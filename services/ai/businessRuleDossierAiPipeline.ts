import type {
  BusinessRule,
  BusinessRuleAnalysis,
  BusinessRuleScreenshot,
  BusinessRuleTaskSheet,
  JiraTask,
  Project,
} from '../../types';
import {
  chunkTasksForDossierAi,
  resolveTasksNeedingSheets,
  shouldUseDossierBatchPipeline,
  DOSSIER_AI_TASKS_PER_BATCH,
} from '../../utils/businessRuleDossierBatch';
import { mergeTaskSheetsForRefresh } from '../../utils/businessRuleDossierMerge';
import {
  createDossierProgressReporter,
  estimateDossierBatchPipelineSteps,
  type DossierAiProgress,
} from '../../utils/businessRuleDossierProgress';
import { normalizeFunctionalityItems, normalizeTaskSheetItems } from '../../utils/businessRuleDossierNormalize';
import { logger } from '../../utils/logger';
import { callGeminiWithRetry, type GeminiContentPart } from './geminiApiWrapper';
import { GEMINI_DEFAULT_MODEL } from './geminiConstants';

const TASK_DESC_MAX = 800;
const TASK_SHEET_FIELD_MAX = 400;

const taskSheetItemSchema = {
  type: 'object',
  properties: {
    taskId: { type: 'string' },
    taskTitle: { type: 'string' },
    implemented: { type: 'string' },
    legacyBefore: { type: 'string' },
    improvedAfter: { type: 'string' },
    purpose: { type: 'string' },
    integratedSystems: { type: 'string' },
    expectedResult: { type: 'string' },
  },
  required: [
    'taskId',
    'taskTitle',
    'implemented',
    'legacyBefore',
    'improvedAfter',
    'purpose',
    'integratedSystems',
    'expectedResult',
  ],
};

const analysisItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    taskIds: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'description', 'taskIds'],
};

const functionalityItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    implemented: { type: 'string' },
    expectedResult: { type: 'string' },
    taskIds: { type: 'array', items: { type: 'string' } },
    implementationStatus: {
      type: 'string',
      enum: ['implementado', 'parcial', 'pendente', 'legado'],
    },
  },
  required: ['name', 'description', 'implemented', 'expectedResult', 'taskIds'],
};

const dossierResponseSchema = {
  type: 'object',
  properties: {
    executiveSummary: { type: 'string' },
    asWas: { type: 'string' },
    asIs: { type: 'string' },
    toBe: { type: 'string' },
    taskSheets: { type: 'array', items: taskSheetItemSchema },
    components: { type: 'array', items: analysisItemSchema },
    functionalities: { type: 'array', items: functionalityItemSchema },
    integrations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          system: { type: 'string' },
          type: { type: 'string' },
          evidence: { type: 'string' },
          taskIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['system', 'type', 'evidence', 'taskIds'],
      },
    },
    traceability: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          section: { type: 'string' },
          confidence: { type: 'string', enum: ['alta', 'media', 'baixa'] },
        },
        required: ['taskId', 'section', 'confidence'],
      },
    },
  },
  required: [
    'executiveSummary',
    'asWas',
    'asIs',
    'toBe',
    'taskSheets',
    'components',
    'functionalities',
    'integrations',
    'traceability',
  ],
};

const taskSheetsOnlyResponseSchema = {
  type: 'object',
  properties: {
    taskSheets: { type: 'array', items: taskSheetItemSchema },
  },
  required: ['taskSheets'],
};

const synthesisResponseSchema = {
  type: 'object',
  properties: {
    executiveSummary: { type: 'string' },
    asWas: { type: 'string' },
    asIs: { type: 'string' },
    toBe: { type: 'string' },
    components: { type: 'array', items: analysisItemSchema },
    functionalities: { type: 'array', items: functionalityItemSchema },
    integrations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          system: { type: 'string' },
          type: { type: 'string' },
          evidence: { type: 'string' },
          taskIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['system', 'type', 'evidence', 'taskIds'],
      },
    },
    traceability: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          section: { type: 'string' },
          confidence: { type: 'string', enum: ['alta', 'media', 'baixa'] },
        },
        required: ['taskId', 'section', 'confidence'],
      },
    },
  },
  required: [
    'executiveSummary',
    'asWas',
    'asIs',
    'toBe',
    'components',
    'functionalities',
    'integrations',
    'traceability',
  ],
};

export interface DossierAiPayload {
  executiveSummary: string;
  asWas: string;
  asIs: string;
  toBe: string;
  taskSheets: BusinessRuleAnalysis['taskSheets'];
  components: BusinessRuleAnalysis['components'];
  functionalities: BusinessRuleAnalysis['functionalities'];
  integrations: BusinessRuleAnalysis['integrations'];
  traceability: BusinessRuleAnalysis['traceability'];
}

export interface RunDossierAiOptions {
  mode: 'generate' | 'refresh';
  usePrevious: boolean;
  previousAnalysis?: BusinessRuleAnalysis;
  excludedTaskIds: string[];
  newTaskIds: string[];
  onProgress?: (progress: DossierAiProgress) => void;
}

function truncate(value: string | undefined, max: number): string {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function formatTaskForPrompt(task: JiraTask): string {
  const links = (task.issueLinks ?? []).map(l => `${l.type}:${l.relatedKey}`).join(', ');
  const components = (task.components ?? []).map(c => c.name).join(', ');
  return [
    `ID: ${task.id}`,
    `Título: ${task.title}`,
    `Tipo: ${task.type}`,
    `Status: ${task.status}${task.jiraStatus ? ` (${task.jiraStatus})` : ''}`,
    `Atualizado: ${task.updatedAt ?? task.createdAt ?? '—'}`,
    components ? `Componentes: ${components}` : '',
    links ? `Links: ${links}` : '',
    `Descrição: ${truncate(task.description, TASK_DESC_MAX)}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildTasksContext(tasks: JiraTask[]): string {
  return tasks.map(formatTaskForPrompt).join('\n\n---\n\n');
}

function scopeTermsForRule(rule: BusinessRule): string {
  return (rule.searchKeywords ?? []).length > 0 ? rule.searchKeywords!.join(', ') : rule.title;
}

function screenshotToPart(screenshot: BusinessRuleScreenshot): GeminiContentPart | null {
  const match = screenshot.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

async function callGeminiJson<T>(
  promptText: string,
  schema: Record<string, unknown>,
  screenshots: BusinessRuleScreenshot[] = []
): Promise<T> {
  const parts: GeminiContentPart[] = [{ text: promptText }];
  for (const shot of screenshots) {
    const part = screenshotToPart(shot);
    if (part) {
      parts.push(part);
      if (shot.caption) {
        parts.push({ text: `Legenda do print "${shot.name}": ${shot.caption}` });
      }
    }
  }

  const response = await callGeminiWithRetry({
    model: GEMINI_DEFAULT_MODEL,
    contents: parts,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  return JSON.parse(response.text) as T;
}

function sharedScopeInstructions(rule: BusinessRule, project: Project, excludedTaskIds: string[]): string {
  const scopeTerms = scopeTermsForRule(rule);
  const excludedNote =
    excludedTaskIds.length > 0
      ? `\nNOTA: ${excludedTaskIds.length} task(s) vinculada(s) foram EXCLUÍDA(s) por baixa relevância (${excludedTaskIds.slice(0, 8).join(', ')}${excludedTaskIds.length > 8 ? '…' : ''}). NÃO as mencione.\n`
      : '';

  return `REGRA DE NEGÓCIO: ${rule.title}
ESCOPO (somente este tema): ${scopeTerms}
PALAVRAS-CHAVE: ${(rule.searchKeywords ?? []).join(', ') || rule.title}
PROJETO: ${project.name}
${excludedNote}
- Trate EXCLUSIVAMENTE o ESCOPO acima.
- Use APENAS evidências das tasks e prints (se houver).
- Marque incertezas como [A CONFIRMAR].
- Cite tasks como [TASK-ID] quando relevante.`;
}

function buildTaskSheetsBatchPrompt(
  rule: BusinessRule,
  project: Project,
  batchTasks: JiraTask[],
  batchIndex: number,
  batchTotal: number,
  excludedTaskIds: string[]
): string {
  return `Você é um analista de negócios e QA sênior. Gere FICHAS TÉCNICAS em português do Brasil.

${sharedScopeInstructions(rule, project, excludedTaskIds)}

LOTE ${batchIndex} de ${batchTotal} — gere taskSheets SOMENTE para as ${batchTasks.length} tasks abaixo.

Para cada task:
- taskId e taskTitle exatos da task.
- implemented: o que foi feito (mín. 2 frases com evidência).
- legacyBefore, improvedAfter, purpose, integratedSystems, expectedResult.
- Use [A CONFIRMAR] se faltar evidência — não invente.

TASKS DESTE LOTE:
${buildTasksContext(batchTasks)}`;
}

function formatTaskSheetForSynthesis(sheet: BusinessRuleTaskSheet): string {
  return [
    `### ${sheet.taskId}: ${sheet.taskTitle}`,
    `Implementado: ${truncate(sheet.implemented, TASK_SHEET_FIELD_MAX)}`,
    `Legado: ${truncate(sheet.legacyBefore, TASK_SHEET_FIELD_MAX)}`,
    `Melhoria: ${truncate(sheet.improvedAfter, TASK_SHEET_FIELD_MAX)}`,
    `Propósito: ${truncate(sheet.purpose, TASK_SHEET_FIELD_MAX)}`,
    `Integrações: ${truncate(sheet.integratedSystems, TASK_SHEET_FIELD_MAX)}`,
    `Resultado esperado: ${truncate(sheet.expectedResult, TASK_SHEET_FIELD_MAX)}`,
  ].join('\n');
}

function buildSynthesisPrompt(
  rule: BusinessRule,
  project: Project,
  taskSheets: BusinessRuleTaskSheet[],
  options: RunDossierAiOptions
): string {
  const sheetsContext = taskSheets.map(formatTaskSheetForSynthesis).join('\n\n');
  const base = `Você é um analista de negócios e QA sênior. Com base nas FICHAS TÉCNICAS já geradas, produza a síntese consolidada do dossiê em português do Brasil.

${sharedScopeInstructions(rule, project, options.excludedTaskIds)}

INSTRUÇÕES:
- executiveSummary: visão geral do escopo (${taskSheets.length} tasks).
- asWas, asIs, toBe: parágrafos detalhados consolidando as fichas — apenas sobre o ESCOPO.
- components: UI/módulos técnicos com taskIds.
- functionalities: cada funcionalidade distinta com implemented, expectedResult, taskIds, implementationStatus.
- integrations e traceability com evidência das fichas.
- NÃO gere taskSheets — use as fichas abaixo como fonte.

FICHAS TÉCNICAS (${taskSheets.length}):
${sheetsContext}
`;

  if (options.mode === 'refresh' && options.usePrevious && options.previousAnalysis) {
    const screenshotCount = rule.screenshots?.length ?? 0;
    return `${base}

ANÁLISE ANTERIOR (versão ${options.previousAnalysis.version}) — preserve e enriqueça:
Resumo executivo anterior: ${truncate(options.previousAnalysis.executiveSummary, 1200)}
asWas anterior: ${truncate(options.previousAnalysis.asWas, 800)}
asIs anterior: ${truncate(options.previousAnalysis.asIs, 800)}
toBe anterior: ${truncate(options.previousAnalysis.toBe, 800)}

MODO INCREMENTAL:
- Incorpore novas fichas/tasks sem apagar conteúdo válido das seções narrativas.
- Tasks novas nesta rodada: ${options.newTaskIds.slice(0, 40).join(', ') || 'nenhuma'}${options.newTaskIds.length > 40 ? '…' : ''}
- ${screenshotCount > 0 ? `${screenshotCount} print(s) anexado(s) — use como evidência visual.` : 'Sem prints novos.'}`;
  }

  return base;
}

function buildFullPrompt(
  rule: BusinessRule,
  project: Project,
  tasks: JiraTask[],
  options: RunDossierAiOptions
): string {
  const scopeTerms = scopeTermsForRule(rule);
  const excludedNote =
    options.excludedTaskIds.length > 0
      ? `\nNOTA: ${options.excludedTaskIds.length} task(s) EXCLUÍDA(s) por baixa relevância.\n`
      : '';

  const base = `Você é um analista de negócios e QA sênior. Produza um dossiê técnico em português do Brasil.

REGRA DE NEGÓCIO: ${rule.title}
ESCOPO: ${scopeTerms}
PROJETO: ${project.name}
${excludedNote}
Gere executiveSummary, asWas, asIs, toBe, taskSheets (uma por task), components, functionalities, integrations, traceability.
Use [A CONFIRMAR] quando faltar evidência.

TASKS (${tasks.length}):
${buildTasksContext(tasks)}`;

  if (options.mode === 'refresh' && options.usePrevious && options.previousAnalysis) {
    return `${base}

ANÁLISE ANTERIOR (v${options.previousAnalysis.version}) — preserve e enriqueça:
${truncate(options.previousAnalysis.markdown, 6000)}

Tasks novas: ${options.newTaskIds.join(', ') || 'nenhuma'}`;
  }

  return base;
}

async function generateTaskSheetsInBatches(
  rule: BusinessRule,
  project: Project,
  tasks: JiraTask[],
  excludedTaskIds: string[],
  report: (label: string) => void,
  batchKind: 'main' | 'complement' = 'main'
): Promise<BusinessRuleTaskSheet[]> {
  const chunks = chunkTasksForDossierAi(tasks);
  const allSheets: BusinessRuleTaskSheet[] = [];
  const kindLabel = batchKind === 'complement' ? 'fichas complementares' : 'fichas técnicas';

  for (let i = 0; i < chunks.length; i++) {
    const batchTasks = chunks[i];
    report(
      chunks.length > 1
        ? `Gerando ${kindLabel} — lote ${i + 1} de ${chunks.length} (${batchTasks.length} tasks)…`
        : `Gerando ${kindLabel} (${batchTasks.length} tasks)…`
    );

    logger.info('Gerando lote de fichas técnicas do dossiê', 'businessRuleDossierAiPipeline', {
      ruleId: rule.id,
      batch: i + 1,
      batchTotal: chunks.length,
      taskCount: batchTasks.length,
    });

    const prompt = buildTaskSheetsBatchPrompt(
      rule,
      project,
      batchTasks,
      i + 1,
      chunks.length,
      excludedTaskIds
    );
    const payload = await callGeminiJson<{ taskSheets: BusinessRuleTaskSheet[] }>(
      prompt,
      taskSheetsOnlyResponseSchema
    );
    allSheets.push(...normalizeTaskSheetItems(payload.taskSheets));
  }

  return allSheets;
}

async function runBatchPipeline(
  rule: BusinessRule,
  project: Project,
  allTasks: JiraTask[],
  options: RunDossierAiOptions
): Promise<DossierAiPayload> {
  const tasksNeedingSheets = resolveTasksNeedingSheets(allTasks, {
    usePrevious: options.usePrevious,
    newTaskIds: options.newTaskIds,
  });

  const progress = createDossierProgressReporter(
    options.onProgress,
    estimateDossierBatchPipelineSteps(tasksNeedingSheets.length)
  );

  logger.info('Pipeline em lotes do dossiê', 'businessRuleDossierAiPipeline', {
    ruleId: rule.id,
    totalTasks: allTasks.length,
    tasksNeedingSheets: tasksNeedingSheets.length,
    batchCount: Math.ceil(tasksNeedingSheets.length / DOSSIER_AI_TASKS_PER_BATCH) || 0,
  });

  const newSheets =
    tasksNeedingSheets.length > 0
      ? await generateTaskSheetsInBatches(
          rule,
          project,
          tasksNeedingSheets,
          options.excludedTaskIds,
          progress.report,
          'main'
        )
      : [];

  let taskSheets: BusinessRuleTaskSheet[];
  if (options.usePrevious && options.previousAnalysis) {
    taskSheets = mergeTaskSheetsForRefresh(
      options.previousAnalysis.taskSheets ?? [],
      newSheets,
      rule.linkedTaskIds
    );
  } else {
    taskSheets = newSheets;
  }

  const missingIds = allTasks.map(t => t.id).filter(id => !taskSheets.some(s => s.taskId === id));
  if (missingIds.length > 0) {
    logger.warn('Fichas ausentes após lotes — gerando complemento', 'businessRuleDossierAiPipeline', {
      ruleId: rule.id,
      missingCount: missingIds.length,
    });
    const missingTasks = allTasks.filter(t => missingIds.includes(t.id));
    const extraBatches = Math.ceil(missingTasks.length / DOSSIER_AI_TASKS_PER_BATCH);
    progress.extendTotalSteps(extraBatches);
    const extraSheets = await generateTaskSheetsInBatches(
      rule,
      project,
      missingTasks,
      options.excludedTaskIds,
      progress.report,
      'complement'
    );
    taskSheets = mergeTaskSheetsForRefresh(taskSheets, extraSheets, rule.linkedTaskIds);
  }

  progress.report('Consolidando síntese do dossiê…');

  const synthesis = await callGeminiJson<Omit<DossierAiPayload, 'taskSheets'>>(
    buildSynthesisPrompt(rule, project, taskSheets, options),
    synthesisResponseSchema,
    rule.screenshots ?? []
  );

  options.onProgress?.({
    step: progress.getTotalSteps(),
    totalSteps: progress.getTotalSteps(),
    label: 'Finalizando dossiê…',
  });

  return {
    ...synthesis,
    taskSheets,
    components: synthesis.components ?? [],
    functionalities: normalizeFunctionalityItems(synthesis.functionalities),
    integrations: synthesis.integrations ?? [],
    traceability: synthesis.traceability ?? [],
  };
}

async function runSingleCallPipeline(
  rule: BusinessRule,
  project: Project,
  tasks: JiraTask[],
  options: RunDossierAiOptions
): Promise<DossierAiPayload> {
  options.onProgress?.({
    step: 1,
    totalSteps: 1,
    label: `Analisando ${tasks.length} task(s) com IA…`,
  });

  const prompt = buildFullPrompt(rule, project, tasks, options);
  const payload = await callGeminiJson<DossierAiPayload>(
    prompt,
    dossierResponseSchema,
    rule.screenshots ?? []
  );

  options.onProgress?.({
    step: 1,
    totalSteps: 1,
    label: 'Finalizando dossiê…',
  });

  return {
    ...payload,
    components: payload.components ?? [],
    functionalities: normalizeFunctionalityItems(payload.functionalities),
    taskSheets: normalizeTaskSheetItems(payload.taskSheets),
    integrations: payload.integrations ?? [],
    traceability: payload.traceability ?? [],
  };
}

/**
 * Executa geração/reanálise do dossiê (chamada única ou pipeline em lotes).
 */
export async function runDossierAiPipeline(
  rule: BusinessRule,
  project: Project,
  tasks: JiraTask[],
  options: RunDossierAiOptions
): Promise<DossierAiPayload> {
  const tasksNeedingSheets = resolveTasksNeedingSheets(tasks, {
    usePrevious: options.usePrevious,
    newTaskIds: options.newTaskIds,
  });

  if (shouldUseDossierBatchPipeline(tasksNeedingSheets, tasks.length)) {
    return runBatchPipeline(rule, project, tasks, options);
  }

  return runSingleCallPipeline(rule, project, tasks, options);
}

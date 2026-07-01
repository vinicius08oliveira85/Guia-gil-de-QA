import type {
  BusinessRule,
  BusinessRuleAnalysis,
  BusinessRuleScreenshot,
  JiraTask,
  Project,
} from '../../types';
import { MAX_BUSINESS_RULE_ANALYSIS_HISTORY } from '../../utils/businessRuleDefaults';
import { hashBusinessRuleTaskSnapshot } from '../../utils/businessRuleTaskSnapshot';
import { getTasksForBusinessRule } from '../../utils/businessRuleTaskLinking';
import { logger } from '../../utils/logger';
import { callGeminiWithRetry, type GeminiContentPart } from './geminiApiWrapper';
import { GEMINI_DEFAULT_MODEL } from './geminiConstants';

import { buildDossierMarkdown } from '../../utils/businessRuleDossierMarkdown';
import { normalizeFunctionalityItems } from '../../utils/businessRuleDossierNormalize';

const TASK_DESC_MAX = 800;
const BATCH_SIZE = 15;

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

function truncate(value: string | undefined, max: number): string {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function formatTaskForPrompt(task: JiraTask): string {
  const links = (task.issueLinks ?? [])
    .map(l => `${l.type}:${l.relatedKey}`)
    .join(', ');
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
  if (tasks.length <= BATCH_SIZE) {
    return tasks.map(formatTaskForPrompt).join('\n\n---\n\n');
  }
  const batches: string[] = [];
  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const chunk = tasks.slice(i, i + BATCH_SIZE);
    batches.push(chunk.map(formatTaskForPrompt).join('\n\n---\n\n'));
  }
  return batches.map((b, i) => `### Lote ${i + 1}\n${b}`).join('\n\n');
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

interface DossierAiPayload {
  executiveSummary: string;
  asWas: string;
  asIs: string;
  toBe: string;
  components: BusinessRuleAnalysis['components'];
  functionalities: BusinessRuleAnalysis['functionalities'];
  integrations: BusinessRuleAnalysis['integrations'];
  traceability: BusinessRuleAnalysis['traceability'];
}

async function callDossierAi(
  promptText: string,
  screenshots: BusinessRuleScreenshot[]
): Promise<DossierAiPayload> {
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
      responseSchema: dossierResponseSchema,
    },
  });

  const parsed = JSON.parse(response.text) as DossierAiPayload;
  return parsed;
}

function buildPrompt(
  rule: BusinessRule,
  project: Project,
  tasks: JiraTask[],
  mode: 'generate' | 'refresh',
  previousAnalysis?: BusinessRuleAnalysis
): string {
  const tasksContext = buildTasksContext(tasks);
  const base = `Você é um analista de negócios e QA sênior. Produza um dossiê técnico em português do Brasil.

REGRA DE NEGÓCIO: ${rule.title}
PALAVRAS-CHAVE: ${(rule.searchKeywords ?? []).join(', ') || rule.title}
PROJETO: ${project.name}

INSTRUÇÕES GERAIS:
- Use APENAS evidências das tasks listadas e dos prints (se houver).
- Não invente integrações ou comportamentos sem evidência nas tasks.
- Marque incertezas como [A CONFIRMAR].
- Cite tasks como [TASK-ID] no texto quando relevante.
- Detalhe componentes de UI, validações, fluxos e integrações quando houver evidência.
- asWas: estado anterior inferido das tasks mais antigas ou entregas concluídas (parágrafos detalhados).
- asIs: estado atual consolidado (parágrafos detalhados).
- toBe: evolução prevista com base em tasks abertas ou gaps (parágrafos detalhados).

FUNCIONALIDADES (seção mais importante — seja detalhado):
- Liste CADA funcionalidade distinta identificada nas tasks (não agrupe demais).
- Para cada item em functionalities, preencha:
  - name: nome claro e específico da funcionalidade.
  - description: resumo de 1 a 2 frases.
  - implemented: o que foi implementado — telas, campos, botões, fluxos, validações, regras de negócio, integrações. Mínimo 2 frases quando houver evidência. Cite [TASK-ID] quando a task sustentar o trecho.
  - expectedResult: resultado esperado para o usuário final ou negócio após usar a funcionalidade (comportamento, dados exibidos, efeitos colaterais). Mínimo 2 frases quando houver evidência.
  - taskIds: IDs das tasks que sustentam essa funcionalidade (pode ser mais de uma).
  - implementationStatus: implementado | parcial | pendente | legado.
- Se uma task descrever várias funcionalidades, separe em itens distintos.
- Se faltar evidência para implemented ou expectedResult, use [A CONFIRMAR] e implementationStatus adequado (parcial ou pendente).

COMPONENTES:
- Agrupe elementos de UI ou módulos técnicos (grids, modais, abas) com description detalhada e taskIds.

TASKS RELACIONADAS (${tasks.length}):
${tasksContext}
`;

  if (mode === 'refresh' && previousAnalysis) {
    return `${base}

ANÁLISE ANTERIOR (versão ${previousAnalysis.version}):
${previousAnalysis.markdown}

Atualize o dossiê incorporando mudanças nas tasks. Preserve o que ainda é válido; sobrescreva seções impactadas.`;
  }

  return base;
}

function pushAnalysisHistory(rule: BusinessRule): BusinessRuleAnalysis[] {
  if (!rule.analysis) return rule.analysisHistory ?? [];
  const history = [rule.analysis, ...(rule.analysisHistory ?? [])];
  return history.slice(0, MAX_BUSINESS_RULE_ANALYSIS_HISTORY);
}

export interface GenerateDossierResult {
  rule: BusinessRule;
}

/**
 * Gera dossiê inicial para uma regra de negócio.
 */
export async function generateBusinessRuleDossier(
  project: Project,
  rule: BusinessRule
): Promise<GenerateDossierResult> {
  const tasks = getTasksForBusinessRule(project, rule);
  if (tasks.length === 0) {
    throw new Error('Selecione ao menos uma task relacionada antes de gerar o dossiê.');
  }

  logger.info('Gerando dossiê de regra de negócio', 'businessRuleDossierService', {
    ruleId: rule.id,
    taskCount: tasks.length,
  });

  const prompt = buildPrompt(rule, project, tasks, 'generate');
  const payload = await callDossierAi(prompt, rule.screenshots ?? []);
  const version = 1;
  const generatedAt = new Date().toISOString();
  const core = {
    executiveSummary: payload.executiveSummary,
    asWas: payload.asWas,
    asIs: payload.asIs,
    toBe: payload.toBe,
    components: payload.components ?? [],
    functionalities: normalizeFunctionalityItems(payload.functionalities),
    integrations: payload.integrations ?? [],
    traceability: payload.traceability ?? [],
  };
  const analysis: BusinessRuleAnalysis = {
    version,
    generatedAt,
    markdown: buildDossierMarkdown(rule.title, core),
    ...core,
  };

  const taskSnapshotHash = hashBusinessRuleTaskSnapshot(project.tasks, rule.linkedTaskIds);

  return {
    rule: {
      ...rule,
      analysis,
      taskSnapshotHash,
      isOutdated: false,
      updatedAt: generatedAt,
    },
  };
}

/**
 * Reanalisa dossiê existente após mudanças nas tasks vinculadas.
 */
export async function refreshBusinessRuleDossier(
  project: Project,
  rule: BusinessRule,
  _changedTaskIds?: string[]
): Promise<GenerateDossierResult> {
  if (!rule.analysis) {
    return generateBusinessRuleDossier(project, rule);
  }

  const tasks = getTasksForBusinessRule(project, rule);
  if (tasks.length === 0) {
    throw new Error('Nenhuma task vinculada para reanalisar o dossiê.');
  }

  logger.info('Reanalisando dossiê de regra de negócio', 'businessRuleDossierService', {
    ruleId: rule.id,
    version: rule.analysis.version,
  });

  const prompt = buildPrompt(rule, project, tasks, 'refresh', rule.analysis);
  const payload = await callDossierAi(prompt, rule.screenshots ?? []);
  const generatedAt = new Date().toISOString();
  const version = rule.analysis.version + 1;
  const core = {
    executiveSummary: payload.executiveSummary,
    asWas: payload.asWas,
    asIs: payload.asIs,
    toBe: payload.toBe,
    components: payload.components ?? [],
    functionalities: normalizeFunctionalityItems(payload.functionalities),
    integrations: payload.integrations ?? [],
    traceability: payload.traceability ?? [],
  };
  const analysis: BusinessRuleAnalysis = {
    version,
    generatedAt,
    markdown: buildDossierMarkdown(rule.title, core),
    ...core,
  };

  const taskSnapshotHash = hashBusinessRuleTaskSnapshot(project.tasks, rule.linkedTaskIds);

  return {
    rule: {
      ...rule,
      analysis,
      analysisHistory: pushAnalysisHistory(rule),
      taskSnapshotHash,
      isOutdated: false,
      updatedAt: generatedAt,
    },
  };
}

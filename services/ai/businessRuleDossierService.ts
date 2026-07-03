import type { BusinessRule, BusinessRuleAnalysis, JiraTask, Project } from '../../types';
import { MAX_BUSINESS_RULE_ANALYSIS_HISTORY } from '../../utils/businessRuleDefaults';
import { mergeDossierAnalysisCore } from '../../utils/businessRuleDossierMerge';
import { hashBusinessRuleTaskSnapshot } from '../../utils/businessRuleTaskSnapshot';
import { getTasksForBusinessRule } from '../../utils/businessRuleTaskLinking';
import { resolveLinkedTasksForDossier } from '../../utils/businessRuleTaskMatcher';
import { logger } from '../../utils/logger';
import { buildDossierMarkdown } from '../../utils/businessRuleDossierMarkdown';
import { runDossierAiPipeline } from './businessRuleDossierAiPipeline';

function pushAnalysisHistory(rule: BusinessRule): BusinessRuleAnalysis[] {
  if (!rule.analysis) return rule.analysisHistory ?? [];
  const history = [rule.analysis, ...(rule.analysisHistory ?? [])];
  return history.slice(0, MAX_BUSINESS_RULE_ANALYSIS_HISTORY);
}

export interface GenerateDossierResult {
  rule: BusinessRule;
}

export type { DossierAiProgress } from '../../utils/businessRuleDossierProgress';

export interface GenerateDossierOptions {
  /** Ignora análise anterior ao reanalisar (geração limpa). */
  regenerateFromScratch?: boolean;
  /** Callback de progresso (lotes, síntese, chamada única). */
  onProgress?: (progress: DossierAiProgress) => void;
}

function resolveDossierTasks(project: Project, rule: BusinessRule): {
  tasks: JiraTask[];
  excludedTaskIds: string[];
} {
  const linked = getTasksForBusinessRule(project, rule);
  if (linked.length === 0) {
    return { tasks: [], excludedTaskIds: [] };
  }
  return resolveLinkedTasksForDossier(project.tasks, rule);
}

function buildAnalysisFromPayload(
  rule: BusinessRule,
  payload: Awaited<ReturnType<typeof runDossierAiPipeline>>,
  version: number,
  generatedAt: string
): BusinessRuleAnalysis {
  const core = {
    executiveSummary: payload.executiveSummary,
    asWas: payload.asWas,
    asIs: payload.asIs,
    toBe: payload.toBe,
    components: payload.components,
    functionalities: payload.functionalities,
    taskSheets: payload.taskSheets,
    integrations: payload.integrations,
    traceability: payload.traceability,
  };
  return {
    version,
    generatedAt,
    markdown: buildDossierMarkdown(rule.title, core),
    ...core,
  };
}

/**
 * Gera dossiê inicial para uma regra de negócio.
 */
export async function generateBusinessRuleDossier(
  project: Project,
  rule: BusinessRule,
  options?: Pick<GenerateDossierOptions, 'onProgress'>
): Promise<GenerateDossierResult> {
  const { tasks, excludedTaskIds } = resolveDossierTasks(project, rule);
  if (tasks.length === 0) {
    throw new Error(
      excludedTaskIds.length > 0
        ? 'Nenhuma task vinculada atingiu relevância mínima para o dossiê. Revise a seleção ou as palavras-chave.'
        : 'Selecione ao menos uma task relacionada antes de gerar o dossiê.'
    );
  }

  logger.info('Gerando dossiê de regra de negócio', 'businessRuleDossierService', {
    ruleId: rule.id,
    taskCount: tasks.length,
    excludedTaskCount: excludedTaskIds.length,
  });

  const payload = await runDossierAiPipeline(rule, project, tasks, {
    mode: 'generate',
    usePrevious: false,
    excludedTaskIds,
    newTaskIds: tasks.map(t => t.id),
    onProgress: options?.onProgress,
  });

  const generatedAt = new Date().toISOString();
  const analysis = buildAnalysisFromPayload(rule, payload, 1, generatedAt);
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
  _changedTaskIds?: string[],
  options?: GenerateDossierOptions
): Promise<GenerateDossierResult> {
  if (!rule.analysis) {
    return generateBusinessRuleDossier(project, rule, options);
  }

  const { tasks, excludedTaskIds } = resolveDossierTasks(project, rule);
  if (tasks.length === 0) {
    throw new Error(
      excludedTaskIds.length > 0
        ? 'Nenhuma task vinculada atingiu relevância mínima para reanalisar o dossiê.'
        : 'Nenhuma task vinculada para reanalisar o dossiê.'
    );
  }

  const usePrevious = !options?.regenerateFromScratch;
  const previousTaskIds = new Set((rule.analysis.taskSheets ?? []).map(s => s.taskId));
  const newTaskIds = tasks.map(t => t.id).filter(id => !previousTaskIds.has(id));

  logger.info('Reanalisando dossiê de regra de negócio', 'businessRuleDossierService', {
    ruleId: rule.id,
    version: rule.analysis.version,
    taskCount: tasks.length,
    newTaskCount: newTaskIds.length,
    excludedTaskCount: excludedTaskIds.length,
    regenerateFromScratch: !usePrevious,
  });

  const payload = await runDossierAiPipeline(rule, project, tasks, {
    mode: usePrevious ? 'refresh' : 'generate',
    usePrevious,
    previousAnalysis: usePrevious ? rule.analysis : undefined,
    excludedTaskIds,
    newTaskIds: usePrevious ? newTaskIds : tasks.map(t => t.id),
    onProgress: options?.onProgress,
  });

  const generatedAt = new Date().toISOString();
  const version = rule.analysis.version + 1;

  const incomingCore = {
    executiveSummary: payload.executiveSummary,
    asWas: payload.asWas,
    asIs: payload.asIs,
    toBe: payload.toBe,
    components: payload.components,
    functionalities: payload.functionalities,
    taskSheets: payload.taskSheets,
    integrations: payload.integrations,
    traceability: payload.traceability,
  };

  const mergedStructured = usePrevious
    ? mergeDossierAnalysisCore(rule.analysis, incomingCore, rule.linkedTaskIds)
    : {
        taskSheets: incomingCore.taskSheets,
        components: incomingCore.components,
        functionalities: incomingCore.functionalities,
        integrations: incomingCore.integrations,
        traceability: incomingCore.traceability,
      };

  const core = {
    executiveSummary: incomingCore.executiveSummary,
    asWas: incomingCore.asWas,
    asIs: incomingCore.asIs,
    toBe: incomingCore.toBe,
    ...mergedStructured,
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

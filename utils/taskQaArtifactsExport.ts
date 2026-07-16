import type { BddScenario, JiraTask, TestCase, TestStrategy } from '../types';

/** Identificador do envelope JSON de artefatos QA de uma tarefa. */
export const TASK_QA_EXPORT_FORMAT_ID = 'qa-agile-guide-task-qa';

/** Versão gravada nos exports atuais. */
export const TASK_QA_EXPORT_FORMAT_VERSION = 1;

/** Versão máxima aceita na importação. */
export const TASK_QA_IMPORT_MAX_FORMAT_VERSION = 1;

/** Payload de artefatos QA exportáveis/importáveis de uma única tarefa. */
export interface TaskQaArtifacts {
  id: string;
  title: string;
  type?: JiraTask['type'];
  description?: string;
  bddScenarios: BddScenario[];
  testStrategy: TestStrategy[];
  testCases: TestCase[];
  strategyTools?: JiraTask['strategyTools'];
  executedStrategies?: number[];
  toolsUsed?: string[];
  testCasesGeneratedAt?: string;
  testCasesSnapshotHash?: string;
}

export interface TaskQaExportEnvelope {
  format: typeof TASK_QA_EXPORT_FORMAT_ID;
  formatVersion: number;
  exportedAt: string;
  readme: string;
  task: TaskQaArtifacts;
}

/**
 * Extrai o pacote QA (BDD + estratégias + casos) de uma tarefa.
 */
export function extractTaskQaArtifacts(task: JiraTask): TaskQaArtifacts {
  return {
    id: task.id,
    title: task.title,
    type: task.type,
    description: task.description || '',
    bddScenarios: [...(task.bddScenarios ?? [])],
    testStrategy: [...(task.testStrategy ?? [])],
    testCases: [...(task.testCases ?? [])],
    strategyTools: task.strategyTools ? { ...task.strategyTools } : undefined,
    executedStrategies: task.executedStrategies ? [...task.executedStrategies] : undefined,
    toolsUsed: task.toolsUsed ? [...task.toolsUsed] : undefined,
    testCasesGeneratedAt: task.testCasesGeneratedAt,
    testCasesSnapshotHash: task.testCasesSnapshotHash,
  };
}

/**
 * Serializa a tarefa em JSON (somente artefatos QA + metadados mínimos).
 */
export function exportTaskQaArtifactsToJSON(task: JiraTask): string {
  const envelope: TaskQaExportEnvelope = {
    format: TASK_QA_EXPORT_FORMAT_ID,
    formatVersion: TASK_QA_EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    readme:
      'Pacote QA de uma tarefa: bddScenarios, testStrategy e testCases. Importe na tarefa aberta para substituir esses campos.',
    task: extractTaskQaArtifacts(task),
  };
  return JSON.stringify(envelope, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Valida e normaliza o JSON importado (envelope ou objeto task direto).
 */
export function parseTaskQaArtifactsFromJson(raw: unknown): TaskQaArtifacts {
  if (!isRecord(raw)) {
    throw new Error('JSON inválido: esperado um objeto.');
  }

  const format = raw.format;
  if (typeof format === 'string' && format.trim() && format.trim() !== TASK_QA_EXPORT_FORMAT_ID) {
    throw new Error(
      `Formato não reconhecido ("${format}"). Esperado "${TASK_QA_EXPORT_FORMAT_ID}".`
    );
  }

  if (typeof raw.formatVersion === 'number' && raw.formatVersion > TASK_QA_IMPORT_MAX_FORMAT_VERSION) {
    throw new Error(
      `Versão do arquivo (${raw.formatVersion}) não suportada. Atualize o app.`
    );
  }

  const taskNode = isRecord(raw.task) ? raw.task : raw;
  const id = typeof taskNode.id === 'string' ? taskNode.id.trim() : '';
  const title = typeof taskNode.title === 'string' ? taskNode.title.trim() : '';

  if (!id && !title) {
    throw new Error('JSON inválido: informe ao menos id ou title da tarefa.');
  }

  const bddScenarios = Array.isArray(taskNode.bddScenarios)
    ? (taskNode.bddScenarios as BddScenario[])
    : [];
  const testStrategy = Array.isArray(taskNode.testStrategy)
    ? (taskNode.testStrategy as TestStrategy[])
    : [];
  const testCases = Array.isArray(taskNode.testCases)
    ? (taskNode.testCases as TestCase[])
    : [];

  if (bddScenarios.length === 0 && testStrategy.length === 0 && testCases.length === 0) {
    throw new Error(
      'Nenhum artefato QA encontrado (bddScenarios, testStrategy ou testCases).'
    );
  }

  return {
    id: id || `imported-task-${Date.now()}`,
    title: title || id || 'Tarefa importada',
    type: typeof taskNode.type === 'string' ? (taskNode.type as JiraTask['type']) : undefined,
    description: typeof taskNode.description === 'string' ? taskNode.description : undefined,
    bddScenarios,
    testStrategy,
    testCases,
    strategyTools:
      isRecord(taskNode.strategyTools)
        ? (taskNode.strategyTools as JiraTask['strategyTools'])
        : undefined,
    executedStrategies: Array.isArray(taskNode.executedStrategies)
      ? (taskNode.executedStrategies as number[])
      : undefined,
    toolsUsed: Array.isArray(taskNode.toolsUsed) ? (taskNode.toolsUsed as string[]) : undefined,
    testCasesGeneratedAt:
      typeof taskNode.testCasesGeneratedAt === 'string'
        ? taskNode.testCasesGeneratedAt
        : undefined,
    testCasesSnapshotHash:
      typeof taskNode.testCasesSnapshotHash === 'string'
        ? taskNode.testCasesSnapshotHash
        : undefined,
  };
}

/**
 * Aplica artefatos QA importados à tarefa aberta (mantém id/título atuais).
 */
export function applyTaskQaArtifactsToTask(
  current: JiraTask,
  artifacts: TaskQaArtifacts
): JiraTask {
  return {
    ...current,
    bddScenarios: artifacts.bddScenarios,
    testStrategy: artifacts.testStrategy,
    testCases: artifacts.testCases,
    strategyTools: artifacts.strategyTools,
    executedStrategies: artifacts.executedStrategies,
    toolsUsed: artifacts.toolsUsed,
    testCasesGeneratedAt: artifacts.testCasesGeneratedAt ?? current.testCasesGeneratedAt,
    testCasesSnapshotHash: artifacts.testCasesSnapshotHash ?? current.testCasesSnapshotHash,
  };
}

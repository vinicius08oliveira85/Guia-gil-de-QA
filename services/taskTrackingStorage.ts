import type { JiraTask } from '../types';
import { DEFAULT_SLA_RISK_WINDOW_HOURS } from '../utils/jiraFilasMetrics';
import { scheduleLocalFolderSync } from '../utils/localFolderSyncScheduler';
import { logger } from '../utils/logger';

/** Chaves de persistência do Acompanhamento de Tarefas (Filas Jira). */
export const FILAS_PROJECT_STORAGE_KEY = 'jira-solus-filas-project-key';
export const FILAS_TASKS_STORAGE_KEY = 'jira-solus-filas-tasks';
export const FILAS_SLA_RISK_WINDOW_STORAGE_KEY = 'jira-solus-filas-sla-risk-window-hours';
export const FILAS_QUEUE_STORAGE_KEY = 'jira-solus-filas-queue';

/** Disparado após importação de backup restaurar o acompanhamento (mesma aba). */
export const TASK_TRACKING_RESTORED_EVENT = 'qa-task-tracking-restored';

export interface TaskTrackingQueueSelection {
  projectKey: string;
  /** @deprecated Use queueIds para seleção múltipla. */
  queueId?: string;
  queueIds?: string[];
  /** Projetos selecionados no assistente de importação. */
  projectKeys?: string[];
  /** Categorias de fila JSM (ex.: Solus, Tasy). */
  queueCategories?: string[];
  /** Rótulos de status de fila (ex.: Abertos, Concluídos). */
  queueStatuses?: string[];
}

/** Snapshot exportável do Acompanhamento de Tarefas. */
export interface TaskTrackingSnapshot {
  selectedProjectKey: string;
  queueSelection: TaskTrackingQueueSelection | null;
  tasks: JiraTask[];
  slaRiskWindowHours: number;
}

const EMPTY_SNAPSHOT: TaskTrackingSnapshot = {
  selectedProjectKey: '',
  queueSelection: null,
  tasks: [],
  slaRiskWindowHours: DEFAULT_SLA_RISK_WINDOW_HOURS,
};

function readSessionItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionItem(key: string, value: string | null): void {
  try {
    if (value === null || value === '') {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
  } catch {
    /* ignore */
  }
}

function readLocalItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalItem(key: string, value: string | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    /* ignore */
  }
}

function readStoredTasks(): JiraTask[] {
  const raw = readLocalItem(FILAS_TASKS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JiraTask[]) : [];
  } catch {
    return [];
  }
}

function readStoredSlaRiskWindowHours(): number {
  const raw = readLocalItem(FILAS_SLA_RISK_WINDOW_STORAGE_KEY);
  const value = raw ? Number(raw) : DEFAULT_SLA_RISK_WINDOW_HOURS;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SLA_RISK_WINDOW_HOURS;
}

function normalizeQueueIds(selection: Partial<TaskTrackingQueueSelection> | null | undefined): string[] {
  if (!selection) return [];
  if (Array.isArray(selection.queueIds) && selection.queueIds.length > 0) {
    return selection.queueIds.map(id => id.trim()).filter(Boolean);
  }
  if (typeof selection.queueId === 'string' && selection.queueId.trim()) {
    return [selection.queueId.trim()];
  }
  return [];
}

function readStoredQueueSelection(): TaskTrackingQueueSelection | null {
  const raw = readSessionItem(FILAS_QUEUE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TaskTrackingQueueSelection>;
    const projectKey = typeof parsed.projectKey === 'string' ? parsed.projectKey.trim() : '';
    const projectKeys =
      Array.isArray(parsed.projectKeys) && parsed.projectKeys.length > 0
        ? parsed.projectKeys.map(k => k.trim()).filter(Boolean)
        : projectKey
          ? [projectKey]
          : [];
    const queueCategories = Array.isArray(parsed.queueCategories)
      ? parsed.queueCategories.map(c => c.trim()).filter(Boolean)
      : [];
    const queueStatuses = Array.isArray(parsed.queueStatuses)
      ? parsed.queueStatuses.map(s => s.trim()).filter(Boolean)
      : [];
    const queueIds = normalizeQueueIds(parsed);

    if (projectKeys.length === 0) return null;

    return {
      projectKey: projectKeys[0],
      projectKeys,
      queueCategories,
      queueStatuses,
      ...(queueIds.length > 0 ? { queueIds, queueId: queueIds[0] } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Lê o estado persistido do Acompanhamento de Tarefas (localStorage + sessionStorage).
 */
export function readTaskTrackingSnapshot(): TaskTrackingSnapshot {
  return {
    selectedProjectKey: readSessionItem(FILAS_PROJECT_STORAGE_KEY)?.trim() ?? '',
    queueSelection: readStoredQueueSelection(),
    tasks: readStoredTasks(),
    slaRiskWindowHours: readStoredSlaRiskWindowHours(),
  };
}

/**
 * Persiste o snapshot do Acompanhamento de Tarefas nos storages do navegador.
 */
export function writeTaskTrackingSnapshot(snapshot: TaskTrackingSnapshot): void {
  const projectKey = snapshot.selectedProjectKey.trim();
  writeSessionItem(FILAS_PROJECT_STORAGE_KEY, projectKey || null);

  if (snapshot.queueSelection?.projectKey) {
    writeFilasImportSelection({
      projectKeys:
        snapshot.queueSelection.projectKeys?.length
          ? snapshot.queueSelection.projectKeys
          : [snapshot.queueSelection.projectKey.trim()],
      queueCategories: snapshot.queueSelection.queueCategories ?? [],
      queueStatuses: snapshot.queueSelection.queueStatuses ?? [],
      queueIds: normalizeQueueIds(snapshot.queueSelection),
    });
  } else {
    writeSessionItem(FILAS_QUEUE_STORAGE_KEY, null);
  }

  writeLocalItem(FILAS_TASKS_STORAGE_KEY, JSON.stringify(snapshot.tasks));
  writeLocalItem(FILAS_SLA_RISK_WINDOW_STORAGE_KEY, String(snapshot.slaRiskWindowHours));
  scheduleLocalFolderSync();
}

/** Lê a seleção persistida do assistente de importação das filas. */
export function readFilasImportSelection(): FilasImportSelection | null {
  const selection = readStoredQueueSelection();
  if (!selection) return null;
  const projectKeys = selection.projectKeys ?? (selection.projectKey ? [selection.projectKey] : []);
  const queueCategories = selection.queueCategories ?? [];
  const queueStatuses = selection.queueStatuses ?? [];
  const queueIds = normalizeQueueIds(selection);
  if (
    projectKeys.length === 0 &&
    queueCategories.length === 0 &&
    queueStatuses.length === 0 &&
    queueIds.length === 0
  ) {
    return null;
  }
  return { projectKeys, queueCategories, queueStatuses, queueIds };
}

export type FilasImportSelection = Pick<
  TaskTrackingQueueSelection,
  'projectKeys' | 'queueCategories' | 'queueStatuses' | 'queueIds'
>;

/** Persiste a seleção do assistente de importação das filas. */
export function writeFilasImportSelection(selection: FilasImportSelection): void {
  const projectKeys = (selection.projectKeys ?? []).map(k => k.trim()).filter(Boolean);
  const queueCategories = (selection.queueCategories ?? []).map(c => c.trim()).filter(Boolean);
  const queueStatuses = (selection.queueStatuses ?? []).map(s => s.trim()).filter(Boolean);
  const queueIds = normalizeQueueIds(selection);

  if (projectKeys.length === 0) {
    writeSessionItem(FILAS_QUEUE_STORAGE_KEY, null);
    return;
  }

  writeSessionItem(
    FILAS_QUEUE_STORAGE_KEY,
    JSON.stringify({
      projectKey: projectKeys[0],
      projectKeys,
      queueCategories,
      queueStatuses,
      ...(queueIds.length > 0 ? { queueIds, queueId: queueIds[0] } : {}),
    })
  );
}

/** Lê os IDs das filas salvas para um projeto Jira. */
export function readStoredQueueIdsForProject(projectKey: string): string[] {
  if (!projectKey) return [];
  const selection = readStoredQueueSelection();
  if (selection?.projectKey !== projectKey) return [];
  return selection.queueIds ?? normalizeQueueIds(selection);
}

/** @deprecated Use readStoredQueueIdsForProject. */
export function readStoredQueueIdForProject(projectKey: string): string {
  return readStoredQueueIdsForProject(projectKey)[0] ?? '';
}

/** Persiste a seleção de filas para um projeto Jira. */
export function writeStoredQueueIdsForProject(projectKey: string, queueIds: string[]): void {
  const normalizedProject = projectKey.trim();
  const normalizedQueueIds = queueIds.map(id => id.trim()).filter(Boolean);
  if (!normalizedProject || normalizedQueueIds.length === 0) {
    writeSessionItem(FILAS_QUEUE_STORAGE_KEY, null);
    return;
  }
  writeSessionItem(
    FILAS_QUEUE_STORAGE_KEY,
    JSON.stringify({
      projectKey: normalizedProject,
      queueIds: normalizedQueueIds,
      queueId: normalizedQueueIds[0],
    })
  );
}

/** @deprecated Use writeStoredQueueIdsForProject. */
export function writeStoredQueueIdForProject(projectKey: string, queueId: string): void {
  writeStoredQueueIdsForProject(projectKey, queueId ? [queueId] : []);
}

/** Notifica componentes na mesma aba que o acompanhamento foi restaurado via importação. */
export function dispatchTaskTrackingRestored(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TASK_TRACKING_RESTORED_EVENT));
}

function isJiraTaskLike(value: unknown): value is JiraTask {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return typeof o.id === 'string' && o.id.trim().length > 0;
}

/**
 * Normaliza dados de acompanhamento vindos de um backup JSON.
 */
export function normalizeTaskTrackingBackup(raw: unknown): TaskTrackingSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;

  const o = raw as Record<string, unknown>;
  const tasksRaw = o.tasks;
  const tasks = Array.isArray(tasksRaw)
    ? tasksRaw.filter(isJiraTaskLike).map(t => ({ ...t, id: t.id.trim() }))
    : [];

  const slaRaw = Number(o.slaRiskWindowHours);
  const slaRiskWindowHours =
    Number.isFinite(slaRaw) && slaRaw > 0 ? slaRaw : DEFAULT_SLA_RISK_WINDOW_HOURS;

  const selectedProjectKey =
    typeof o.selectedProjectKey === 'string' ? o.selectedProjectKey.trim() : '';

  let queueSelection: TaskTrackingQueueSelection | null = null;
  if (o.queueSelection && typeof o.queueSelection === 'object') {
    const q = o.queueSelection as Partial<TaskTrackingQueueSelection>;
    const pk = typeof q.projectKey === 'string' ? q.projectKey.trim() : '';
    const queueIds = normalizeQueueIds(q);
    if (pk && queueIds.length > 0) {
      queueSelection = { projectKey: pk, queueIds, queueId: queueIds[0] };
    }
  }

  return { selectedProjectKey, queueSelection, tasks, slaRiskWindowHours };
}

/**
 * Restaura o Acompanhamento de Tarefas a partir de um backup e notifica a UI.
 */
export function restoreTaskTrackingFromBackup(raw: unknown): boolean {
  const snapshot = normalizeTaskTrackingBackup(raw);
  if (!snapshot) {
    logger.debug('Backup sem dados de acompanhamento de tarefas', 'taskTrackingStorage');
    return false;
  }

  writeTaskTrackingSnapshot(snapshot);
  dispatchTaskTrackingRestored();
  logger.info(
    `Acompanhamento de tarefas restaurado: ${snapshot.tasks.length} tarefa(s)`,
    'taskTrackingStorage',
    { projectKey: snapshot.selectedProjectKey || '(nenhum)' }
  );
  return true;
}

export { EMPTY_SNAPSHOT };

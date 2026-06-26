import type { JiraTask } from '../types';
import { DEFAULT_SLA_RISK_WINDOW_HOURS } from '../utils/jiraFilasMetrics';
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
  queueId: string;
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

function readStoredQueueSelection(): TaskTrackingQueueSelection | null {
  const raw = readSessionItem(FILAS_QUEUE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TaskTrackingQueueSelection>;
    if (
      typeof parsed.projectKey === 'string' &&
      parsed.projectKey.trim() &&
      typeof parsed.queueId === 'string' &&
      parsed.queueId.trim()
    ) {
      return { projectKey: parsed.projectKey.trim(), queueId: parsed.queueId.trim() };
    }
    return null;
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

  if (snapshot.queueSelection?.projectKey && snapshot.queueSelection.queueId) {
    writeSessionItem(FILAS_QUEUE_STORAGE_KEY, JSON.stringify(snapshot.queueSelection));
  } else {
    writeSessionItem(FILAS_QUEUE_STORAGE_KEY, null);
  }

  writeLocalItem(FILAS_TASKS_STORAGE_KEY, JSON.stringify(snapshot.tasks));
  writeLocalItem(FILAS_SLA_RISK_WINDOW_STORAGE_KEY, String(snapshot.slaRiskWindowHours));
}

/** Lê o ID da fila salvo para um projeto Jira. */
export function readStoredQueueIdForProject(projectKey: string): string {
  if (!projectKey) return '';
  const selection = readStoredQueueSelection();
  return selection?.projectKey === projectKey ? selection.queueId : '';
}

/** Persiste a seleção de fila para um projeto Jira. */
export function writeStoredQueueIdForProject(projectKey: string, queueId: string): void {
  const normalizedProject = projectKey.trim();
  const normalizedQueue = queueId.trim();
  if (!normalizedProject || !normalizedQueue) {
    writeSessionItem(FILAS_QUEUE_STORAGE_KEY, null);
    return;
  }
  writeSessionItem(
    FILAS_QUEUE_STORAGE_KEY,
    JSON.stringify({ projectKey: normalizedProject, queueId: normalizedQueue })
  );
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
    const q = o.queueSelection as Record<string, unknown>;
    if (typeof q.projectKey === 'string' && typeof q.queueId === 'string') {
      const pk = q.projectKey.trim();
      const qid = q.queueId.trim();
      if (pk && qid) {
        queueSelection = { projectKey: pk, queueId: qid };
      }
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

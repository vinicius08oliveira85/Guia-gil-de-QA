import type { JiraTask } from '../types';

/** Abas fixas do projeto. */
export type ProjectFixedTabId = 'dashboard' | 'tasks' | 'documents' | 'businessRules';

/** Abas fixas da tela Acompanhamento de Tarefas (Jira Solus). */
export type JiraSolusFixedTabId = 'dashboard' | 'filas';

/** Identificador de aba do workspace (fixa ou tarefa). */
export type WorkspaceTabId = ProjectFixedTabId | JiraSolusFixedTabId | `task:${string}`;

export const PROJECT_FIXED_TAB_IDS: ProjectFixedTabId[] = [
  'dashboard',
  'tasks',
  'documents',
  'businessRules',
];

export const JIRA_SOLUS_FIXED_TAB_IDS: JiraSolusFixedTabId[] = ['dashboard', 'filas'];

export const MAX_OPEN_TASK_TABS = 10;

export const TASK_TAB_PREFIX = 'task:' as const;

export function isProjectFixedTabId(id: WorkspaceTabId): id is ProjectFixedTabId {
  return (PROJECT_FIXED_TAB_IDS as string[]).includes(id);
}

export function isJiraSolusFixedTabId(id: WorkspaceTabId): id is JiraSolusFixedTabId {
  return (JIRA_SOLUS_FIXED_TAB_IDS as string[]).includes(id);
}

export function isTaskTabId(id: WorkspaceTabId): id is `task:${string}` {
  return id.startsWith(TASK_TAB_PREFIX);
}

export function taskTabId(taskId: string): `task:${string}` {
  return `${TASK_TAB_PREFIX}${taskId}`;
}

export function taskIdFromTabId(tabId: WorkspaceTabId): string | null {
  if (!isTaskTabId(tabId)) return null;
  return tabId.slice(TASK_TAB_PREFIX.length);
}

export function truncateTaskTabTitle(title: string, max = 36): string {
  const trimmed = title.trim() || 'Sem título';
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export interface TaskTabLabel {
  taskId: string;
  title: string;
  status?: JiraTask['status'];
}

export function buildTaskTabLabel(task: JiraTask): TaskTabLabel {
  return {
    taskId: task.id,
    title: truncateTaskTabTitle(task.title ?? ''),
    status: task.status,
  };
}

export function resolveTaskTabLabels(
  openTaskTabIds: string[],
  tasks: JiraTask[]
): TaskTabLabel[] {
  const byId = new Map(tasks.map(t => [t.id, t]));
  return openTaskTabIds.map(taskId => {
    const task = byId.get(taskId);
    if (!task) {
      return { taskId, title: taskId };
    }
    return buildTaskTabLabel(task);
  });
}

/**
 * Abre ou foca aba de tarefa respeitando o limite máximo.
 * Retorna nova lista de IDs e aba ativa.
 */
export function openTaskTabState(
  openTaskTabIds: string[],
  activeTab: WorkspaceTabId,
  taskId: string
): { openTaskTabIds: string[]; activeTab: WorkspaceTabId } {
  const tabId = taskTabId(taskId);
  if (openTaskTabIds.includes(taskId)) {
    return { openTaskTabIds, activeTab: tabId };
  }

  let nextIds = [...openTaskTabIds, taskId];
  if (nextIds.length > MAX_OPEN_TASK_TABS) {
    nextIds = nextIds.slice(nextIds.length - MAX_OPEN_TASK_TABS);
  }

  return { openTaskTabIds: nextIds, activeTab: tabId };
}

/**
 * Fecha aba de tarefa e retorna a aba ativa sugerida.
 */
export function closeTaskTabState(
  openTaskTabIds: string[],
  activeTab: WorkspaceTabId,
  taskIdToClose: string,
  fallbackFixedTab: ProjectFixedTabId | JiraSolusFixedTabId = 'tasks'
): { openTaskTabIds: string[]; activeTab: WorkspaceTabId } {
  const closingTabId = taskTabId(taskIdToClose);
  const nextIds = openTaskTabIds.filter(id => id !== taskIdToClose);

  if (activeTab !== closingTabId) {
    return { openTaskTabIds: nextIds, activeTab };
  }

  const closedIndex = openTaskTabIds.indexOf(taskIdToClose);
  const fallbackTaskId =
    nextIds[Math.max(0, closedIndex - 1)] ?? nextIds[nextIds.length - 1];

  const nextActive: WorkspaceTabId = fallbackTaskId
    ? taskTabId(fallbackTaskId)
    : fallbackFixedTab;

  return { openTaskTabIds: nextIds, activeTab: nextActive };
}

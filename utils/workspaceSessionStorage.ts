import {
  isJiraSolusFixedTabId,
  isProjectFixedTabId,
  isTaskTabId,
  PROJECT_FIXED_TAB_IDS,
  JIRA_SOLUS_FIXED_TAB_IDS,
  type WorkspaceTabId,
} from './workspaceTabs';

export type WorkspaceScope = 'project' | 'jira-solus';

export type TaskDetailSectionId =
  | 'overview'
  | 'bdd'
  | 'tests'
  | 'guidance'
  | 'businessRules'
  | 'planning';

export interface WorkspaceSessionState {
  activeTab: WorkspaceTabId;
  openTaskTabIds: string[];
  tasksListMode?: 'all' | 'backlog';
  /** Seção ativa por task (Resumo, Testes, etc.). */
  taskSections?: Record<string, TaskDetailSectionId>;
}

const STORAGE_PREFIX = 'qa-workspace-session:';

export function workspaceSessionStorageKey(scope: WorkspaceScope, scopeId: string): string {
  return `${STORAGE_PREFIX}${scope}:${scopeId}`;
}

function isValidTabForScope(tab: string, scope: WorkspaceScope): tab is WorkspaceTabId {
  const tabId = tab as WorkspaceTabId;
  if (isTaskTabId(tabId)) return true;
  if (scope === 'project') return isProjectFixedTabId(tabId);
  return isJiraSolusFixedTabId(tabId);
}

function sanitizeSession(
  raw: Partial<WorkspaceSessionState> | null | undefined,
  scope: WorkspaceScope,
  defaultTab: WorkspaceTabId
): WorkspaceSessionState {
  const activeTab =
    raw?.activeTab && isValidTabForScope(raw.activeTab, scope) ? raw.activeTab : defaultTab;

  const openTaskTabIds = Array.isArray(raw?.openTaskTabIds)
    ? raw.openTaskTabIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];

  const tasksListMode = raw?.tasksListMode === 'backlog' ? 'backlog' : 'all';

  const taskSections: Record<string, TaskDetailSectionId> = {};
  if (raw?.taskSections && typeof raw.taskSections === 'object') {
    const allowed: TaskDetailSectionId[] = [
      'overview',
      'bdd',
      'tests',
      'guidance',
      'businessRules',
      'planning',
    ];
    for (const [taskId, section] of Object.entries(raw.taskSections)) {
      if (allowed.includes(section as TaskDetailSectionId)) {
        taskSections[taskId] = section as TaskDetailSectionId;
      }
    }
  }

  return {
    activeTab,
    openTaskTabIds,
    ...(scope === 'project' ? { tasksListMode } : {}),
    ...(Object.keys(taskSections).length > 0 ? { taskSections } : {}),
  };
}

export function loadWorkspaceSession(
  scope: WorkspaceScope,
  scopeId: string,
  defaultTab: WorkspaceTabId
): WorkspaceSessionState {
  if (typeof window === 'undefined') {
    return sanitizeSession(null, scope, defaultTab);
  }
  try {
    const raw = localStorage.getItem(workspaceSessionStorageKey(scope, scopeId));
    if (!raw) return sanitizeSession(null, scope, defaultTab);
    return sanitizeSession(JSON.parse(raw) as WorkspaceSessionState, scope, defaultTab);
  } catch {
    return sanitizeSession(null, scope, defaultTab);
  }
}

export function saveWorkspaceSession(
  scope: WorkspaceScope,
  scopeId: string,
  state: WorkspaceSessionState
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(workspaceSessionStorageKey(scope, scopeId), JSON.stringify(state));
  } catch {
    /* quota ou modo privado */
  }
}

export function readWorkspaceTabFromUrl(): WorkspaceTabId | null {
  if (typeof window === 'undefined') return null;
  const tab = new URLSearchParams(window.location.search).get('tab');
  if (!tab) return null;
  const tabId = tab as WorkspaceTabId;
  if (isTaskTabId(tabId)) return tabId;
  if ((PROJECT_FIXED_TAB_IDS as string[]).includes(tab)) return tabId;
  if ((JIRA_SOLUS_FIXED_TAB_IDS as string[]).includes(tab)) return tabId;
  return null;
}

export function getAdjacentOpenTaskId(
  openTaskTabIds: string[],
  currentTaskId: string,
  direction: 'prev' | 'next'
): string | null {
  if (openTaskTabIds.length < 2) return null;
  const index = openTaskTabIds.indexOf(currentTaskId);
  if (index < 0) return null;
  const nextIndex =
    direction === 'next'
      ? (index + 1) % openTaskTabIds.length
      : (index - 1 + openTaskTabIds.length) % openTaskTabIds.length;
  return openTaskTabIds[nextIndex] ?? null;
}

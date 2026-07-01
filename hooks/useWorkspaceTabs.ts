import { useCallback, useEffect, useRef, useState } from 'react';
import type { JiraTask } from '../types';
import type { TasksListMode } from '../utils/backlogTasks';
import {
  closeTaskTabState,
  openTaskTabState,
  taskTabId,
  type JiraSolusFixedTabId,
  type ProjectFixedTabId,
  type WorkspaceTabId,
} from '../utils/workspaceTabs';
import {
  loadWorkspaceSession,
  readWorkspaceTabFromUrl,
  saveWorkspaceSession,
  type TaskDetailSectionId,
  type WorkspaceScope,
  type WorkspaceSessionState,
} from '../utils/workspaceSessionStorage';

const SAVE_DEBOUNCE_MS = 250;

export interface UseWorkspaceTabsOptions {
  scope: WorkspaceScope;
  scopeId: string;
  defaultActiveTab: WorkspaceTabId;
  /** Sincroniza ?tab= na URL (apenas scope project com projectId). */
  syncUrl?: boolean;
  projectIdForUrl?: string;
  fallbackFixedTab?: ProjectFixedTabId | JiraSolusFixedTabId;
}

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

function buildProjectSearch(
  projectId: string,
  activeTab: WorkspaceTabId,
  tasksListMode: TasksListMode
): string {
  const params = new URLSearchParams();
  params.set('project', projectId);
  params.set('tab', activeTab);
  if (tasksListMode === 'backlog') {
    params.set('subview', 'backlog');
  }
  return `?${params.toString()}`;
}

function readTasksListModeFromUrl(): TasksListMode {
  if (typeof window === 'undefined') return 'all';
  const params = new URLSearchParams(window.location.search);
  const subview = params.get('subview');
  const view = params.get('view');
  if (subview === 'backlog' || view === 'backlog') return 'backlog';
  if (normalizePathname(window.location.pathname) === '/backlog') return 'backlog';
  return 'all';
}

function resolveInitialState(
  options: UseWorkspaceTabsOptions
): WorkspaceSessionState & { tasksListMode: TasksListMode } {
  const stored = loadWorkspaceSession(options.scope, options.scopeId, options.defaultActiveTab);
  const urlTab = options.syncUrl ? readWorkspaceTabFromUrl() : null;
  const urlMode = options.syncUrl ? readTasksListModeFromUrl() : stored.tasksListMode ?? 'all';

  let activeTab = urlTab ?? stored.activeTab;
  let openTaskTabIds = [...stored.openTaskTabIds];

  if (urlTab && isTaskTabFromUrl(urlTab)) {
    const taskId = urlTab.slice('task:'.length);
    if (taskId && !openTaskTabIds.includes(taskId)) {
      openTaskTabIds = [...openTaskTabIds, taskId];
    }
  }

  return {
    activeTab,
    openTaskTabIds,
    tasksListMode: urlMode,
    taskSections: stored.taskSections ?? {},
  };
}

function isTaskTabFromUrl(tab: WorkspaceTabId): boolean {
  return tab.startsWith('task:');
}

export function useWorkspaceTabs(options: UseWorkspaceTabsOptions) {
  const {
    scope,
    scopeId,
    defaultActiveTab,
    syncUrl = false,
    projectIdForUrl,
    fallbackFixedTab = scope === 'project' ? 'tasks' : 'filas',
  } = options;

  const [state, setState] = useState(() => resolveInitialState(options));
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipUrlWriteRef = useRef(false);
  const scopeIdRef = useRef(scopeId);
  scopeIdRef.current = scopeId;

  const persist = useCallback(
    (next: WorkspaceSessionState & { tasksListMode?: TasksListMode }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveWorkspaceSession(scope, scopeIdRef.current, {
          activeTab: next.activeTab,
          openTaskTabIds: next.openTaskTabIds,
          ...(scope === 'project' ? { tasksListMode: next.tasksListMode } : {}),
          taskSections: next.taskSections,
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [scope]
  );

  const applyState = useCallback(
    (updater: (prev: typeof state) => typeof state) => {
      setState(prev => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setActiveTab = useCallback(
    (tabId: WorkspaceTabId) => {
      applyState(prev => ({ ...prev, activeTab: tabId }));
    },
    [applyState]
  );

  const setTasksListMode = useCallback(
    (mode: TasksListMode) => {
      applyState(prev => ({ ...prev, tasksListMode: mode }));
    },
    [applyState]
  );

  const setTaskSection = useCallback(
    (taskId: string, section: TaskDetailSectionId) => {
      applyState(prev => ({
        ...prev,
        taskSections: { ...prev.taskSections, [taskId]: section },
      }));
    },
    [applyState]
  );

  const openTaskTab = useCallback(
    (task: JiraTask) => {
      applyState(prev => {
        const next = openTaskTabState(prev.openTaskTabIds, prev.activeTab, task.id);
        return {
          ...prev,
          openTaskTabIds: next.openTaskTabIds,
          activeTab: next.activeTab,
        };
      });
    },
    [applyState]
  );

  const closeTaskTab = useCallback(
    (taskId: string) => {
      applyState(prev => {
        const next = closeTaskTabState(
          prev.openTaskTabIds,
          prev.activeTab,
          taskId,
          fallbackFixedTab
        );
        const taskSections = { ...prev.taskSections };
        delete taskSections[taskId];
        return {
          ...prev,
          openTaskTabIds: next.openTaskTabIds,
          activeTab: next.activeTab,
          taskSections,
        };
      });
    },
    [applyState, fallbackFixedTab]
  );

  const focusTaskTab = useCallback(
    (taskId: string) => {
      applyState(prev => {
        if (!prev.openTaskTabIds.includes(taskId)) {
          const next = openTaskTabState(prev.openTaskTabIds, prev.activeTab, taskId);
          return { ...prev, ...next };
        }
        return { ...prev, activeTab: taskTabId(taskId) };
      });
    },
    [applyState]
  );

  /** Recarrega sessão ao trocar de projeto (scopeId). */
  useEffect(() => {
    skipUrlWriteRef.current = true;
    const initial = resolveInitialState({ ...options, scopeId });
    setState(initial);
    persist(initial);
    const t = setTimeout(() => {
      skipUrlWriteRef.current = false;
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset só quando scopeId muda
  }, [scopeId]);

  /** Sincroniza URL do projeto. */
  useEffect(() => {
    if (!syncUrl || !projectIdForUrl || typeof window === 'undefined') return;
    if (skipUrlWriteRef.current) return;

    const desired = buildProjectSearch(projectIdForUrl, state.activeTab, state.tasksListMode);
    const path = normalizePathname(window.location.pathname);
    const canonicalPath = path === '/backlog' ? '/' : path;
    const nextUrl = `${canonicalPath}${desired}`;

    if (path === '/backlog') {
      window.history.replaceState({ workspaceTab: state.activeTab }, '', nextUrl);
      return;
    }

    if (`${canonicalPath}${window.location.search}` !== nextUrl) {
      window.history.pushState({ workspaceTab: state.activeTab }, '', nextUrl);
    }
  }, [syncUrl, projectIdForUrl, state.activeTab, state.tasksListMode]);

  /** Voltar/avançar do navegador. */
  useEffect(() => {
    if (!syncUrl || typeof window === 'undefined') return;

    const onPopState = () => {
      skipUrlWriteRef.current = true;
      const urlTab = readWorkspaceTabFromUrl();
      const urlMode = readTasksListModeFromUrl();
      setState(prev => {
        let openTaskTabIds = [...prev.openTaskTabIds];
        const activeTab = urlTab ?? prev.activeTab;
        if (urlTab && isTaskTabFromUrl(urlTab)) {
          const taskId = urlTab.slice('task:'.length);
          if (taskId && !openTaskTabIds.includes(taskId)) {
            openTaskTabIds = [...openTaskTabIds, taskId];
          }
        }
        const next = {
          ...prev,
          activeTab,
          openTaskTabIds,
          tasksListMode: urlMode,
        };
        persist(next);
        return next;
      });
      setTimeout(() => {
        skipUrlWriteRef.current = false;
      }, 0);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [syncUrl, persist]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return {
    activeTab: state.activeTab,
    openTaskTabIds: state.openTaskTabIds,
    tasksListMode: state.tasksListMode,
    taskSections: state.taskSections ?? {},
    setActiveTab,
    setTasksListMode,
    setTaskSection,
    openTaskTab,
    closeTaskTab,
    focusTaskTab,
  };
}

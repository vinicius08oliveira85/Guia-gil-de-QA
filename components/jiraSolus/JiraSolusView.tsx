import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LANDING_SECTIONS } from '../landing/landingSections';
import { cn } from '../../utils/cn';
import type { JiraTask } from '../../types';
import { type JiraFilasFilter } from '../../utils/jiraFilasMetrics';
import {
  FILAS_PROJECT_STORAGE_KEY,
  FILAS_SLA_RISK_WINDOW_STORAGE_KEY,
  FILAS_TASKS_STORAGE_KEY,
  readTaskTrackingSnapshot,
  TASK_TRACKING_RESTORED_EVENT,
  writeTaskTrackingSnapshot,
} from '../../services/taskTrackingStorage';
import { Breadcrumbs, type BreadcrumbItem } from '../common/Breadcrumbs';
import {
  jiraSolusChromeHeaderClass,
  jiraSolusPanelsAreaClass,
  jiraSolusViewContentClass,
  jiraSolusViewPageShellClass,
} from './jiraSolusViewNeuUi';
import { JiraFilasPanel, type JiraFilasWorkspaceBridge } from './JiraFilasPanel';
import { JiraFilasDashboardPanel } from './JiraFilasDashboardPanel';
import { ProjectWorkspaceTabBar } from '../project/ProjectWorkspaceTabBar';
import { TaskWorkspacePanel } from '../tasks/TaskWorkspacePanel';
import {
  projectChromeBreadcrumbsClass,
  projectChromeHeaderInnerClass,
  projectChromeToolbarClass,
} from '../tasks/tasksPanelNeuStyles';
import {
  isJiraSolusFixedTabId,
  isTaskTabId,
  resolveTaskTabLabels,
  taskIdFromTabId,
  type JiraSolusFixedTabId,
  type WorkspaceTabId,
} from '../../utils/workspaceTabs';
import { getAdjacentOpenTaskId } from '../../utils/workspaceSessionStorage';
import { useWorkspaceTabs } from '../../hooks/useWorkspaceTabs';
import { useTaskTrackingHeaderStore } from '../../store/taskTrackingHeaderStore';
import { TaskTrackingWorkspaceActions } from '../common/TaskTrackingWorkspaceActions';
import toast from 'react-hot-toast';
import { KeepAlivePanel } from '../common/KeepAlivePanel';

const FIXED_TABS: Array<{ id: JiraSolusFixedTabId; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'filas', label: 'Filas (Jira)' },
];

const FIXED_TAB_LABELS: Record<JiraSolusFixedTabId, string> = {
  dashboard: 'Dashboard',
  filas: 'Filas (Jira)',
};

function applySnapshotToState(
  snapshot: ReturnType<typeof readTaskTrackingSnapshot>,
  setters: {
    setTasks: React.Dispatch<React.SetStateAction<JiraTask[]>>;
    setSelectedProjectKey: React.Dispatch<React.SetStateAction<string>>;
    setSlaRiskWindowHours: React.Dispatch<React.SetStateAction<number>>;
  }
): void {
  setters.setTasks(snapshot.tasks);
  setters.setSelectedProjectKey(snapshot.selectedProjectKey);
  setters.setSlaRiskWindowHours(snapshot.slaRiskWindowHours);
}

/**
 * Tela Acompanhamento de Tarefas — abas Dashboard (indicadores de SLA/Status) e
 * Filas (Jira), com abas dinâmicas de tarefa no estilo console.
 */
export const JiraSolusView = React.memo(() => {
  const initialSnapshot = useMemo(() => readTaskTrackingSnapshot(), []);
  const [tasks, setTasks] = useState<JiraTask[]>(() => initialSnapshot.tasks);
  const [selectedProjectKey, setSelectedProjectKey] = useState(
    () => initialSnapshot.selectedProjectKey
  );

  const workspaceScopeId = selectedProjectKey || 'global';
  const {
    activeTab,
    openTaskTabIds,
    taskSections,
    setActiveTab,
    setTaskSection,
    openTaskTab,
    closeTaskTab,
    focusTaskTab,
  } = useWorkspaceTabs({
    scope: 'jira-solus',
    scopeId: workspaceScopeId,
    defaultActiveTab: 'dashboard',
    fallbackFixedTab: 'filas',
  });

  const [filasBridge, setFilasBridge] = useState<JiraFilasWorkspaceBridge | null>(null);
  const [jiraStatuses, setJiraStatuses] = useState<Array<{ name: string; color: string }>>([]);
  const [slaRiskWindowHours, setSlaRiskWindowHours] = useState(
    () => initialSnapshot.slaRiskWindowHours
  );
  const [activeFilter, setActiveFilter] = useState<JiraFilasFilter>({ kind: 'all' });
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const taskTrackingJiraAction = useTaskTrackingHeaderStore(s => s.jiraAction);

  const saveTaskTracking = useCallback(async () => {
    setIsSavingTracking(true);
    try {
      writeTaskTrackingSnapshot({
        selectedProjectKey,
        queueSelection: readTaskTrackingSnapshot().queueSelection,
        tasks,
        slaRiskWindowHours,
      });
      toast.success('Acompanhamento salvo localmente!');
    } finally {
      setIsSavingTracking(false);
    }
  }, [selectedProjectKey, tasks, slaRiskWindowHours]);

  useEffect(() => {
    const handleRestored = () => {
      applySnapshotToState(readTaskTrackingSnapshot(), {
        setTasks,
        setSelectedProjectKey,
        setSlaRiskWindowHours,
      });
    };
    window.addEventListener(TASK_TRACKING_RESTORED_EVENT, handleRestored);
    return () => window.removeEventListener(TASK_TRACKING_RESTORED_EVENT, handleRestored);
  }, []);

  useEffect(() => {
    const taskIdToFocus = sessionStorage.getItem('taskIdToFocus');
    if (!taskIdToFocus) return;
    const task = tasks.find(item => item.id === taskIdToFocus);
    if (!task) return;
    sessionStorage.removeItem('taskIdToFocus');
    openTaskTab(task);
  }, [tasks, openTaskTab]);

  useEffect(() => {
    try {
      if (selectedProjectKey) {
        sessionStorage.setItem(FILAS_PROJECT_STORAGE_KEY, selectedProjectKey);
      } else {
        sessionStorage.removeItem(FILAS_PROJECT_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [selectedProjectKey]);

  useEffect(() => {
    try {
      localStorage.setItem(FILAS_TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* ignore */
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(FILAS_SLA_RISK_WINDOW_STORAGE_KEY, String(slaRiskWindowHours));
    } catch {
      /* ignore */
    }
  }, [slaRiskWindowHours]);

  const taskTabLabels = useMemo(
    () => resolveTaskTabLabels(openTaskTabIds, tasks),
    [openTaskTabIds, tasks]
  );

  const activeTaskId = useMemo(
    () => (isTaskTabId(activeTab) ? taskIdFromTabId(activeTab) : null),
    [activeTab]
  );

  const showFilasPanel = isJiraSolusFixedTabId(activeTab) && activeTab === 'filas';
  const showDashboardPanel = isJiraSolusFixedTabId(activeTab) && activeTab === 'dashboard';

  const handleApplyFilter = useCallback(
    (filter: JiraFilasFilter) => {
      setActiveFilter(filter);
      setActiveTab('filas');
    },
    [setActiveTab]
  );

  const handleSelectWorkspaceTab = useCallback(
    (tabId: WorkspaceTabId) => {
      setActiveTab(tabId);
    },
    [setActiveTab]
  );

  const handleOpenTaskTab = useCallback(
    (task: JiraTask) => {
      openTaskTab(task);
    },
    [openTaskTab]
  );

  const handleCloseTaskTab = useCallback(
    (taskId: string) => {
      closeTaskTab(taskId);
    },
    [closeTaskTab]
  );

  const handleNavigateAdjacentTask = useCallback(
    (direction: 'prev' | 'next') => {
      if (!activeTaskId) return;
      const nextId = getAdjacentOpenTaskId(openTaskTabIds, activeTaskId, direction);
      if (nextId) focusTaskTab(nextId);
    },
    [activeTaskId, openTaskTabIds, focusTaskTab]
  );

  useEffect(() => {
    if (!activeTaskId || openTaskTabIds.length < 2) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNavigateAdjacentTask('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNavigateAdjacentTask('next');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTaskId, openTaskTabIds.length, handleNavigateAdjacentTask]);

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const allTabIds: WorkspaceTabId[] = [
        ...FIXED_TABS.map(t => t.id),
        ...openTaskTabIds.map(id => `task:${id}` as const),
      ];
      const index = allTabIds.findIndex(t => t === activeTab);
      if (index < 0) return;
      let nextIndex = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (index + 1) % allTabIds.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (index - 1 + allTabIds.length) % allTabIds.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = allTabIds.length - 1;
      } else return;
      if (nextIndex !== index) setActiveTab(allTabIds[nextIndex]);
    },
    [activeTab, openTaskTabIds]
  );

  const breadcrumbTaskId = activeTaskId;
  const breadcrumbTaskTitle = useMemo(() => {
    if (!breadcrumbTaskId) return null;
    return tasks.find(t => t.id === breadcrumbTaskId)?.title ?? breadcrumbTaskId;
  }, [breadcrumbTaskId, tasks]);

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: LANDING_SECTIONS.jiraSolus.title,
        onClick:
          !isJiraSolusFixedTabId(activeTab) || activeTab !== 'dashboard'
            ? () => setActiveTab('dashboard')
            : undefined,
      },
    ];

    if (isTaskTabId(activeTab) && breadcrumbTaskTitle) {
      items.push({
        label: FIXED_TAB_LABELS.filas,
        onClick: () => setActiveTab('filas'),
      });
      items.push({ label: breadcrumbTaskTitle });
      return items;
    }

    if (isJiraSolusFixedTabId(activeTab) && activeTab === 'filas') {
      items.push({ label: FIXED_TAB_LABELS.filas });
    }

    return items;
  }, [activeTab, breadcrumbTaskTitle]);

  return (
    <div className={jiraSolusViewPageShellClass} data-theme="leve">
      <div className={jiraSolusViewContentClass}>
        <div className={jiraSolusChromeHeaderClass}>
          <div className={cn('flex min-w-0 flex-col gap-1', projectChromeHeaderInnerClass)}>
            <div className="project-chrome-header-row flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 max-md:flex-nowrap max-md:items-center max-md:gap-1 max-md:gap-y-0">
              <div className="min-w-0 max-w-full flex-1 overflow-x-auto max-md:overflow-hidden sm:overflow-visible">
                <Breadcrumbs
                  items={breadcrumbItems}
                  showHome={false}
                  align="left"
                  dense
                  className={cn(projectChromeBreadcrumbsClass, 'w-full min-w-0 max-w-full')}
                />
              </div>
              <div className={cn(projectChromeToolbarClass, 'shrink-0')} role="presentation">
                <TaskTrackingWorkspaceActions
                  variant="toolbar"
                  onSave={saveTaskTracking}
                  onJiraSync={() => taskTrackingJiraAction?.onSync()}
                  isSaving={isSavingTracking}
                  isJiraSyncing={taskTrackingJiraAction?.isSyncing}
                  jiraDisabled={taskTrackingJiraAction?.disabled ?? true}
                  jiraTitle={taskTrackingJiraAction?.title}
                />
              </div>
            </div>
          </div>
          <ProjectWorkspaceTabBar
            fixedTabs={FIXED_TABS}
            activeTab={activeTab}
            taskTabs={taskTabLabels}
            onSelectTab={handleSelectWorkspaceTab}
            onCloseTaskTab={handleCloseTaskTab}
            onTabKeyDown={handleTabKeyDown}
          />
        </div>

        <div className={jiraSolusPanelsAreaClass}>
        {openTaskTabIds.map(taskId => (
          <div
            key={taskId}
            className={activeTaskId === taskId ? undefined : 'hidden'}
            aria-hidden={activeTaskId !== taskId}
          >
            {filasBridge ? (
              <TaskWorkspacePanel
                taskId={taskId}
                project={filasBridge.filasProject}
                onUpdateProject={filasBridge.onUpdateProject}
                onOpenTaskTab={handleOpenTaskTab}
                onClose={() => handleCloseTaskTab(taskId)}
                hideTestFeatures
                onUpdateFromJira={filasBridge.onUpdateFromJira}
                isUpdatingFromJira={filasBridge.isUpdatingFromJira === taskId}
                initialSection={taskSections[taskId]}
                onSectionChange={section => setTaskSection(taskId, section)}
                openTaskNav={
                  openTaskTabIds.length > 1
                    ? {
                        currentIndex: openTaskTabIds.indexOf(taskId) + 1,
                        total: openTaskTabIds.length,
                        onPrev: () => handleNavigateAdjacentTask('prev'),
                        onNext: () => handleNavigateAdjacentTask('next'),
                      }
                    : undefined
                }
              />
            ) : (
              <div className="rounded-lg border border-base-300/60 bg-base-100 p-4 text-sm text-base-content/80">
                Carregando detalhes da tarefa…
              </div>
            )}
          </div>
        ))}

        <div
          className={isTaskTabId(activeTab) ? 'hidden' : undefined}
          aria-hidden={isTaskTabId(activeTab)}
        >
          <KeepAlivePanel
            id="jira-solus-panel-dashboard"
            labelledBy="tab-dashboard"
            active={showDashboardPanel}
            lazy={false}
          >
            <JiraFilasDashboardPanel
              tasks={tasks}
              selectedProjectKey={selectedProjectKey}
              slaRiskWindowHours={slaRiskWindowHours}
              activeFilter={activeFilter}
              onApplyFilter={handleApplyFilter}
            />
          </KeepAlivePanel>

          <KeepAlivePanel
            id="jira-solus-panel-filas"
            labelledBy="tab-filas"
            active={showFilasPanel}
          >
            <JiraFilasPanel
              tasks={tasks}
              setTasks={setTasks}
              selectedProjectKey={selectedProjectKey}
              setSelectedProjectKey={setSelectedProjectKey}
              jiraStatuses={jiraStatuses}
              setJiraStatuses={setJiraStatuses}
              activeFilter={activeFilter}
              onClearFilter={() => setActiveFilter({ kind: 'all' })}
              slaRiskWindowHours={slaRiskWindowHours}
              onOpenTaskTab={handleOpenTaskTab}
              onWorkspaceBridgeChange={setFilasBridge}
            />
          </KeepAlivePanel>
        </div>
        </div>
      </div>
    </div>
  );
});

JiraSolusView.displayName = 'JiraSolusView';

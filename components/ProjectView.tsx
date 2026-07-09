import React, { useState, useEffect, Suspense, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, TestCase } from '../types';
import { useProjectMetrics } from '../hooks/useProjectMetrics';
import { PrintableReport } from './PrintableReport';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { QADashboard } from './dashboard/QADashboard';
import { DevDashboard } from './dashboard/DevDashboard';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const TasksView = lazyWithRetry(() =>
  import('./tasks/TasksView').then(m => ({ default: m.TasksView }))
);
const DocumentsView = lazyWithRetry(() =>
  import('./DocumentsView').then(m => ({ default: m.DocumentsView }))
);
const BusinessRulesManager = lazyWithRetry(() =>
  import('./project/BusinessRulesManager').then(m => ({ default: m.BusinessRulesManager }))
);
const NotepadView = lazyWithRetry(() =>
  import('./project/NotepadView').then(m => ({ default: m.NotepadView }))
);
import { KeepAlivePanel } from './common/KeepAlivePanel';
import { Breadcrumbs } from './common/Breadcrumbs';
import type { BreadcrumbItem } from './common/Breadcrumbs';
import { ConfirmDialog } from './common/ConfirmDialog';
import { useProjectsStore } from '../store/projectsStore';
import { useAutoSave } from '../hooks/useAutoSave';
import toast from 'react-hot-toast';
import { Spinner } from './common/Spinner';
import { Trash2, CheckCircle2, AlertTriangle, Layers, PanelRight, RefreshCw } from 'lucide-react';
import { logger } from '../utils/logger';
import { Button } from './common/Button';
import { cn } from '../utils/cn';
import { workspaceSurfaceLightClass } from './common/appPageNeuUi';
import { appContentPaddingX } from './common/viewUi';
import {
  projectChromeBacklogBtnClass,
  projectChromeBacklogCountClass,
  projectChromeBreadcrumbsClass,
  projectChromeDangerBtnClass,
  projectChromeHeaderInnerClass,
  projectChromeHeaderShellClass,
  projectChromeSyncBtnClass,
  projectChromeToolbarClass,
  projectChromeToolbarDividerClass,
  projectChromeToolbarStatusClass,
  projectChromeToolbarStatusWrapClass,
} from './tasks/tasksPanelNeuStyles';
import { countBacklogTasks, type TasksListMode } from '../utils/backlogTasks';
import {
  isProjectFixedTabId,
  isTaskTabId,
  resolveTaskTabLabels,
  taskIdFromTabId,
  type ProjectFixedTabId,
  type WorkspaceTabId,
} from '../utils/workspaceTabs';
import { getAdjacentOpenTaskId } from '../utils/workspaceSessionStorage';
import { useWorkspaceTabs } from '../hooks/useWorkspaceTabs';
import { useBusinessRuleDossierSync } from '../hooks/useBusinessRuleDossierSync';
import { useNotepadDock } from '../hooks/useNotepadDock';
import { ProjectWorkspaceTabBar } from './project/ProjectWorkspaceTabBar';
import { NotepadDockPanel } from './project/NotepadDockPanel';
import { TaskWorkspacePanel } from './tasks/TaskWorkspacePanel';
import type { JiraTask } from '../types';
import { getProjectListPathForProject, PROJECT_WORKFLOW_LABELS, normalizeProjectWorkflow } from '../utils/projectWorkflow';

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tarefas & Testes',
  documents: 'Documentos',
  notepad: 'Bloco de Notas',
  businessRules: 'Regras de negócio',
};

const TAB_LABELS_DEV: Record<string, string> = {
  ...TAB_LABELS,
  tasks: 'Tarefas & Implementação',
};

export const ProjectView: React.FC<{
  project: Project;
  onUpdateProject: (project: Project) => void | Promise<void>;
  onDeleteProject?: (projectId: string) => void | Promise<void>;
}> = ({ project, onUpdateProject, onDeleteProject }) => {
  const {
    activeTab,
    openTaskTabIds,
    tasksListMode,
    taskSections,
    setActiveTab,
    setTasksListMode,
    setTaskSection,
    openTaskTab,
    closeTaskTab,
    focusTaskTab,
  } = useWorkspaceTabs({
    scope: 'project',
    scopeId: project.id,
    defaultActiveTab: 'dashboard',
    syncUrl: true,
    projectIdForUrl: project.id,
    fallbackFixedTab: 'tasks',
  });
  const [initialTaskId, setInitialTaskId] = useState<string | undefined>(undefined);
  /** Deep link do Dashboard: filtrar tarefas com casos em certos status (ex.: falhas). */
  const [tasksExecutionNavKey, setTasksExecutionNavKey] = useState(0);
  const [tasksExecutionNavStatuses, setTasksExecutionNavStatuses] = useState<TestCase['status'][]>(
    []
  );
  /** Tarefa com detalhes inline ou modal aberto — terceiro nível do breadcrumb. */
  const [breadcrumbTaskId, setBreadcrumbTaskId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isSavingLocally, setIsSavingLocally] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveProjectLocally = useProjectsStore(s => s.saveProjectLocally);
  const syncLocalBackup = useProjectsStore(s => s.syncLocalBackup);
  const projects = useProjectsStore(s => s.projects);
  const storeLoading = useProjectsStore(s => s.isLoading);
  const selectProject = useProjectsStore(s => s.selectProject);
  const storeProject = useProjectsStore(s => s.projects.find(p => p.id === project.id));
  const navigate = useNavigate();

  // Projeto mais recente do store (mesmo id do prop); fallback ao prop se ainda não estiver na lista
  const currentProject = storeProject ?? project;
  const isDevProject = normalizeProjectWorkflow(currentProject.workflow) === 'dev';
  const tabLabels = isDevProject ? TAB_LABELS_DEV : TAB_LABELS;

  const goToProjectsList = useCallback(() => {
    selectProject(null);
    navigate(getProjectListPathForProject(currentProject));
  }, [selectProject, navigate, currentProject]);

  const analyzingBusinessRuleIds = useBusinessRuleDossierSync(currentProject, onUpdateProject);

  const {
    isOpen: isNotepadDockOpen,
    width: notepadDockWidth,
    toggle: toggleNotepadDock,
    close: closeNotepadDock,
    setWidth: setNotepadDockWidth,
  } = useNotepadDock(currentProject.id);

  const showNotepadDock =
    isNotepadDockOpen &&
    !(isProjectFixedTabId(activeTab) && activeTab === 'notepad');

  const metrics = useProjectMetrics(currentProject);
  const previousPhasesRef = useRef<string>('');
  const isMountedRef = useRef(true);
  const projectRef = useRef(currentProject);
  const onUpdateProjectRef = useRef(onUpdateProject);


  // Auto-save: IndexedDB automático; pasta local pelo botão Sincronizar ou em Dados locais
  useAutoSave({
    project: currentProject,
    debounceMs: 300,
    disabled: false,
  });

  // Keep refs updated - usar currentProject (do store) em vez de apenas project prop
  useEffect(() => {
    projectRef.current = currentProject;
    onUpdateProjectRef.current = onUpdateProject;
  }, [currentProject, onUpdateProject]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /** Projeto removido do store (sync, exclusão ou ID inválido após refresh): avisa e volta à listagem. */
  const projectMissingNotifiedRef = useRef(false);
  useEffect(() => {
    projectMissingNotifiedRef.current = false;
  }, [project.id]);

  useEffect(() => {
    if (storeLoading) return;
    const existsInStore = projects.some(p => p.id === project.id);
    if (existsInStore) {
      projectMissingNotifiedRef.current = false;
      return;
    }
    if (projectMissingNotifiedRef.current) return;
    projectMissingNotifiedRef.current = true;
    toast.error('Projeto não encontrado ou foi removido. Voltando para a listagem de projetos.');
    goToProjectsList();
  }, [storeLoading, projects, project.id, goToProjectsList]);

  useEffect(() => {
    // Update project state only if the calculated phases have changed
    if (!metrics.newPhases || !isMountedRef.current) return;

    const newPhasesString = JSON.stringify(metrics.newPhases);
    const currentPhasesString = JSON.stringify(projectRef.current.phases);

    // Only update if phases actually changed and component is still mounted
    if (newPhasesString !== previousPhasesRef.current && newPhasesString !== currentPhasesString) {
      previousPhasesRef.current = newPhasesString;
      // Use setTimeout to ensure update happens after render, preventing React error #130
      setTimeout(() => {
        if (!isMountedRef.current) return;
        const latest =
          useProjectsStore.getState().projects.find(p => p.id === project.id) ?? projectRef.current;
        void useProjectsStore
          .getState()
          .updateProject({ ...latest, phases: metrics.newPhases }, { silent: true })
          .catch(err => logger.warn('Erro ao atualizar fases do projeto', 'ProjectView', err));
      }, 0);
    }
  }, [metrics.newPhases]);

  useEffect(() => {
    if (!isPrinting) {
      return;
    }

    const originalTitle = document.title;
    document.title = `Relatorio_${currentProject.name.replace(/\s/g, '_')}`;
    const timer = setTimeout(() => {
      window.print();
      setIsPrinting(false);
      document.title = originalTitle;
    }, 300);

    return () => clearTimeout(timer);
  }, [isPrinting, currentProject.name]);

  const handlePrint = () => {
    setIsPrinting(true);
  };

  const handleSaveLocally = async () => {
    setIsSavingLocally(true);
    setSaveStatus('saving');
    try {
      await saveProjectLocally(currentProject.id);
      setSaveStatus('saved');
      toast.success(`Projeto "${currentProject.name}" salvo localmente!`);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar localmente: ${errorMessage}`);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSavingLocally(false);
    }
  };

  const handleSyncLocalBackup = async () => {
    setIsSavingLocally(true);
    try {
      await syncLocalBackup();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao sincronizar pasta local');
    } finally {
      setIsSavingLocally(false);
    }
  };


  // Deep link pontual (ex.: vindo de outra tela)
  useEffect(() => {
    const taskIdToFocus = sessionStorage.getItem('taskIdToFocus');
    if (!taskIdToFocus) return;
    sessionStorage.removeItem('taskIdToFocus');
    focusTaskTab(taskIdToFocus);
    setBreadcrumbTaskId(taskIdToFocus);
    setInitialTaskId(taskIdToFocus);
  }, [currentProject.id, focusTaskTab]);

  const tabs: Array<{ id: ProjectFixedTabId; label: string }> = [
    { id: 'dashboard', label: tabLabels.dashboard },
    { id: 'tasks', label: tabLabels.tasks },
    { id: 'documents', label: tabLabels.documents },
    { id: 'businessRules', label: tabLabels.businessRules },
    { id: 'notepad', label: tabLabels.notepad },
  ];

  const taskTabLabels = useMemo(
    () => resolveTaskTabLabels(openTaskTabIds, currentProject.tasks),
    [openTaskTabIds, currentProject.tasks]
  );

  const activeTaskId = useMemo(
    () => (isTaskTabId(activeTab) ? taskIdFromTabId(activeTab) : null),
    [activeTab]
  );

  const handleSelectWorkspaceTab = useCallback(
    (tabId: WorkspaceTabId) => {
      setActiveTab(tabId);
      if (isProjectFixedTabId(tabId) && tabId !== 'tasks') {
        setTasksListMode('all');
        setBreadcrumbTaskId(null);
      }
      if (isTaskTabId(tabId)) {
        const id = taskIdFromTabId(tabId);
        if (id) setBreadcrumbTaskId(id);
      }
    },
    [setActiveTab, setTasksListMode]
  );

  const handleTabClick = useCallback(
    (tabId: string) => {
      handleSelectWorkspaceTab(tabId as WorkspaceTabId);
    },
    [handleSelectWorkspaceTab]
  );

  const handleOpenTaskTab = useCallback(
    (task: JiraTask) => {
      openTaskTab(task);
      setBreadcrumbTaskId(task.id);
    },
    [openTaskTab]
  );

  const handleCloseTaskTab = useCallback(
    (taskId: string) => {
      closeTaskTab(taskId);
      setBreadcrumbTaskId(prev => (prev === taskId ? null : prev));
    },
    [closeTaskTab]
  );

  const handleTasksListModeChange = useCallback(
    (mode: TasksListMode) => {
      setTasksListMode(mode);
      if (!isProjectFixedTabId(activeTab) || activeTab !== 'tasks') {
        setActiveTab('tasks');
      }
    },
    [activeTab, setActiveTab, setTasksListMode]
  );

  const backlogCount = useMemo(
    () => countBacklogTasks(currentProject.tasks),
    [currentProject.tasks]
  );

  const handleNavigateToBacklog = useCallback(() => {
    setTasksListMode('backlog');
    setActiveTab('tasks');
  }, [setActiveTab, setTasksListMode]);

  const handleNavigateToTasksWithExecutionStatuses = useCallback(
    (statuses: TestCase['status'][]) => {
      setTasksExecutionNavStatuses(statuses);
      setTasksExecutionNavKey(k => k + 1);
      setActiveTab('tasks');
    },
    [setActiveTab]
  );

  const handleNavigateAdjacentTask = useCallback(
    (direction: 'prev' | 'next') => {
      if (!activeTaskId) return;
      const nextId = getAdjacentOpenTaskId(openTaskTabIds, activeTaskId, direction);
      if (nextId) {
        focusTaskTab(nextId);
        setBreadcrumbTaskId(nextId);
      }
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

  const handleTaskDetailsOpenChange = useCallback((taskId: string, isOpen: boolean) => {
    if (isOpen) setBreadcrumbTaskId(taskId);
    else setBreadcrumbTaskId(prev => (prev === taskId ? null : prev));
  }, []);

  useEffect(() => {
    if (isProjectFixedTabId(activeTab) && activeTab !== 'tasks' && !isTaskTabId(activeTab)) {
      setBreadcrumbTaskId(null);
    }
  }, [activeTab]);

  const scrollToTaskInList = useCallback(
    (taskId: string) => {
      setActiveTab('tasks');
      setInitialTaskId(taskId);
      const safe =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(taskId)
          : taskId.replace(/["\\]/g, '');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document
            .querySelector(`[data-task-id="${safe}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      });
    },
    [setActiveTab]
  );

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const allTabIds: WorkspaceTabId[] = [
        ...tabs.map(t => t.id),
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
      } else if (e.key >= '1' && e.key <= '9' && Number(e.key) <= allTabIds.length) {
        e.preventDefault();
        nextIndex = Number(e.key) - 1;
      } else return;
      if (nextIndex !== index) handleSelectWorkspaceTab(allTabIds[nextIndex]);
    },
    [activeTab, tabs, openTaskTabIds, handleSelectWorkspaceTab]
  );

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const workflow = normalizeProjectWorkflow(currentProject.workflow);
    const items: BreadcrumbItem[] = [
      { label: PROJECT_WORKFLOW_LABELS[workflow], onClick: goToProjectsList },
    ];

    const onlyProjectHome =
      isProjectFixedTabId(activeTab) && activeTab === 'dashboard' && !breadcrumbTaskId;
    if (onlyProjectHome) {
      items.push({ label: currentProject.name });
      return items;
    }

    items.push({ label: currentProject.name, onClick: () => handleTabClick('dashboard') });

    if (isTaskTabId(activeTab) && breadcrumbTaskId) {
      const task = currentProject.tasks.find(t => t.id === breadcrumbTaskId);
      const raw = task?.title?.trim() || 'Tarefa';
      const label = raw.length > 56 ? `${raw.slice(0, 53)}…` : raw;
      items.push({ label });
      return items;
    }

    if (isProjectFixedTabId(activeTab) && activeTab === 'tasks') {
      if (breadcrumbTaskId) {
        const task = currentProject.tasks.find(t => t.id === breadcrumbTaskId);
        const raw = task?.title?.trim() || 'Tarefa';
        const label = raw.length > 56 ? `${raw.slice(0, 53)}…` : raw;
        items.push({
          label: tasksListMode === 'backlog' ? 'Backlog' : tabLabels.tasks,
          onClick: () => handleTabClick('tasks'),
        });
        items.push({ label });
      } else {
        items.push({
          label: tasksListMode === 'backlog' ? `${tabLabels.tasks} · Backlog` : tabLabels.tasks,
        });
      }
    } else if (isProjectFixedTabId(activeTab) && activeTab === 'documents') {
      items.push({ label: tabLabels.documents });
    } else if (isProjectFixedTabId(activeTab) && activeTab === 'notepad') {
      items.push({ label: tabLabels.notepad });
    } else if (isProjectFixedTabId(activeTab) && activeTab === 'businessRules') {
      items.push({ label: tabLabels.businessRules });
    }

    return items;
  }, [
    goToProjectsList,
    currentProject.name,
    currentProject.workflow,
    currentProject.tasks,
    activeTab,
    breadcrumbTaskId,
    tasksListMode,
    tabLabels,
    handleTabClick,
  ]);

  return (
    <>
      <div
        className={cn(
          workspaceSurfaceLightClass,
          'project-view-page-shell',
          'animate-fade-in w-full min-w-0 max-w-none py-3 sm:py-4 max-md:py-2 non-printable',
          appContentPaddingX
        )}
        data-theme="leve"
      >
        <div className={projectChromeHeaderShellClass}>
          <div className={cn('flex min-w-0 flex-col gap-1', projectChromeHeaderInnerClass)}>
            {/* Linha 1: trilho + ações na mesma linha (mobile compacto) */}
            <div className="project-chrome-header-row flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 max-md:flex-nowrap max-md:items-center max-md:gap-1 max-md:gap-y-0">
              <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center gap-x-2 gap-y-1 max-md:min-w-0 max-md:flex-nowrap sm:flex-nowrap sm:items-center">
                <div className="min-w-0 max-w-full flex-1 overflow-x-auto max-md:overflow-hidden sm:overflow-visible">
                  <Breadcrumbs
                    items={breadcrumbItems}
                    showHome={false}
                    align="left"
                    dense
                    className={cn(projectChromeBreadcrumbsClass, 'w-full min-w-0 max-w-full')}
                  />
                </div>
              </div>
              {/* Toolbar de ações do projeto — agrupadas em uma única barra coesa */}
              <div className={projectChromeToolbarClass} role="toolbar" aria-label="Ações do projeto">
                {/* Status de salvamento */}
                <div
                  className={projectChromeToolbarStatusWrapClass}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {saveStatus === 'saving' && (
                    <>
                      <Spinner size="sm" />
                      <span className="text-info hidden sm:inline">Salvando...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                      <span className="hidden text-success sm:inline">Salvo</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-error" aria-hidden />
                      <span className="hidden text-error sm:inline">Erro ao salvar</span>
                    </>
                  )}
                </div>

                <div className={projectChromeToolbarDividerClass} aria-hidden />
                <button
                  type="button"
                  onClick={handleSaveLocally}
                  disabled={isSavingLocally}
                  className={projectChromeSyncBtnClass}
                  aria-label="Salvar projeto localmente"
                >
                  {isSavingLocally && saveStatus === 'saving' ? (
                    <>
                      <Spinner size="sm" />
                      <span className="hidden sm:inline">Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="hidden sm:inline">Salvar</span>
                    </>
                  )}
                </button>

                <div className={projectChromeToolbarDividerClass} aria-hidden />
                <button
                  type="button"
                  onClick={handleSyncLocalBackup}
                  disabled={isSavingLocally}
                  className={projectChromeSyncBtnClass}
                  aria-label="Sincronizar backup na pasta local"
                >
                  {isSavingLocally && saveStatus !== 'saving' ? (
                    <>
                      <Spinner size="sm" />
                      <span className="hidden sm:inline">Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="hidden sm:inline">Sincronizar</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleNotepadDock}
                  className={cn(
                    projectChromeSyncBtnClass,
                    isNotepadDockOpen &&
                      'bg-primary/14 text-primary'
                  )}
                  aria-label={
                    isNotepadDockOpen
                      ? 'Fechar coluna fixa do bloco de notas'
                      : 'Abrir coluna fixa do bloco de notas'
                  }
                  aria-pressed={isNotepadDockOpen}
                  title="Coluna fixa do Bloco de Notas"
                >
                  <PanelRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">
                    {isNotepadDockOpen ? 'Notas fixas' : 'Fixar notas'}
                  </span>
                </button>


                {/* Separador + Excluir */}
                {onDeleteProject && (
                  <>
                    <div className={projectChromeToolbarDividerClass} aria-hidden />
                    <button
                      type="button"
                      onClick={() => setShowDeleteProjectConfirm(true)}
                      className={projectChromeDangerBtnClass}
                      aria-label={`Excluir projeto ${currentProject.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="hidden sm:inline">Excluir</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {isProjectFixedTabId(activeTab) &&
              activeTab !== 'dashboard' &&
              activeTab !== 'tasks' &&
              activeTab !== 'documents' &&
              activeTab !== 'notepad' &&
              activeTab !== 'businessRules' && (
            <div className="flex min-w-0 flex-nowrap items-center gap-x-2 overflow-hidden">
              <span className="inline-flex shrink-0 items-center rounded-[var(--project-dashboard-insight-inner-radius)] bg-base-200 px-2 py-0.5 font-sans text-[10px] font-bold leading-none text-primary">
                {currentProject.settings?.jiraProjectKey
                  ? `Jira: ${currentProject.settings.jiraProjectKey}`
                  : 'Projeto'}
              </span>
              <h1
                id="project-view-title"
                className="min-w-0 max-w-[55%] flex-1 basis-0 truncate font-sans text-xl font-bold leading-tight tracking-tight text-base-content sm:max-w-none sm:text-2xl"
                title={currentProject.name}
              >
                {currentProject.name}
              </h1>
              <span
                className="hidden shrink-0 text-base-content/72 sm:inline"
                aria-hidden="true"
              >
                ·
              </span>
              <span
                className="min-w-0 flex-1 basis-0 truncate text-left font-sans text-xs leading-tight text-base-content/72 sm:text-sm"
                title={
                  currentProject.description?.trim() ? currentProject.description : 'Sem descrição.'
                }
              >
                {currentProject.description?.trim() ? currentProject.description : 'Sem descrição.'}
              </span>
            </div>
            )}
          </div>
          <ProjectWorkspaceTabBar
            fixedTabs={tabs}
            activeTab={activeTab}
            taskTabs={taskTabLabels}
            onSelectTab={handleSelectWorkspaceTab}
            onCloseTaskTab={handleCloseTaskTab}
            onTabKeyDown={handleTabKeyDown}
            backlogSlot={
              <button
                type="button"
                onClick={handleNavigateToBacklog}
                className={projectChromeBacklogBtnClass(
                  isProjectFixedTabId(activeTab) &&
                    activeTab === 'tasks' &&
                    tasksListMode === 'backlog'
                )}
                aria-label={`Abrir backlog (${backlogCount} itens)`}
                title={`Ver backlog em ${tabLabels.tasks}`}
              >
                <Layers className="h-3 w-3 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Backlog</span>
                <span
                  className={projectChromeBacklogCountClass(
                    isProjectFixedTabId(activeTab) &&
                      activeTab === 'tasks' &&
                      tasksListMode === 'backlog'
                  )}
                  aria-hidden
                >
                  {backlogCount}
                </span>
              </button>
            }
          />
        </div>

        <div className={cn('mt-4 flex min-w-0 gap-0 sm:mt-5 max-md:mt-2', showNotepadDock && 'items-stretch')}>
          <div className="min-w-0 flex-1">
          {openTaskTabIds.map(taskId => (
            <div
              key={taskId}
              className={activeTaskId === taskId ? undefined : 'hidden'}
              aria-hidden={activeTaskId !== taskId}
            >
              <TaskWorkspacePanel
                taskId={taskId}
                project={currentProject}
                onUpdateProject={onUpdateProject}
                onNavigateToTab={handleTabClick}
                onOpenTaskTab={handleOpenTaskTab}
                onClose={() => handleCloseTaskTab(taskId)}
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
            </div>
          ))}
          <div
            className={isTaskTabId(activeTab) ? 'hidden' : undefined}
            aria-hidden={isTaskTabId(activeTab)}
          >
            <KeepAlivePanel
              id="tab-panel-dashboard"
              labelledBy="tab-dashboard"
              active={isProjectFixedTabId(activeTab) && activeTab === 'dashboard'}
              lazy={false}
            >
              <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
                {isDevProject ? (
                  <DevDashboard
                    project={currentProject}
                    onUpdateProject={onUpdateProject}
                    onNavigateToTab={tabId => handleTabClick(tabId)}
                  />
                ) : (
                  <QADashboard
                    project={currentProject}
                    onUpdateProject={onUpdateProject}
                    onNavigateToTab={tabId => handleTabClick(tabId)}
                    onNavigateToBacklog={handleNavigateToBacklog}
                    onNavigateToTasksWithExecutionStatuses={
                      handleNavigateToTasksWithExecutionStatuses
                    }
                  />
                )}
              </Suspense>
            </KeepAlivePanel>
            <KeepAlivePanel
              id="tab-panel-tasks"
              labelledBy="tab-tasks"
              active={isProjectFixedTabId(activeTab) && activeTab === 'tasks'}
            >
              <Suspense fallback={<LoadingSkeleton variant="task" count={5} />}>
                <TasksView
                  project={currentProject}
                  onUpdateProject={onUpdateProject}
                  onNavigateToTab={tabId => handleTabClick(tabId)}
                  onOpenTaskTab={handleOpenTaskTab}
                  initialTaskId={initialTaskId}
                  onTaskDetailsOpenChange={handleTaskDetailsOpenChange}
                  tasksExecutionNavKey={tasksExecutionNavKey}
                  tasksExecutionNavStatuses={tasksExecutionNavStatuses}
                  listMode={tasksListMode}
                  onListModeChange={handleTasksListModeChange}
                />
              </Suspense>
            </KeepAlivePanel>
            <KeepAlivePanel
              id="tab-panel-documents"
              labelledBy="tab-documents"
              active={isProjectFixedTabId(activeTab) && activeTab === 'documents'}
            >
              <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
                <DocumentsView
                  project={currentProject}
                  onUpdateProject={onUpdateProject}
                  onNavigateToTab={handleTabClick}
                />
              </Suspense>
            </KeepAlivePanel>
            <KeepAlivePanel
              id="tab-panel-notepad"
              labelledBy="tab-notepad"
              active={isProjectFixedTabId(activeTab) && activeTab === 'notepad'}
            >
              <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                <NotepadView
                  project={currentProject}
                  onUpdateProject={onUpdateProject}
                  dockOpen={isNotepadDockOpen}
                  onToggleDock={toggleNotepadDock}
                />
              </Suspense>
            </KeepAlivePanel>
            <KeepAlivePanel
              id="tab-panel-businessRules"
              labelledBy="tab-businessRules"
              active={isProjectFixedTabId(activeTab) && activeTab === 'businessRules'}
            >
              <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                <BusinessRulesManager
                  project={currentProject}
                  onUpdateProject={onUpdateProject}
                  analyzingRuleIds={analyzingBusinessRuleIds}
                />
              </Suspense>
            </KeepAlivePanel>
          </div>
          </div>
            {showNotepadDock && (
              <NotepadDockPanel
                project={currentProject}
                width={notepadDockWidth}
                onWidthChange={setNotepadDockWidth}
                onClose={closeNotepadDock}
                onToggleDock={toggleNotepadDock}
              />
            )}
          {showNotepadDock ? (
            <div
              className="fixed inset-0 z-30 bg-black/20 max-md:block lg:hidden"
              aria-hidden
              onClick={closeNotepadDock}
            />
          ) : null}
        </div>
      </div>
      {onDeleteProject && (
        <ConfirmDialog
          isOpen={showDeleteProjectConfirm}
          onClose={() => setShowDeleteProjectConfirm(false)}
          onConfirm={async () => {
            setIsDeletingProject(true);
            try {
              await onDeleteProject(currentProject.id);
              setShowDeleteProjectConfirm(false);
            } finally {
              setIsDeletingProject(false);
            }
          }}
          title={`Excluir "${currentProject.name}"`}
          message="Você tem certeza que deseja excluir este projeto? Todos os dados associados (tarefas, documentos, análises) serão perdidos permanentemente. Esta ação não pode ser desfeita."
          confirmText="Sim, Excluir"
          cancelText="Cancelar"
          variant="danger"
          isLoading={isDeletingProject}
        />
      )}
      {isPrinting && <PrintableReport project={currentProject} metrics={metrics} />}
    </>
  );
};

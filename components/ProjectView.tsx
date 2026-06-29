import React, { useState, useEffect, Suspense, useRef, useCallback, useMemo } from 'react';
import { Project, TestCase } from '../types';
import { useProjectMetrics } from '../hooks/useProjectMetrics';
import { PrintableReport } from './PrintableReport';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { QADashboard } from './dashboard/QADashboard';
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
import { PageTransition } from './common/PageTransition';
import { Breadcrumbs } from './common/Breadcrumbs';
import type { BreadcrumbItem } from './common/Breadcrumbs';
import { ConfirmDialog } from './common/ConfirmDialog';
import { useProjectsStore } from '../store/projectsStore';
import { isSupabaseAvailable } from '../services/supabaseService';
import { useAutoSave } from '../hooks/useAutoSave';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import toast from 'react-hot-toast';
import { Spinner } from './common/Spinner';
import { Trash2, CheckCircle2, AlertTriangle, CloudOff, Layers } from 'lucide-react';
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
  closeTaskTabState,
  isProjectFixedTabId,
  isTaskTabId,
  openTaskTabState,
  resolveTaskTabLabels,
  taskIdFromTabId,
  type ProjectFixedTabId,
  type WorkspaceTabId,
} from '../utils/workspaceTabs';
import { ProjectWorkspaceTabBar } from './project/ProjectWorkspaceTabBar';
import { TaskWorkspacePanel } from './tasks/TaskWorkspacePanel';
import type { JiraTask } from '../types';

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tarefas & Testes',
  documents: 'Documentos',
  businessRules: 'Regras de negócio',
};

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
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

export const ProjectView: React.FC<{
  project: Project;
  onUpdateProject: (project: Project) => void | Promise<void>;
  onDeleteProject?: (projectId: string) => void | Promise<void>;
}> = ({ project, onUpdateProject, onDeleteProject }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('dashboard');
  const [openTaskTabIds, setOpenTaskTabIds] = useState<string[]>([]);
  const [tasksListMode, setTasksListMode] = useState<TasksListMode>('all');
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
  const [isSavingToSupabase, setIsSavingToSupabase] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveProjectToSupabase = useProjectsStore(s => s.saveProjectToSupabase);
  const lastSaveToSupabase = useProjectsStore(s => s.lastSaveToSupabase);
  const projects = useProjectsStore(s => s.projects);
  const storeLoading = useProjectsStore(s => s.isLoading);
  const selectProject = useProjectsStore(s => s.selectProject);
  const storeProject = useProjectsStore(s => s.projects.find(p => p.id === project.id));
  const supabaseAvailable = isSupabaseAvailable();
  const isOnline = useOnlineStatus();

  // Projeto mais recente do store (mesmo id do prop); fallback ao prop se ainda não estiver na lista
  const currentProject = storeProject ?? project;

  const metrics = useProjectMetrics(currentProject);
  const previousPhasesRef = useRef<string>('');
  const isMountedRef = useRef(true);
  const projectRef = useRef(currentProject);
  const onUpdateProjectRef = useRef(onUpdateProject);


  // Auto-save: IndexedDB automático; Supabase apenas pelo botão Salvar (ou sync manual)
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
    selectProject(null);
  }, [storeLoading, projects, project.id, selectProject]);

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
        void useProjectsStore
          .getState()
          .updateProject({ ...projectRef.current, phases: metrics.newPhases }, { silent: true })
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

  const handleSaveToSupabase = async () => {
    if (!supabaseAvailable) {
      toast.error('Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.');
      return;
    }

    setIsSavingToSupabase(true);
    setSaveStatus('saving');
    try {
      await saveProjectToSupabase(currentProject.id);
      setSaveStatus('saved');
      toast.success(`Projeto "${currentProject.name}" salvo no Supabase com sucesso!`);
      // Resetar status após 2 segundos
      setTimeout(() => {
        if (saveStatus === 'saved') {
          setSaveStatus('idle');
        }
      }, 2000);
    } catch (error) {
      setSaveStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar no Supabase: ${errorMessage}`);
      // Resetar status de erro após 3 segundos
      setTimeout(() => {
        if (saveStatus === 'error') {
          setSaveStatus('idle');
        }
      }, 3000);
    } finally {
      setIsSavingToSupabase(false);
    }
  };

  // Toast quando um salvamento esperado na nuvem ficou apenas local (transição true -> false)
  const prevLastSaveToSupabaseRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (lastSaveToSupabase === false && prevLastSaveToSupabaseRef.current === true) {
      toast('Salvo localmente (Supabase indisponível)', {
        icon: <AlertTriangle className="text-warning" size={20} aria-hidden />,
        duration: 4000,
      });
    }
    prevLastSaveToSupabaseRef.current = lastSaveToSupabase;
  }, [lastSaveToSupabase]);

  // Monitorar mudanças no projeto para atualizar status de salvamento
  useEffect(() => {
    if (supabaseAvailable && saveStatus === 'saved') {
      // Quando projeto muda, resetar status para indicar que precisa salvar novamente
      setSaveStatus('idle');
    }
  }, [currentProject, supabaseAvailable]);

  // Verificar taskIdToFocus na montagem e ao mudar de projeto
  useEffect(() => {
    const taskIdToFocus = sessionStorage.getItem('taskIdToFocus');
    if (taskIdToFocus) {
      sessionStorage.removeItem('taskIdToFocus');
      const next = openTaskTabState(openTaskTabIds, activeTab, taskIdToFocus);
      setOpenTaskTabIds(next.openTaskTabIds);
      setActiveTab(next.activeTab);
      setBreadcrumbTaskId(taskIdToFocus);
      setInitialTaskId(taskIdToFocus);
      return;
    }
    const modeFromUrl = readTasksListModeFromUrl();
    if (modeFromUrl === 'backlog') {
      setActiveTab('tasks');
      setTasksListMode('backlog');
    }
  }, [currentProject.id]);

  /** Sincroniza subvisão backlog: ?project=&subview=backlog (dentro de Tarefas & Testes). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isProjectFixedTabId(activeTab) || activeTab !== 'tasks') return;
    const params = new URLSearchParams();
    params.set('project', currentProject.id);
    if (tasksListMode === 'backlog') {
      params.set('subview', 'backlog');
    }
    const desiredSearch = `?${params.toString()}`;
    const path = normalizePathname(window.location.pathname);
    const canonicalPath = path === '/backlog' ? '/' : path;
    if (path === '/backlog') {
      window.history.replaceState({}, '', `/${desiredSearch}`);
      return;
    }
    if (window.location.search !== desiredSearch) {
      window.history.replaceState({}, '', `${canonicalPath}${desiredSearch}`);
    }
  }, [currentProject.id, activeTab, tasksListMode]);

  const tabs: Array<{ id: ProjectFixedTabId; label: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tasks', label: 'Tarefas & Testes' },
    { id: 'documents', label: 'Documentos' },
    { id: 'businessRules', label: 'Regras de negócio' },
  ];

  const taskTabLabels = useMemo(
    () => resolveTaskTabLabels(openTaskTabIds, currentProject.tasks),
    [openTaskTabIds, currentProject.tasks]
  );

  const activeTaskId = useMemo(
    () => (isTaskTabId(activeTab) ? taskIdFromTabId(activeTab) : null),
    [activeTab]
  );

  const handleSelectWorkspaceTab = useCallback((tabId: WorkspaceTabId) => {
    setActiveTab(tabId);
    if (isProjectFixedTabId(tabId) && tabId !== 'tasks') {
      setTasksListMode('all');
      setBreadcrumbTaskId(null);
    }
    if (isTaskTabId(tabId)) {
      const id = taskIdFromTabId(tabId);
      if (id) setBreadcrumbTaskId(id);
    }
  }, []);

  const handleTabClick = useCallback(
    (tabId: string) => {
      handleSelectWorkspaceTab(tabId as WorkspaceTabId);
    },
    [handleSelectWorkspaceTab]
  );

  const handleOpenTaskTab = useCallback(
    (task: JiraTask) => {
      const next = openTaskTabState(openTaskTabIds, activeTab, task.id);
      setOpenTaskTabIds(next.openTaskTabIds);
      setActiveTab(next.activeTab);
      setBreadcrumbTaskId(task.id);
    },
    [openTaskTabIds, activeTab]
  );

  const handleCloseTaskTab = useCallback(
    (taskId: string) => {
      const next = closeTaskTabState(openTaskTabIds, activeTab, taskId);
      setOpenTaskTabIds(next.openTaskTabIds);
      setActiveTab(next.activeTab);
      setBreadcrumbTaskId(prev => (prev === taskId ? null : prev));
    },
    [openTaskTabIds, activeTab]
  );

  const handleTasksListModeChange = useCallback((mode: TasksListMode) => {
    setTasksListMode(mode);
    if (!isProjectFixedTabId(activeTab) || activeTab !== 'tasks') {
      setActiveTab('tasks');
    }
  }, [activeTab]);

  const backlogCount = useMemo(
    () => countBacklogTasks(currentProject.tasks),
    [currentProject.tasks]
  );

  const handleNavigateToBacklog = useCallback(() => {
    setTasksListMode('backlog');
    setActiveTab('tasks');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncFromUrl = () => {
      const mode = readTasksListModeFromUrl();
      setTasksListMode(mode);
      if (mode === 'backlog') {
        setActiveTab('tasks');
      }
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const handleNavigateToTasksWithExecutionStatuses = useCallback(
    (statuses: TestCase['status'][]) => {
      setTasksExecutionNavStatuses(statuses);
      setTasksExecutionNavKey(k => k + 1);
      setActiveTab('tasks');
    },
    []
  );

  const handleTaskDetailsOpenChange = useCallback((taskId: string, isOpen: boolean) => {
    if (isOpen) setBreadcrumbTaskId(taskId);
    else setBreadcrumbTaskId(prev => (prev === taskId ? null : prev));
  }, []);

  useEffect(() => {
    if (isProjectFixedTabId(activeTab) && activeTab !== 'tasks' && !isTaskTabId(activeTab)) {
      setBreadcrumbTaskId(null);
    }
  }, [activeTab]);

  const scrollToTaskInList = useCallback((taskId: string) => {
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
  }, []);

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
    const items: BreadcrumbItem[] = [{ label: 'Projetos', onClick: () => selectProject(null) }];

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
          label: tasksListMode === 'backlog' ? 'Backlog' : TAB_LABELS.tasks,
          onClick: () => handleTabClick('tasks'),
        });
        items.push({ label });
      } else {
        items.push({
          label: tasksListMode === 'backlog' ? `${TAB_LABELS.tasks} · Backlog` : TAB_LABELS.tasks,
        });
      }
    } else if (isProjectFixedTabId(activeTab) && activeTab === 'documents') {
      items.push({ label: TAB_LABELS.documents });
    } else if (isProjectFixedTabId(activeTab) && activeTab === 'businessRules') {
      items.push({ label: TAB_LABELS.businessRules });
    }

    return items;
  }, [
    selectProject,
    currentProject.name,
    currentProject.tasks,
    activeTab,
    breadcrumbTaskId,
    tasksListMode,
    handleTabClick,
  ]);

  return (
    <>
      <div
        className={cn(
          workspaceSurfaceLightClass,
          'animate-fade-in w-full min-w-0 max-w-none py-3 sm:py-4 max-md:py-2 non-printable',
          appContentPaddingX
        )}
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
                {(supabaseAvailable || lastSaveToSupabase === false) && (
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
                        <CheckCircle2
                          className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            lastSaveToSupabase === false ? 'text-warning' : 'text-success'
                          )}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            'hidden sm:inline',
                            lastSaveToSupabase === false ? 'text-warning' : 'text-success'
                          )}
                        >
                          {lastSaveToSupabase === false ? 'Salvo localmente' : 'Salvo'}
                        </span>
                      </>
                    )}
                    {saveStatus === 'error' && (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-error" aria-hidden />
                        <span className="hidden text-error sm:inline">Erro ao salvar</span>
                      </>
                    )}
                    {saveStatus === 'idle' && !supabaseAvailable && lastSaveToSupabase === false && (
                      <>
                        <CloudOff className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
                        <span className="hidden text-warning sm:inline">Local</span>
                      </>
                    )}
                    {saveStatus === 'idle' && supabaseAvailable && lastSaveToSupabase === false && (
                      <span className={cn('hidden font-sans sm:inline', projectChromeToolbarStatusClass)}>
                        Salvo localmente
                      </span>
                    )}
                  </div>
                )}

                {/* Botão Sincronizar — só quando há supabase E salvamento pendente */}
                {supabaseAvailable && lastSaveToSupabase === false && saveStatus === 'idle' && (
                  <>
                    <div className={projectChromeToolbarDividerClass} aria-hidden />
                    <button
                      type="button"
                      onClick={handleSaveToSupabase}
                      disabled={isSavingToSupabase || !isOnline}
                      className={projectChromeSyncBtnClass}
                      aria-label="Sincronizar projeto com a nuvem"
                      title={
                        !isOnline
                          ? 'É necessário estar online para sincronizar com a nuvem.'
                          : undefined
                      }
                    >
                      {isSavingToSupabase ? (
                        <>
                          <Spinner size="sm" />
                          <span className="hidden sm:inline">Salvando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="hidden sm:inline">Sincronizar</span>
                        </>
                      )}
                    </button>
                  </>
                )}

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
              activeTab !== 'businessRules' && (
            <div className="flex min-w-0 flex-nowrap items-center gap-x-2 overflow-hidden">
              <span className="inline-flex shrink-0 items-center rounded-[var(--project-dashboard-insight-inner-radius)] bg-[var(--leve-header-cream)] px-2 py-0.5 font-sans text-[10px] font-bold leading-none text-[var(--leve-header-accent)]">
                {currentProject.settings?.jiraProjectKey
                  ? `Jira: ${currentProject.settings.jiraProjectKey}`
                  : 'Projeto'}
              </span>
              <h1
                id="project-view-title"
                className="min-w-0 max-w-[55%] flex-1 basis-0 truncate font-sans text-xl font-bold leading-tight tracking-tight text-[var(--leve-header-text)] sm:max-w-none sm:text-2xl"
                title={currentProject.name}
              >
                {currentProject.name}
              </h1>
              <span
                className="hidden shrink-0 text-[var(--leve-header-text-muted)] sm:inline"
                aria-hidden="true"
              >
                ·
              </span>
              <span
                className="min-w-0 flex-1 basis-0 truncate text-left font-sans text-xs leading-tight text-[var(--leve-header-text-muted)] sm:text-sm"
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
                title="Ver backlog em Tarefas & Testes"
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

        <div className="mt-4 sm:mt-5 max-md:mt-2">
          <PageTransition transitionKey={activeTab}>
            {activeTaskId ? (
              <TaskWorkspacePanel
                key={activeTaskId}
                taskId={activeTaskId}
                project={currentProject}
                onUpdateProject={onUpdateProject}
                onNavigateToTab={handleTabClick}
                onOpenTaskTab={handleOpenTaskTab}
                onClose={() => handleCloseTaskTab(activeTaskId)}
              />
            ) : null}
            {isProjectFixedTabId(activeTab) && activeTab === 'dashboard' && (
              <section id="tab-panel-dashboard" role="tabpanel" aria-labelledby="tab-dashboard">
                <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
                  <QADashboard
                    project={currentProject}
                    onUpdateProject={onUpdateProject}
                    onNavigateToTab={tabId => handleTabClick(tabId)}
                    onNavigateToBacklog={handleNavigateToBacklog}
                    onNavigateToTasksWithExecutionStatuses={
                      handleNavigateToTasksWithExecutionStatuses
                    }
                  />
                </Suspense>
              </section>
            )}
            {isProjectFixedTabId(activeTab) && activeTab === 'tasks' && (
              <section id="tab-panel-tasks" role="tabpanel" aria-labelledby="tab-tasks">
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
              </section>
            )}
            {isProjectFixedTabId(activeTab) && activeTab === 'documents' && (
              <section id="tab-panel-documents" role="tabpanel" aria-labelledby="tab-documents">
                <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
                  <DocumentsView
                    project={currentProject}
                    onUpdateProject={onUpdateProject}
                    onNavigateToTab={handleTabClick}
                  />
                </Suspense>
              </section>
            )}
            {isProjectFixedTabId(activeTab) && activeTab === 'businessRules' && (
              <section
                id="tab-panel-businessRules"
                role="tabpanel"
                aria-labelledby="tab-businessRules"
              >
                <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                  <BusinessRulesManager
                    project={currentProject}
                    onUpdateProject={onUpdateProject}
                  />
                </Suspense>
              </section>
            )}
          </PageTransition>
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

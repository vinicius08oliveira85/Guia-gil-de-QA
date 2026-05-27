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
import { appContentPaddingX } from './common/viewUi';
import {
  projectChromeBacklogBtnClass,
  projectChromeBacklogCountClass,
  projectChromeBreadcrumbsClass,
  projectChromeDangerBtnClass,
  projectChromeHeaderShellClass,
  projectChromeScrollFadeFromClass,
  projectChromeScrollFadeToClass,
  projectChromeScrollHintClass,
  projectChromeSyncBtnClass,
  projectChromeTabActiveClass,
  projectChromeTabIdleClass,
  projectChromeTabsDividerClass,
  projectChromeTabsNavClass,
  projectChromeToolbarClass,
  projectChromeToolbarDividerClass,
  projectChromeToolbarStatusClass,
} from './tasks/tasksPanelNeuStyles';
import { countBacklogTasks, type TasksListMode } from '../utils/backlogTasks';

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
  onBack: () => void;
  onDeleteProject?: (projectId: string) => void | Promise<void>;
}> = ({ project, onUpdateProject, onBack: _onBack, onDeleteProject }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
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

  // Estado e Refs para indicadores de scroll nas abas
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setCanScrollLeft(scrollLeft > 0);
    // Pequena margem de erro para precisão de float
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Monitorar scroll e resize para atualizar indicadores
  useEffect(() => {
    checkScroll();
    const tabsElement = tabsRef.current;
    if (!tabsElement) return;

    tabsElement.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      tabsElement.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, activeTab]);

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
      // Limpar o sessionStorage
      sessionStorage.removeItem('taskIdToFocus');
      // Navegar para a aba de tarefas
      setActiveTab('tasks');
      // Passar o taskId para o TasksView
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
    if (activeTab !== 'tasks') return;
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

  const tabs: Array<{ id: string; label: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tasks', label: 'Tarefas & Testes' },
    { id: 'documents', label: 'Documentos' },
    { id: 'businessRules', label: 'Regras de negócio' },
  ];

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'tasks') {
      setTasksListMode('all');
    }
  }, []);

  const handleTasksListModeChange = useCallback((mode: TasksListMode) => {
    setTasksListMode(mode);
    if (activeTab !== 'tasks') {
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
    if (activeTab !== 'tasks') setBreadcrumbTaskId(null);
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
      const index = tabs.findIndex(t => t.id === activeTab);
      if (index < 0) return;
      let nextIndex = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = tabs.length - 1;
      } else if (e.key >= '1' && e.key <= '9' && Number(e.key) <= tabs.length) {
        e.preventDefault();
        nextIndex = Number(e.key) - 1;
      } else return;
      if (nextIndex !== index) setActiveTab(tabs[nextIndex].id);
    },
    [activeTab, tabs]
  );

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: 'Projetos', onClick: () => selectProject(null) }];

    const onlyProjectHome = activeTab === 'dashboard' && !breadcrumbTaskId;
    if (onlyProjectHome) {
      items.push({ label: currentProject.name });
      return items;
    }

    items.push({ label: currentProject.name, onClick: () => handleTabClick('dashboard') });

    if (activeTab === 'tasks') {
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
    } else if (activeTab === 'documents') {
      items.push({ label: TAB_LABELS.documents });
    } else if (activeTab === 'businessRules') {
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
          'animate-fade-in w-full min-w-0 max-w-none py-3 sm:py-4 non-printable',
          appContentPaddingX
        )}
      >
        <div className={projectChromeHeaderShellClass}>
          <div className="flex min-w-0 flex-col gap-1">
            {/* Linha 1: voltar + trilho | estado + excluir */}
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center gap-x-2 gap-y-1 sm:flex-nowrap sm:items-center">
                <div className="min-w-0 max-w-full flex-1 overflow-x-auto sm:overflow-visible">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
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

            {activeTab !== 'dashboard' &&
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
          <div className={projectChromeTabsDividerClass}>
            {canScrollLeft && (
              <div className={projectChromeScrollFadeFromClass} aria-hidden />
            )}
            {canScrollRight && (
              <div className={projectChromeScrollFadeToClass} aria-hidden />
            )}

            <div className="flex w-full items-end gap-2">
              <nav
                ref={tabsRef}
                className={projectChromeTabsNavClass}
                aria-label="Seções do projeto"
                role="tablist"
                aria-orientation="horizontal"
                onKeyDown={handleTabKeyDown}
              >
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabClick(tab.id)}
                    className={
                      activeTab === tab.id ? projectChromeTabActiveClass : projectChromeTabIdleClass
                    }
                    id={`tab-${tab.id}`}
                    role="tab"
                    tabIndex={activeTab === tab.id ? 0 : -1}
                    aria-selected={activeTab === tab.id}
                    aria-controls={`tab-panel-${tab.id}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <button
                type="button"
                onClick={handleNavigateToBacklog}
                className={projectChromeBacklogBtnClass(
                  activeTab === 'tasks' && tasksListMode === 'backlog'
                )}
                aria-label={`Abrir backlog (${backlogCount} itens)`}
                title="Ver backlog em Tarefas & Testes"
              >
                <Layers className="h-3 w-3 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Backlog</span>
                <span
                  className={projectChromeBacklogCountClass(
                    activeTab === 'tasks' && tasksListMode === 'backlog'
                  )}
                  aria-hidden
                >
                  {backlogCount}
                </span>
              </button>
            </div>
            {canScrollRight && (
              <p className={projectChromeScrollHintClass} aria-live="polite">
                Deslize as abas para ver mais seções
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 sm:mt-5">
          <PageTransition transitionKey={activeTab}>
            {activeTab === 'dashboard' && (
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
            {activeTab === 'tasks' && (
              <section id="tab-panel-tasks" role="tabpanel" aria-labelledby="tab-tasks">
                <Suspense fallback={<LoadingSkeleton variant="task" count={5} />}>
                  <TasksView
                    project={currentProject}
                    onUpdateProject={onUpdateProject}
                    onNavigateToTab={tabId => handleTabClick(tabId)}
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
            {activeTab === 'documents' && (
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
            {activeTab === 'businessRules' && (
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

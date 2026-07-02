import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AlertTriangle, Bug, Loader2 } from 'lucide-react';
import { ProjectCard } from './common/ProjectCard';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useProjectsStore } from '../store/projectsStore';
import { EmptyState } from './common/EmptyState';
import {
  getLocalFolderBackupPrefs,
  getLocalFolderBackupPrefsSync,
  LOCAL_FOLDER_CONFIG_UPDATED_EVENT,
} from '../services/localFolderBackupService';
import { CreateProjectModal } from './CreateProjectModal';
import { cn } from '../utils/cn';
import {
  computeWorkspaceTestMetrics,
  computeTaskWorkflowBuckets,
  computeTaskDonePercent,
  computeProjectsWithTestExecutionAlerts,
  projectNeedsAttention,
  computeProjectHealth,
} from '../utils/workspaceAnalytics';
import {
  applyManualProjectOrder,
  buildProjectOrderIds,
  moveProjectIdInOrder,
} from '../utils/projectListOrder';
import { ProjectsDashboardHeader } from './projectsDashboard/ProjectsDashboardHeader';
import { WorkspaceDaisyStats, type LocalBackupStatStatus } from './projectsDashboard/WorkspaceDaisyStats';
import { GlobalEfficiencyMetric } from './projectsDashboard/GlobalEfficiencyMetric';
import { NewProjectCard } from './projectsDashboard/NewProjectCard';
import { ProjectsDashboardSidebar } from './projectsDashboard/ProjectsDashboardSidebar';
import { useAriaLive } from '../hooks/useAriaLive';
import { projectsListShell } from './common/viewUi';
import { viewHeroChromeClass } from './common/viewHeroChromeUi';
import {
  viewHeroToolbarIconClass,
  viewHeroToolbarIconWrapClass,
} from './common/viewHeroChromeUi';
import {
  projectsDashboardFilterPillClass,
  projectsDashboardQuickFiltersDividerClass,
  projectsDashboardQuickFiltersPillClass,
  projectsDashboardQuickFiltersToolbarClass,
  projectsDashboardMainGridClass,
  projectsDashboardMessagePanelClass,
  projectsDashboardPageClass,
  projectsDashboardProjectGridClass,
  projectsDashboardStatsRegionClass,
} from './projectsDashboard/projectsDashboardUi';

type QuickFilter = 'all' | 'withBugs' | 'needsAttention';

/** Projeto tem pelo menos 1 bug aberto. */
function projectHasOpenBugs(project: Project): boolean {
  return computeProjectHealth(project).openBugs > 0;
}

export const ProjectsDashboard: React.FC<{
  projects: Project[];
  onCreateProject: (name: string, description: string, templateId?: string) => Promise<void>;
}> = ({ projects, onCreateProject }) => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [localBackupStatus, setLocalBackupStatus] = useState<LocalBackupStatStatus>('unconfigured');
  const [sortBy, setSortBy] = useLocalStorage<'name' | 'updatedAt'>('projectsSortBy', 'name');
  const [manualOrder, setManualOrder] = useLocalStorage<string[]>('projectsManualOrder', []);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  // Visualização sempre em grade - removido viewMode
  // Ordenação fixa por nome - removido sortBy
  // Filtros removidos - removido selectedTags e showTagFilter
  // Esquema API removido - removido showSchemaModal

  const { handleError, handleSuccess } = useErrorHandler();
  const { isLoading } = useProjectsStore();
  const { announce } = useAriaLive();

  const refreshLocalBackupStatus = useCallback(async () => {
    const prefs = await getLocalFolderBackupPrefs();
    if (!prefs.hasConfiguredFolder) {
      setLocalBackupStatus('unconfigured');
      return;
    }
    if (prefs.lastSyncError) {
      setLocalBackupStatus('pending');
      return;
    }
    setLocalBackupStatus(prefs.lastSyncAt ? 'ok' : 'pending');
  }, []);

  useEffect(() => {
    void refreshLocalBackupStatus();
    const onUpdated = () => {
      const syncPrefs = getLocalFolderBackupPrefsSync();
      if (!syncPrefs.folderLabel) {
        setLocalBackupStatus('unconfigured');
        return;
      }
      if (syncPrefs.lastSyncError) {
        setLocalBackupStatus('pending');
        return;
      }
      setLocalBackupStatus(syncPrefs.lastSyncAt ? 'ok' : 'pending');
    };
    window.addEventListener(LOCAL_FOLDER_CONFIG_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(LOCAL_FOLDER_CONFIG_UPDATED_EVENT, onUpdated);
  }, [refreshLocalBackupStatus]);

  // Função para navegar para uma tarefa específica
  const handleNavigateToTask = useCallback(
    (projectId: string, taskId: string) => {
      // Armazenar taskId no sessionStorage para ser lido pelo ProjectView
      sessionStorage.setItem('taskIdToFocus', taskId);
      // Selecionar o projeto (isso abrirá o ProjectView)
      navigate(`/projects/${projectId}`);
    },
    [navigate]
  );

  // Escutar eventos para abrir modal de criação
  React.useEffect(() => {
    const handleOpenModal = () => setIsCreating(true);
    window.addEventListener('open-create-project-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-create-project-modal', handleOpenModal);
    };
  }, []);


  const handleSortByChange = useCallback(
    (value: 'name' | 'updatedAt') => {
      setSortBy(value);
    },
    [setSortBy]
  );

  const sortProjectsList = useCallback((list: Project[]) => {
    const copy = [...list];
    if (sortBy === 'name') {
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return copy.sort((a, b) => {
      const aDate = a.updatedAt || a.createdAt || '';
      const bDate = b.updatedAt || b.createdAt || '';
      return bDate.localeCompare(aDate);
    });
  }, [sortBy]);

  const sortedProjects = useMemo(() => {
    const list = sortProjectsList(projects);
    return applyManualProjectOrder(list, manualOrder);
  }, [projects, sortBy, manualOrder, sortProjectsList]);

  /** Persiste reordenação do preview do browser (card na 2ª posição → 1ª). */
  const previewCardOrderSeeded = useRef(false);
  useEffect(() => {
    if (previewCardOrderSeeded.current || manualOrder.length > 0 || projects.length < 2) return;

    const base = sortProjectsList(projects);
    const moved = base.find(p => p.name === 'Gestão de Pacientes Internados');
    const fromIndex = moved ? base.findIndex(p => p.id === moved.id) : -1;
    if (!moved || fromIndex !== 1) return;

    previewCardOrderSeeded.current = true;
    setManualOrder(moveProjectIdInOrder(buildProjectOrderIds(base), moved.id, 0));
  }, [projects, manualOrder.length, sortProjectsList, setManualOrder]);

  const filteredProjects = useMemo(() => {
    if (quickFilter === 'withBugs') return sortedProjects.filter(projectHasOpenBugs);
    if (quickFilter === 'needsAttention') return sortedProjects.filter(projectNeedsAttention);
    return sortedProjects;
  }, [sortedProjects, quickFilter]);

  const filterAriaReady = useRef(false);
  const prevQuickFilter = useRef<QuickFilter | undefined>(undefined);
  useEffect(() => {
    if (!filterAriaReady.current) {
      filterAriaReady.current = true;
      prevQuickFilter.current = quickFilter;
      return;
    }
    if (prevQuickFilter.current === quickFilter) return;
    prevQuickFilter.current = quickFilter;
    const n = filteredProjects.length;
    const countPhrase = `${n} ${n === 1 ? 'projeto' : 'projetos'}.`;
    const map: Record<QuickFilter, string> = {
      all: `Filtro de projetos: todos. ${countPhrase}`,
      withBugs: `Filtro de projetos: com bugs abertos. ${countPhrase}`,
      needsAttention: `Filtro de projetos: precisam de atenção. ${countPhrase}`,
    };
    announce(map[quickFilter], 'polite');
  }, [quickFilter, filteredProjects.length, announce]);

  const sortAriaReady = useRef(false);
  const prevSortBy = useRef<'name' | 'updatedAt' | undefined>(undefined);
  useEffect(() => {
    if (projects.length <= 1) return;
    if (!sortAriaReady.current) {
      sortAriaReady.current = true;
      prevSortBy.current = sortBy;
      return;
    }
    if (prevSortBy.current === sortBy) return;
    prevSortBy.current = sortBy;
    const n = filteredProjects.length;
    const countPhrase = `${n} ${n === 1 ? 'projeto' : 'projetos'} na lista.`;
    announce(
      sortBy === 'name'
        ? `Ordenação: nome do projeto. ${countPhrase}`
        : `Ordenação: última atualização. ${countPhrase}`,
      'polite'
    );
  }, [sortBy, projects.length, filteredProjects.length, announce]);

  const lastActivity = useMemo(() => {
    if (projects.length === 0) return null;
    const dates = projects.map(p => new Date(p.updatedAt || p.createdAt || 0).getTime());
    return new Date(Math.max(...dates));
  }, [projects]);

  const lastActivityText = useMemo(() => {
    if (!lastActivity) return null;
    try {
      return formatDistanceToNow(lastActivity, { addSuffix: true, locale: ptBR });
    } catch {
      return null;
    }
  }, [lastActivity]);

  const projectsNeedingAttention = useMemo(
    () => projects.filter(projectNeedsAttention),
    [projects]
  );
  const projectsWithBugs = useMemo(() => projects.filter(projectHasOpenBugs), [projects]);

  const workspaceTestMetrics = useMemo(() => computeWorkspaceTestMetrics(projects), [projects]);
  const taskWorkflowBuckets = useMemo(() => computeTaskWorkflowBuckets(projects), [projects]);
  const taskDonePercentGlobal = useMemo(() => computeTaskDonePercent(projects), [projects]);
  const projectsTestAlertList = useMemo(
    () => computeProjectsWithTestExecutionAlerts(projects),
    [projects]
  );
  const showWorkspaceAlerts =
    projectsNeedingAttention.length > 0 || projectsTestAlertList.length > 0;

  return (
    <>
      <div className={projectsDashboardPageClass}>
        <div className={projectsListShell}>
          <div className={cn(viewHeroChromeClass, 'gap-3 sm:gap-4')}>
            <ProjectsDashboardHeader
              projectCount={projects.length}
              sortBy={sortBy}
              onSortByChange={handleSortByChange}
              lastActivityText={lastActivityText}
            />

            {projects.length > 0 && (
              <div
                className={cn(projectsDashboardStatsRegionClass, 'mb-0 mt-0')}
                role="region"
                aria-label="Resumo do workspace"
              >
                <WorkspaceDaisyStats
                  className="contents"
                  projectCount={projects.length}
                  testSuccessPercent={workspaceTestMetrics.testSuccessPercent}
                  taskDonePercent={taskDonePercentGlobal}
                  localBackupStatus={localBackupStatus}
                />
                <GlobalEfficiencyMetric
                  className="col-span-2 sm:col-span-4 lg:col-span-1"
                  percent={workspaceTestMetrics.executionEfficiencyPercent}
                  executedCount={workspaceTestMetrics.executedTestCases}
                  totalCount={workspaceTestMetrics.totalTestCases}
                />
              </div>
            )}

            {projects.length > 1 && (
              <ProjectQuickFiltersGroup
                quickFilter={quickFilter}
                setQuickFilter={setQuickFilter}
                showBugsFilter={projectsWithBugs.length > 0}
                showAttentionFilter={projectsNeedingAttention.length > 0}
                bugsCount={projectsWithBugs.length}
                attentionCount={projectsNeedingAttention.length}
              />
            )}
          </div>

          <CreateProjectModal
            isOpen={isCreating}
            onClose={() => setIsCreating(false)}
            onCreateProject={onCreateProject}
            onOpenSettings={() => navigate('/settings')}
            onProjectImported={project => navigate(`/projects/${project.id}`)}
            onCreateBusyChange={setIsCreateSubmitting}
          />

          <div className={cn(projects.length > 0 && projectsDashboardMainGridClass)}>
            <div className="min-w-0">
            {filteredProjects.length > 0 ? (
              <div
                className={projectsDashboardProjectGridClass}
                role="list"
                aria-label="Lista de projetos"
              >
                {filteredProjects.map((p, index) => (
                  <div
                    key={p.id}
                    className="min-h-0"
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={filteredProjects.length + (quickFilter === 'all' ? 1 : 0)}
                  >
                    <ProjectCard
                      project={p}
                      className="h-full"
                      onSelect={() => navigate(`/projects/${p.id}`)}
                      onTaskClick={taskId => handleNavigateToTask(p.id, taskId)}
                    />
                  </div>
                ))}
                {quickFilter === 'all' && (
                  <div role="listitem" className="min-h-0">
                    <NewProjectCard
                      onClick={() => setIsCreating(true)}
                      disabled={isCreateSubmitting}
                      className="h-full"
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                {projects.length === 0 ? (
                  <div className={cn(projectsDashboardMessagePanelClass, 'sm:p-8')}>
                    <EmptyState
                      icon="🚀"
                      title="Nenhum projeto ainda"
                      description="Crie um projeto para organizar tarefas, testes, documentos e métricas em um fluxo único."
                      action={{
                        label: 'Criar Primeiro Projeto',
                        onClick: () => setIsCreating(true),
                        variant: 'primary',
                      }}
                      tip="Você pode criar um projeto do zero, usar um template ou importar do Jira se estiver configurado."
                    />
                  </div>
                ) : (
                  <div className={projectsDashboardMessagePanelClass} role="status" aria-live="polite">
                    <p className="mb-4 max-w-full mx-auto text-sm text-[var(--leve-header-text-muted)]">
                      {quickFilter === 'withBugs'
                        ? 'Nenhum projeto com bugs abertos corresponde a este filtro.'
                        : 'Nenhum projeto corresponde a "Precisa de atenção" com os critérios atuais.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setQuickFilter('all')}
                      className={cn(projectsDashboardFilterPillClass(false), 'mx-auto')}
                    >
                      Mostrar todos os projetos
                    </button>
                  </div>
                )}
              </>
            )}
            </div>

            {projects.length > 0 && (
              <ProjectsDashboardSidebar
                className="mt-6 lg:mt-0"
                projects={projects}
                healthProjects={projectsNeedingAttention}
                testExecutionAlertProjects={projectsTestAlertList}
                taskWorkflowBuckets={taskWorkflowBuckets}
                onSelectProject={id => navigate(`/projects/${id}`)}
                listFilterNeedsAttention={quickFilter === 'needsAttention'}
                onToggleListFilterNeedsAttention={() =>
                  setQuickFilter(quickFilter === 'needsAttention' ? 'all' : 'needsAttention')
                }
                showAlerts={showWorkspaceAlerts}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

function ProjectQuickFiltersGroup({
  quickFilter,
  setQuickFilter,
  showBugsFilter,
  showAttentionFilter,
  bugsCount,
  attentionCount,
}: {
  quickFilter: QuickFilter;
  setQuickFilter: React.Dispatch<React.SetStateAction<QuickFilter>>;
  showBugsFilter: boolean;
  showAttentionFilter: boolean;
  bugsCount: number;
  attentionCount: number;
}) {
  const pillClass = (active: boolean) => projectsDashboardQuickFiltersPillClass(active);

  return (
    <div
      className={cn(projectsDashboardQuickFiltersToolbarClass, 'mb-0')}
      role="group"
      aria-label="Filtrar projetos"
    >
      <button
        type="button"
        onClick={() => setQuickFilter('all')}
        className={pillClass(quickFilter === 'all')}
        aria-pressed={quickFilter === 'all'}
      >
        Todos
      </button>
      {showBugsFilter ? (
        <>
          <div className={projectsDashboardQuickFiltersDividerClass} aria-hidden />
          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'withBugs' ? 'all' : 'withBugs')}
            className={pillClass(quickFilter === 'withBugs')}
            aria-pressed={quickFilter === 'withBugs'}
          >
            <span className={viewHeroToolbarIconWrapClass} aria-hidden>
              <Bug className={viewHeroToolbarIconClass} />
            </span>
            Com bugs ({bugsCount})
          </button>
        </>
      ) : null}
      {showAttentionFilter ? (
        <>
          <div className={projectsDashboardQuickFiltersDividerClass} aria-hidden />
          <button
            type="button"
            onClick={() =>
              setQuickFilter(quickFilter === 'needsAttention' ? 'all' : 'needsAttention')
            }
            className={pillClass(quickFilter === 'needsAttention')}
            aria-pressed={quickFilter === 'needsAttention'}
          >
            <span className={viewHeroToolbarIconWrapClass} aria-hidden>
              <AlertTriangle className={viewHeroToolbarIconClass} />
            </span>
            Atenção ({attentionCount})
          </button>
        </>
      ) : null}
    </div>
  );
}

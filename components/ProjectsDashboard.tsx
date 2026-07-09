import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, type ProjectWorkflow } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  AlertTriangle,
  Bug,
  ChevronDown,
  ClipboardCheck,
  Gauge,
  LayoutGrid,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ProjectCard } from './common/ProjectCard';
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
import { applyManualProjectOrder } from '../utils/projectListOrder';
import { getLastOpenedProjectIds } from '../utils/landingRecentProjects';
import { filterProjectsByWorkflow } from '../utils/projectWorkflow';
import { LANDING_SECTIONS } from './landing/landingSections';
import { ProjectsDashboardHeader } from './projectsDashboard/ProjectsDashboardHeader';
import {
  WorkspaceDaisyStats,
  type LocalBackupStatStatus,
  type WorkspaceStatKey,
} from './projectsDashboard/WorkspaceDaisyStats';
import { GlobalEfficiencyMetric } from './projectsDashboard/GlobalEfficiencyMetric';
import { NewProjectCard } from './projectsDashboard/NewProjectCard';
import { ProjectsDashboardSidebar } from './projectsDashboard/ProjectsDashboardSidebar';
import { useAriaLive } from '../hooks/useAriaLive';
import { projectsListShell } from './common/viewUi';
import {
  projectsDashboardFilterPillClass,
  projectsDashboardClearFiltersBtnClass,
  projectsDashboardEmptyPanelClass,
  projectsDashboardGlobalEfficiencyGridClass,
  projectsDashboardHeroShellClass,
  projectsDashboardSectionDescClass,
  projectsDashboardSectionHeaderClass,
  projectsDashboardSectionLabelClass,
  projectsDashboardContentClass,
  projectsDashboardHeroChromeClass,
  projectsDashboardQuickFiltersCountClass,
  projectsDashboardQuickFiltersPillClass,
  projectsDashboardQuickFiltersToolbarClass,
  projectsDashboardMainGridClass,
  projectsDashboardMessagePanelClass,
  projectsDashboardPageClass,
  projectsDashboardProjectGridClass,
  projectsDashboardStatsRegionClass,
  projectsDashboardSummaryToggleClass,
} from './projectsDashboard/projectsDashboardUi';

type QuickFilter = 'all' | 'withBugs' | 'needsAttention' | 'testAlerts';

function projectHasOpenBugs(project: Project): boolean {
  return computeProjectHealth(project).openBugs > 0;
}

function projectMatchesSearch(project: Project, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (project.name.toLowerCase().includes(q)) return true;
  if (project.description?.toLowerCase().includes(q)) return true;
  if (project.settings?.jiraProjectKey?.toLowerCase().includes(q)) return true;
  if (project.tags?.some(tag => tag.toLowerCase().includes(q))) return true;
  return false;
}

/** Ordena por último aberto; preenche com updatedAt/createdAt. */
function sortProjectsByLastOpened(list: Project[], lastOpenedIds: string[]): Project[] {
  const order = new Map(lastOpenedIds.map((id, index) => [id, index]));
  return [...list].sort((a, b) => {
    const ai = order.has(a.id) ? (order.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
    const bi = order.has(b.id) ? (order.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    const aDate = a.updatedAt || a.createdAt || '';
    const bDate = b.updatedAt || b.createdAt || '';
    return bDate.localeCompare(aDate);
  });
}

export const ProjectsDashboard: React.FC<{
  workflow: ProjectWorkflow;
  projects: Project[];
  onCreateProject: (
    name: string,
    description: string,
    templateId?: string,
    workflow?: ProjectWorkflow
  ) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
}> = ({ workflow, projects: allProjects, onCreateProject, onDeleteProject }) => {
  const projects = useMemo(
    () => filterProjectsByWorkflow(allProjects, workflow),
    [allProjects, workflow]
  );
  const sectionMeta =
    workflow === 'dev' ? LANDING_SECTIONS.projectsDev : LANDING_SECTIONS.projectsQa;
  const isQaWorkflow = workflow === 'qa';
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [localBackupStatus, setLocalBackupStatus] = useState<LocalBackupStatStatus>('unconfigured');
  const [manualOrder] = useLocalStorage<string[]>('projectsManualOrder', []);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryExpanded, setSummaryExpanded] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );

  const { isLoading } = useProjectsStore();
  const { announce } = useAriaLive();
  const listRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setSummaryExpanded(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const handleNavigateToTask = useCallback(
    (projectId: string, taskId: string) => {
      sessionStorage.setItem('taskIdToFocus', taskId);
      navigate(`/projects/${projectId}`);
    },
    [navigate]
  );

  useEffect(() => {
    const handleOpenModal = () => setIsCreating(true);
    window.addEventListener('open-create-project-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-create-project-modal', handleOpenModal);
    };
  }, []);

  const lastOpenedIds = useMemo(() => getLastOpenedProjectIds(), [projects]);

  const sortedProjects = useMemo(() => {
    const list = sortProjectsByLastOpened(projects, lastOpenedIds);
    return applyManualProjectOrder(list, manualOrder);
  }, [projects, lastOpenedIds, manualOrder]);

  const filteredProjects = useMemo(() => {
    let list = sortedProjects.filter(p => projectMatchesSearch(p, searchQuery));
    if (quickFilter === 'withBugs') list = list.filter(projectHasOpenBugs);
    if (quickFilter === 'needsAttention') list = list.filter(projectNeedsAttention);
    if (quickFilter === 'testAlerts') {
      const alertIds = new Set(computeProjectsWithTestExecutionAlerts(projects).map(p => p.id));
      list = list.filter(p => alertIds.has(p.id));
    }
    return list;
  }, [sortedProjects, quickFilter, searchQuery, projects]);

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
      testAlerts: `Filtro de projetos: alertas de execução de testes. ${countPhrase}`,
    };
    announce(map[quickFilter], 'polite');
  }, [quickFilter, filteredProjects.length, announce]);

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
    projectsNeedingAttention.length > 0 || (isQaWorkflow && projectsTestAlertList.length > 0);

  const scrollToList = useCallback(() => {
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleStatClick = useCallback(
    (key: WorkspaceStatKey) => {
      if (key === 'backup') {
        navigate('/settings');
        return;
      }
      if (key === 'projects') {
        setQuickFilter('all');
        setSearchQuery('');
        scrollToList();
        return;
      }
      if (key === 'progress') {
        if (projectsNeedingAttention.length > 0) {
          setQuickFilter('needsAttention');
        } else {
          setQuickFilter('all');
        }
        scrollToList();
        return;
      }
      if (key === 'success') {
        if (projectsTestAlertList.length > 0) {
          setQuickFilter('testAlerts');
        } else {
          setQuickFilter('all');
        }
        scrollToList();
      }
    },
    [navigate, projectsNeedingAttention.length, projectsTestAlertList.length, scrollToList]
  );

  const handleEfficiencyClick = useCallback(() => {
    if (projectsTestAlertList.length > 0) {
      setQuickFilter('testAlerts');
    } else {
      setQuickFilter('all');
    }
    scrollToList();
  }, [projectsTestAlertList.length, scrollToList]);

  const handleCreateProjectForWorkflow = useCallback(
    async (name: string, description: string, templateId?: string) => {
      await onCreateProject(name, description, templateId, workflow);
    },
    [onCreateProject, workflow]
  );

  const statsBlock =
    projects.length > 0 ? (
      <div
        className={cn(projectsDashboardStatsRegionClass, 'mb-0 mt-0')}
        role="region"
        aria-label="Resumo do workspace"
      >
        <WorkspaceDaisyStats
          className="contents"
          projectCount={projects.length}
          testSuccessPercent={workspaceTestMetrics.testSuccessPercent}
          showTestSuccessStat={isQaWorkflow}
          taskDonePercent={taskDonePercentGlobal}
          localBackupStatus={localBackupStatus}
          onStatClick={handleStatClick}
        />
        {isQaWorkflow ? (
          <GlobalEfficiencyMetric
            className={projectsDashboardGlobalEfficiencyGridClass}
            percent={workspaceTestMetrics.executionEfficiencyPercent}
            executedCount={workspaceTestMetrics.executedTestCases}
            totalCount={workspaceTestMetrics.totalTestCases}
            onClick={handleEfficiencyClick}
          />
        ) : null}
      </div>
    ) : null;

  return (
    <>
      <div className={projectsDashboardPageClass} data-theme="leve">
        <div className={projectsDashboardContentClass}>
          <div className={projectsListShell}>
            <div className={projectsDashboardHeroShellClass}>
              <div className={cn(projectsDashboardHeroChromeClass, 'gap-3 sm:gap-4')}>
                <ProjectsDashboardHeader
                  title={sectionMeta.title}
                  projectCount={projects.length}
                  lastActivityText={lastActivityText}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                />

                {projects.length > 0 ? (
                  <div className="lg:contents">
                    <button
                      type="button"
                      className={projectsDashboardSummaryToggleClass(summaryExpanded)}
                      aria-expanded={summaryExpanded}
                      aria-controls="projects-dashboard-summary"
                      onClick={() => setSummaryExpanded(open => !open)}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Gauge className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        Resumo do workspace
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 transition-transform',
                          summaryExpanded && 'rotate-180'
                        )}
                        aria-hidden
                      />
                    </button>
                    <div
                      id="projects-dashboard-summary"
                      className={summaryExpanded ? 'contents' : 'hidden lg:contents'}
                    >
                      {statsBlock}
                    </div>
                  </div>
                ) : null}

                {projects.length > 1 && (
                  <ProjectQuickFiltersGroup
                    quickFilter={quickFilter}
                    setQuickFilter={setQuickFilter}
                    totalCount={projects.length}
                    showBugsFilter={projectsWithBugs.length > 0}
                    showAttentionFilter={projectsNeedingAttention.length > 0}
                    showTestAlertsFilter={isQaWorkflow && projectsTestAlertList.length > 0}
                    bugsCount={projectsWithBugs.length}
                    attentionCount={projectsNeedingAttention.length}
                    testAlertsCount={projectsTestAlertList.length}
                  />
                )}
              </div>
            </div>

            <CreateProjectModal
            isOpen={isCreating}
            onClose={() => setIsCreating(false)}
            workflow={workflow}
            onCreateProject={handleCreateProjectForWorkflow}
            onOpenSettings={() => navigate('/settings')}
            onProjectImported={project => navigate(`/projects/${project.id}`)}
            onCreateBusyChange={setIsCreateSubmitting}
          />

          <div ref={listRef} className={cn(projects.length > 0 && projectsDashboardMainGridClass)}>
            <div className="min-w-0">
              {projects.length > 0 && !isLoading ? (
                <div className={projectsDashboardSectionHeaderClass}>
                  <h2 className={projectsDashboardSectionLabelClass}>Seus projetos</h2>
                  <p className={projectsDashboardSectionDescClass}>
                    {filteredProjects.length}{' '}
                    {filteredProjects.length === 1 ? 'projeto visível' : 'projetos visíveis'}
                    {searchQuery.trim() || quickFilter !== 'all'
                      ? ' com os filtros atuais'
                      : ' no workspace'}
                  </p>
                </div>
              ) : null}

              {isLoading && projects.length === 0 ? (
                <div
                  className={projectsDashboardEmptyPanelClass}
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-sm font-medium text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]">
                    Carregando projetos…
                  </p>
                </div>
              ) : filteredProjects.length > 0 ? (
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
                      aria-setsize={
                        filteredProjects.length + (quickFilter === 'all' && !searchQuery.trim() ? 1 : 0)
                      }
                    >
                      <ProjectCard
                        project={p}
                        className="h-full"
                        onSelect={() => navigate(`/projects/${p.id}`)}
                        onTaskClick={taskId => handleNavigateToTask(p.id, taskId)}
                        onDeleteProject={() => onDeleteProject(p.id)}
                      />
                    </div>
                  ))}
                  {quickFilter === 'all' && !searchQuery.trim() && (
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
                    <div className={projectsDashboardEmptyPanelClass}>
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
                    <div
                      className={projectsDashboardMessagePanelClass}
                      role="status"
                      aria-live="polite"
                    >
                      <p className="mb-4 mx-auto max-w-full text-sm font-medium text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]">
                        {searchQuery.trim()
                          ? `Nenhum projeto corresponde a “${searchQuery.trim()}”.`
                          : quickFilter === 'withBugs'
                            ? 'Nenhum projeto com bugs abertos corresponde a este filtro.'
                            : quickFilter === 'testAlerts'
                              ? 'Nenhum projeto com alerta de execução de testes.'
                              : 'Nenhum projeto corresponde a "Precisa de atenção" com os critérios atuais.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickFilter('all');
                          setSearchQuery('');
                        }}
                        className={projectsDashboardClearFiltersBtnClass}
                        aria-label="Mostrar todos os projetos"
                      >
                        Mostrar todos os projetos
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {projects.length > 0 && (
              <div className={cn(!summaryExpanded && 'hidden lg:block')}>
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
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

function ProjectQuickFilterButton({
  active,
  label,
  count,
  icon: Icon,
  onClick,
  ariaLabel,
}: {
  active: boolean;
  label: string;
  count?: number;
  icon: LucideIcon;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={projectsDashboardQuickFiltersPillClass(active)}
      aria-pressed={active}
      aria-label={ariaLabel}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
      <span>{label}</span>
      {count != null ? (
        <span className={projectsDashboardQuickFiltersCountClass(active)} aria-hidden>
          {count}
        </span>
      ) : null}
    </button>
  );
}

function ProjectQuickFiltersGroup({
  quickFilter,
  setQuickFilter,
  totalCount,
  showBugsFilter,
  showAttentionFilter,
  showTestAlertsFilter,
  bugsCount,
  attentionCount,
  testAlertsCount,
}: {
  quickFilter: QuickFilter;
  setQuickFilter: React.Dispatch<React.SetStateAction<QuickFilter>>;
  totalCount: number;
  showBugsFilter: boolean;
  showAttentionFilter: boolean;
  showTestAlertsFilter: boolean;
  bugsCount: number;
  attentionCount: number;
  testAlertsCount: number;
}) {
  return (
    <div
      className={cn(projectsDashboardQuickFiltersToolbarClass, 'mb-0')}
      role="group"
      aria-label="Filtrar projetos"
    >
      <ProjectQuickFilterButton
        active={quickFilter === 'all'}
        label="Todos"
        count={totalCount}
        icon={LayoutGrid}
        onClick={() => setQuickFilter('all')}
        ariaLabel={`Todos os projetos (${totalCount})`}
      />
      {showBugsFilter ? (
        <ProjectQuickFilterButton
          active={quickFilter === 'withBugs'}
          label="Com bugs"
          count={bugsCount}
          icon={Bug}
          onClick={() => setQuickFilter(quickFilter === 'withBugs' ? 'all' : 'withBugs')}
          ariaLabel={`Projetos com bugs abertos (${bugsCount})`}
        />
      ) : null}
      {showAttentionFilter ? (
        <ProjectQuickFilterButton
          active={quickFilter === 'needsAttention'}
          label="Atenção"
          count={attentionCount}
          icon={AlertTriangle}
          onClick={() =>
            setQuickFilter(quickFilter === 'needsAttention' ? 'all' : 'needsAttention')
          }
          ariaLabel={`Projetos que precisam de atenção (${attentionCount})`}
        />
      ) : null}
      {showTestAlertsFilter ? (
        <ProjectQuickFilterButton
          active={quickFilter === 'testAlerts'}
          label="Testes"
          count={testAlertsCount}
          icon={ClipboardCheck}
          onClick={() => setQuickFilter(quickFilter === 'testAlerts' ? 'all' : 'testAlerts')}
          ariaLabel={`Projetos com alertas de testes (${testAlertsCount})`}
        />
      ) : null}
    </div>
  );
}

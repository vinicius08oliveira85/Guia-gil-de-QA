import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AlertTriangle, Bug, Loader2 } from 'lucide-react';
import { ProjectCard } from './common/ProjectCard';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useProjectsStore } from '../store/projectsStore';
import { EmptyState } from './common/EmptyState';
import { isSupabaseAvailable } from '../services/supabaseService';
import { CreateProjectModal } from './CreateProjectModal';
import { calculateProjectMetrics } from '../hooks/useProjectMetrics';
import { cn } from '../utils/cn';
import {
  computeWorkspaceTestMetrics,
  computeTaskWorkflowBuckets,
  computeTaskDonePercent,
  computeProjectsWithTestExecutionAlerts,
} from '../utils/workspaceAnalytics';
import { ProjectsDashboardHeader } from './projectsDashboard/ProjectsDashboardHeader';
import { WorkspaceDaisyStats } from './projectsDashboard/WorkspaceDaisyStats';
import { GlobalEfficiencyMetric } from './projectsDashboard/GlobalEfficiencyMetric';
import { NewProjectCard } from './projectsDashboard/NewProjectCard';
import { ProjectsDashboardSidebar } from './projectsDashboard/ProjectsDashboardSidebar';
import { useAriaLive } from '../hooks/useAriaLive';

type QuickFilter = 'all' | 'withBugs' | 'needsAttention';

/** Projeto precisa de atenção: 2+ bugs abertos ou taxa de sucesso < 70% (com testes executados). */
function projectNeedsAttention(project: Project): boolean {
  const m = calculateProjectMetrics(project);
  return m.openVsClosedBugs.open >= 2 || (m.executedTestCases > 0 && m.testPassRate < 70);
}

/** Projeto tem pelo menos 1 bug aberto. */
function projectHasOpenBugs(project: Project): boolean {
  return calculateProjectMetrics(project).openVsClosedBugs.open > 0;
}

export const ProjectsDashboard: React.FC<{
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, description: string, templateId?: string) => Promise<void>;
  onOpenSettings?: () => void;
}> = ({ projects, onSelectProject, onCreateProject, onOpenSettings }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [retryCooldownUntil, setRetryCooldownUntil] = useState<number | null>(null);
  const [syncBannerDismissed, setSyncBannerDismissed] = useState(false);
  const [sortBy, setSortBy] = useLocalStorage<'name' | 'updatedAt'>('projectsSortBy', 'name');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  // Visualização sempre em grade - removido viewMode
  // Ordenação fixa por nome - removido sortBy
  // Filtros removidos - removido selectedTags e showTagFilter
  // Esquema API removido - removido showSchemaModal

  const { handleError, handleSuccess } = useErrorHandler();
  const { supabaseLoadFailed, supabaseLoadError, loadProjects, isLoading, lastSaveToSupabase } =
    useProjectsStore();
  const { announce } = useAriaLive();

  // Função para navegar para uma tarefa específica
  const handleNavigateToTask = useCallback(
    (projectId: string, taskId: string) => {
      // Armazenar taskId no sessionStorage para ser lido pelo ProjectView
      sessionStorage.setItem('taskIdToFocus', taskId);
      // Selecionar o projeto (isso abrirá o ProjectView)
      onSelectProject(projectId);
    },
    [onSelectProject]
  );

  // Escutar eventos para abrir modal de criação
  React.useEffect(() => {
    const handleOpenModal = () => setIsCreating(true);
    window.addEventListener('open-create-project-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-create-project-modal', handleOpenModal);
    };
  }, []);

  // Quando a sincronização concluir com sucesso, limpar o "dismiss" do banner para que ele volte a aparecer se falhar de novo
  React.useEffect(() => {
    if (!supabaseLoadFailed) setSyncBannerDismissed(false);
  }, [supabaseLoadFailed, isLoading]);

  /** Erros que merecem destaque vermelho: 5xx, timeout e cold start (mensagem local-first). */
  const isSyncServerError = Boolean(
    supabaseLoadError &&
      (/\b(500|502|503|504|522|Erro HTTP)\b/i.test(supabaseLoadError) ||
        /timeout|expirou|demorou demais|cold start|plano gratuito|banco de dados está iniciando|service unavailable|indisponível/i.test(
          supabaseLoadError
        ))
  );
  const retryButtonDisabled =
    isLoading || (retryCooldownUntil != null && Date.now() < retryCooldownUntil);

  const handleRetrySync = useCallback(() => {
    setRetryCooldownUntil(Date.now() + 2500);
    loadProjects();
  }, [loadProjects]);

  const handleSortByChange = useCallback(
    (value: 'name' | 'updatedAt') => {
      setSortBy(value);
    },
    [setSortBy]
  );

  const sortedProjects = useMemo(() => {
    const list = [...projects];
    if (sortBy === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list.sort((a, b) => {
      const aDate = a.updatedAt || a.createdAt || '';
      const bDate = b.updatedAt || b.createdAt || '';
      return bDate.localeCompare(aDate);
    });
  }, [projects, sortBy]);

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

  const filterPillClass = (active: boolean) =>
    cn(
      'inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:min-h-9',
      active
        ? 'bg-[var(--brand-cta)] text-[var(--brand-cta-foreground)] shadow-sm'
        : 'border border-base-300/80 bg-base-100 text-base-content/80 hover:border-base-300 hover:bg-base-200/60'
    );

  return (
    <>
      <div className="animate-fade-in min-h-[calc(100vh-4rem)] bg-base-200/40 font-body">
        <div className="tasks-panel-scope mx-auto w-full max-w-[90rem] px-3 py-4 sm:px-6 sm:py-5">
          <ProjectsDashboardHeader
            projectCount={projects.length}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            lastActivityText={lastActivityText}
          />

          {projects.length > 0 && (
            <div className="mb-4 mt-4 flex flex-col gap-3 sm:mt-5 lg:flex-row lg:items-stretch lg:gap-3">
              <WorkspaceDaisyStats
                className="min-w-0 flex-1"
                projectCount={projects.length}
                testSuccessPercent={workspaceTestMetrics.testSuccessPercent}
                taskDonePercent={taskDonePercentGlobal}
                lastSaveToSupabase={lastSaveToSupabase}
                supabaseAvailable={isSupabaseAvailable()}
                supabaseLoadFailed={supabaseLoadFailed}
              />
              <GlobalEfficiencyMetric
                className="w-full shrink-0 lg:w-auto lg:min-w-[13rem]"
                percent={workspaceTestMetrics.executionEfficiencyPercent}
                executedCount={workspaceTestMetrics.executedTestCases}
                totalCount={workspaceTestMetrics.totalTestCases}
              />
            </div>
          )}

          {projects.length > 1 && (
            <div
              className="mb-4 flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filtrar projetos"
            >
              <button
                type="button"
                onClick={() => setQuickFilter('all')}
                className={filterPillClass(quickFilter === 'all')}
                aria-pressed={quickFilter === 'all'}
              >
                Todos
              </button>
              {projectsWithBugs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuickFilter(quickFilter === 'withBugs' ? 'all' : 'withBugs')}
                  className={filterPillClass(quickFilter === 'withBugs')}
                  aria-pressed={quickFilter === 'withBugs'}
                >
                  <Bug className="h-3.5 w-3.5" aria-hidden />
                  Com bugs ({projectsWithBugs.length})
                </button>
              )}
              {projectsNeedingAttention.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setQuickFilter(quickFilter === 'needsAttention' ? 'all' : 'needsAttention')
                  }
                  className={filterPillClass(quickFilter === 'needsAttention')}
                  aria-pressed={quickFilter === 'needsAttention'}
                >
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  Atenção ({projectsNeedingAttention.length})
                </button>
              )}
            </div>
          )}

          {/* Com projetos no workspace: banner não depende do filtro (evita sumir quando o filtro zera a lista) */}
          {supabaseLoadFailed && projects.length > 0 && !syncBannerDismissed && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isSyncServerError ? 'bg-error/10 text-error-content border border-error/30' : 'bg-warning/10 text-warning-content border border-warning/30'}`}
              role="alert"
            >
              <div className="flex flex-col gap-1 min-w-0">
                {supabaseLoadError ? (
                  <>
                    <span className="font-medium">Sincronização indisponível:</span>
                    <span className="break-words">{supabaseLoadError}</span>
                  </>
                ) : (
                  <span>Sincronização com a nuvem indisponível no momento.</span>
                )}
                <span className="text-base-content/80 text-xs mt-0.5">
                  Seus projetos locais continuam disponíveis. Tente novamente mais tarde ou
                  verifique em Configurações.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSyncBannerDismissed(true)}
                  className="px-2 py-1 rounded text-xs font-medium opacity-80 hover:opacity-100"
                >
                  Dispensar
                </button>
                <button
                  type="button"
                  onClick={handleRetrySync}
                  disabled={retryButtonDisabled}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${isSyncServerError ? 'bg-error/20 hover:bg-error/30 border border-error/40 text-error-content' : 'bg-warning/20 hover:bg-warning/30 border border-warning/40 text-warning-content'}`}
                >
                  {retryButtonDisabled ? 'Aguarde…' : 'Tentar novamente'}
                </button>
              </div>
            </div>
          )}

          <CreateProjectModal
            isOpen={isCreating}
            onClose={() => setIsCreating(false)}
            onCreateProject={onCreateProject}
            onOpenSettings={onOpenSettings}
            onProjectImported={project => onSelectProject(project.id)}
            onCreateBusyChange={setIsCreateSubmitting}
          />

          <div
            className={cn(
              'mt-2',
              projects.length > 0 &&
                'lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,20rem)] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]'
            )}
          >
            <div className="min-w-0">
            {filteredProjects.length > 0 ? (
              <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5"
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
                      onSelect={() => onSelectProject(p.id)}
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
                {/* Sem projetos no workspace: aviso de sync aqui (com lista vazia não há banner no topo) */}
                {supabaseLoadFailed && projects.length === 0 && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isSyncServerError ? 'bg-error/10 text-error-content border border-error/30' : 'bg-warning/10 text-warning-content border border-warning/30'}`}
                    role="alert"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      {supabaseLoadError ? (
                        <>
                          <span className="font-medium">Sincronização indisponível:</span>
                          <span className="break-words">{supabaseLoadError}</span>
                        </>
                      ) : (
                        <span>
                          Sincronização com a nuvem indisponível no momento. Se você já tinha
                          projetos, tente novamente ou verifique a conexão.
                        </span>
                      )}
                      <span className="text-base-content/80 text-xs mt-0.5">
                        Seus projetos locais continuam disponíveis. Tente novamente mais tarde ou
                        verifique em Configurações.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetrySync}
                      disabled={retryButtonDisabled}
                      className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${isSyncServerError ? 'bg-error/20 hover:bg-error/30 border border-error/40 text-error-content' : 'bg-warning/20 hover:bg-warning/30 border border-warning/40 text-warning-content'}`}
                    >
                      {retryButtonDisabled ? (
                        <>
                          <Loader2
                            className="w-3.5 h-3.5 animate-spin inline-block mr-1"
                            aria-hidden
                          />
                          {isLoading ? 'Carregando…' : 'Aguarde…'}
                        </>
                      ) : (
                        'Tentar novamente'
                      )}
                    </button>
                  </div>
                )}
                {projects.length === 0 ? (
                  <div className="rounded-[var(--rounded-box)] border border-base-300/80 bg-base-100 p-4 shadow-sm sm:p-8">
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
                    className="rounded-[var(--rounded-box)] border border-base-300/80 bg-base-200/40 p-4 text-center sm:p-5 dark:bg-base-200/20"
                    role="status"
                    aria-live="polite"
                  >
                    <p className="text-sm text-base-content/80 mb-4 max-w-full mx-auto">
                      {quickFilter === 'withBugs'
                        ? 'Nenhum projeto com bugs abertos corresponde a este filtro.'
                        : 'Nenhum projeto corresponde a "Precisa de atenção" com os critérios atuais.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setQuickFilter('all')}
                      className="btn btn-outline btn-sm rounded-lg"
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
                onSelectProject={onSelectProject}
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

import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, TestCase } from '../../types';
import { FileExportModal } from '../common/FileExportModal';
import { EmptyState } from '../common/EmptyState';
import { DashboardFiltersModal, DashboardFilters } from './DashboardFiltersModal';
import { ListChecks, CheckCircle2, AlertTriangle, Percent, Loader2 } from 'lucide-react';
import { useProjectsStore } from '../../store/projectsStore';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { DashboardStatCard } from './DashboardStatCard';
import { ProjectDashboard } from './ProjectDashboard';
import { RecentActivity } from './RecentActivity';
import { QADashboardHeaderToolbar } from './QADashboardHeaderToolbar';
import { Card } from '../common/Card';

interface QADashboardProps {
  project: Project;
  onUpdateProject?: (project: Project) => void;
  onNavigateToTab?: (tabId: string) => void;
  onNavigateToTasksWithExecutionStatuses?: (statuses: TestCase['status'][]) => void;
  /**
   * Quando definido, substitui `useProjectsStore().isLoading` apenas no banner de sincronização
   * (útil para Storybook, testes ou um contêiner que já conhece o estado de carga).
   */
  syncLoading?: boolean;
  /**
   * Quando definido, substitui o `error` do store apenas no alerta superior.
   * Passe `null` para ocultar o alerta mesmo se o store tiver erro.
   */
  syncError?: Error | null;
}

/**
 * Dashboard do projeto orientado a dados reais das tarefas (sem geração por IA).
 * Dados: `Project` / `JiraTask` em `types.ts`; leitura via store (`useProjectsStore`) e props.
 */
export const QADashboard: React.FC<QADashboardProps> = React.memo(props => {
  const { project, onNavigateToTab, syncLoading, syncError } = props;
  const { projects, selectedProjectId, isLoading, error } = useProjectsStore();

  const showLoadingBanner = syncLoading !== undefined ? syncLoading : isLoading;
  const displayError = syncError !== undefined ? syncError : error;

  const liveProject = useMemo(() => {
    const fromStore = projects.find(p => p.id === selectedProjectId);
    if (fromStore && fromStore.id === project.id) return fromStore;
    return project;
  }, [projects, selectedProjectId, project]);

  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>({});

  const filteredProject = useMemo(() => {
    if (!dashboardFilters || Object.keys(dashboardFilters).length === 0) {
      return liveProject;
    }

    let filteredTasks = [...(liveProject.tasks ?? [])];

    if (dashboardFilters.taskType && dashboardFilters.taskType.length > 0) {
      filteredTasks = filteredTasks.filter(task => dashboardFilters.taskType!.includes(task.type));
    }

    if (dashboardFilters.testStatus && dashboardFilters.testStatus.length > 0) {
      filteredTasks = filteredTasks.filter(task => {
        const testCases = task.testCases || [];
        return testCases.some(tc => dashboardFilters.testStatus!.includes(tc.status));
      });
    }

    return {
      ...liveProject,
      tasks: filteredTasks,
    };
  }, [liveProject, dashboardFilters]);

  const dashboardMetrics = useDashboardMetrics(filteredProject);

  const activeFiltersCount =
    (dashboardFilters.period && dashboardFilters.period !== 'all' ? 1 : 0) +
    (dashboardFilters.taskType?.length ?? 0) +
    (dashboardFilters.testStatus?.length ?? 0) +
    (dashboardFilters.phase?.length ?? 0);

  const lastUpdatedText = useMemo(() => {
    const date = liveProject.updatedAt || liveProject.createdAt;
    if (!date) return null;
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
    } catch {
      return null;
    }
  }, [liveProject.updatedAt, liveProject.createdAt]);

  const goTasks = onNavigateToTab ? () => onNavigateToTab('tasks') : undefined;

  return (
    <div className="space-y-6 py-8 md:py-10 lg:py-12" role="main" aria-label="Dashboard do projeto">
      {showLoadingBanner && (
        <div
          className="flex items-center gap-2 rounded-xl border border-base-300/80 bg-base-100/95 px-4 py-3 text-sm text-base-content/80 shadow-sm backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
          <span>Carregando ou sincronizando dados do projeto…</span>
        </div>
      )}

      {displayError && (
        <div className="alert alert-error text-sm shadow-sm" role="alert">
          <span className="font-medium">Não foi possível carregar os projetos.</span>
          <span className="block opacity-90">{displayError.message}</span>
        </div>
      )}

      <Card hoverable={false} className="p-3 py-4 sm:p-4 sm:py-6 lg:p-5">
        <div className="tasks-panel-scope flex flex-col gap-tasks-panel-loose">
          <div className="rounded-xl border border-base-300/80 bg-base-100/95 p-3 shadow-sm backdrop-blur-md sm:p-4">
            <QADashboardHeaderToolbar
              lastUpdatedText={lastUpdatedText}
              activeFiltersCount={activeFiltersCount}
              filters={dashboardFilters}
              onFiltersChange={setDashboardFilters}
              onOpenFiltersModal={() => setShowFilters(true)}
              onOpenExportModal={() => setShowExportModal(true)}
            />
          </div>

          {/* KPIs principais: grid 1 col mobile → 4 desktop */}
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Indicadores principais de tarefas"
          >
            {showLoadingBanner && !filteredProject.tasks?.length ? (
              <>
                {[0, 1, 2, 3].map(k => (
                  <div
                    key={k}
                    className="h-[92px] animate-pulse rounded-xl border border-base-300/80 bg-base-200/50"
                    aria-hidden
                  />
                ))}
              </>
            ) : (
              <>
                <DashboardStatCard
                  title="Total de tarefas"
                  value={dashboardMetrics.totalTasks}
                  icon={ListChecks}
                  onClick={goTasks}
                />
                <DashboardStatCard
                  title="Concluídas"
                  value={dashboardMetrics.completedTasks}
                  icon={CheckCircle2}
                  onClick={goTasks}
                />
                <DashboardStatCard
                  title="Atrasadas"
                  value={dashboardMetrics.overdueTasks}
                  icon={AlertTriangle}
                  className={
                    dashboardMetrics.overdueTasks > 0 ? 'border-error/40 bg-error/5' : undefined
                  }
                  onClick={goTasks}
                />
                <DashboardStatCard
                  title="Eficiência"
                  value={
                    dashboardMetrics.totalTasks === 0
                      ? '—'
                      : `${dashboardMetrics.efficiencyPercent}%`
                  }
                  icon={Percent}
                  onClick={goTasks}
                />
              </>
            )}
          </div>

          <ProjectDashboard
            project={filteredProject}
            isLoading={showLoadingBanner && !filteredProject.tasks?.length}
          />

          {!showLoadingBanner && dashboardMetrics.totalTasks === 0 && (
            <EmptyState
              compact
              title="Nenhuma tarefa no escopo"
              description="Crie tarefas na aba Tarefas ou ajuste os filtros do dashboard."
              icon="📊"
              secondaryAction={
                onNavigateToTab
                  ? { label: 'Ir para Tarefas', onClick: () => onNavigateToTab('tasks') }
                  : undefined
              }
            />
          )}

          <RecentActivity project={filteredProject} />
        </div>
      </Card>

      <FileExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportType="project"
        project={liveProject}
      />

      <DashboardFiltersModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        project={liveProject}
        filters={dashboardFilters}
        onFiltersChange={setDashboardFilters}
      />
    </div>
  );
});

QADashboard.displayName = 'QADashboard';

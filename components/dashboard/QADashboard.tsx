import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, TestCase } from '../../types';
import { FileExportModal } from '../common/FileExportModal';
import { EmptyState } from '../common/EmptyState';
import { DashboardFiltersModal, DashboardFilters } from './DashboardFiltersModal';
import { ListChecks, CheckCircle2, AlertTriangle, Percent, Loader2, Layers } from 'lucide-react';
import { countBacklogTasks, formatBacklogShareLabel } from '../../utils/backlogTasks';
import { useProjectsStore } from '../../store/projectsStore';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { glassIndicatorCardClass } from '../common/projectCardUi';
import { GlassIndicatorCards, type SmallIndicatorItem } from './GlassIndicatorCards';
import { cn } from '../../utils/cn';
import {
  dashboardEmptyStateShellClass,
  dashboardErrorBannerClass,
  dashboardMainStackClass,
  dashboardHeroChromeClass,
  dashboardHeroShellClass,
  dashboardInsightsSectionDescClass,
  dashboardInsightsSectionHeaderClass,
  dashboardInsightsSectionLabelClass,
  dashboardLoadingBannerClass,
  dashboardNeuScopeClass,
} from './dashboardNeuUi';
import { ProjectDashboard } from './ProjectDashboard';
import { RecentActivity } from './RecentActivity';
import { QADashboardHeaderToolbar } from './QADashboardHeaderToolbar';

interface QADashboardProps {
  project: Project;
  onUpdateProject?: (project: Project) => void;
  onNavigateToTab?: (tabId: string) => void;
  /** Abre Tarefas & Testes no modo Backlog. */
  onNavigateToBacklog?: () => void;
  onNavigateToTasksWithExecutionStatuses?: (statuses: TestCase['status'][]) => void;
  syncLoading?: boolean;
  syncError?: Error | null;
}

/**
 * Dashboard do projeto orientado a dados reais das tarefas (sem geração por IA).
 */
export const QADashboard: React.FC<QADashboardProps> = React.memo(props => {
  const { project, onNavigateToTab, onNavigateToBacklog, syncLoading, syncError } = props;
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
  const goBacklog = onNavigateToBacklog;
  const backlogCount = useMemo(
    () => countBacklogTasks(filteredProject.tasks ?? []),
    [filteredProject.tasks]
  );
  const backlogShareLabel = useMemo(
    () => formatBacklogShareLabel(backlogCount, dashboardMetrics.totalTasks),
    [backlogCount, dashboardMetrics.totalTasks]
  );

  const showBacklogCard = !!goBacklog;

  const qaIndicatorItems = useMemo((): SmallIndicatorItem[] => {
    const { totalTasks, completedTasks, overdueTasks, efficiencyPercent } = dashboardMetrics;
    const items: SmallIndicatorItem[] = [
      {
        label: 'Total de Tarefas',
        value: totalTasks,
        modifier: 'no escopo',
        icon: ListChecks,
        colorTheme: 'primary',
        onClick: goTasks,
      },
      {
        label: 'Concluídas',
        value: completedTasks,
        modifier: totalTasks > 0 ? `${efficiencyPercent}%` : '0%',
        icon: CheckCircle2,
        colorTheme: 'success',
        onClick: goTasks,
      },
      {
        label: 'Atrasadas',
        value: overdueTasks,
        modifier: overdueTasks > 0 ? 'atenção' : 'em dia',
        icon: AlertTriangle,
        colorTheme: 'error',
        onClick: goTasks,
      },
      {
        label: 'Eficiência',
        value: totalTasks === 0 ? '—' : `${efficiencyPercent}%`,
        modifier: 'taxa de conclusão',
        icon: Percent,
        colorTheme: 'info',
        onClick: goTasks,
      },
    ];
    if (showBacklogCard) {
      items.push({
        label: 'Backlog · To Do e Fila Jira',
        value: backlogCount,
        modifier: backlogShareLabel ?? '—',
        icon: Layers,
        colorTheme: 'warning',
        onClick: goBacklog,
      });
    }
    return items;
  }, [
    dashboardMetrics,
    goTasks,
    goBacklog,
    showBacklogCard,
    backlogCount,
    backlogShareLabel,
  ]);

  const jiraKey = liveProject.settings?.jiraProjectKey;

  return (
    <div
      className={dashboardNeuScopeClass}
      role="main"
      aria-label="Dashboard do projeto"
    >
      <div className={dashboardMainStackClass}>
      {showLoadingBanner && (
        <div className={dashboardLoadingBannerClass} role="status" aria-live="polite">
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-primary"
            aria-hidden
          />
          <span>Carregando ou sincronizando dados do projeto…</span>
        </div>
      )}

      {displayError && (
        <div className={dashboardErrorBannerClass} role="alert">
          <span className="font-medium">Não foi possível carregar os projetos.</span>
          <span className="mt-0.5 block opacity-90">{displayError.message}</span>
        </div>
      )}

      <div className={dashboardHeroShellClass}>
        <div className={dashboardHeroChromeClass}>
          <QADashboardHeaderToolbar
            jiraProjectKey={jiraKey}
            lastUpdatedText={lastUpdatedText}
            activeFiltersCount={activeFiltersCount}
            filters={dashboardFilters}
            onFiltersChange={setDashboardFilters}
            onOpenFiltersModal={() => setShowFilters(true)}
            onOpenExportModal={() => setShowExportModal(true)}
          />

          <section aria-label="Indicadores principais de tarefas">
            {showLoadingBanner && !filteredProject.tasks?.length ? (
              <div
                className={cn(
                  'grid grid-cols-2 gap-2 sm:gap-3',
                  showBacklogCard ? 'sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-4'
                )}
              >
                {Array.from({ length: showBacklogCard ? 5 : 4 }).map((_, k) => (
                  <div
                    key={k}
                    className={cn(
                      glassIndicatorCardClass,
                      'h-[4.75rem] animate-pulse opacity-80 sm:h-[5rem]'
                    )}
                    aria-hidden
                  />
                ))}
              </div>
            ) : (
              <GlassIndicatorCards
                items={qaIndicatorItems}
                columns={showBacklogCard ? 5 : 4}
              />
            )}
          </section>
        </div>
      </div>

      <div className={dashboardInsightsSectionHeaderClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className={dashboardInsightsSectionLabelClass}>Qualidade e execução</h2>
            <p className={dashboardInsightsSectionDescClass}>
              Cobertura, bugs, automação e tendências — respeitam os filtros do dashboard.
            </p>
          </div>
          <p className="hidden max-w-xs text-right text-[11px] leading-snug text-[color-mix(in_srgb,var(--brand-text-strong)_62%,transparent)] sm:block">
            Pairar sobre severidades e fatias revela contagens. Crítico pulsa quando há bugs abertos.
          </p>
        </div>
      </div>

      <ProjectDashboard
        project={filteredProject}
        isLoading={showLoadingBanner && !filteredProject.tasks?.length}
      />

      {!showLoadingBanner && dashboardMetrics.totalTasks === 0 && (
        <div className={dashboardEmptyStateShellClass}>
          <EmptyState
            compact
            title="Nenhuma tarefa no escopo"
            description="Crie tarefas na aba Tarefas ou ajuste os filtros do dashboard."
            icon="📊"
            secondaryAction={
              onNavigateToBacklog && backlogCount > 0
                ? { label: 'Ver backlog', onClick: onNavigateToBacklog }
                : onNavigateToTab
                  ? { label: 'Ir para Tarefas', onClick: () => onNavigateToTab('tasks') }
                  : undefined
            }
          />
        </div>
      )}

      <RecentActivity project={filteredProject} onViewAll={goTasks} />
      </div>

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

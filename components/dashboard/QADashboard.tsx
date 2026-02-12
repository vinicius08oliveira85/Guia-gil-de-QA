import React, { useMemo, useState } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useMetricsHistory } from '../../hooks/useMetricsHistory';
import { GlassIndicatorCards } from './GlassIndicatorCards';
import { FileExportModal } from '../common/FileExportModal';
import { DashboardFiltersModal, DashboardFilters } from './DashboardFiltersModal';
import {
  ClipboardCheck,
  AlertCircle,
  Download,
  Filter,
  Plus,
  ClipboardList,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

/**
 * Props do componente QADashboard
 */
interface QADashboardProps {
  /** Projeto a ser exibido no dashboard */
  project: Project;
  /** Callback para atualizar o projeto */
  onUpdateProject?: (project: Project) => void;
  /** Callback para navegar entre abas */
  onNavigateToTab?: (tabId: string) => void;
}

/**
 * Dashboard principal de QA com visão geral moderna de testes, bugs, cobertura e análises
 * 
 * @example
 * ```tsx
 * <QADashboard project={project} onUpdateProject={handleUpdateProject} />
 * ```
 */
export const QADashboard: React.FC<QADashboardProps> = React.memo(({ project, onUpdateProject, onNavigateToTab }) => {
  // Estados para controlar modais
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>({});

  // Aplicar filtros ao projeto
  const filteredProject = useMemo(() => {
    if (!dashboardFilters || Object.keys(dashboardFilters).length === 0) {
      return project;
    }

    let filteredTasks = [...project.tasks];

    // Filtro por tipo de tarefa
    if (dashboardFilters.taskType && dashboardFilters.taskType.length > 0) {
      filteredTasks = filteredTasks.filter(task =>
        dashboardFilters.taskType!.includes(task.type)
      );
    }

    // Filtro por status de teste
    if (dashboardFilters.testStatus && dashboardFilters.testStatus.length > 0) {
      filteredTasks = filteredTasks.filter(task => {
        const testCases = task.testCases || [];
        return testCases.some(tc =>
          dashboardFilters.testStatus!.includes(tc.status)
        );
      });
    }

    // Filtro por fase (simplificado - verifica se a tarefa está em alguma fase)
    if (dashboardFilters.phase && dashboardFilters.phase.length > 0) {
      // Este filtro pode ser expandido conforme necessário
      // Por enquanto, mantém todas as tarefas se houver filtro de fase
    }

    return {
      ...project,
      tasks: filteredTasks
    };
  }, [project, dashboardFilters]);

  const metrics = useProjectMetrics(filteredProject);
  const { trends } = useMetricsHistory(filteredProject, dashboardFilters.period || 'week');

  // Tendência para Total de Tarefas (modificador no card)
  const tasksTrend = useMemo(() => {
    if (!trends) return '0%';
    const current = trends.executedTests?.current ?? 0;
    const previous = trends.executedTests?.previous ?? 0;
    if (previous === 0) return '0%';
    const changePercent = Math.round(((current - previous) / previous) * 100);
    return changePercent > 0 ? `+${changePercent}%` : changePercent < 0 ? `${changePercent}%` : '0%';
  }, [trends]);

  // Helper para alternar filtro de bugs
  const toggleBugFilter = () => {
    setDashboardFilters(prev => {
      const isBugOnly = prev.taskType?.length === 1 && prev.taskType[0] === 'Bug';
      return {
        ...prev,
        taskType: isBugOnly ? [] : ['Bug']
      };
    });
  };

  const totalTasksCount = filteredProject.tasks?.length ?? 0;
  const taskStatus = metrics.taskStatus ?? { toDo: 0, inProgress: 0, done: 0, blocked: 0 };
  const totalNonBug = taskStatus.toDo + taskStatus.inProgress + taskStatus.done + taskStatus.blocked;
  const concludedPercent = totalNonBug > 0 ? Math.round((taskStatus.done / totalNonBug) * 100) : 0;
  const openBugs = metrics.openVsClosedBugs?.open ?? 0;
  const hasCriticalBugs = (metrics.bugsBySeverity?.['Crítico'] ?? 0) > 0;

  const indicatorItems = useMemo(
    () => [
      {
        label: 'Total de Tarefas',
        value: totalTasksCount,
        modifier: tasksTrend,
        icon: ClipboardList,
        colorTheme: 'orange' as const,
      },
      {
        label: 'Tarefas Pendentes',
        value: taskStatus.toDo,
        modifier: '-',
        icon: Clock,
        colorTheme: 'yellow' as const,
      },
      {
        label: 'Em Andamento',
        value: taskStatus.inProgress,
        modifier: 'active',
        icon: Zap,
        colorTheme: 'blue' as const,
      },
      {
        label: 'Concluídas',
        value: taskStatus.done,
        modifier: `${concludedPercent}%`,
        icon: CheckCircle,
        colorTheme: 'emerald' as const,
      },
      {
        label: 'Bugs Abertos',
        value: openBugs,
        modifier: hasCriticalBugs ? 'Critical' : 'Abertos',
        icon: AlertTriangle,
        colorTheme: 'red' as const,
      },
    ],
    [
      totalTasksCount,
      tasksTrend,
      taskStatus.toDo,
      taskStatus.inProgress,
      taskStatus.done,
      concludedPercent,
      openBugs,
      hasCriticalBugs,
    ]
  );

  const executionProps = useMemo(
    () => ({
      executedTestCases: metrics.executedTestCases ?? 0,
      totalTestCases: metrics.totalTestCases ?? 0,
      automationRatio: metrics.automationRatio ?? 0,
      projectName: filteredProject.name || 'Projeto',
      automationTrend: '+5.2% esta semana',
    }),
    [
      metrics.executedTestCases,
      metrics.totalTestCases,
      metrics.automationRatio,
      filteredProject.name,
    ]
  );

  return (
    <div className="space-y-6" role="main" aria-label="Dashboard de QA">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
                Dashboard de QA
              </h2>
            </div>
            <p className="text-base-content/70 text-sm max-w-2xl">
              Visão geral de testes, bugs, cobertura e análises do projeto.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={toggleBugFilter}
              className={`btn btn-sm rounded-full flex items-center gap-1.5 ${
                dashboardFilters.taskType?.length === 1 && dashboardFilters.taskType[0] === 'Bug'
                  ? 'btn-error text-white' 
                  : 'btn-outline hover:border-error hover:text-error'
              }`}
              title="Filtrar apenas Bugs"
            >
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              <span>Bugs</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="btn btn-outline btn-sm rounded-full flex items-center gap-1.5 hover:bg-base-200"
              aria-label="Filtrar dados do dashboard"
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span>Filtrar</span>
            </button>
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="btn btn-outline btn-sm rounded-full flex items-center gap-1.5 hover:bg-base-200"
              aria-label="Exportar dados do dashboard"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Exportar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                // Navegar para aba de tarefas para criar novo teste
                if (onNavigateToTab) {
                  onNavigateToTab('tasks');
                } else {
                  setShowNewTestModal(true);
                }
              }}
              className="btn btn-primary btn-sm rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              aria-label="Criar novo teste"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Novo Teste</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indicadores QA (glass): Total, Pendentes, Em Andamento, Concluídas, Bugs, Execução, Automatizados */}
      <GlassIndicatorCards items={indicatorItems} execution={executionProps} />

      {/* Modal de Exportação */}
      <FileExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportType="project"
        project={project}
      />

      {/* Modal de Filtros */}
      <DashboardFiltersModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        project={project}
        filters={dashboardFilters}
        onFiltersChange={setDashboardFilters}
      />
    </div>
  );
});

QADashboard.displayName = 'QADashboard';

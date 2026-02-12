import React, { useMemo, useState } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useMetricsHistory } from '../../hooks/useMetricsHistory';
import { MetricCard } from './MetricCard';
import { TestPhaseProgress } from './TestPhaseProgress';
import { RecentActivity } from './RecentActivity';
import { QualityKPIs } from './QualityKPIs';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { FileExportModal } from '../common/FileExportModal';
import { DashboardFiltersModal, DashboardFilters } from './DashboardFiltersModal';
import { ReopeningRateCard } from '../tasks/ReopeningRateCard';
import { getQualityAlerts } from '../tasks/qualityMetrics';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Activity,
  ListChecks,
  FileText,
  Target,
  Layers,
  RefreshCw,
  Download,
  Filter,
  Plus,
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

  const tasksTrend = useMemo(() => {
    if (!trends) return { change: '0%', trend: 'neutral' as const };
    const current = trends.executedTests?.current || 0;
    const previous = trends.executedTests?.previous || 0;
    if (previous === 0) return { change: '0%', trend: 'neutral' as const };
    const changePercent = Math.round(((current - previous) / previous) * 100);
    return {
      change: changePercent > 0 ? `+${changePercent}%` : changePercent < 0 ? `${changePercent}%` : '0%',
      trend: changePercent > 0 ? 'up' as const : changePercent < 0 ? 'down' as const : 'neutral' as const,
    };
  }, [trends]);

  const testCasesTrend = useMemo(() => {
    if (!trends) return { change: '0%', trend: 'neutral' as const };
    const current = trends.executedTests?.current || 0;
    const previous = trends.executedTests?.previous || 0;
    if (previous === 0) return { change: '0%', trend: 'neutral' as const };
    const changePercent = Math.round(((current - previous) / previous) * 100);
    return {
      change: changePercent > 0 ? `+${changePercent}%` : changePercent < 0 ? `${changePercent}%` : '0%',
      trend: changePercent > 0 ? 'up' as const : changePercent < 0 ? 'down' as const : 'neutral' as const,
    };
  }, [trends]);

  const toggleBugFilter = () => {
    setDashboardFilters(prev => {
      const isBugOnly = prev.taskType?.length === 1 && prev.taskType[0] === 'Bug';
      return { ...prev, taskType: isBugOnly ? [] : ['Bug'] };
    });
  };

  const totalStrategies = useMemo(() => {
    const strategies = new Set<string>();
    filteredProject.tasks?.forEach(task => {
      task.testStrategy?.forEach(strategy => {
        strategies.add(strategy.testType);
      });
    });
    return strategies.size;
  }, [filteredProject.tasks]);

  const strategiesTrend = useMemo(() => {
    if (!trends || !project.metricsHistory || project.metricsHistory.length < 2) {
      return { change: '0%', trend: 'neutral' as const };
    }
    const current = trends.executedTests?.current || 0;
    const previous = trends.executedTests?.previous || 0;
    if (previous === 0) return { change: '0%', trend: 'neutral' as const };
    const changePercent = Math.round(((current - previous) / previous) * 100);
    if (Math.abs(changePercent) < 5) return { change: '0%', trend: 'neutral' as const };
    return {
      change: changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`,
      trend: changePercent > 0 ? 'up' as const : 'down' as const,
    };
  }, [trends, project.metricsHistory]);

  const activePhases = useMemo(() => {
    return metrics.newPhases?.filter(p => p.status === 'Em Andamento' || p.status === 'Concluído').length || 0;
  }, [metrics.newPhases]);

  const phasesTrend = useMemo(() => {
    if (!trends || !project.metricsHistory || project.metricsHistory.length < 2) {
      return { change: '0%', trend: 'neutral' as const };
    }
    const current = trends.passRate?.current || 0;
    const previous = trends.passRate?.previous || 0;
    if (previous === 0) return { change: '0%', trend: 'neutral' as const };
    const changePercent = Math.round(((current - previous) / previous) * 100);
    if (Math.abs(changePercent) < 5) return { change: '0%', trend: 'neutral' as const };
    return {
      change: changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`,
      trend: changePercent > 0 ? 'up' as const : 'down' as const,
    };
  }, [trends, project.metricsHistory]);

  const defectRate = useMemo(() => {
    if (metrics.totalTestCases === 0) return 0;
    return Math.round((metrics.failedTestCases / metrics.totalTestCases) * 100);
  }, [metrics]);

  const reopeningRate = 0;

  const qualityMetricsObj = useMemo(() => ({
    coverage: metrics.testCoverage,
    passRate: metrics.testPassRate,
    defectRate,
    reopeningRate,
  }), [metrics, defectRate]);

  const hasCriticalAlerts = useMemo(() => {
    return metrics.bugsBySeverity['Crítico'] > 0 ||
      (metrics.failedTestCases > 0 && metrics.testPassRate < 50);
  }, [metrics]);

  const alerts = useMemo(() => {
    const alertsList: Array<{
      id: string;
      type: 'critical' | 'warning' | 'info' | 'success';
      title: string;
      description: string;
      priority: 'High' | 'Medium' | 'Low';
      time: string;
    }> = [];

    if (metrics.bugsBySeverity['Crítico'] > 0) {
      alertsList.push({
        id: 'critical-bug',
        type: 'critical',
        title: 'Bug Crítico no Projeto',
        description: `${metrics.bugsBySeverity['Crítico']} bug(s) crítico(s) aberto(s) requerem atenção imediata`,
        priority: 'High',
        time: 'Agora',
      });
    }
    if (metrics.failedTestCases > 0 && metrics.testPassRate < 50) {
      alertsList.push({
        id: 'low-pass-rate',
        type: 'critical',
        title: 'Taxa de Aprovação Baixa',
        description: `Taxa de aprovação de ${metrics.testPassRate}% está abaixo do esperado`,
        priority: 'High',
        time: 'Agora',
      });
    }
    if (metrics.testCoverage < 80) {
      alertsList.push({
        id: 'low-coverage',
        type: 'warning',
        title: 'Cobertura de Testes Abaixo do Limiar',
        description: `Cobertura de ${metrics.testCoverage}% está abaixo do recomendado (80%)`,
        priority: 'Medium',
        time: 'Agora',
      });
    }
    const qualityAlerts = getQualityAlerts(qualityMetricsObj);
    qualityAlerts.forEach((alertMsg, index) => {
      if (alertMsg.includes('Cobertura') && alertsList.some(a => a.id === 'low-coverage')) return;
      alertsList.push({
        id: `quality-auto-${index}`,
        type: alertMsg.includes('Crítica') || alertMsg.includes('Elevada') ? 'critical' : 'warning',
        title: 'Alerta de Qualidade',
        description: alertMsg,
        priority: alertMsg.includes('Crítica') ? 'High' : 'Medium',
        time: 'Agora',
      });
    });
    if (metrics.openVsClosedBugs.open > 10) {
      alertsList.push({
        id: 'many-bugs',
        type: 'warning',
        title: 'Muitos Bugs Abertos',
        description: `${metrics.openVsClosedBugs.open} bugs abertos podem impactar a qualidade`,
        priority: 'Medium',
        time: 'Agora',
      });
    }
    if (alertsList.length === 0) {
      alertsList.push({
        id: 'all-good',
        type: 'success',
        title: 'Tudo Funcionando Bem',
        description: 'Nenhum alerta crítico. O projeto está em bom estado.',
        priority: 'Low',
        time: 'Agora',
      });
    }
    return alertsList.sort((a, b) => (a.priority === 'High' ? -1 : 1));
  }, [metrics, qualityMetricsObj]);

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

      {/* Grid: 4 MetricCards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Tarefas"
          value={filteredProject.tasks?.length ?? 0}
          change={tasksTrend.change}
          trend={tasksTrend.trend}
          icon={ListChecks}
        />
        <MetricCard
          title="Casos de Teste"
          value={metrics.totalTestCases ?? 0}
          change={testCasesTrend.change}
          trend={testCasesTrend.trend}
          icon={FileText}
        />
        <MetricCard
          title="Estratégias de Teste"
          value={totalStrategies}
          change={strategiesTrend.change}
          trend={strategiesTrend.trend}
          icon={Target}
        />
        <MetricCard
          title="Fases de Teste"
          value={activePhases}
          change={phasesTrend.change}
          trend={phasesTrend.trend}
          icon={Layers}
        />
      </div>

      {/* Progresso das Fases + Quality KPIs + ReopeningRate */}
      <div className="grid gap-4 lg:grid-cols-2 mt-6">
        <Card className="p-4">
          <TestPhaseProgress project={filteredProject} />
        </Card>
        <div className="space-y-4">
          <QualityKPIs project={filteredProject} />
          <ReopeningRateCard rate={reopeningRate} />
        </div>
      </div>

      {/* Recent Activity + Alertas */}
      <div className="grid gap-4 lg:grid-cols-2 mt-6">
        <RecentActivity project={filteredProject} />
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
              Alertas
            </h3>
            {hasCriticalAlerts && (
              <Badge variant="error" size="sm">Crítico</Badge>
            )}
          </div>
          <div className="space-y-3" role="list" aria-label="Alertas de qualidade">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border px-3 py-2 ${
                  alert.type === 'critical' ? 'border-error/30 bg-error/5' :
                  alert.type === 'warning' ? 'border-warning/30 bg-warning/5' :
                  'border-base-300 bg-base-100'
                }`}
                role="listitem"
              >
                <p className="text-sm font-medium text-base-content">{alert.title}</p>
                <p className="text-xs text-base-content/70 mt-0.5">{alert.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

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

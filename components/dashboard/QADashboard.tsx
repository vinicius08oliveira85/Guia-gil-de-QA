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

  // Calcular tendências para os cards de métricas
  const tasksTrend = useMemo(() => {
    if (!trends) return { change: '0%', trend: 'neutral' as const };
    // Usar executedTests como proxy para tendência de tarefas (mais tarefas = mais testes executados)
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
    // Calcular mudança baseada em executedTests que reflete melhor o crescimento
    const current = trends.executedTests?.current || 0;
    const previous = trends.executedTests?.previous || 0;
    if (previous === 0) return { change: '0%', trend: 'neutral' as const };
    
    const changePercent = Math.round(((current - previous) / previous) * 100);
    return {
      change: changePercent > 0 ? `+${changePercent}%` : changePercent < 0 ? `${changePercent}%` : '0%',
      trend: changePercent > 0 ? 'up' as const : changePercent < 0 ? 'down' as const : 'neutral' as const,
    };
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

  // Contar estratégias de teste únicas
  const totalStrategies = useMemo(() => {
    const strategies = new Set<string>();
    filteredProject.tasks?.forEach(task => {
      task.testStrategy?.forEach(strategy => {
        strategies.add(strategy.testType);
      });
    });
    return strategies.size;
  }, [filteredProject.tasks]);

  // Calcular tendência de estratégias comparando com histórico
  const strategiesTrend = useMemo(() => {
    if (!trends || !project.metricsHistory || project.metricsHistory.length < 2) {
      return { change: '0%', trend: 'neutral' as const };
    }
    
    // Estimar estratégias anteriores baseado em crescimento de testes
    // Se mais testes foram executados, provavelmente mais estratégias foram usadas
    const current = trends.executedTests?.current || 0;
    const previous = trends.executedTests?.previous || 0;
    if (previous === 0) return { change: '0%', trend: 'neutral' as const };
    
    const changePercent = Math.round(((current - previous) / previous) * 100);
    // Se a mudança for muito pequena, considerar neutral
    if (Math.abs(changePercent) < 5) {
      return { change: '0%', trend: 'neutral' as const };
    }
    
    return {
      change: changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`,
      trend: changePercent > 0 ? 'up' as const : 'down' as const,
    };
  }, [trends, project.metricsHistory]);

  // Contar fases ativas
  const activePhases = useMemo(() => {
    return metrics.newPhases?.filter(p => p.status === 'Em Andamento' || p.status === 'Concluído').length || 0;
  }, [metrics.newPhases]);

  // Calcular tendência de fases baseado em progresso do projeto
  const phasesTrend = useMemo(() => {
    if (!trends || !project.metricsHistory || project.metricsHistory.length < 2) {
      return { change: '0%', trend: 'neutral' as const };
    }
    
    // Usar passRate como indicador de progresso nas fases
    const current = trends.passRate?.current || 0;
    const previous = trends.passRate?.previous || 0;
    if (previous === 0) return { change: '0%', trend: 'neutral' as const };
    
    const changePercent = Math.round(((current - previous) / previous) * 100);
    // Se a mudança for muito pequena, considerar neutral
    if (Math.abs(changePercent) < 5) {
      return { change: '0%', trend: 'neutral' as const };
    }
    
    return {
      change: changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`,
      trend: changePercent > 0 ? 'up' as const : 'down' as const,
    };
  }, [trends, project.metricsHistory]);

  // Calcular métricas derivadas para qualidade
  const defectRate = useMemo(() => {
    if (metrics.totalTestCases === 0) return 0;
    return Math.round((metrics.failedTestCases / metrics.totalTestCases) * 100);
  }, [metrics]);

  // Placeholder para Taxa de Reabertura (idealmente viria do histórico de status)
  const reopeningRate = 0;

  const qualityMetricsObj = useMemo(() => ({
    coverage: metrics.testCoverage,
    passRate: metrics.testPassRate,
    defectRate,
    reopeningRate
  }), [metrics, defectRate]);

  // Verificar se há alertas críticos
  const hasCriticalAlerts = useMemo(() => {
    return metrics.bugsBySeverity['Crítico'] > 0 || 
           (metrics.failedTestCases > 0 && metrics.testPassRate < 50);
  }, [metrics]);

  // Gerar alertas baseados nas métricas
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

    // Integrar alertas da lógica centralizada de qualidade
    const qualityAlerts = getQualityAlerts(qualityMetricsObj);
    qualityAlerts.forEach((alertMsg, index) => {
      // Evitar duplicatas de cobertura se já adicionado acima
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
  }, [metrics]);

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
              className="btn btn-outline btn-sm rounded-full flex items-center gap-1.5"
              aria-label="Filtrar dados do dashboard"
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span>Filtrar</span>
            </button>
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="btn btn-outline btn-sm rounded-full flex items-center gap-1.5"
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
              className="btn btn-primary btn-sm rounded-full flex items-center gap-1.5"
              aria-label="Criar novo teste"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Novo Teste</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metrics - 4 Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Tarefas"
          value={metrics.totalTasks}
          change={tasksTrend.change}
          trend={tasksTrend.trend}
          icon={ListChecks}
          description="Tarefas ativas do projeto"
        />
        <MetricCard
          title="Casos de Teste"
          value={metrics.totalTestCases}
          change={testCasesTrend.change}
          trend={testCasesTrend.trend}
          icon={FileText}
          description="Total de casos de teste"
        />
        <MetricCard
          title="Estratégias de Teste"
          value={totalStrategies}
          change={strategiesTrend.change}
          trend={strategiesTrend.trend}
          icon={Target}
          description="Estratégias ativas"
        />
        <MetricCard
          title="Fases de Teste"
          value={activePhases}
          change={phasesTrend.change}
          trend={phasesTrend.trend}
          icon={Layers}
          description="Fases ativas"
        />
      </div>

      {/* Test Phase Progress and Quality KPIs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" hoverable>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-base-content">Progresso das Fases</h3>
                <p className="text-sm text-base-content/70">
                  Status atual das fases de teste do projeto
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Atualizar progresso das fases"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <TestPhaseProgress project={filteredProject} />
          </div>
        </Card>

        <div className="space-y-4">
          <QualityKPIs project={filteredProject} />
          <ReopeningRateCard rate={reopeningRate} />
        </div>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivity project={filteredProject} />

        <Card hoverable>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-base-content">Alertas e Notificações</h3>
                <p className="text-sm text-base-content/70">Atualizações importantes e problemas</p>
              </div>
              {hasCriticalAlerts && (
                <Badge variant="error" size="sm">
                  {alerts.filter(a => a.type === 'critical').length} Crítico(s)
                </Badge>
              )}
            </div>
            <div className="space-y-4">
              {alerts.map((alert) => {
                const alertColors = {
                  critical: 'bg-error/10 border-error/20',
                  warning: 'bg-warning/10 border-warning/20',
                  info: 'bg-info/10 border-info/20',
                  success: 'bg-success/10 border-success/20',
                };

                const iconColors = {
                  critical: 'text-error',
                  warning: 'text-warning',
                  info: 'text-info',
                  success: 'text-success',
                };

                const Icon = alert.type === 'critical' || alert.type === 'warning' 
                  ? AlertCircle 
                  : alert.type === 'success'
                  ? CheckCircle2
                  : Activity;

                return (
                  <div
                    key={alert.id}
                    className={`flex gap-3 p-3 rounded-lg border ${alertColors[alert.type]}`}
                  >
                    <Icon className={`h-5 w-5 ${iconColors[alert.type]} shrink-0 mt-0.5`} aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-base-content">{alert.title}</p>
                      <p className="text-xs text-base-content/70 mt-1">{alert.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={
                            alert.priority === 'High' 
                              ? 'error' 
                              : alert.priority === 'Medium' 
                              ? 'warning' 
                              : 'info'
                          }
                          size="sm"
                          className="text-xs"
                        >
                          {alert.priority === 'High' 
                            ? 'Alta Prioridade' 
                            : alert.priority === 'Medium' 
                            ? 'Média Prioridade' 
                            : 'Baixa Prioridade'}
                        </Badge>
                        <span className="text-xs text-base-content/60">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

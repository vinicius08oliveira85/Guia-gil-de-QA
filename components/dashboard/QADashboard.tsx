import React, { useMemo, useState } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useMetricsHistory } from '../../hooks/useMetricsHistory';
import { DashboardStatCard } from './DashboardStatCard';
import { QualityScoreChart } from './QualityScoreChart';
import { CriticalAlerts } from './CriticalAlerts';
import { ProjectDetailsPanel } from './ProjectDetailsPanel';
import { RecentActivity } from './RecentActivity';
import { BarChartWidget } from './BarChartWidget';
import { FileExportModal } from '../common/FileExportModal';
import { DashboardFiltersModal, DashboardFilters } from './DashboardFiltersModal';
import { getQualityAlerts, calculateQualityScore } from '../tasks/qualityMetrics';
import {
  ClipboardCheck,
  AlertCircle,
  ListChecks,
  FileText,
  Target,
  Layers,
  Download,
  Filter,
  Plus,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';
import { generateProjectFullAnalysis, appendProjectFullAnalysis } from '../../services/ai/projectFullAnalysisService';
import { ProjectAnalysesBoard } from './ProjectAnalysesBoard';
import { useErrorHandler } from '../../hooks/useErrorHandler';

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
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>({});
  const { handleError, handleSuccess } = useErrorHandler();

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
  const metricsPeriod: 'week' | 'month' =
    dashboardFilters.period === 'month' || dashboardFilters.period === 'quarter' ? 'month' : 'week';
  const { trends, previousMetrics } = useMetricsHistory(filteredProject, metricsPeriod);

  const activeFiltersCount =
    (dashboardFilters.period && dashboardFilters.period !== 'all' ? 1 : 0) +
    (dashboardFilters.taskType?.length ?? 0) +
    (dashboardFilters.testStatus?.length ?? 0) +
    (dashboardFilters.phase?.length ?? 0);

  const computeTrendFromMetric = (
    current: number,
    previous: number,
    options?: { minChangePercent?: number }
  ): { change: string | undefined; trend: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) return { change: undefined, trend: 'neutral' };
    const changePercent = Math.round(((current - previous) / previous) * 100);
    if (options?.minChangePercent != null && Math.abs(changePercent) < options.minChangePercent) {
      return { change: undefined, trend: 'neutral' };
    }
    const change =
      changePercent > 0 ? `+${changePercent}%` : changePercent < 0 ? `${changePercent}%` : '0%';
    const trend = changePercent > 0 ? 'up' as const : changePercent < 0 ? 'down' as const : 'neutral' as const;
    return { change, trend };
  };

  const tasksTrend = useMemo(() => {
    if (!trends) return { change: undefined, trend: 'neutral' as const };
    const current = trends.totalTasks?.current ?? 0;
    const previous = trends.totalTasks?.previous ?? 0;
    return computeTrendFromMetric(current, previous);
  }, [trends]);

  const testCasesTrend = useMemo(() => {
    if (!trends) return { change: undefined, trend: 'neutral' as const };
    const current = trends.totalTestCases?.current ?? 0;
    const previous = trends.totalTestCases?.previous ?? 0;
    return computeTrendFromMetric(current, previous);
  }, [trends]);

  const toggleBugFilter = () => {
    setDashboardFilters(prev => {
      const isBugOnly = prev.taskType?.length === 1 && prev.taskType[0] === 'Bug';
      return { ...prev, taskType: isBugOnly ? [] : ['Bug'] };
    });
  };

  const handleGenerateAnalysis = async () => {
    if (!onUpdateProject || isGeneratingAnalysis) return;
    setIsGeneratingAnalysis(true);
    try {
      const analysis = await generateProjectFullAnalysis(project);
      const updated = appendProjectFullAnalysis(project, analysis);
      onUpdateProject(updated);
      handleSuccess('Análise IA gerada e salva com sucesso!');
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Erro ao gerar análise'), 'Gerar análise IA');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const totalStrategies = useMemo(() => {
    return filteredProject.tasks?.reduce((acc, t) => acc + (t.testStrategy?.length ?? 0), 0) ?? 0;
  }, [filteredProject.tasks]);

  const strategiesTrend = useMemo(() => {
    if (!trends) return { change: undefined, trend: 'neutral' as const };
    const current = trends.totalStrategies?.current ?? 0;
    const previous = trends.totalStrategies?.previous ?? 0;
    return computeTrendFromMetric(current, previous, { minChangePercent: 5 });
  }, [trends]);

  const activePhases = useMemo(() => {
    return metrics.newPhases?.filter(p => p.status === 'Em Andamento' || p.status === 'Concluído').length || 0;
  }, [metrics.newPhases]);

  const phasesTrend = useMemo(() => {
    if (!trends) return { change: undefined, trend: 'neutral' as const };
    const current = trends.activePhases?.current ?? 0;
    const previous = trends.activePhases?.previous ?? 0;
    return computeTrendFromMetric(current, previous, { minChangePercent: 5 });
  }, [trends]);

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

  const qualityScore = useMemo(
    () => calculateQualityScore(qualityMetricsObj),
    [qualityMetricsObj]
  );

  const qualityScoreTrendLabel = useMemo(() => {
    if (!previousMetrics) return undefined;
    const prevCoverage = previousMetrics.totalTestCases > 0
      ? Math.round((previousMetrics.executedTestCases / previousMetrics.totalTestCases) * 100)
      : 0;
    const prevDefect = previousMetrics.totalTestCases > 0
      ? Math.round((previousMetrics.failedTestCases / previousMetrics.totalTestCases) * 100)
      : 0;
    const prevScore = calculateQualityScore({
      coverage: prevCoverage,
      passRate: previousMetrics.testPassRate,
      defectRate: prevDefect,
      reopeningRate: 0,
    });
    const diff = Math.round(qualityScore - prevScore);
    if (diff === 0) return undefined;
    const periodLabel = metricsPeriod === 'month' ? 'mês' : 'semana';
    return diff > 0
      ? `+${diff} em relação ao ${periodLabel} passado`
      : `${diff} em relação ao ${periodLabel} passado`;
  }, [previousMetrics, qualityScore, metricsPeriod, metrics.totalTestCases]);

  const kpiMetrics = useMemo(
    () => ({
      passRate: metrics.testPassRate,
      defectRate:
        metrics.totalTestCases > 0
          ? Math.round((metrics.failedTestCases / metrics.totalTestCases) * 100 * 10) / 10
          : 0,
      coverage: metrics.testCoverage,
      avgExecutionTimeMinutes: 12.4,
    }),
    [metrics]
  );

  // Dados para gráficos de distribuição (prioridade, responsável, complexidade)
  const priorityChartData = useMemo(() => {
    const dist = metrics.priorityDistribution ?? [];
    const colorByPriority: Record<string, string> = {
      Urgente: 'bg-error',
      Alta: 'bg-warning',
      Média: 'bg-info',
      Baixa: 'bg-success',
      'Sem prioridade': 'bg-base-content/30',
    };
    return {
      data: dist.map(d => ({ label: d.priority, value: d.percentage, color: colorByPriority[d.priority] ?? 'bg-base-300' })),
      rawData: dist.map(d => ({ label: d.priority, value: d.count, color: colorByPriority[d.priority] ?? 'bg-base-300' })),
    };
  }, [metrics.priorityDistribution]);

  const assigneeChartData = useMemo(() => {
    const dist = metrics.assigneeDistribution ?? [];
    const palette = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning'];
    return {
      data: dist.map((d, i) => ({ label: d.assigneeLabel, value: d.percentage, color: palette[i % palette.length] })),
      rawData: dist.map((d, i) => ({ label: d.assigneeLabel, value: d.count, color: palette[i % palette.length] })),
    };
  }, [metrics.assigneeDistribution]);

  const complexityChartData = useMemo(() => {
    const dist = metrics.complexityDistribution ?? [];
    const colorByComplexity: Record<string, string> = {
      Baixa: 'bg-success',
      Média: 'bg-info',
      Alta: 'bg-warning',
      'Muito Alta': 'bg-error',
    };
    return {
      data: dist.map(d => ({ label: d.complexity, value: d.percentage, color: colorByComplexity[d.complexity] ?? 'bg-base-300' })),
      rawData: dist.map(d => ({ label: d.complexity, value: d.count, color: colorByComplexity[d.complexity] ?? 'bg-base-300' })),
    };
  }, [metrics.complexityDistribution]);

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
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-base-content">
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
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-300 flex items-center gap-1.5 border ${
                dashboardFilters.taskType?.length === 1 && dashboardFilters.taskType[0] === 'Bug'
                  ? 'bg-error text-error-content border-error'
                  : 'text-base-content/70 hover:bg-base-200 hover:text-base-content border-base-300 hover:border-error/50 hover:text-error'
              }`}
              title="Filtrar apenas Bugs"
              aria-label="Filtrar apenas Bugs"
            >
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Bugs</span>
            </button>
            {/* Em telas médias ou maiores: botões visíveis */}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors duration-300 flex items-center gap-1.5"
                aria-label="Filtrar dados do dashboard"
              >
                <Filter className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{`Filtrar${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors duration-300 flex items-center gap-1.5"
                aria-label="Exportar dados do dashboard"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Exportar</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateAnalysis}
                disabled={isGeneratingAnalysis || !onUpdateProject}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors duration-300 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isGeneratingAnalysis ? 'Gerando análise…' : 'Gerar análise IA'}
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isGeneratingAnalysis ? 'Gerando…' : 'Gerar análise IA'}</span>
              </button>
            </div>
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {dashboardFilters.period && dashboardFilters.period !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs bg-base-200 border border-base-300">
                    Período: {dashboardFilters.period === 'month' ? 'Mês' : dashboardFilters.period === 'quarter' ? 'Trimestre' : 'Semana'}
                    <button type="button" onClick={() => setDashboardFilters((prev) => ({ ...prev, period: 'all' }))} className="btn btn-ghost btn-xs rounded-full p-0.5" aria-label="Remover filtro período"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {(dashboardFilters.taskType ?? []).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs bg-base-200 border border-base-300">
                    Tipo: {t}
                    <button type="button" onClick={() => setDashboardFilters((prev) => ({ ...prev, taskType: prev.taskType?.filter((x) => x !== t) ?? [] }))} className="btn btn-ghost btn-xs rounded-full p-0.5" aria-label={`Remover filtro tipo ${t}`}><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {(dashboardFilters.testStatus ?? []).map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs bg-base-200 border border-base-300">
                    Status: {s === 'Not Run' ? 'Não executado' : s === 'Passed' ? 'Passou' : s === 'Failed' ? 'Falhou' : 'Bloqueado'}
                    <button type="button" onClick={() => setDashboardFilters((prev) => ({ ...prev, testStatus: prev.testStatus?.filter((x) => x !== s) ?? [] }))} className="btn btn-ghost btn-xs rounded-full p-0.5" aria-label={`Remover filtro status ${s}`}><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {(dashboardFilters.phase ?? []).map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs bg-base-200 border border-base-300">
                    Fase: {p}
                    <button type="button" onClick={() => setDashboardFilters((prev) => ({ ...prev, phase: prev.phase?.filter((x) => x !== p) ?? [] }))} className="btn btn-ghost btn-xs rounded-full p-0.5" aria-label={`Remover filtro fase ${p}`}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            {/* Em mobile: dropdown Ações */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setShowActionsMenu((v) => !v)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content border border-base-300 transition-colors duration-300 flex items-center gap-1.5"
                aria-label="Abrir menu de ações"
                aria-expanded={showActionsMenu}
              >
                <span>Ações</span>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              {showActionsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden="true"
                    onClick={() => setShowActionsMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 py-1 rounded-xl border border-base-300 bg-base-100 shadow-lg min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => { setShowFilters(true); setShowActionsMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      {`Filtrar${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowExportModal(true); setShowActionsMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Exportar
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleGenerateAnalysis(); setShowActionsMenu(false); }}
                      disabled={isGeneratingAnalysis || !onUpdateProject}
                      className="w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isGeneratingAnalysis ? 'Gerando…' : 'Gerar análise IA'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 4 stat cards (clicáveis para navegar à aba Tarefas quando onNavigateToTab existir) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total de Tarefas"
          value={filteredProject.tasks?.length ?? 0}
          changePercent={tasksTrend.change}
          trend={tasksTrend.trend}
          icon={ListChecks}
          onClick={onNavigateToTab ? () => onNavigateToTab('tasks') : undefined}
        />
        <DashboardStatCard
          title="Casos de Teste"
          value={metrics.totalTestCases ?? 0}
          changePercent={testCasesTrend.change}
          trend={testCasesTrend.trend}
          icon={FileText}
          onClick={onNavigateToTab ? () => onNavigateToTab('tasks') : undefined}
        />
        <DashboardStatCard
          title="Estratégias de Teste"
          value={totalStrategies}
          changePercent={strategiesTrend.change}
          trend={strategiesTrend.trend}
          icon={Target}
          onClick={onNavigateToTab ? () => onNavigateToTab('tasks') : undefined}
        />
        <DashboardStatCard
          title="Fases de Teste"
          value={activePhases}
          changePercent={phasesTrend.change}
          trend={phasesTrend.trend}
          icon={Layers}
        />
      </div>

      {/* Grid principal: Score + Alertas (7) | Detalhes do Projeto (5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <QualityScoreChart score={qualityScore} trendLabel={qualityScoreTrendLabel} />
          <CriticalAlerts alerts={alerts} onlyCriticalAndWarning />
        </div>
        <div className="lg:col-span-5">
          <ProjectDetailsPanel
            phases={metrics.newPhases || []}
            currentPhaseProgress={project.sdlcPhaseAnalysis?.progressPercentage}
            kpiMetrics={kpiMetrics}
          />
        </div>
      </div>

      {/* Indicadores: Prioridade, Responsável, Complexidade (clicáveis para abrir filtros) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChartWidget
          title="Por prioridade"
          data={priorityChartData.data}
          rawData={priorityChartData.rawData}
          interactive
          onBarClick={() => setShowFilters(true)}
          updatedAt={project.updatedAt}
        />
        <BarChartWidget
          title="Por responsável"
          data={assigneeChartData.data}
          rawData={assigneeChartData.rawData}
          interactive
          onBarClick={() => setShowFilters(true)}
          updatedAt={project.updatedAt}
        />
        <BarChartWidget
          title="Por complexidade"
          data={complexityChartData.data}
          rawData={complexityChartData.rawData}
          interactive
          onBarClick={() => setShowFilters(true)}
          updatedAt={project.updatedAt}
        />
      </div>

      {/* Quadro: Análises IA do projeto */}
      <ProjectAnalysesBoard
        analyses={project.projectFullAnalyses ?? []}
        onGenerateAnalysis={onUpdateProject ? handleGenerateAnalysis : undefined}
        isGenerating={isGeneratingAnalysis}
      />

      {/* Atividades Recentes */}
      <div className="mt-6">
        <RecentActivity project={filteredProject} />
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

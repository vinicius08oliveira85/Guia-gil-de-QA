import React, { useMemo } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useMetricsHistory } from '../../hooks/useMetricsHistory';
import { useDashboardInsights } from '../../hooks/useDashboardInsights';
import { DashboardAlerts } from './DashboardAlerts';
import { QualityScoreCard } from './QualityScoreCard';
import { DashboardInsightsCard } from './DashboardInsightsCard';
import { PredictionsCard } from './PredictionsCard';
import { RecommendationsCard } from './RecommendationsCard';
import { MetricEnhancementsCard } from './MetricEnhancementsCard';
import { SDLCPhaseTimeline } from './SDLCPhaseTimeline';
import { ReleaseTimeline, TimeLine_01Entry } from '../common/ReleaseTimeline';
import { CheckCircle2, TrendingUp, BarChart3, Bug, Zap } from 'lucide-react';

interface QADashboardProps {
  project: Project;
  onUpdateProject?: (project: Project) => void;
}

/**
 * Dashboard principal de QA com visão geral de testes, bugs, cobertura e análises
 */
export const QADashboard: React.FC<QADashboardProps> = React.memo(({ project, onUpdateProject }) => {
  const metrics = useProjectMetrics(project);
  const { trends } = useMetricsHistory(project, 'week');
  const { insightsAnalysis, isGenerating, generateCompleteAnalysis } = useDashboardInsights(
    project,
    onUpdateProject,
    false
  );

  // Verificar se há testes críticos falhando (bugs críticos ou muitos testes falhando)
  const hasCriticalFailures = metrics.bugsBySeverity['Crítico'] > 0 || 
    (metrics.failedTestCases > 0 && metrics.testPassRate < 50);

  const passRateTrend = trends?.passRate;

  // Mapear métricas para entries do timeline
  const timelineEntries = useMemo<TimeLine_01Entry[]>(() => {
    const total = metrics.totalTestCases;
    const passedPercentage = total > 0 ? Math.round((metrics.passedTestCases / total) * 100) : 0;
    const failedPercentage = total > 0 ? Math.round((metrics.failedTestCases / total) * 100) : 0;
    const blockedPercentage = total > 0 ? Math.round((metrics.blockedTestCases / total) * 100) : 0;
    const notRunPercentage = total > 0 ? Math.round((metrics.notRunTestCases / total) * 100) : 0;
    const executionPercentage = total > 0 ? Math.round((metrics.executedTestCases / total) * 100) : 0;

    return [
      {
        icon: BarChart3,
        title: 'Visão Geral dos Testes',
        subtitle: `${total} casos de teste totais`,
        description: `Resumo completo do status de execução dos testes do projeto, incluindo aprovados, com falha, bloqueados e não executados.`,
        items: [
          `${metrics.passedTestCases} testes aprovados (${passedPercentage}% do total)`,
          `${metrics.failedTestCases} testes com falha (${failedPercentage}% do total)`,
          `${metrics.blockedTestCases} testes bloqueados (${blockedPercentage}% do total)`,
          `${metrics.notRunTestCases} testes não executados (${notRunPercentage}% do total)`,
        ],
      },
      {
        icon: TrendingUp,
        title: 'Taxa de Sucesso',
        subtitle: `${metrics.testPassRate}% de aprovação`,
        description: `Taxa de sucesso dos testes executados. ${metrics.testPassRate}% dos testes executados foram aprovados.${passRateTrend?.trend ? ` Tendência: ${passRateTrend.trend === 'up' ? 'aumentando' : passRateTrend.trend === 'down' ? 'diminuindo' : 'estável'}.` : ''}`,
        items: passRateTrend?.trend ? [
          `Taxa atual: ${metrics.testPassRate}%`,
          passRateTrend.previous !== undefined ? `Taxa anterior: ${passRateTrend.previous}%` : '',
          `Tendência: ${passRateTrend.trend === 'up' ? 'Aumentando' : passRateTrend.trend === 'down' ? 'Diminuindo' : 'Estável'}`,
        ].filter(Boolean) : [
          `Taxa atual: ${metrics.testPassRate}%`,
          `${metrics.executedTestCases} testes executados de ${total} totais`,
        ],
      },
      {
        icon: CheckCircle2,
        title: 'Status das Execuções',
        subtitle: `${metrics.executedTestCases} de ${total} executados`,
        description: `Progresso da execução dos testes. ${executionPercentage}% dos casos de teste foram executados.`,
        items: [
          `${executionPercentage}% dos testes foram executados`,
          `Aprovados: ${metrics.passedTestCases}`,
          `Com Falha: ${metrics.failedTestCases}`,
          `Bloqueados: ${metrics.blockedTestCases}`,
          `Pendentes: ${total - metrics.executedTestCases}`,
        ],
      },
      {
        icon: Bug,
        title: 'Bugs e Incidentes',
        subtitle: `${metrics.openVsClosedBugs.open} bugs abertos`,
        description: `Visão geral dos bugs e incidentes identificados no projeto, categorizados por severidade.`,
        items: [
          `Total de bugs abertos: ${metrics.openVsClosedBugs.open}`,
          `Crítico: ${metrics.bugsBySeverity['Crítico']}`,
          `Alto: ${metrics.bugsBySeverity['Alto']}`,
          `Médio: ${metrics.bugsBySeverity['Médio']}`,
          `Baixo: ${metrics.bugsBySeverity['Baixo']}`,
          metrics.quickAnalysis.recentlyResolvedBugs > 0 
            ? `Resolvidos (7 dias): ${metrics.quickAnalysis.recentlyResolvedBugs}`
            : '',
        ].filter(Boolean),
      },
      {
        icon: Zap,
        title: 'Análises Rápidas',
        subtitle: 'Métricas de qualidade e performance',
        description: `Análise rápida das métricas de qualidade, incluindo média de falhas, retrabalho e funcionalidades problemáticas.`,
        items: [
          `Média de falhas por dia: ${metrics.quickAnalysis.averageFailuresPerDay.toFixed(1)} (últimos 30 dias)`,
          `Testes reexecutados: ${metrics.quickAnalysis.reexecutedTests} (indicador de retrabalho)`,
          `Funcionalidades problemáticas: ${metrics.quickAnalysis.topProblematicTasks.length}`,
          ...metrics.quickAnalysis.topProblematicTasks.slice(0, 3).map((task, idx) => 
            `#${idx + 1} ${task.taskTitle}: ${task.failureCount} falhas`
          ),
        ],
      },
    ];
  }, [metrics, passRateTrend]);

  return (
    <div className="space-y-6" role="main" aria-label="Dashboard de QA">
      {/* Botão único de análise completa */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={generateCompleteAnalysis}
          disabled={isGenerating}
          className="btn btn-primary btn-sm rounded-full disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[180px]"
          aria-label="Gerar análise completa do dashboard"
        >
          {isGenerating ? 'Gerando...' : '🔄 Gerar Análise Completa'}
        </button>
      </div>

      {/* Alertas */}
      <DashboardAlerts
        hasCriticalFailures={hasCriticalFailures}
        bugsBySeverity={metrics.bugsBySeverity}
        passRate={metrics.testPassRate}
      />

      {/* Timeline SDLC */}
      <SDLCPhaseTimeline project={project} onUpdateProject={onUpdateProject} />

      {/* Timeline de Métricas */}
      <ReleaseTimeline
        title="Métricas do Dashboard"
        description="Visão geral das métricas e status do projeto de QA"
        entries={timelineEntries}
        className="py-4"
      />

      {/* Análise de IA */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content flex-shrink-0">Análise de IA</h2>
        </div>

        {/* Score de Qualidade */}
        <QualityScoreCard analysis={insightsAnalysis} isLoading={isGenerating} />

        {/* Grid com Insights e Previsões */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardInsightsCard analysis={insightsAnalysis} isLoading={isGenerating} />
          <PredictionsCard analysis={insightsAnalysis} isLoading={isGenerating} />
        </div>

        {/* Recomendações */}
        <RecommendationsCard analysis={insightsAnalysis} isLoading={isGenerating} />

        {/* Melhorias de Métricas */}
        <MetricEnhancementsCard analysis={insightsAnalysis} isLoading={isGenerating} />
      </div>
    </div>
  );
});

QADashboard.displayName = 'QADashboard';


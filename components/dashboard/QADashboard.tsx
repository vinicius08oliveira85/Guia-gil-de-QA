import React, { useState } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useMetricsHistory } from '../../hooks/useMetricsHistory';
import { useDashboardInsights } from '../../hooks/useDashboardInsights';
import { TestOverviewCards } from './TestOverviewCards';
import { SuccessRateCard } from './SuccessRateCard';
import { BugsIncidentsCard } from './BugsIncidentsCard';
import { ExecutionProgressCard } from './ExecutionProgressCard';
import { CoverageCard } from './CoverageCard';
import { QuickAnalysisCard } from './QuickAnalysisCard';
import { DashboardAlerts } from './DashboardAlerts';
import { QualityScoreCard } from './QualityScoreCard';
import { DashboardInsightsCard } from './DashboardInsightsCard';
import { PredictionsCard } from './PredictionsCard';
import { RecommendationsCard } from './RecommendationsCard';
import { MetricEnhancementsCard } from './MetricEnhancementsCard';

interface QADashboardProps {
  project: Project;
  onUpdateProject?: (project: Project) => void;
}

/**
 * Dashboard principal de QA com visão geral de testes, bugs, cobertura e análises
 */
export const QADashboard: React.FC<QADashboardProps> = React.memo(({ project, onUpdateProject }) => {
  const [autoGenerateInsights, setAutoGenerateInsights] = useState(true);
  const metrics = useProjectMetrics(project);
  const { trends } = useMetricsHistory(project, 'week');
  const { insightsAnalysis, isGenerating, generateInsightsAnalysis } = useDashboardInsights(
    project,
    onUpdateProject,
    autoGenerateInsights
  );

  // Verificar se há testes críticos falhando (bugs críticos ou muitos testes falhando)
  const hasCriticalFailures = metrics.bugsBySeverity['Crítico'] > 0 || 
    (metrics.failedTestCases > 0 && metrics.testPassRate < 50);

  const passRateTrend = trends?.passRate;

  return (
    <div className="space-y-6" role="main" aria-label="Dashboard de QA">
      {/* Alertas */}
      <DashboardAlerts
        hasCriticalFailures={hasCriticalFailures}
        bugsBySeverity={metrics.bugsBySeverity}
        passRate={metrics.testPassRate}
        totalBugs={metrics.openVsClosedBugs.open}
      />

      {/* Visão Geral dos Testes */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Visão Geral dos Testes</h2>
        <TestOverviewCards
          passed={metrics.passedTestCases}
          failed={metrics.failedTestCases}
          blocked={metrics.blockedTestCases}
          notRun={metrics.notRunTestCases}
          total={metrics.totalTestCases}
        />
      </div>

      {/* Taxa de Sucesso e Status das Execuções */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SuccessRateCard
          passRate={metrics.testPassRate}
          trend={passRateTrend?.trend || null}
          previousRate={passRateTrend?.previous}
        />
        <ExecutionProgressCard
          total={metrics.totalTestCases}
          executed={metrics.executedTestCases}
          passed={metrics.passedTestCases}
          failed={metrics.failedTestCases}
          blocked={metrics.blockedTestCases}
        />
      </div>

      {/* Bugs e Incidentes */}
      <BugsIncidentsCard
        project={project}
        bugsBySeverity={metrics.bugsBySeverity}
        totalBugs={metrics.openVsClosedBugs.open}
        recentlyResolved={metrics.quickAnalysis.recentlyResolvedBugs}
      />

      {/* Cobertura por Funcionalidade */}
      <CoverageCard project={project} />

      {/* Análises Rápidas */}
      <QuickAnalysisCard
        averageFailuresPerDay={metrics.quickAnalysis.averageFailuresPerDay}
        topProblematicTasks={metrics.quickAnalysis.topProblematicTasks}
        reexecutedTests={metrics.quickAnalysis.reexecutedTests}
      />

      {/* Análise de IA */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-text-primary flex-shrink-0">Análise de IA</h2>
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="flex items-center gap-2 text-sm text-text-secondary whitespace-nowrap">
              <input
                type="checkbox"
                checked={autoGenerateInsights}
                onChange={(e) => setAutoGenerateInsights(e.target.checked)}
                className="rounded flex-shrink-0"
                aria-label="Gerar análise automaticamente"
              />
              <span>Auto-gerar</span>
            </label>
            <button
              onClick={generateInsightsAnalysis}
              disabled={isGenerating}
              className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[140px]"
              aria-label="Gerar análise de insights"
            >
              {isGenerating ? 'Gerando...' : '🔄 Gerar Análise'}
            </button>
          </div>
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


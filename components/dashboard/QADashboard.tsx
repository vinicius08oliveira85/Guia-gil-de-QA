import React from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useMetricsHistory } from '../../hooks/useMetricsHistory';
import { TestOverviewCards } from './TestOverviewCards';
import { SuccessRateCard } from './SuccessRateCard';
import { BugsIncidentsCard } from './BugsIncidentsCard';
import { ExecutionProgressCard } from './ExecutionProgressCard';
import { CoverageCard } from './CoverageCard';
import { QuickAnalysisCard } from './QuickAnalysisCard';
import { DashboardAlerts } from './DashboardAlerts';

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
    </div>
  );
});

QADashboard.displayName = 'QADashboard';


import { useMemo, useEffect } from 'react';
import { Project, MetricsSnapshot } from '../types';
import { useProjectMetrics } from './useProjectMetrics';
import {
  saveMetricsSnapshot,
  getCurrentAndPreviousPeriodMetrics,
  compareMetricsPeriods,
  createMetricsSnapshot,
} from '../services/metricsHistoryService';
import { useProjectsStore } from '../store/projectsStore';
import { logger } from '../utils/logger';

/**
 * Hook para gerenciar histórico de métricas e calcular tendências
 */
export const useMetricsHistory = (project: Project, period: 'week' | 'month' = 'week') => {
  const metrics = useProjectMetrics(project);
  const { updateProject } = useProjectsStore();

  // Salvar snapshot diário (apenas uma vez por dia)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastSnapshotDate = project.metricsHistory?.[0]?.date
      ? new Date(project.metricsHistory[0].date).toISOString().split('T')[0]
      : null;

    // Se já salvou hoje, não salvar novamente
    if (lastSnapshotDate === today) {
      return;
    }

    // Criar e salvar snapshot
    const snapshot = createMetricsSnapshot(
      metrics.totalTestCases,
      metrics.passedTestCases,
      metrics.failedTestCases,
      metrics.blockedTestCases,
      metrics.notRunTestCases,
      metrics.openVsClosedBugs.open + metrics.openVsClosedBugs.closed,
      metrics.bugsBySeverity,
      metrics.executedTestCases,
      metrics.testPassRate,
      metrics.automationRatio
    );

    const updatedProject = saveMetricsSnapshot(project, snapshot);
    updateProject(updatedProject).catch(error => {
      logger.error('Erro ao salvar snapshot de métricas', 'useMetricsHistory', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]); // Apenas quando o projeto mudar (evitar loop infinito)

  // Obter métricas do período atual e anterior
  const periodMetrics = useMemo(() => {
    return getCurrentAndPreviousPeriodMetrics(project, period);
  }, [project, period]);

  // Calcular tendências
  const trends = useMemo(() => {
    if (!periodMetrics.current || !periodMetrics.previous) {
      return null;
    }

    return compareMetricsPeriods(periodMetrics.current, periodMetrics.previous);
  }, [periodMetrics]);

  return {
    currentMetrics: periodMetrics.current,
    previousMetrics: periodMetrics.previous,
    trends,
    history: project.metricsHistory || [],
  };
};


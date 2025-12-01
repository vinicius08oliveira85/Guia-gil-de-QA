import React from 'react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';

interface MetricEnhancementsCardProps {
  analysis: DashboardInsightsAnalysis | null;
  isLoading?: boolean;
}

/**
 * Card de melhorias de métricas específicas
 */
export const MetricEnhancementsCard: React.FC<MetricEnhancementsCardProps> = React.memo(({
  analysis,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-3 text-text-secondary">Analisando métricas...</span>
        </div>
      </Card>
    );
  }

  if (!analysis || !analysis.metricEnhancements) {
    return null;
  }

  const { metricEnhancements } = analysis;

  const getTrendColor = (current: number, predicted: number) => {
    if (predicted > current) return 'text-emerald-600';
    if (predicted < current) return 'text-red-600';
    return 'text-slate-600';
  };

  const getTrendIcon = (current: number, predicted: number) => {
    if (predicted > current) return '↑';
    if (predicted < current) return '↓';
    return '→';
  };

  return (
    <Card className="space-y-4" aria-label="Melhorias de métricas">
      <h3 className="text-lg font-semibold text-text-primary">Melhorias de Métricas</h3>

      <div className="space-y-4">
        {/* Taxa de Sucesso */}
        <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-text-primary">Taxa de Sucesso dos Testes</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Atual: {metricEnhancements.testPassRate.current}%</span>
              <span className={`text-sm font-semibold ${getTrendColor(metricEnhancements.testPassRate.current, metricEnhancements.testPassRate.predicted)}`}>
                {getTrendIcon(metricEnhancements.testPassRate.current, metricEnhancements.testPassRate.predicted)} {metricEnhancements.testPassRate.predicted}%
              </span>
            </div>
          </div>
          <p className="text-sm text-text-secondary">{metricEnhancements.testPassRate.suggestion}</p>
        </div>

        {/* Resolução de Bugs */}
        <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-text-primary">Resolução de Bugs</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Atual: {metricEnhancements.bugResolution.current}</span>
              <span className={`text-sm font-semibold ${getTrendColor(metricEnhancements.bugResolution.current, metricEnhancements.bugResolution.predicted)}`}>
                {getTrendIcon(metricEnhancements.bugResolution.current, metricEnhancements.bugResolution.predicted)} {metricEnhancements.bugResolution.predicted}
              </span>
            </div>
          </div>
          <p className="text-sm text-text-secondary">{metricEnhancements.bugResolution.suggestion}</p>
        </div>

        {/* Cobertura */}
        <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-text-primary">Cobertura de Testes</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Atual: {metricEnhancements.coverage.current}%</span>
              <span className="text-sm font-semibold text-accent">
                → Meta: {metricEnhancements.coverage.target}%
              </span>
            </div>
          </div>
          <p className="text-sm text-text-secondary">{metricEnhancements.coverage.suggestion}</p>
        </div>
      </div>
    </Card>
  );
});

MetricEnhancementsCard.displayName = 'MetricEnhancementsCard';


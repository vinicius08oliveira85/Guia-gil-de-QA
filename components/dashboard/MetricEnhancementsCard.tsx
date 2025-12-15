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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-base-content/70">Analisando métricas...</span>
        </div>
      </Card>
    );
  }

  if (!analysis || !analysis.metricEnhancements) {
    return null;
  }

  const { metricEnhancements } = analysis;

  const getTrendColor = (current: number, predicted: number) => {
    if (predicted > current) return 'text-success';
    if (predicted < current) return 'text-error';
    return 'text-base-content/60';
  };

  const getTrendIcon = (current: number, predicted: number) => {
    if (predicted > current) return '↑';
    if (predicted < current) return '↓';
    return '→';
  };

  return (
    <Card className="p-5 space-y-4 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all duration-200" aria-label="Melhorias de métricas">
      <h3 className="text-lg font-semibold text-base-content">Melhorias de Métricas</h3>

      <div className="space-y-4">
        {/* Taxa de Sucesso */}
        <div className="p-4 bg-base-100 rounded-xl border border-base-300 hover:border-primary/20 transition-all">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h4 className="font-semibold text-base-content">Taxa de Sucesso dos Testes</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-base-content/70">Atual: {metricEnhancements.testPassRate.current}%</span>
              <span className={`badge badge-sm ${getTrendColor(metricEnhancements.testPassRate.current, metricEnhancements.testPassRate.predicted) === 'text-success' ? 'badge-success' : getTrendColor(metricEnhancements.testPassRate.current, metricEnhancements.testPassRate.predicted) === 'text-error' ? 'badge-error' : 'badge-warning'}`}>
                {getTrendIcon(metricEnhancements.testPassRate.current, metricEnhancements.testPassRate.predicted)} {metricEnhancements.testPassRate.predicted}%
              </span>
            </div>
          </div>
          <p className="text-sm text-base-content/70 leading-relaxed">{metricEnhancements.testPassRate.suggestion}</p>
        </div>

        {/* Resolução de Bugs */}
        <div className="p-4 bg-base-100 rounded-xl border border-base-300 hover:border-primary/20 transition-all">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h4 className="font-semibold text-base-content">Resolução de Bugs</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-base-content/70">Atual: {metricEnhancements.bugResolution.current}</span>
              <span className={`badge badge-sm ${getTrendColor(metricEnhancements.bugResolution.current, metricEnhancements.bugResolution.predicted) === 'text-success' ? 'badge-success' : getTrendColor(metricEnhancements.bugResolution.current, metricEnhancements.bugResolution.predicted) === 'text-error' ? 'badge-error' : 'badge-warning'}`}>
                {getTrendIcon(metricEnhancements.bugResolution.current, metricEnhancements.bugResolution.predicted)} {metricEnhancements.bugResolution.predicted}
              </span>
            </div>
          </div>
          <p className="text-sm text-base-content/70 leading-relaxed">{metricEnhancements.bugResolution.suggestion}</p>
        </div>

        {/* Cobertura */}
        <div className="p-4 bg-base-100 rounded-xl border border-base-300 hover:border-primary/20 transition-all">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h4 className="font-semibold text-base-content">Cobertura de Testes</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-base-content/70">Atual: {metricEnhancements.coverage.current}%</span>
              <span className="badge badge-primary badge-sm">
                → Meta: {metricEnhancements.coverage.target}%
              </span>
            </div>
          </div>
          <p className="text-sm text-base-content/70 leading-relaxed">{metricEnhancements.coverage.suggestion}</p>
        </div>
      </div>
    </Card>
  );
});

MetricEnhancementsCard.displayName = 'MetricEnhancementsCard';


import React from 'react';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';
import { Badge } from '../common/Badge';

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

  const getTrendVariant = (current: number, predicted: number): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    if (predicted > current) return 'success';
    if (predicted < current) return 'error';
    return 'warning';
  };

  const getTrendIcon = (current: number, predicted: number) => {
    if (predicted > current) {
      return <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />;
    }
    if (predicted < current) {
      return <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />;
    }
    return <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />;
  };

  return (
    <Card className="p-5 space-y-4 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all duration-200" aria-label="Melhorias de métricas">
      <h3 className="text-lg font-semibold text-base-content">Melhorias de Métricas</h3>

      <div className="space-y-4">
        {/* Taxa de Sucesso */}
        <div className="p-5 bg-base-100 rounded-xl border border-base-300 hover:bg-base-200 transition-colors">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h4 className="font-semibold text-base-content">Taxa de Sucesso dos Testes</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-base-content/70">Atual: {metricEnhancements.testPassRate.current}%</span>
              <Badge 
                variant={getTrendVariant(metricEnhancements.testPassRate.current, metricEnhancements.testPassRate.predicted)} 
                size="sm"
                className="inline-flex items-center gap-1"
              >
                {getTrendIcon(metricEnhancements.testPassRate.current, metricEnhancements.testPassRate.predicted)}
                <span>{metricEnhancements.testPassRate.predicted}%</span>
              </Badge>
            </div>
          </div>
          <p className="text-sm text-base-content/80 leading-relaxed">{metricEnhancements.testPassRate.suggestion}</p>
        </div>

        {/* Resolução de Bugs */}
        <div className="p-5 bg-base-100 rounded-xl border border-base-300 hover:bg-base-200 transition-colors">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h4 className="font-semibold text-base-content">Resolução de Bugs</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-base-content/70">Atual: {metricEnhancements.bugResolution.current}</span>
              <Badge 
                variant={getTrendVariant(metricEnhancements.bugResolution.current, metricEnhancements.bugResolution.predicted)} 
                size="sm"
                className="inline-flex items-center gap-1"
              >
                {getTrendIcon(metricEnhancements.bugResolution.current, metricEnhancements.bugResolution.predicted)}
                <span>{metricEnhancements.bugResolution.predicted}</span>
              </Badge>
            </div>
          </div>
          <p className="text-sm text-base-content/80 leading-relaxed">{metricEnhancements.bugResolution.suggestion}</p>
        </div>

        {/* Cobertura */}
        <div className="p-5 bg-base-100 rounded-xl border border-base-300 hover:bg-base-200 transition-colors">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h4 className="font-semibold text-base-content">Cobertura de Testes</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-base-content/70">Atual: {metricEnhancements.coverage.current}%</span>
              <Badge variant="info" size="sm" className="inline-flex items-center gap-1">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Meta: {metricEnhancements.coverage.target}%</span>
              </Badge>
            </div>
          </div>
          <p className="text-sm text-base-content/80 leading-relaxed">{metricEnhancements.coverage.suggestion}</p>
        </div>
      </div>
    </Card>
  );
});

MetricEnhancementsCard.displayName = 'MetricEnhancementsCard';


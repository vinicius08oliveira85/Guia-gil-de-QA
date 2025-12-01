import React from 'react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';

interface PredictionsCardProps {
  analysis: DashboardInsightsAnalysis | null;
  isLoading?: boolean;
}

/**
 * Card de previsões e fatores de risco
 */
export const PredictionsCard: React.FC<PredictionsCardProps> = React.memo(({
  analysis,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-3 text-text-secondary">Gerando previsões...</span>
        </div>
      </Card>
    );
  }

  if (!analysis || !analysis.predictions) {
    return null;
  }

  const { predictions } = analysis;

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case 'Alta': return 'bg-red-100 text-red-800';
      case 'Média': return 'bg-yellow-100 text-yellow-800';
      case 'Baixa': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card className="space-y-4" aria-label="Previsões e fatores de risco">
      <h3 className="text-lg font-semibold text-text-primary">Previsões e Riscos</h3>

      {/* Previsões numéricas */}
      {(predictions.nextWeekPassRate !== undefined || predictions.nextWeekBugs !== undefined) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {predictions.nextWeekPassRate !== undefined && (
            <div className="p-3 bg-surface-hover rounded-lg border border-surface-border">
              <p className="text-xs text-text-secondary mb-1">Taxa de Sucesso (Próxima Semana)</p>
              <p className="text-2xl font-bold text-text-primary">{predictions.nextWeekPassRate}%</p>
            </div>
          )}
          {predictions.nextWeekBugs !== undefined && (
            <div className="p-3 bg-surface-hover rounded-lg border border-surface-border">
              <p className="text-xs text-text-secondary mb-1">Bugs Previstos (Próxima Semana)</p>
              <p className="text-2xl font-bold text-text-primary">{predictions.nextWeekBugs}</p>
            </div>
          )}
        </div>
      )}

      {/* Fatores de risco */}
      {predictions.riskFactors && predictions.riskFactors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">Fatores de Risco Identificados:</p>
          <div className="space-y-2">
            {predictions.riskFactors.map((risk, index) => (
              <div
                key={index}
                className="p-3 bg-surface-hover rounded-lg border border-surface-border"
                aria-label={`Fator de risco: ${risk.factor} (${risk.probability})`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-text-primary flex-1">{risk.factor}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getProbabilityColor(risk.probability)}`}>
                    {risk.probability}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{risk.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
});

PredictionsCard.displayName = 'PredictionsCard';


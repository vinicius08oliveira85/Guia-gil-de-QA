import React from 'react';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';
import { Badge } from '../common/Badge';

interface PredictionsCardProps {
  analysis: DashboardInsightsAnalysis | null;
  isLoading?: boolean;
}

/**
 * Card de previsões e fatores de risco
 */
export const PredictionsCard: React.FC<PredictionsCardProps> = React.memo(
  ({ analysis, isLoading = false }) => {
    if (isLoading) {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-base-content/70">Gerando previsões...</span>
          </div>
        </Card>
      );
    }

    if (!analysis || !analysis.predictions) {
      return null;
    }

    const { predictions } = analysis;

    const getProbabilityVariant = (
      probability: string
    ): 'error' | 'warning' | 'info' | 'success' | 'default' => {
      switch (probability) {
        case 'Alta':
          return 'error';
        case 'Média':
          return 'warning';
        case 'Baixa':
          return 'info';
        default:
          return 'default';
      }
    };

    return (
      <Card className="p-5 space-y-6" aria-label="Previsões e fatores de risco">
        <h3 className="text-lg font-semibold text-base-content">Previsões e Riscos</h3>

        {/* Previsões numéricas */}
        {(predictions.nextWeekPassRate !== undefined || predictions.nextWeekBugs !== undefined) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {predictions.nextWeekPassRate !== undefined && (
              <div className="p-5 bg-base-100 border border-base-300 rounded-xl hover:bg-base-200 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-base-content/60" aria-hidden="true" />
                  <p className="text-xs text-base-content/70">Taxa de Sucesso (Próxima Semana)</p>
                </div>
                <p className="text-2xl font-bold text-base-content">
                  {predictions.nextWeekPassRate}%
                </p>
              </div>
            )}
            {predictions.nextWeekBugs !== undefined && (
              <div className="p-5 bg-base-100 border border-base-300 rounded-xl hover:bg-base-200 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-base-content/60" aria-hidden="true" />
                  <p className="text-xs text-base-content/70">Bugs Previstos (Próxima Semana)</p>
                </div>
                <p className="text-2xl font-bold text-base-content">{predictions.nextWeekBugs}</p>
              </div>
            )}
          </div>
        )}

        {/* Fatores de risco */}
        {predictions.riskFactors && predictions.riskFactors.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-error" aria-label="Alerta" />
              <p className="text-sm font-semibold text-base-content">
                Fatores de Risco Identificados
              </p>
            </div>
            <div className="space-y-3">
              {predictions.riskFactors.map((risk, index) => (
                <div
                  key={index}
                  className="p-4 bg-base-100 border border-base-300 rounded-xl hover:bg-base-200 transition-colors"
                  aria-label={`Fator de risco: ${risk.factor} (${risk.probability})`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-medium text-base-content flex-1 leading-relaxed">
                      {risk.factor}
                    </h4>
                    <Badge
                      variant={getProbabilityVariant(risk.probability)}
                      size="sm"
                      className="shrink-0"
                    >
                      {risk.probability}
                    </Badge>
                  </div>
                  <p className="text-sm text-base-content/70 leading-relaxed">{risk.impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  }
);

PredictionsCard.displayName = 'PredictionsCard';

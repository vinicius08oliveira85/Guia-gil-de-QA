import React from 'react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { getCardTextSecondaryClasses } from '../../utils/themeCardColors';
import { StatusBadge } from '../common/StatusBadge';

interface RecommendationsCardProps {
  analysis: DashboardInsightsAnalysis | null;
  isLoading?: boolean;
}

/**
 * Card de recomendações priorizadas
 */
export const RecommendationsCard: React.FC<RecommendationsCardProps> = React.memo(({
  analysis,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-3 text-text-secondary">Gerando recomendações...</span>
        </div>
      </Card>
    );
  }

  if (!analysis || !analysis.recommendations || analysis.recommendations.length === 0) {
    return null;
  }

  const { theme } = useTheme();

  const getCategoryStatus = (category: string): 'info' | 'error' | 'warning' | 'success' | 'default' => {
    switch (category) {
      case 'Testes': return 'info';
      case 'Bugs': return 'error';
      case 'Cobertura': return 'warning';
      case 'Processo': return 'success';
      case 'Qualidade': return 'warning';
      default: return 'default';
    }
  };

  const getImpactEffortStatus = (impact: string, effort: string): 'success' | 'warning' | 'default' => {
    // Priorizar recomendações de alto impacto e baixo esforço
    if (impact === 'Alto' && effort === 'Baixo') {
      return 'success';
    }
    if (impact === 'Alto') {
      return 'warning';
    }
    return 'default';
  };

  // Ordenar por impacto e esforço (alto impacto + baixo esforço primeiro)
  const sortedRecommendations = [...analysis.recommendations].sort((a, b) => {
    const aScore = (a.impact === 'Alto' ? 3 : a.impact === 'Médio' ? 2 : 1) - 
                   (a.effort === 'Baixo' ? 0 : a.effort === 'Médio' ? 1 : 2);
    const bScore = (b.impact === 'Alto' ? 3 : b.impact === 'Médio' ? 2 : 1) - 
                   (b.effort === 'Baixo' ? 0 : b.effort === 'Médio' ? 1 : 2);
    return bScore - aScore;
  });

  return (
    <Card className="space-y-4" aria-label="Recomendações priorizadas">
      <h3 className="text-lg font-semibold text-text-primary">Recomendações Priorizadas</h3>
      
      <div className="space-y-3">
        {sortedRecommendations.map((rec, index) => (
          <Card
            key={index}
            className={`p-4 border-2 ${theme === 'leve-saude' ? 'bg-white/80 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700' : 'bg-surface-hover border-surface-border'}`}
            aria-label={`Recomendação: ${rec.title} (${rec.category})`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <StatusBadge status={getCategoryStatus(rec.category)}>
                    {rec.category}
                  </StatusBadge>
                  <StatusBadge status={getImpactEffortStatus(rec.impact, rec.effort)}>
                    Impacto: {rec.impact} | Esforço: {rec.effort}
                  </StatusBadge>
                </div>
                <h4 className="font-semibold text-text-primary">{rec.title}</h4>
              </div>
            </div>
            <p className={`text-sm ${getCardTextSecondaryClasses(theme)}`}>{rec.description}</p>
          </Card>
        ))}
      </div>
    </Card>
  );
});

RecommendationsCard.displayName = 'RecommendationsCard';


import React from 'react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';

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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Testes': 'bg-blue-100 text-blue-800',
      'Bugs': 'bg-red-100 text-red-800',
      'Cobertura': 'bg-purple-100 text-purple-800',
      'Processo': 'bg-green-100 text-green-800',
      'Qualidade': 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-slate-100 text-slate-800';
  };

  const getImpactEffortBadge = (impact: string, effort: string) => {
    // Priorizar recomendações de alto impacto e baixo esforço
    if (impact === 'Alto' && effort === 'Baixo') {
      return 'bg-emerald-100 text-emerald-800';
    }
    if (impact === 'Alto') {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-slate-100 text-slate-800';
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
          <div
            key={index}
            className="p-4 bg-surface-hover rounded-lg border border-surface-border"
            aria-label={`Recomendação: ${rec.title} (${rec.category})`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${getCategoryColor(rec.category)}`}>
                    {rec.category}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${getImpactEffortBadge(rec.impact, rec.effort)}`}>
                    Impacto: {rec.impact} | Esforço: {rec.effort}
                  </span>
                </div>
                <h4 className="font-semibold text-text-primary">{rec.title}</h4>
              </div>
            </div>
            <p className="text-sm text-text-secondary">{rec.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
});

RecommendationsCard.displayName = 'RecommendationsCard';


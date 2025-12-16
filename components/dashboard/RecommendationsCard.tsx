import React from 'react';
import { TestTube, Bug, Target, Settings, Award } from 'lucide-react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';
import { Badge } from '../common/Badge';

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-base-content/70">Gerando recomendações...</span>
        </div>
      </Card>
    );
  }

  if (!analysis || !analysis.recommendations || analysis.recommendations.length === 0) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Testes':
        return <TestTube className="h-3.5 w-3.5" aria-hidden="true" />;
      case 'Bugs':
        return <Bug className="h-3.5 w-3.5" aria-hidden="true" />;
      case 'Cobertura':
        return <Target className="h-3.5 w-3.5" aria-hidden="true" />;
      case 'Processo':
        return <Settings className="h-3.5 w-3.5" aria-hidden="true" />;
      case 'Qualidade':
        return <Award className="h-3.5 w-3.5" aria-hidden="true" />;
      default:
        return null;
    }
  };

  const getCategoryVariant = (category: string): 'info' | 'error' | 'warning' | 'success' | 'default' => {
    switch (category) {
      case 'Testes': return 'info';
      case 'Bugs': return 'error';
      case 'Cobertura': return 'warning';
      case 'Processo': return 'success';
      case 'Qualidade': return 'warning';
      default: return 'default';
    }
  };

  const getImpactEffortVariant = (impact: string, effort: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
    // Priorizar recomendações de alto impacto e baixo esforço
    if (impact === 'Alto' && effort === 'Baixo') {
      return 'success';
    }
    if (impact === 'Alto') {
      return 'warning';
    }
    // Para impacto médio ou baixo, usar 'info' para melhor visibilidade
    return 'info';
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
    <Card className="p-5 space-y-4 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all duration-200" aria-label="Recomendações priorizadas">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">Recomendações Priorizadas</h3>
        <Badge variant="info" size="sm">{sortedRecommendations.length}</Badge>
      </div>
      
      <div className="space-y-4">
        {sortedRecommendations.map((rec, index) => (
          <div
            key={index}
            className="p-5 bg-base-100 border border-base-300 rounded-xl hover:bg-base-200 hover:border-primary/30 transition-colors"
            aria-label={`Recomendação: ${rec.title} (${rec.category})`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getCategoryVariant(rec.category)} size="sm" className="inline-flex items-center gap-1.5">
                  {getCategoryIcon(rec.category)}
                  <span>{rec.category}</span>
                </Badge>
                <Badge variant={getImpactEffortVariant(rec.impact, rec.effort)} size="sm">
                  Impacto: {rec.impact} | Esforço: {rec.effort}
                </Badge>
              </div>
              <h4 className="font-semibold text-base-content text-base leading-relaxed">{rec.title}</h4>
              <p className="text-sm text-base-content/80 leading-relaxed">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

RecommendationsCard.displayName = 'RecommendationsCard';



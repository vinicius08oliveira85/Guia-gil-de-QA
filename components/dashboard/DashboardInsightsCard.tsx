import React from 'react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';

interface DashboardInsightsCardProps {
  analysis: DashboardInsightsAnalysis | null;
  isLoading?: boolean;
}

/**
 * Card de insights do dashboard
 */
export const DashboardInsightsCard: React.FC<DashboardInsightsCardProps> = React.memo(({
  analysis,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-3 text-text-secondary">Gerando insights...</span>
        </div>
      </Card>
    );
  }

  if (!analysis || !analysis.insights || analysis.insights.length === 0) {
    return null;
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'Crítica': 'bg-red-100 text-red-800',
      'Alta': 'bg-orange-100 text-orange-800',
      'Média': 'bg-yellow-100 text-yellow-800',
      'Baixa': 'bg-blue-100 text-blue-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  // Ordenar insights por prioridade
  const sortedInsights = [...analysis.insights].sort((a, b) => {
    const priorityOrder = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
    return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
           (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
  });

  return (
    <Card className="space-y-4" aria-label="Insights do dashboard">
      <h3 className="text-lg font-semibold text-text-primary">Insights da IA</h3>
      
      <div className="space-y-3">
        {sortedInsights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${getInsightColor(insight.type)}`}
            aria-label={`${insight.type}: ${insight.title}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl flex-shrink-0" aria-hidden="true">
                  {getInsightIcon(insight.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-text-primary">{insight.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBadge(insight.priority)}`}>
                      {insight.priority}
                    </span>
                    {insight.actionable && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                        Acionável
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">{insight.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

DashboardInsightsCard.displayName = 'DashboardInsightsCard';


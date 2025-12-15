import React from 'react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-base-content/70">Gerando insights...</span>
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
      case 'success': return 'bg-success/20 border-success/50';
      case 'warning': return 'bg-warning-content/20 border-warning-content/60';
      case 'error': return 'bg-error/20 border-error/50';
      case 'info': return 'bg-info/20 border-info/50';
      default: return 'bg-base-200 border-base-300';
    }
  };

  const getPriorityStatus = (priority: string): 'error' | 'warning' | 'info' => {
    switch (priority) {
      case 'Crítica': return 'error';
      case 'Alta': return 'warning';
      case 'Média': return 'info';
      case 'Baixa': return 'info';
      default: return 'info';
    }
  };

  // Ordenar insights por prioridade
  const sortedInsights = [...analysis.insights].sort((a, b) => {
    const priorityOrder = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
    return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
           (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
  });

  return (
    <Card className="p-5 space-y-4" aria-label="Insights do dashboard">
      <h3 className="text-lg font-semibold text-base-content">Insights da IA</h3>
      
      <div className="space-y-3">
        {sortedInsights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border ${getInsightColor(insight.type)}`}
            aria-label={`${insight.type}: ${insight.title}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl flex-shrink-0" aria-hidden="true">
                  {getInsightIcon(insight.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-base-content">{insight.title}</h4>
                    <StatusBadge status={getPriorityStatus(insight.priority)}>
                      {insight.priority}
                    </StatusBadge>
                    {insight.actionable && (
                      <StatusBadge status="info">
                        Acionável
                      </StatusBadge>
                    )}
                  </div>
                  <p className="text-sm text-base-content/70">{insight.description}</p>
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


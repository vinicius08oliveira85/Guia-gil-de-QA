import React from 'react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { getInfoCardClasses, getErrorCardClasses, getWarningCardClasses, getSuccessCardClasses, getCardTextSecondaryClasses } from '../../utils/themeCardColors';
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

  const { theme } = useTheme();

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return getSuccessCardClasses(theme);
      case 'warning': return getWarningCardClasses(theme);
      case 'error': return getErrorCardClasses(theme);
      case 'info': return getInfoCardClasses(theme);
      default: return theme === 'leve-saude' ? 'bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-100' : 'bg-slate-50 border-slate-200 text-slate-600';
    }
  };

  const getPriorityStatus = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (priority) {
      case 'Crítica': return 'error';
      case 'Alta': return 'warning';
      case 'Média': return 'info';
      case 'Baixa': return 'default';
      default: return 'default';
    }
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
          <Card
            key={index}
            className={`p-4 border-2 ${getInsightColor(insight.type)}`}
            aria-label={`${insight.type}: ${insight.title}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl flex-shrink-0" aria-hidden="true">
                  {getInsightIcon(insight.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-text-primary">{insight.title}</h4>
                    <StatusBadge status={getPriorityStatus(insight.priority)}>
                      {insight.priority}
                    </StatusBadge>
                    {insight.actionable && (
                      <StatusBadge status="info">
                        Acionável
                      </StatusBadge>
                    )}
                  </div>
                  <p className={`text-sm ${getCardTextSecondaryClasses(theme)}`}>{insight.description}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
});

DashboardInsightsCard.displayName = 'DashboardInsightsCard';


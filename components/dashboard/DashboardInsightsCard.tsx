import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';
import { getPriorityVariant } from '../../utils/taskHelpers';
import { Badge } from '../common/Badge';

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
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" aria-hidden="true" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-error" aria-hidden="true" />;
      case 'info':
        return <Info className="h-5 w-5 text-info" aria-hidden="true" />;
      default:
        return <Info className="h-5 w-5 text-base-content/40" aria-hidden="true" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-success/10 border-success/30';
      case 'warning': return 'bg-warning/10 border-warning/30';
      case 'error': return 'bg-error/10 border-error/30';
      case 'info': return 'bg-info/10 border-info/30';
      default: return 'bg-base-100 border-base-300';
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
      
      <div className="space-y-4">
        {sortedInsights.map((insight, index) => (
          <div
            key={index}
            className={`p-5 rounded-xl border ${getInsightColor(insight.type)} hover:bg-base-200 transition-colors`}
            aria-label={`${insight.type}: ${insight.title}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h4 className="font-semibold text-base-content text-base leading-relaxed">{insight.title}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge appearance="pill" variant={getPriorityVariant(insight.priority)} size="sm">
                      {insight.priority}
                    </Badge>
                    {insight.actionable && (
                      <Badge variant="info" size="sm">
                        Acionável
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-base-content/80 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

DashboardInsightsCard.displayName = 'DashboardInsightsCard';


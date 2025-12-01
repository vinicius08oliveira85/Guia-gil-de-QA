import React from 'react';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';

interface QualityScoreCardProps {
  analysis: DashboardInsightsAnalysis | null;
  isLoading?: boolean;
}

/**
 * Card de score de qualidade geral
 */
export const QualityScoreCard: React.FC<QualityScoreCardProps> = React.memo(({
  analysis,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-3 text-text-secondary">Calculando score...</span>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const { qualityScore, qualityLevel } = analysis;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Excelente': return 'bg-emerald-100 text-emerald-800';
      case 'Bom': return 'bg-blue-100 text-blue-800';
      case 'Regular': return 'bg-yellow-100 text-yellow-800';
      case 'Ruim': return 'bg-orange-100 text-orange-800';
      case 'Crítico': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card className={`${getScoreBgColor(qualityScore)} border-2`} aria-label={`Score de qualidade: ${qualityScore} (${qualityLevel})`}>
      <div className="text-center space-y-4">
        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">Score de Qualidade</p>
          <div className="relative inline-block">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-surface-border"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(qualityScore / 100) * 352} 352`}
                  className={getScoreColor(qualityScore)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(qualityScore)}`}>
                  {qualityScore}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getLevelBadgeColor(qualityLevel)}`}>
            {qualityLevel}
          </span>
        </div>
      </div>
    </Card>
  );
});

QualityScoreCard.displayName = 'QualityScoreCard';


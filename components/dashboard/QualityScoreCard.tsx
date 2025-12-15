import React from 'react';
import { motion } from 'framer-motion';
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-base-content/70">Calculando score...</span>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const { qualityScore, qualityLevel } = analysis;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-warning';
    return 'text-error';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success/10 border-success/30';
    if (score >= 60) return 'bg-warning/10 border-warning/30';
    if (score >= 40) return 'bg-warning/5 border-warning/20';
    return 'bg-error/10 border-error/30';
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Excelente': return 'badge badge-success badge-outline';
      case 'Bom': return 'badge badge-info badge-outline';
      case 'Regular': return 'badge badge-warning badge-outline';
      case 'Ruim': return 'badge badge-warning badge-outline';
      case 'Crítico': return 'badge badge-error badge-outline';
      default: return 'badge badge-neutral badge-outline';
    }
  };

  const circumference = 2 * Math.PI * 56;
  const strokeDashoffset = circumference - (qualityScore / 100) * circumference;

  return (
    <Card 
      variant="elevated"
      className={`${getScoreBgColor(qualityScore)} border-2`} 
      aria-label={`Score de qualidade: ${qualityScore} (${qualityLevel})`}
    >
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="text-sm font-medium text-base-content/70 mb-2">Score de Qualidade</p>
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
                  className="text-base-300"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference}
                  className={getScoreColor(qualityScore)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              >
                <motion.span 
                  className={`text-3xl font-bold ${getScoreColor(qualityScore)}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {qualityScore}
                </motion.span>
              </motion.div>
            </div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <span className={`${getLevelBadgeColor(qualityLevel)}`}>
            {qualityLevel}
          </span>
        </motion.div>
      </motion.div>
    </Card>
  );
});

QualityScoreCard.displayName = 'QualityScoreCard';


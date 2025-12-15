import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../common/Card';
import { DashboardInsightsAnalysis } from '../../types';
import { CheckCircle2, Activity, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface QualityScoreCardProps {
  analysis: DashboardInsightsAnalysis | null;
  isLoading?: boolean;
}

type StatusLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  textColor: string;
  ringColor: string;
  bgGradient: string;
  borderColor: string;
  badgeClass: string;
}

const STATUS_CONFIG: Record<StatusLevel, StatusConfig> = {
  excellent: {
    label: 'Excelente',
    icon: CheckCircle2,
    textColor: 'text-success',
    ringColor: 'stroke-success',
    bgGradient: 'from-success/25 via-success/15 to-success/8',
    borderColor: 'border-success/50',
    badgeClass: 'badge-success',
  },
  good: {
    label: 'Bom',
    icon: Activity,
    textColor: 'text-info',
    ringColor: 'stroke-info',
    bgGradient: 'from-info/25 via-info/15 to-info/8',
    borderColor: 'border-info/50',
    badgeClass: 'badge-info',
  },
  fair: {
    label: 'Regular',
    icon: AlertCircle,
    textColor: 'text-warning-content',
    ringColor: 'stroke-warning-content',
    bgGradient: 'from-warning-content/30 via-warning-content/20 to-warning-content/10',
    borderColor: 'border-warning-content/60',
    badgeClass: 'badge-warning',
  },
  poor: {
    label: 'Ruim',
    icon: AlertTriangle,
    textColor: 'text-warning-content',
    ringColor: 'stroke-warning-content',
    bgGradient: 'from-warning-content/40 via-warning-content/25 to-warning-content/15',
    borderColor: 'border-warning-content/70',
    badgeClass: 'badge-warning',
  },
  critical: {
    label: 'Crítico',
    icon: XCircle,
    textColor: 'text-error',
    ringColor: 'stroke-error',
    bgGradient: 'from-error/35 via-error/20 to-error/12',
    borderColor: 'border-error/60',
    badgeClass: 'badge-error',
  },
};

/**
 * Determina o nível de status baseado no score
 */
function getStatusLevel(score: number): StatusLevel {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'poor';
  return 'critical';
}

/**
 * Card de score de qualidade geral com design moderno e melhor contraste
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
  const statusLevel = getStatusLevel(qualityScore);
  const config = STATUS_CONFIG[statusLevel];
  const Icon = config.icon;

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (qualityScore / 100) * circumference;

  return (
    <Card
      variant="elevated"
      className={cn(
        'relative overflow-hidden border-2',
        config.borderColor,
        'bg-gradient-to-br',
        config.bgGradient
      )}
      aria-label={`Score de qualidade: ${qualityScore} de 100 (${qualityLevel})`}
    >
      <motion.div
        className="relative p-6 md:p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header com título e badge de status */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-base-content uppercase tracking-wider">
            Score de Qualidade
          </h3>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full',
              'bg-base-100 border-2',
              config.borderColor,
              'shadow-md'
            )}
          >
            <Icon className={cn('h-4 w-4', config.textColor)} aria-hidden="true" />
            <span className={cn('text-sm font-semibold', config.textColor)}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="relative flex items-center justify-center my-6">
          <svg
            className="transform -rotate-90 w-40 h-40 md:w-48 md:h-48"
            aria-label={`Score de qualidade: ${qualityScore} de 100`}
            role="img"
          >
            {/* Background circle */}
            <circle
              cx="50%"
              cy="50%"
              r="60"
              className="stroke-base-300/50"
              strokeWidth="10"
              fill="none"
            />

            {/* Progress circle com glow effect */}
            <motion.circle
              cx="50%"
              cy="50%"
              r="60"
              className={cn(
                config.ringColor,
                'drop-shadow-[0_0_8px_currentColor]'
              )}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute flex flex-col items-center justify-center">
            <motion.div
              className={cn(
                'text-5xl md:text-6xl font-bold tabular-nums tracking-tight',
                'text-base-content'
              )}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            >
              {qualityScore}
            </motion.div>
            <motion.div
              className="text-sm text-base-content/80 font-medium mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              de 100
            </motion.div>
          </div>
        </div>

        {/* Barra de progresso horizontal */}
        <div className="w-full mt-6">
          <div className="relative h-2.5 bg-base-300/50 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full transition-all duration-1000 ease-out',
                config.ringColor.replace('stroke-', 'bg-'),
                'shadow-[0_0_8px_currentColor]'
              )}
              style={{ width: `${qualityScore}%` }}
              role="progressbar"
              aria-valuenow={qualityScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso: ${qualityScore}%`}
              initial={{ width: 0 }}
              animate={{ width: `${qualityScore}%` }}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Score labels */}
          <div className="flex justify-between mt-2 px-1">
            <span className="text-xs text-base-content/70 font-medium">0</span>
            <span className="text-xs text-base-content/70 font-medium">100</span>
          </div>
        </div>
      </motion.div>
    </Card>
  );
});

QualityScoreCard.displayName = 'QualityScoreCard';


import React from 'react';
import { StatCard } from './StatCard';

interface SuccessRateCardProps {
  passRate: number;
  trend?: 'up' | 'down' | 'stable' | null;
  previousRate?: number;
}

/**
 * Card de taxa de sucesso dos testes com indicador de tendência
 */
export const SuccessRateCard: React.FC<SuccessRateCardProps> = React.memo(({
  passRate,
  trend,
  previousRate,
}) => {
  const getTrendInfo = () => {
    if (!trend || trend === 'stable' || previousRate === undefined) {
      return null;
    }

    const diff = passRate - previousRate;
    const absDiff = Math.abs(diff);
    
    return {
      value: absDiff,
      isPositive: trend === 'up',
      label: trend === 'up' ? 'Aumentou' : 'Diminuiu',
    };
  };

  const trendInfo = getTrendInfo();
  const statusColor = passRate >= 80 ? 'text-emerald-600' : passRate >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <StatCard
      title="Taxa de Sucesso"
      value={`${passRate}%`}
      description={`${passRate}% dos testes executados foram aprovados`}
      statusColor={statusColor}
      trend={trendInfo ? (trendInfo.isPositive ? trendInfo.value : -trendInfo.value) : undefined}
      trendLabel={trendInfo ? `${trendInfo.label} em relação ao período anterior` : undefined}
      accent={passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'danger'}
      aria-label={`Taxa de sucesso dos testes: ${passRate}%${trendInfo ? `, ${trendInfo.label} ${trendInfo.value}%` : ''}`}
    />
  );
});

SuccessRateCard.displayName = 'SuccessRateCard';


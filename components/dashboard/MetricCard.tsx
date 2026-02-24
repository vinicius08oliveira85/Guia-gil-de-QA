import React from 'react';
import { Card } from '../common/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Props do componente MetricCard
 */
interface MetricCardProps {
  /** Título da métrica */
  title: string;
  /** Valor principal a ser exibido */
  value: string | number;
  /** Mudança percentual ou absoluta */
  change?: string;
  /** Tendência da métrica */
  trend?: 'up' | 'down' | 'neutral';
  /** Ícone a ser exibido */
  icon: LucideIcon;
  /** Descrição adicional */
  description?: string;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Card de métrica com ícone, valor, tendência e descrição
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Total Tasks"
 *   value="248"
 *   change="+12%"
 *   trend="up"
 *   icon={ListChecks}
 *   description="Active project tasks"
 * />
 * ```
 */
export const MetricCard = React.memo<MetricCardProps>(
  ({ title, value, change, trend = 'neutral', icon: Icon, description, className }) => {
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

    const trendColor =
      trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-base-content/60';

    return (
      <Card className={cn('p-6', className)} hoverable>
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          {change && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
              <TrendIcon className="h-3 w-3" aria-hidden="true" />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-base-content">{value}</p>
          <p className="text-sm font-medium text-base-content">{title}</p>
          {description && <p className="text-xs text-base-content/70">{description}</p>}
        </div>
      </Card>
    );
  }
);

MetricCard.displayName = 'MetricCard';

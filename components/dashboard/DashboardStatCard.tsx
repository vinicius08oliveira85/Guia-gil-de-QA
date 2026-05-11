import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card } from '../common/Card';

export type TrendType = 'up' | 'down' | 'neutral';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  /** Variação percentual em relação ao período anterior; omitido quando não há dados de tendência */
  changePercent?: string;
  trend?: TrendType;
  icon: LucideIcon;
  className?: string;
  /** Callback ao clicar no card; quando definido, o card fica clicável com feedback visual */
  onClick?: () => void;
}

/**
 * Card de estatística do dashboard (grid superior): ícone, valor, variação % e label.
 * Layout horizontal alinhado ao design de referência.
 */
export const DashboardStatCard = React.memo<DashboardStatCardProps>(
  ({ title, value, changePercent, trend = 'neutral', icon: Icon, className, onClick }) => {
    const changeColor =
      trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-base-content/60';

    const isClickable = !!onClick;

    const handleClick = () => {
      onClick?.();
    };

    return (
      <Card
        hoverable={isClickable}
        variant="default"
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={isClickable ? handleClick : undefined}
        onKeyDown={
          isClickable
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick();
                }
              }
            : undefined
        }
        className={cn(
          'p-4 sm:p-5',
          isClickable &&
            'cursor-pointer hover:scale-[1.02] hover:ring-2 hover:ring-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/35 motion-reduce:transition-none motion-reduce:hover:scale-100',
          className
        )}
      >
        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5 text-xl" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-xl font-bold tabular-nums text-base-content">
                {value}
              </span>
              {changePercent != null && (
                <span className={cn('text-[10px] font-medium', changeColor)}>{changePercent}</span>
              )}
            </div>
            <p className="text-xs text-base-content/70">{title}</p>
          </div>
        </div>
      </Card>
    );
  }
);

DashboardStatCard.displayName = 'DashboardStatCard';

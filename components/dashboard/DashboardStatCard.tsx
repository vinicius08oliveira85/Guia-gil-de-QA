import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

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
      <div
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
          'bg-base-100 px-5 py-4 rounded-xl shadow-sm border border-base-300 flex items-center gap-4',
          isClickable &&
            'cursor-pointer hover:ring-2 hover:ring-primary/20 hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30',
          className
        )}
      >
        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
          <Icon className="text-xl w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-base-content">{value}</span>
            {changePercent != null && (
              <span className={cn('text-[10px] font-medium', changeColor)}>{changePercent}</span>
            )}
          </div>
          <p className="text-base-content/70 text-xs">{title}</p>
        </div>
      </div>
    );
  }
);

DashboardStatCard.displayName = 'DashboardStatCard';

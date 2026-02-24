import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export type TrendType = 'up' | 'down' | 'neutral';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  changePercent?: string;
  trend?: TrendType;
  icon: LucideIcon;
  className?: string;
}

/**
 * Card de estatística do dashboard (grid superior): ícone, valor, variação % e label.
 * Layout horizontal alinhado ao design de referência.
 */
export const DashboardStatCard = React.memo<DashboardStatCardProps>(
  ({ title, value, changePercent, trend = 'neutral', icon: Icon, className }) => {
    const changeColor =
      trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-base-content/60';

    return (
      <div
        className={cn(
          'bg-base-100 px-5 py-4 rounded-xl shadow-sm border border-base-300 flex items-center gap-4',
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

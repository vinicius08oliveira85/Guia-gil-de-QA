import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export type TrendType = 'up' | 'down' | 'neutral';
export type DashboardStatTone = 'info' | 'success' | 'warning' | 'accent';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  changePercent?: string;
  trend?: TrendType;
  icon: LucideIcon;
  tone?: DashboardStatTone;
  className?: string;
  onClick?: () => void;
}

const TONE_STYLES: Record<
  DashboardStatTone,
  { card: string; iconWrap: string }
> = {
  info: {
    card: 'border-info/25 bg-info/[0.07]',
    iconWrap: 'bg-info/15 text-info ring-info/20',
  },
  success: {
    card: 'border-success/25 bg-success/[0.08]',
    iconWrap: 'bg-success/15 text-success ring-success/20',
  },
  warning: {
    card: 'border-error/30 bg-error/[0.06]',
    iconWrap: 'bg-error/15 text-error ring-error/20',
  },
  accent: {
    card:
      'border-[color-mix(in_srgb,var(--brand-highlight)_28%,transparent)] bg-[color-mix(in_srgb,var(--brand-highlight)_7%,transparent)]',
    iconWrap:
      'bg-[color-mix(in_srgb,var(--brand-highlight)_12%,transparent)] text-[var(--brand-highlight)] ring-[color-mix(in_srgb,var(--brand-highlight)_18%,transparent)]',
  },
};

/**
 * Card de KPI do dashboard — ícone em destaque, valor e rótulo (referência visual do produto).
 */
export const DashboardStatCard = React.memo<DashboardStatCardProps>(
  ({
    title,
    value,
    changePercent,
    trend = 'neutral',
    icon: Icon,
    tone = 'info',
    className,
    onClick,
  }) => {
    const changeColor =
      trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-base-content/60';

    const isClickable = !!onClick;
    const toneStyle = TONE_STYLES[tone];

    const handleClick = () => onClick?.();

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
          'flex items-center gap-3 rounded-[var(--rounded-box)] border p-3 soft-shadow sm:gap-4 sm:p-4',
          toneStyle.card,
          isClickable &&
            'cursor-pointer transition-[box-shadow,transform] hover:shadow-md hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] motion-reduce:hover:translate-y-0',
          className
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-11 sm:w-11',
            toneStyle.iconWrap
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="font-heading text-xl font-bold tabular-nums text-base-content sm:text-2xl">
              {value}
            </span>
            {changePercent != null && (
              <span className={cn('text-[10px] font-medium', changeColor)}>{changePercent}</span>
            )}
          </div>
          <p className="text-xs font-medium text-base-content/70 sm:text-sm">{title}</p>
        </div>
      </div>
    );
  }
);

DashboardStatCard.displayName = 'DashboardStatCard';

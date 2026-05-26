import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { dashboardKpiCardBaseClass } from '../common/projectCardUi';

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

const TONE_STYLES: Record<DashboardStatTone, { card: string; iconWrap: string }> = {
  info: {
    card: 'border-[color-mix(in_srgb,var(--brand-highlight)_22%,transparent)] bg-[color-mix(in_srgb,var(--brand-highlight)_7%,var(--leve-neu-bg))]',
    iconWrap:
      'bg-[color-mix(in_srgb,var(--brand-highlight)_14%,transparent)] text-[var(--brand-highlight)] ring-[color-mix(in_srgb,var(--brand-highlight)_20%,transparent)]',
  },
  success: {
    card: 'border-[color-mix(in_srgb,#10b981_22%,transparent)] bg-[color-mix(in_srgb,#10b981_8%,var(--leve-neu-bg))]',
    iconWrap: 'bg-[color-mix(in_srgb,#10b981_16%,transparent)] text-success ring-success/20',
  },
  warning: {
    card: 'border-[color-mix(in_srgb,#ef4444_20%,transparent)] bg-[color-mix(in_srgb,#ef4444_6%,var(--leve-neu-bg))]',
    iconWrap: 'bg-error/12 text-error ring-error/20',
  },
  accent: {
    card: 'border-[color-mix(in_srgb,var(--brand-cta)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-cta)_8%,var(--leve-neu-bg))]',
    iconWrap:
      'bg-[color-mix(in_srgb,var(--brand-cta)_14%,transparent)] text-[var(--brand-cta)] ring-[color-mix(in_srgb,var(--brand-cta)_22%,transparent)]',
  },
};

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
      trend === 'up'
        ? 'text-success'
        : trend === 'down'
          ? 'text-error'
          : 'text-[var(--leve-header-text-muted)]';

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
          dashboardKpiCardBaseClass,
          toneStyle.card,
          isClickable &&
            'cursor-pointer hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand-cta)_32%,transparent)] hover:shadow-[var(--leve-neu-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] motion-reduce:hover:translate-y-0',
          className
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-10 sm:w-10',
            toneStyle.iconWrap
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--leve-header-text-muted)] sm:text-[11px]">
            {title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="font-heading text-xl font-bold tabular-nums text-[var(--leve-header-text)] sm:text-2xl">
              {value}
            </span>
            {changePercent != null && (
              <span className={cn('text-[10px] font-medium', changeColor)}>{changePercent}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

DashboardStatCard.displayName = 'DashboardStatCard';

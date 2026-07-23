import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Tooltip } from '../../common/Tooltip';
import { cn } from '../../../utils/cn';
import {
  projectDashboardInsightCardClass,
  projectDashboardInsightHeaderClass,
  projectDashboardInsightSubtitleClass,
  projectDashboardInsightTitleClass,
} from '../../common/projectCardUi';
import { TONE_ACCENT, type InsightTone } from './insightTokens';

export interface InsightMetricCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: InsightTone;
  /** Índice para animação staggered (0-based). */
  index?: number;
}

/**
 * Card bento moderno com placa de ícone, accent semântico e entrada staggered.
 */
export const InsightMetricCard = React.memo(function InsightMetricCard({
  title,
  subtitle,
  children,
  className,
  hint,
  icon: Icon,
  tone = 'brand',
  index = 0,
}: InsightMetricCardProps) {
  const accent = TONE_ACCENT[tone];

  const card = (
    <article
      className={cn(
        projectDashboardInsightCardClass,
        'dashboard-insight-bento-card dashboard-insight-bento-card--modern',
        className
      )}
      style={
        {
          '--insight-card-accent': accent,
          animationDelay: `${Math.min(index, 10) * 45}ms`,
        } as React.CSSProperties
      }
    >
      <div
        className="dashboard-insight-accent-rail pointer-events-none absolute inset-y-3 left-0 w-1 rounded-full opacity-90"
        style={{ background: accent }}
        aria-hidden
      />
      <header className={cn(projectDashboardInsightHeaderClass, 'pl-1')}>
        <div className="flex items-start gap-2.5">
          {Icon ? (
            <span
              className="dashboard-insight-icon-plate flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={
                {
                  color: accent,
                  background: `color-mix(in srgb, ${accent} 14%, transparent)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 22%, transparent)`,
                } as React.CSSProperties
              }
              aria-hidden
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
          ) : null}
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className={projectDashboardInsightTitleClass}>{title}</h3>
            {subtitle ? <p className={projectDashboardInsightSubtitleClass}>{subtitle}</p> : null}
          </div>
        </div>
      </header>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col pl-1">{children}</div>
    </article>
  );

  if (!hint) return card;

  return (
    <Tooltip content={hint} delay={220} position="top" triggerClassName="block w-full min-w-0">
      <div className="block h-full w-full cursor-default">{card}</div>
    </Tooltip>
  );
});

InsightMetricCard.displayName = 'InsightMetricCard';

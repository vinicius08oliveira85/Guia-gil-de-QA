import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';
import type { JiraFilasFilter } from '../../utils/jiraFilasMetrics';

export interface JiraFilasDistributionSegment {
  key: string;
  label: string;
  value: number;
  /** Classe de cor de fundo (ex.: 'bg-success'). */
  colorClass: string;
  filter?: JiraFilasFilter;
}

export interface JiraFilasDistributionBarProps {
  segments: JiraFilasDistributionSegment[];
  total: number;
  ariaLabel: string;
  onApplyFilter?: (filter: JiraFilasFilter) => void;
  className?: string;
}

const formatPercent = (value: number): string =>
  `${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;

/**
 * Barra horizontal de proporção (modelo TaskStatusDistributionBar), adaptada à
 * identidade clara das Filas (Jira). Cada segmento é clicável para filtrar a lista.
 */
export const JiraFilasDistributionBar: React.FC<JiraFilasDistributionBarProps> = ({
  segments,
  total,
  ariaLabel,
  onApplyFilter,
  className,
}) => {
  const computed = useMemo(
    () =>
      segments.map(segment => ({
        ...segment,
        pct: total > 0 ? (segment.value / total) * 100 : 0,
      })),
    [segments, total]
  );

  return (
    <div className={cn('space-y-2.5', className)}>
      <div
        className={cn(
          'flex h-3 w-full overflow-hidden rounded-full',
          'bg-[color-mix(in_srgb,var(--brand-text-muted)_18%,transparent)]',
          'ring-1 ring-[color-mix(in_srgb,var(--brand-surface-border)_70%,transparent)]'
        )}
        role="img"
        aria-label={ariaLabel}
      >
        {total === 0 ? (
          <div className="h-full w-full bg-[color-mix(in_srgb,var(--brand-text-muted)_20%,transparent)]" />
        ) : (
          computed.map(segment =>
            segment.pct > 0 ? (
              <div
                key={segment.key}
                className={cn('h-full transition-[width] duration-500', segment.colorClass)}
                style={{ width: `${segment.pct}%` }}
                title={`${segment.label}: ${formatPercent(segment.pct)}`}
              />
            ) : null
          )
        )}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 font-sans text-[11px] sm:text-xs">
        {computed.map(segment => {
          const content = (
            <>
              <span
                className={cn('h-2.5 w-2.5 shrink-0 rounded-full', segment.colorClass)}
                aria-hidden
              />
              <span className="text-[var(--brand-text-muted)]">{segment.label}</span>
              <strong className="font-semibold tabular-nums text-[var(--brand-text-strong)]">
                {segment.value.toLocaleString('pt-BR')}
              </strong>
              <span className="tabular-nums text-[var(--brand-text-muted)]">
                ({formatPercent(segment.pct)})
              </span>
            </>
          );

          if (onApplyFilter && segment.filter) {
            return (
              <li key={segment.key}>
                <button
                  type="button"
                  onClick={() => onApplyFilter(segment.filter!)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 transition-colors',
                    'hover:bg-[color-mix(in_srgb,var(--project-card-accent)_10%,transparent)]',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
                    'focus-visible:outline-[var(--project-card-accent)]'
                  )}
                  title={`${segment.label}: filtrar lista`}
                >
                  {content}
                </button>
              </li>
            );
          }

          return (
            <li key={segment.key} className="inline-flex items-center gap-1.5 px-1.5 py-0.5">
              {content}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

JiraFilasDistributionBar.displayName = 'JiraFilasDistributionBar';

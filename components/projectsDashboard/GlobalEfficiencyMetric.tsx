import React from 'react';
import { cn } from '../../utils/cn';

export interface GlobalEfficiencyMetricProps {
  percent: number;
  executedCount?: number;
  totalCount?: number;
  className?: string;
}

/**
 * Indicador de eficiência global com barra em gradiente laranja → verde (referência do dashboard).
 */
export const GlobalEfficiencyMetric: React.FC<GlobalEfficiencyMetricProps> = ({
  percent,
  executedCount,
  totalCount,
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div
      className={cn(
        'flex min-w-[10.5rem] flex-col justify-center gap-1.5 rounded-[var(--rounded-box)] border border-base-300/60 bg-base-100/90 px-3 py-2.5 soft-shadow sm:min-w-[12rem] sm:px-4 sm:py-3',
        className
      )}
      role="group"
      aria-label={`Eficiência global de execução: ${clamped}%`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/70 sm:text-[11px]">
          Eficiência global
        </span>
        <strong className="text-lg font-bold tabular-nums text-base-content sm:text-xl">
          {clamped}%
        </strong>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-base-200 ring-1 ring-base-300/50"
        aria-hidden
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${clamped}%`,
            background:
              'linear-gradient(90deg, var(--brand-cta) 0%, color-mix(in srgb, var(--brand-cta) 35%, #22c55e) 55%, #22c55e 100%)',
          }}
        />
      </div>
      {totalCount != null && totalCount > 0 && executedCount != null && (
        <p className="text-[10px] leading-tight text-base-content/60 sm:text-[11px]">
          {executedCount}/{totalCount} casos executados
        </p>
      )}
    </div>
  );
};

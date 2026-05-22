import React from 'react';
import { cn } from '../../utils/cn';
import { workspacePanelShellClass, workspaceStatLabelClass, workspaceStatValueClass } from '../common/projectCardUi';

export interface GlobalEfficiencyMetricProps {
  percent: number;
  executedCount?: number;
  totalCount?: number;
  className?: string;
}

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
        workspacePanelShellClass,
        'flex min-h-[4rem] flex-col justify-center gap-1.5 px-3 py-2.5 sm:min-h-[4.25rem] sm:px-4 sm:py-3',
        className
      )}
      role="group"
      aria-label={`Eficiência global de execução: ${clamped}%`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={workspaceStatLabelClass}>Eficiência global</span>
        <strong className={cn(workspaceStatValueClass, 'text-[var(--brand-text-strong)]')}>{clamped}%</strong>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--brand-text-muted)_12%,transparent)] ring-1 ring-[var(--brand-surface-border)]"
        aria-hidden
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${clamped}%`,
            background:
              'linear-gradient(90deg, var(--brand-cta) 0%, color-mix(in srgb, var(--brand-cta) 40%, #22c55e) 50%, #22c55e 100%)',
          }}
        />
      </div>
      {totalCount != null && totalCount > 0 && executedCount != null && (
        <p className="text-[10px] leading-tight text-[var(--brand-text-muted)] sm:text-[11px]">
          {executedCount}/{totalCount} casos executados
        </p>
      )}
    </div>
  );
};

import React from 'react';
import { Gauge } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  formatWorkspaceStatCount,
  formatWorkspaceStatPercent,
  workspaceDaisyStatCardClass,
  workspaceDaisyStatLabelClass,
  workspaceDaisyStatValueClass,
} from '../common/projectCardUi';

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
      className={cn(workspaceDaisyStatCardClass, 'gap-2', className)}
      role="group"
      aria-label={`Eficiência global de execução: ${clamped}%`}
    >
      <div className="flex w-full items-center justify-center gap-1.5">
        <Gauge className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-accent)] sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
        <span className={workspaceDaisyStatLabelClass}>Eficiência global</span>
      </div>
      <strong className={workspaceDaisyStatValueClass}>{formatWorkspaceStatPercent(clamped)}</strong>
      <div
        className="h-1.5 w-full overflow-hidden rounded-[var(--workspace-panel-inner-radius)] bg-[color-mix(in_srgb,var(--workspace-stat-text)_12%,transparent)]"
        aria-hidden
      >
        <div
          className="h-full rounded-[var(--workspace-panel-inner-radius)] bg-[var(--workspace-stat-accent)] transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {totalCount != null && totalCount > 0 && executedCount != null && (
        <p className="font-sans text-[10px] leading-tight text-[var(--workspace-stat-text)] opacity-80 sm:text-[11px]">
          {formatWorkspaceStatCount(executedCount)}/{formatWorkspaceStatCount(totalCount)} casos executados
        </p>
      )}
    </div>
  );
};

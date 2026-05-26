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
  const knobLeft = `clamp(0px, calc(${clamped}% - 6px), calc(100% - 12px))`;

  return (
    <div
      className={cn(workspaceDaisyStatCardClass, 'gap-2', className)}
      role="group"
      aria-label={`Eficiência global de execução: ${clamped}%`}
    >
      <div className="flex w-full items-center justify-center gap-1.5">
        <Gauge
          className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-accent)] sm:h-4 sm:w-4"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className={workspaceDaisyStatLabelClass}>Eficiência global</span>
      </div>
      <strong className={workspaceDaisyStatValueClass}>{formatWorkspaceStatPercent(clamped)}</strong>
      <div className="workspace-stat-neu-track relative h-2 w-full" aria-hidden>
        <div
          className="workspace-stat-neu-fill absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
        {clamped > 0 ? (
          <span
            className="workspace-stat-neu-knob pointer-events-none absolute top-1/2 z-[1] h-3 w-3 -translate-y-1/2 rounded-full"
            style={{ left: knobLeft }}
          />
        ) : null}
      </div>
      {totalCount != null && totalCount > 0 && executedCount != null && (
        <p className="font-sans text-[10px] leading-tight text-[var(--workspace-stat-text)] opacity-80 sm:text-[11px]">
          {formatWorkspaceStatCount(executedCount)}/{formatWorkspaceStatCount(totalCount)} casos executados
        </p>
      )}
    </div>
  );
};

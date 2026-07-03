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
import { RadialProgress } from '../common/RadialProgress';

export interface GlobalEfficiencyMetricProps {
  percent: number;
  executedCount?: number;
  totalCount?: number;
  className?: string;
  onClick?: () => void;
}

export const GlobalEfficiencyMetric: React.FC<GlobalEfficiencyMetricProps> = ({
  percent,
  executedCount,
  totalCount,
  className,
  onClick,
}) => {
  const clamped = Math.min(100, Math.max(0, percent));
  const label = `Eficiência global de execução: ${clamped}%`;
  const title =
    'Percentual de casos de teste já executados no workspace. Clique para ver projetos com alertas de execução.';

  const body = (
    <>
      <div className="flex w-full items-center justify-center gap-1.5">
        <Gauge
          className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-accent)] sm:h-4 sm:w-4"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className={workspaceDaisyStatLabelClass}>Eficiência global</span>
      </div>
      <RadialProgress value={clamped} size={64} strokeWidth={6} ariaLabel="Eficiência global">
        <strong className={cn(workspaceDaisyStatValueClass, 'text-sm sm:text-base')}>
          {formatWorkspaceStatPercent(clamped)}
        </strong>
      </RadialProgress>
      {totalCount != null && totalCount > 0 && executedCount != null && (
        <p className="font-sans text-[10px] leading-tight text-[var(--workspace-stat-text)] opacity-80 sm:text-[11px]">
          {formatWorkspaceStatCount(executedCount)}/{formatWorkspaceStatCount(totalCount)} casos
          executados
        </p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cn(
          workspaceDaisyStatCardClass,
          'gap-2 cursor-pointer transition-[transform,box-shadow] hover:-translate-y-0.5',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-stat-accent)]',
          'motion-reduce:transform-none',
          className
        )}
        onClick={onClick}
        title={title}
        aria-label={title}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={cn(workspaceDaisyStatCardClass, 'gap-2', className)} role="group" aria-label={label}>
      {body}
    </div>
  );
};

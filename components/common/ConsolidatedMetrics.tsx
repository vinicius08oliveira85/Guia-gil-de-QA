import React, { useMemo } from 'react';
import { Project } from '../../types';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { BarChart3, ClipboardCheck, ListChecks, Bug } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ConsolidatedMetricsProps {
  projects: Project[];
  className?: string;
  variant?: 'embedded' | 'standalone';
}

/**
 * Métricas agregadas: testes executados, tarefas totais, bugs ativos.
 */
export const ConsolidatedMetrics = React.memo<ConsolidatedMetricsProps>(
  ({ projects, className, variant = 'standalone' }) => {
    const consolidated = useMemo(() => {
      return projects.reduce(
        (acc, p) => {
          const metrics = calculateProjectMetrics(p);
          return {
            totalTestsExecuted: acc.totalTestsExecuted + metrics.executedTestCases,
            totalTasks: acc.totalTasks + (p.tasks?.length ?? 0),
            openBugs: acc.openBugs + metrics.openVsClosedBugs.open,
          };
        },
        { totalTestsExecuted: 0, totalTasks: 0, openBugs: 0 }
      );
    }, [projects]);

    const embedded = variant === 'embedded';

    const cell =
      'group flex min-h-0 flex-row items-center gap-2.5 rounded-lg border p-2 transition-[box-shadow,border-color] duration-200 hover:shadow-sm sm:gap-2.5 sm:p-2.5';

    const iconWrap = (color: string) =>
      cn(
        'flex shrink-0 items-center justify-center rounded-lg',
        embedded ? 'h-9 w-9' : 'h-10 w-10 sm:h-11 sm:w-11',
        color
      );

    const valueCls = embedded ? 'text-lg font-bold' : 'text-xl font-bold sm:text-2xl';

    return (
      <section
        className={cn(
          embedded ? 'relative z-[1]' : 'mb-6 rounded-2xl border border-base-300/70 bg-base-100 p-4 shadow-sm sm:p-5',
          className
        )}
        aria-labelledby="consolidated-metrics-heading"
      >
        <div className={cn('mb-2.5 flex items-center gap-2', embedded && 'mb-3')}>
          <BarChart3
            className={cn('shrink-0 text-primary', embedded ? 'h-4 w-4' : 'h-5 w-5')}
            aria-hidden="true"
          />
          <h2
            id="consolidated-metrics-heading"
            className="text-xs font-bold uppercase tracking-wider text-base-content/82"
          >
            {embedded ? 'Métricas globais' : 'Consolidado de métricas'}
          </h2>
        </div>
        <div
          className={cn(
            'flex flex-col gap-2',
            !embedded && 'grid grid-cols-1 sm:grid-cols-3 md:gap-3'
          )}
        >
          <div
            className={cn(cell, 'border-success/20 bg-success/[0.06] hover:border-success/35')}
            role="group"
            aria-label={`Testes totais executados: ${consolidated.totalTestsExecuted}`}
          >
            <div className={iconWrap('bg-success/15 text-success')}>
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-base-content/70">
                Testes totais
              </p>
              <p className={cn('tabular-nums text-base-content', valueCls)}>
                {consolidated.totalTestsExecuted}
              </p>
              {!embedded && (
                <p className="text-[11px] leading-snug text-base-content/72 sm:text-xs">
                  Executados em todos os projetos
                </p>
              )}
            </div>
          </div>
          <div
            className={cn(cell, 'border-info/25 bg-info/[0.06] hover:border-info/40')}
            role="group"
            aria-label={`Tarefas totais mapeadas: ${consolidated.totalTasks}`}
          >
            <div className={iconWrap('bg-info/15 text-info')}>
              <ListChecks className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-base-content/70">
                Tarefas totais
              </p>
              <p className={cn('tabular-nums text-base-content', valueCls)}>
                {consolidated.totalTasks}
              </p>
              {!embedded && (
                <p className="text-[11px] leading-snug text-base-content/72 sm:text-xs">
                  Mapeadas globalmente
                </p>
              )}
            </div>
          </div>
          <div
            className={cn(
              cell,
              'border-[color-mix(in_srgb,var(--brand-cta)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-cta)_6%,transparent)]'
            )}
            role="group"
            aria-label={`Bugs ativos aguardando correção: ${consolidated.openBugs}`}
          >
            <div className={iconWrap('bg-[color-mix(in_srgb,var(--brand-cta)_12%,transparent)] text-[var(--brand-cta)]')}>
              <Bug className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-base-content/70">
                Bugs ativos
              </p>
              <p className={cn('tabular-nums text-base-content', valueCls)}>
                {consolidated.openBugs}
              </p>
              {!embedded && (
                <p className="text-[11px] leading-snug text-base-content/72 sm:text-xs">
                  Aguardando correção
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }
);

ConsolidatedMetrics.displayName = 'ConsolidatedMetrics';

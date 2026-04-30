import React, { useMemo } from 'react';
import { Project } from '../../types';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { BarChart3, ClipboardCheck, ListChecks, Bug } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ConsolidatedMetricsProps {
  projects: Project[];
  className?: string;
  /**
   * `embedded`: dentro do painel do workspace — divisor superior, células compactas (bento).
   * `standalone`: cartão próprio (legado / telas isoladas).
   */
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
      'group flex min-h-0 flex-row items-center gap-2.5 rounded-xl border p-2.5 shadow-sm ring-1 ring-base-content/[0.02] transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-px hover:shadow-md motion-reduce:transform-none sm:gap-3 sm:p-3';

    return (
      <section
        className={cn(
          embedded
            ? 'relative z-[1] mt-2 border-t border-base-300/55 pt-3'
            : 'mb-6 rounded-2xl border border-base-300/70 bg-base-100 p-4 shadow-sm sm:p-5',
          className
        )}
        aria-labelledby="consolidated-metrics-heading"
      >
        <div className={cn('mb-2 flex items-center gap-2', embedded && 'mb-2.5')}>
          <BarChart3
            className={cn('shrink-0 text-primary', embedded ? 'h-4 w-4' : 'h-5 w-5')}
            aria-hidden="true"
          />
          <h2
            id="consolidated-metrics-heading"
            className="text-xs font-bold uppercase tracking-wider text-base-content/82"
          >
            Consolidado de métricas
          </h2>
        </div>
        <div
          className={cn(
            'grid gap-2 sm:grid-cols-3 sm:gap-2.5',
            !embedded && 'grid-cols-1 md:gap-3'
          )}
        >
          <div
            className={cn(
              cell,
              'border-success/20 bg-success/[0.06] hover:border-success/35'
            )}
            role="group"
            aria-label={`Testes totais executados: ${consolidated.totalTestsExecuted}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success text-success-content shadow-sm ring-1 ring-success/20 sm:h-11 sm:w-11">
              <ClipboardCheck className="h-5 w-5 sm:h-5 sm:w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/78">
                Testes totais
              </p>
              <p className="text-xl font-bold tabular-nums tracking-tight text-base-content sm:text-2xl">
                {consolidated.totalTestsExecuted}
              </p>
              <p className="text-[11px] leading-snug text-base-content/72 sm:text-xs">
                Executados em todos os projetos
              </p>
            </div>
          </div>
          <div
            className={cn(
              cell,
              'border-secondary/25 bg-secondary/[0.07] hover:border-secondary/40'
            )}
            role="group"
            aria-label={`Tarefas totais mapeadas: ${consolidated.totalTasks}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-content shadow-sm ring-1 ring-secondary/20 sm:h-11 sm:w-11">
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/78">
                Tarefas totais
              </p>
              <p className="text-xl font-bold tabular-nums tracking-tight text-base-content sm:text-2xl">
                {consolidated.totalTasks}
              </p>
              <p className="text-[11px] leading-snug text-base-content/72 sm:text-xs">Mapeadas globalmente</p>
            </div>
          </div>
          <div
            className={cn(cell, 'border-primary/25 bg-primary/[0.06] hover:border-primary/40')}
            role="group"
            aria-label={`Bugs ativos aguardando correção: ${consolidated.openBugs}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-content shadow-sm ring-1 ring-primary/20 sm:h-11 sm:w-11">
              <Bug className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/78">Bugs ativos</p>
              <p className="text-xl font-bold tabular-nums tracking-tight text-base-content sm:text-2xl">
                {consolidated.openBugs}
              </p>
              <p className="text-[11px] leading-snug text-base-content/72 sm:text-xs">Aguardando correção</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

ConsolidatedMetrics.displayName = 'ConsolidatedMetrics';

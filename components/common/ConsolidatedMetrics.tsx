import React, { useMemo } from 'react';
import { Project } from '../../types';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { BarChart3, ClipboardCheck, ListChecks, Bug } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ConsolidatedMetricsProps {
  projects: Project[];
  className?: string;
}

/**
 * Seção "Consolidado de Métricas": Testes Totais (executados), Tarefas Totais, Bugs Ativos.
 * Valores agregados de todos os projetos.
 */
export const ConsolidatedMetrics = React.memo<ConsolidatedMetricsProps>(({ projects, className }) => {
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

  return (
    <section
      className={cn(
        'bg-base-100 rounded-3xl p-8 shadow-sm border border-base-300 mb-8',
        className
      )}
      aria-labelledby="consolidated-metrics-heading"
    >
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2
          id="consolidated-metrics-heading"
          className="text-sm font-bold text-base-content/60 uppercase tracking-widest"
        >
          Consolidado de Métricas
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          className="flex items-center gap-6 p-4 rounded-2xl bg-success/5 border border-success/10"
          role="group"
          aria-label={`Testes totais executados: ${consolidated.totalTestsExecuted}`}
        >
          <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center text-white flex-shrink-0">
            <ClipboardCheck className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-base-content/70 uppercase tracking-widest">Testes Totais</p>
            <p className="text-2xl font-bold tracking-tight text-base-content">{consolidated.totalTestsExecuted}</p>
            <p className="text-sm text-base-content/70">Executados em todos os projetos</p>
          </div>
        </div>
        <div
          className="flex items-center gap-6 p-4 rounded-2xl bg-secondary/5 border border-secondary/10"
          role="group"
          aria-label={`Tarefas totais mapeadas: ${consolidated.totalTasks}`}
        >
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-secondary-content flex-shrink-0">
            <ListChecks className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-base-content/70 uppercase tracking-widest">Tarefas Totais</p>
            <p className="text-2xl font-bold tracking-tight text-base-content">{consolidated.totalTasks}</p>
            <p className="text-sm text-base-content/70">Mapeadas globalmente</p>
          </div>
        </div>
        <div
          className="flex items-center gap-6 p-4 rounded-2xl bg-primary/5 border border-primary/10"
          role="group"
          aria-label={`Bugs ativos aguardando correção: ${consolidated.openBugs}`}
        >
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-content flex-shrink-0">
            <Bug className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-base-content/70 uppercase tracking-widest">Bugs Ativos</p>
            <p className="text-2xl font-bold tracking-tight text-base-content">{consolidated.openBugs}</p>
            <p className="text-sm text-base-content/70">Aguardando correção</p>
          </div>
        </div>
      </div>
    </section>
  );
});

ConsolidatedMetrics.displayName = 'ConsolidatedMetrics';

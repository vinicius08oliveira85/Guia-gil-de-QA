import React, { useMemo } from 'react';
import type { TaskWorkflowBuckets } from '../../utils/workspaceAnalytics';
import { cn } from '../../utils/cn';

export interface TaskStatusDistributionBarProps {
  buckets: TaskWorkflowBuckets;
  className?: string;
}

/**
 * Barra de progresso segmentada: To Do, Em progresso, Concluído (proporção ao total de tarefas).
 */
export const TaskStatusDistributionBar: React.FC<TaskStatusDistributionBarProps> = ({ buckets, className }) => {
  const segments = useMemo(() => {
    const { todo, inProgress, done, total } = buckets;
    if (total === 0) {
      return [{ key: 'empty', pct: 100, className: 'bg-base-300', label: 'Sem tarefas' }];
    }
    const pTodo = (todo / total) * 100;
    const pProg = (inProgress / total) * 100;
    const pDone = (done / total) * 100;
    return [
      { key: 'todo', pct: pTodo, className: 'bg-base-content/25', label: 'A fazer' },
      { key: 'prog', pct: pProg, className: 'bg-info', label: 'Em progresso' },
      { key: 'done', pct: pDone, className: 'bg-success', label: 'Concluído' },
    ];
  }, [buckets]);

  return (
    <section
      className={cn('rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm', className)}
      aria-labelledby="task-dist-heading"
    >
      <h2 id="task-dist-heading" className="text-sm font-semibold text-base-content mb-1">
        Status das tarefas (global)
      </h2>
      <p className="text-xs text-base-content/60 mb-3">
        Distribuição por status interno: To Do, In Progress / Blocked e Done.
      </p>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-base-200"
        role="img"
        aria-label={`Tarefas: ${buckets.todo} a fazer, ${buckets.inProgress} em progresso, ${buckets.done} concluídas, de ${buckets.total} no total`}
      >
        {segments.map((s) =>
          s.pct > 0 ? (
            <div
              key={s.key}
              className={cn('h-full transition-all', s.className)}
              style={{ width: `${s.pct}%` }}
              title={`${s.label}: ${s.pct.toFixed(1)}%`}
            />
          ) : null
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/70">
        <li>
          <span className="inline-block h-2 w-2 rounded-full bg-base-content/25 align-middle mr-1" aria-hidden />
          A fazer: <strong className="text-base-content">{buckets.todo}</strong>
        </li>
        <li>
          <span className="inline-block h-2 w-2 rounded-full bg-info align-middle mr-1" aria-hidden />
          Em progresso: <strong className="text-base-content">{buckets.inProgress}</strong>
        </li>
        <li>
          <span className="inline-block h-2 w-2 rounded-full bg-success align-middle mr-1" aria-hidden />
          Concluído: <strong className="text-base-content">{buckets.done}</strong>
        </li>
        <li className="text-base-content/50">Total: {buckets.total}</li>
      </ul>
    </section>
  );
};

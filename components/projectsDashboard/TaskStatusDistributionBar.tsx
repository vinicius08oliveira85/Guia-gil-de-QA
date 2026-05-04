import React, { useMemo } from 'react';
import type { TaskWorkflowBuckets } from '../../utils/workspaceAnalytics';
import { cn } from '../../utils/cn';

export interface TaskStatusDistributionBarProps {
  buckets: TaskWorkflowBuckets;
  className?: string;
}

/**
 * Barra segmentada global (To Do / Em progresso / Concluído) com legenda legível.
 */
export const TaskStatusDistributionBar: React.FC<TaskStatusDistributionBarProps> = ({
  buckets,
  className,
}) => {
  const segments = useMemo(() => {
    const { todo, inProgress, done, total } = buckets;
    if (total === 0) {
      return [{ key: 'empty', pct: 100, className: 'bg-base-300', label: 'Sem tarefas' }];
    }
    const pTodo = (todo / total) * 100;
    const pProg = (inProgress / total) * 100;
    const pDone = (done / total) * 100;
    return [
      { key: 'todo', pct: pTodo, className: 'bg-base-content/28', label: 'A fazer' },
      { key: 'prog', pct: pProg, className: 'bg-info', label: 'Em progresso' },
      { key: 'done', pct: pDone, className: 'bg-success', label: 'Concluído' },
    ];
  }, [buckets]);

  return (
    <section
      className={cn(
        'flex h-full min-h-0 flex-col rounded-xl border border-base-300/65 bg-base-100/85 p-3 shadow-sm ring-1 ring-base-content/[0.02] sm:p-3.5',
        className
      )}
      aria-labelledby="task-dist-heading"
    >
      <h2
        id="task-dist-heading"
        className="text-xs font-bold uppercase tracking-wide text-base-content/85"
      >
        Status das tarefas (global)
      </h2>
      <p className="mt-0.5 text-xs leading-snug text-base-content/75">
        To Do, In Progress / Blocked e Done — proporção ao total.
      </p>
      <div
        className="mt-2.5 flex h-4 w-full shrink-0 overflow-hidden rounded-full bg-base-200 ring-1 ring-base-300/40"
        role="img"
        aria-label={`Tarefas: ${buckets.todo} a fazer, ${buckets.inProgress} em progresso, ${buckets.done} concluídas, de ${buckets.total} no total`}
      >
        {segments.map(s =>
          s.pct > 0 ? (
            <div
              key={s.key}
              className={cn(
                'h-full cursor-default transition-[filter] duration-150 hover:brightness-95',
                s.className
              )}
              style={{ width: `${s.pct}%` }}
              title={`${s.label}: ${s.pct.toFixed(1)}%`}
            />
          ) : null
        )}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-base-content/80 sm:gap-x-4">
        <li>
          <span
            className="mr-1 inline-block h-2 w-2 rounded-full bg-base-content/28 align-middle"
            aria-hidden
          />
          A fazer: <strong className="font-semibold text-base-content">{buckets.todo}</strong>
        </li>
        <li>
          <span
            className="mr-1 inline-block h-2 w-2 rounded-full bg-info align-middle"
            aria-hidden
          />
          Em progresso:{' '}
          <strong className="font-semibold text-base-content">{buckets.inProgress}</strong>
        </li>
        <li>
          <span
            className="mr-1 inline-block h-2 w-2 rounded-full bg-success align-middle"
            aria-hidden
          />
          Concluído: <strong className="font-semibold text-base-content">{buckets.done}</strong>
        </li>
        <li className="font-medium text-base-content/65">Total: {buckets.total}</li>
      </ul>
    </section>
  );
};

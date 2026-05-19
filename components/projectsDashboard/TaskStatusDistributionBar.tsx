import React, { useMemo } from 'react';
import type { TaskWorkflowBuckets } from '../../utils/workspaceAnalytics';
import { cn } from '../../utils/cn';

export interface TaskStatusDistributionBarProps {
  buckets: TaskWorkflowBuckets;
  className?: string;
  variant?: 'default' | 'embedded';
}

/**
 * Barra segmentada global (A fazer / Em prog. / Feito) com legenda.
 */
export const TaskStatusDistributionBar: React.FC<TaskStatusDistributionBarProps> = ({
  buckets,
  className,
  variant = 'default',
}) => {
  const embedded = variant === 'embedded';

  const segments = useMemo(() => {
    const { todo, inProgress, done, total } = buckets;
    if (total === 0) {
      return [{ key: 'empty', pct: 100, className: 'bg-base-300', label: 'Sem tarefas' }];
    }
    const pTodo = (todo / total) * 100;
    const pProg = (inProgress / total) * 100;
    const pDone = (done / total) * 100;
    return [
      {
        key: 'todo',
        pct: pTodo,
        className: 'bg-[var(--brand-cta)]',
        label: 'A fazer',
      },
      {
        key: 'prog',
        pct: pProg,
        className: 'bg-warning',
        label: 'Em prog.',
      },
      {
        key: 'done',
        pct: pDone,
        className: 'bg-success',
        label: 'Feito',
      },
    ];
  }, [buckets]);

  return (
    <section
      className={cn(
        embedded
          ? 'flex flex-col border-t border-base-300/50 pt-3'
          : 'flex h-full min-h-0 flex-col rounded-[var(--rounded-box)] border border-base-300/65 bg-base-100/85 p-3 soft-shadow ring-1 ring-base-content/[0.02] sm:p-3.5',
        className
      )}
      aria-labelledby="task-dist-heading"
    >
      <h2
        id="task-dist-heading"
        className="text-xs font-bold uppercase tracking-wide text-base-content/85"
      >
        Status das tarefas
      </h2>
      {!embedded && (
        <p className="mt-0.5 text-xs leading-snug text-base-content/75">
          To Do, In Progress / Blocked e Done — proporção ao total.
        </p>
      )}
      <div
        className="mt-2 flex h-3 w-full shrink-0 overflow-hidden rounded-full bg-base-200 ring-1 ring-base-300/40"
        role="img"
        aria-label={`Tarefas: ${buckets.todo} a fazer, ${buckets.inProgress} em progresso, ${buckets.done} concluídas, de ${buckets.total} no total`}
      >
        {segments.map(s =>
          s.pct > 0 ? (
            <div
              key={s.key}
              className={cn('h-full', s.className)}
              style={{ width: `${s.pct}%` }}
              title={`${s.label}: ${s.pct.toFixed(1)}%`}
            />
          ) : null
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-base-content/75 sm:text-xs">
        <li>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--brand-cta)] align-middle" aria-hidden />
          A fazer: <strong className="font-semibold text-base-content">{buckets.todo}</strong>
        </li>
        <li>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-warning align-middle" aria-hidden />
          Em prog.:{' '}
          <strong className="font-semibold text-base-content">{buckets.inProgress}</strong>
        </li>
        <li>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-success align-middle" aria-hidden />
          Feito: <strong className="font-semibold text-base-content">{buckets.done}</strong>
        </li>
        <li className="font-medium text-base-content/60">Total: {buckets.total}</li>
      </ul>
    </section>
  );
};

import React, { useMemo } from 'react';
import type { TaskWorkflowBuckets } from '../../utils/workspaceAnalytics';
import { cn } from '../../utils/cn';
import { workspacePanelSectionTitleClass } from '../common/projectCardUi';

export interface TaskStatusDistributionBarProps {
  buckets: TaskWorkflowBuckets;
  className?: string;
  variant?: 'default' | 'embedded';
}

export const TaskStatusDistributionBar: React.FC<TaskStatusDistributionBarProps> = ({
  buckets,
  className,
  variant = 'default',
}) => {
  const embedded = variant === 'embedded';

  const segments = useMemo(() => {
    const { todo, inProgress, done, total } = buckets;
    if (total === 0) {
      return [
        {
          key: 'empty',
          pct: 100,
          className: embedded
            ? 'bg-base-content/25'
            : 'bg-[color-mix(in_srgb,var(--brand-text-muted)_20%,transparent)]',
          label: 'Sem tarefas',
        },
      ];
    }
    const pTodo = (todo / total) * 100;
    const pProg = (inProgress / total) * 100;
    const pDone = (done / total) * 100;
    return [
      {
        key: 'todo',
        pct: pTodo,
        className: embedded ? 'bg-primary' : 'bg-[var(--brand-cta)]',
        label: 'A fazer',
      },
      {
        key: 'prog',
        pct: pProg,
        className: embedded
          ? 'bg-[color-mix(in_srgb,oklch(var(--p))_55%,#fbbf24)]'
          : 'bg-warning',
        label: 'Em prog.',
      },
      {
        key: 'done',
        pct: pDone,
        className: embedded
          ? 'bg-[color-mix(in_srgb,oklch(var(--bc))_40%,transparent)]'
          : 'bg-success',
        label: 'Feito',
      },
    ];
  }, [buckets, embedded]);

  return (
    <section
      className={cn(
        embedded
          ? 'flex flex-col border-t border-base-300/35 pt-4'
          : 'leve-neu-surface flex h-full min-h-0 flex-col p-3 sm:p-3.5',
        className
      )}
      aria-labelledby="task-dist-heading"
    >
      <h2 id="task-dist-heading" className={embedded ? workspacePanelSectionTitleClass : 'text-xs font-bold uppercase tracking-wide text-base-content/85'}>
        Status das tarefas
      </h2>
      {!embedded && (
        <p className="mt-0.5 text-xs leading-snug text-base-content/72">
          To Do, In Progress / Blocked e Done — proporção ao total.
        </p>
      )}
      <div
        className={cn(
          'mt-2.5 flex h-3 w-full shrink-0 overflow-hidden',
          embedded
            ? 'workspace-panel-neu-dist-track'
            : 'rounded-full bg-[color-mix(in_srgb,var(--leve-neu-dark)_12%,var(--leve-neu-bg))] ring-1 ring-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]'
        )}
        role="img"
        aria-label={`Tarefas: ${buckets.todo} a fazer, ${buckets.inProgress} em progresso, ${buckets.done} concluídas, de ${buckets.total} no total`}
      >
        {segments.map(s =>
          s.pct > 0 ? (
            <div key={s.key} className={cn('h-full transition-[width] duration-500', s.className)} style={{ width: `${s.pct}%` }} title={`${s.label}: ${s.pct.toFixed(1)}%`} />
          ) : null
        )}
      </div>
      <ul
        className={cn(
          'mt-3 flex flex-wrap gap-x-3 gap-y-1 font-sans text-[11px] text-base-content/72 sm:text-xs'
        )}
      >
        <li>
          <span
            className={cn(
              'mr-1 inline-block h-2 w-2 rounded-full align-middle',
              embedded ? 'bg-primary' : 'bg-[var(--brand-cta)]'
            )}
            aria-hidden
          />
          A fazer:{' '}
          <strong
            className={cn('font-semibold text-base-content')}
          >
            {buckets.todo}
          </strong>
        </li>
        <li>
          <span
            className={cn(
              'mr-1 inline-block h-2 w-2 rounded-full align-middle',
              embedded ? 'bg-[color-mix(in_srgb,oklch(var(--p))_55%,#fbbf24)]' : 'bg-warning'
            )}
            aria-hidden
          />
          Em prog.:{' '}
          <strong
            className={cn('font-semibold text-base-content')}
          >
            {buckets.inProgress}
          </strong>
        </li>
        <li>
          <span
            className={cn(
              'mr-1 inline-block h-2 w-2 rounded-full align-middle',
              embedded
                ? 'bg-[color-mix(in_srgb,oklch(var(--bc))_40%,transparent)]'
                : 'bg-success'
            )}
            aria-hidden
          />
          Feito:{' '}
          <strong
            className={cn('font-semibold text-base-content')}
          >
            {buckets.done}
          </strong>
        </li>
        <li className="font-medium">Total: {buckets.total}</li>
      </ul>
    </section>
  );
};

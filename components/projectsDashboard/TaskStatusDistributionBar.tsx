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
      return [{ key: 'empty', pct: 100, className: 'bg-[color-mix(in_srgb,var(--brand-text-muted)_20%,transparent)]', label: 'Sem tarefas' }];
    }
    const pTodo = (todo / total) * 100;
    const pProg = (inProgress / total) * 100;
    const pDone = (done / total) * 100;
    return [
      { key: 'todo', pct: pTodo, className: 'bg-[var(--brand-cta)]', label: 'A fazer' },
      { key: 'prog', pct: pProg, className: 'bg-warning', label: 'Em prog.' },
      { key: 'done', pct: pDone, className: 'bg-success', label: 'Feito' },
    ];
  }, [buckets]);

  return (
    <section
      className={cn(
        embedded
          ? 'flex flex-col border-t border-[var(--brand-surface-border)] pt-3'
          : 'flex h-full min-h-0 flex-col rounded-[var(--rounded-box)] border border-[var(--brand-surface-border)] bg-[color-mix(in_srgb,var(--brand-surface-strong)_92%,transparent)] p-3 backdrop-blur-sm sm:p-3.5',
        className
      )}
      aria-labelledby="task-dist-heading"
    >
      <h2 id="task-dist-heading" className={embedded ? workspacePanelSectionTitleClass : 'text-xs font-bold uppercase tracking-wide text-base-content/85'}>
        Status das tarefas
      </h2>
      {!embedded && (
        <p className="mt-0.5 text-xs leading-snug text-[var(--brand-text-muted)]">
          To Do, In Progress / Blocked e Done — proporção ao total.
        </p>
      )}
      <div
        className="mt-2.5 flex h-2.5 w-full shrink-0 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--brand-text-muted)_12%,transparent)] ring-1 ring-[var(--brand-surface-border)]"
        role="img"
        aria-label={`Tarefas: ${buckets.todo} a fazer, ${buckets.inProgress} em progresso, ${buckets.done} concluídas, de ${buckets.total} no total`}
      >
        {segments.map(s =>
          s.pct > 0 ? (
            <div key={s.key} className={cn('h-full transition-[width] duration-500', s.className)} style={{ width: `${s.pct}%` }} title={`${s.label}: ${s.pct.toFixed(1)}%`} />
          ) : null
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--brand-text-muted)] sm:text-xs">
        <li>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--brand-cta)] align-middle" aria-hidden />
          A fazer: <strong className="font-semibold text-[var(--brand-text-strong)]">{buckets.todo}</strong>
        </li>
        <li>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-warning align-middle" aria-hidden />
          Em prog.: <strong className="font-semibold text-[var(--brand-text-strong)]">{buckets.inProgress}</strong>
        </li>
        <li>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-success align-middle" aria-hidden />
          Feito: <strong className="font-semibold text-[var(--brand-text-strong)]">{buckets.done}</strong>
        </li>
        <li className="font-medium">Total: {buckets.total}</li>
      </ul>
    </section>
  );
};

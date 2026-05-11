import React from 'react';
import { cn } from '../../utils/cn';

function SkeletonCard() {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--rounded-box)] border border-base-300/80 bg-base-200/90 p-4 shadow-sm',
        'animate-pulse dark:bg-base-200/50'
      )}
      aria-hidden
    >
      <div className="mb-4 flex gap-3">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-base-300/70 dark:bg-base-300/50" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-3/4 rounded bg-base-300/70 dark:bg-base-300/50" />
          <div className="h-3 w-1/2 rounded bg-base-300/60 dark:bg-base-300/45" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-base-300/50 pt-3">
        <div className="h-16 rounded-lg bg-base-300/55 dark:bg-base-300/40" />
        <div className="h-16 rounded-lg bg-base-300/55 dark:bg-base-300/40" />
        <div className="h-16 rounded-lg bg-base-300/55 dark:bg-base-300/40" />
      </div>
    </div>
  );
}

/**
 * Grade de placeholders alinhada à listagem de projetos (Tarefas/Dashboard: gap-tasks-panel, rounded-box).
 */
export const ProjectsDashboardSkeleton: React.FC = () => {
  return (
    <div
      className="animate-fade-in min-h-[calc(100vh-4rem)] bg-base-100"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Carregando projetos"
    >
      <div className="tasks-panel-scope mx-auto w-full max-w-full px-3 py-3 sm:px-6 sm:py-4">
        <div className="mb-4 h-28 animate-pulse rounded-[var(--rounded-box)] border border-base-300/70 bg-base-200/60 sm:h-32 dark:bg-base-200/40" />
        <div className="grid grid-cols-1 gap-tasks-panel md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

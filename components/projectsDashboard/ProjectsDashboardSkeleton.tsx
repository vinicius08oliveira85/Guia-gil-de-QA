import React from 'react';
import { cn } from '../../utils/cn';

/** Placeholder alinhado ao ProjectCard minimalista (tokens de raio e sombra). */
function SkeletonCard() {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-5 overflow-hidden rounded-[var(--rounded-box)] border border-base-300 bg-base-200/95 p-6 soft-shadow',
        'animate-pulse dark:bg-base-200/50'
      )}
      aria-hidden
    >
      <div className="flex items-start justify-between gap-3">
        <div className="h-11 w-11 shrink-0 rounded-[1rem] bg-base-300/70 dark:bg-base-300/45" />
        <div className="mt-1 h-5 w-5 shrink-0 rounded bg-base-300/50" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-4/5 max-w-[14rem] rounded-[var(--radius)] bg-base-300/70 dark:bg-base-300/45" />
        <div className="h-3.5 w-full rounded bg-base-300/55 dark:bg-base-300/40" />
        <div className="h-3.5 w-5/6 rounded bg-base-300/45 dark:bg-base-300/35" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-7 w-24 rounded-full bg-base-300/55 dark:bg-base-300/40" />
        <div className="h-7 w-28 rounded-full bg-base-300/55 dark:bg-base-300/40" />
        <div className="h-7 w-32 rounded-full bg-base-300/45 dark:bg-base-300/35" />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-base-300/40 pt-4">
        <div className="h-3 w-24 rounded bg-base-300/50" />
        <div className="h-3 w-24 rounded bg-base-300/50" />
        <div className="h-3 w-20 rounded bg-base-300/50" />
      </div>
    </div>
  );
}

/**
 * Grade de placeholders — mesmo gap da listagem (`gap-6`) e cantos do card de projeto.
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

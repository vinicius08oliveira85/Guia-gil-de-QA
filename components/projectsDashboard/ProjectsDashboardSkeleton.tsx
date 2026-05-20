import React from 'react';
import { cn } from '../../utils/cn';
import { projectsListShell } from '../common/viewUi';

function SkeletonCard() {
  return (
    <div
      className={cn(
        'flex min-h-[11.5rem] flex-col gap-2 rounded-[var(--rounded-box)] border border-base-300/70 bg-base-100 p-3 soft-shadow sm:min-h-[14.5rem] sm:gap-3 sm:p-4',
        'animate-pulse'
      )}
      aria-hidden
    >
      <div className="flex justify-between">
        <div className="h-9 w-9 rounded-lg bg-base-200" />
        <div className="h-5 w-8 rounded-md bg-base-200" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-4/5 rounded bg-base-200" />
        <div className="h-3 w-1/3 rounded bg-base-200/80" />
      </div>
      <div className="grid grid-cols-3 gap-2 border-y border-base-300/40 py-3">
        <div className="h-8 rounded bg-base-200/70" />
        <div className="h-8 rounded bg-base-200/70" />
        <div className="h-8 rounded bg-base-200/70" />
      </div>
      <div className="h-1.5 w-full rounded-full bg-base-200" />
      <div className="flex justify-between pt-1">
        <div className="h-3 w-20 rounded bg-base-200/70" />
        <div className="h-3 w-10 rounded bg-base-200/70" />
      </div>
    </div>
  );
}

export const ProjectsDashboardSkeleton: React.FC = () => {
  return (
    <div
      className="animate-fade-in min-h-[calc(100vh-4rem)] bg-base-200/40"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Carregando projetos"
    >
      <div className={projectsListShell}>
        <div className="mb-6 h-20 animate-pulse rounded-[var(--rounded-box)] bg-base-100/80" />
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--rounded-box)] bg-base-100/80" />
          ))}
        </div>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="mt-6 hidden h-64 animate-pulse rounded-[var(--rounded-box)] bg-base-100/80 lg:block" />
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { cn } from '../../utils/cn';
import { projectsListShell } from '../common/viewUi';

function SkeletonCard() {
  return (
    <div
      className={cn(
        'flex min-h-[12rem] flex-col gap-2 rounded-[var(--rounded-box)] border border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)] p-3.5 sm:min-h-[14rem] sm:gap-2.5 sm:p-4',
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
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(12rem,1.35fr)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[4.25rem] animate-pulse rounded-[var(--rounded-box)] border border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)]"
            />
          ))}
          <div className="col-span-2 h-[4.25rem] animate-pulse rounded-[var(--rounded-box)] border border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)] sm:col-span-4 lg:col-span-1" />
        </div>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="mt-6 hidden h-64 animate-pulse rounded-[var(--rounded-box)] bg-base-100/80 lg:block" />
        </div>
      </div>
    </div>
  );
};

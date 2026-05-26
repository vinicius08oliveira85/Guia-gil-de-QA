import React from 'react';
import { cn } from '../../utils/cn';
import { projectsListShell } from '../common/viewUi';
import {
  projectsDashboardMainGridClass,
  projectsDashboardPageClass,
  projectsDashboardProjectGridClass,
  projectsDashboardStatsRegionClass,
} from './projectsDashboardUi';

function SkeletonCard() {
  return (
    <div
      className={cn(
        'project-card-neu-shell flex min-h-[12rem] flex-col gap-2.5 rounded-[var(--project-card-radius)] p-4 sm:min-h-[14rem]',
        'animate-pulse'
      )}
      aria-hidden
    >
      <div className="flex justify-between">
        <div className="project-card-neu-raised h-10 w-10 rounded-full opacity-60" />
        <div className="project-card-neu-chip h-5 w-8 rounded-lg opacity-50" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-4/5 rounded-lg bg-[color-mix(in_srgb,var(--project-card-neu-light)_40%,transparent)]" />
        <div className="h-3 w-1/3 rounded-lg bg-[color-mix(in_srgb,var(--project-card-neu-light)_25%,transparent)]" />
      </div>
      <div className="project-card-neu-metrics flex-1 gap-2 opacity-70">
        <div className="h-8 rounded-lg bg-[color-mix(in_srgb,var(--project-card-neu-light)_20%,transparent)]" />
        <div className="h-8 rounded-lg bg-[color-mix(in_srgb,var(--project-card-neu-light)_20%,transparent)]" />
        <div className="h-8 rounded-lg bg-[color-mix(in_srgb,var(--project-card-neu-light)_20%,transparent)]" />
      </div>
      <div className="project-card-neu-track h-2 opacity-60" />
      <div className="flex justify-between pt-1">
        <div className="project-card-neu-chip h-6 w-20 opacity-50" />
        <div className="project-card-neu-chip h-6 w-10 opacity-50" />
      </div>
    </div>
  );
}

export const ProjectsDashboardSkeleton: React.FC = () => {
  return (
    <div
      className={projectsDashboardPageClass}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Carregando projetos"
    >
      <div className={projectsListShell}>
        <div className="projects-dash-surface-raised mb-6 h-20 animate-pulse rounded-[var(--projects-dash-radius)]" />
        <div className={projectsDashboardStatsRegionClass}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="projects-dash-stat-card h-[4.25rem] animate-pulse opacity-70" />
          ))}
          <div className="projects-dash-stat-card col-span-2 h-[4.25rem] animate-pulse opacity-70 sm:col-span-4 lg:col-span-1" />
        </div>
        <div className={projectsDashboardMainGridClass}>
          <div className={projectsDashboardProjectGridClass}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="workspace-panel-neu-shell mt-6 hidden h-64 animate-pulse opacity-70 lg:mt-0 lg:block" />
        </div>
      </div>
    </div>
  );
};

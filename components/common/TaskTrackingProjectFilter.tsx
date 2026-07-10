import React from 'react';
import { cn } from '../../utils/cn';
import {
  TASK_TRACKING_ALL_PROJECTS,
  type TaskTrackingProjectFilter,
} from '../../utils/taskTrackingProject';
import {
  landingNeuFilterBtnClass,
  landingNeuFilterCountClass,
  landingNeuFilterToolbarClass,
  landingTextSubtleClass,
} from '../landing/landingNeuUi';

export interface TaskTrackingProjectFilterProps {
  projectKeys: string[];
  activeFilter: TaskTrackingProjectFilter;
  onSelectFilter: (filter: TaskTrackingProjectFilter) => void;
  countForProject: (projectKey: string) => number;
  totalCount: number;
  variant?: 'landing' | 'jira-solus';
  className?: string;
}

interface ProjectChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  variant: 'landing' | 'jira-solus';
}

const ProjectChip: React.FC<ProjectChipProps> = ({
  label,
  count,
  active,
  onClick,
  variant,
}) => {
  const btnClass = landingNeuFilterBtnClass(active);
  const countClass = landingNeuFilterCountClass;

  return (
    <button
      type="button"
      onClick={onClick}
      className={btnClass}
      aria-pressed={active}
      aria-label={`${label}, ${count} tarefa(s)`}
    >
      {label}
      <span className={countClass}>{count}</span>
    </button>
  );
};

/**
 * Barra de filtro por projeto Jira — compartilhada entre Landing e Acompanhamento.
 */
export const TaskTrackingProjectFilterBar = React.memo<TaskTrackingProjectFilterProps>(
  ({
    projectKeys,
    activeFilter,
    onSelectFilter,
    countForProject,
    totalCount,
    variant = 'landing',
    className,
  }) => {
    if (projectKeys.length <= 1) return null;

    const toolbarClass = landingNeuFilterToolbarClass;

    return (
      <div className={cn('flex flex-col gap-2', className)} role="group" aria-label="Filtrar por projeto">
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-wide',
            variant === 'landing' ? landingTextSubtleClass : 'text-[color-mix(in_srgb,var(--brand-text-strong)_62%,transparent)]'
          )}
        >
          Projeto
        </span>
        <div className={toolbarClass}>
          <ProjectChip
            label="Todos"
            count={totalCount}
            active={activeFilter === TASK_TRACKING_ALL_PROJECTS}
            onClick={() => onSelectFilter(TASK_TRACKING_ALL_PROJECTS)}
            variant={variant}
          />
          {projectKeys.map(projectKey => (
            <ProjectChip
              key={projectKey}
              label={projectKey}
              count={countForProject(projectKey)}
              active={activeFilter === projectKey}
              onClick={() => onSelectFilter(projectKey)}
              variant={variant}
            />
          ))}
        </div>
      </div>
    );
  }
);

TaskTrackingProjectFilterBar.displayName = 'TaskTrackingProjectFilterBar';

import React from 'react';
import type { BacklogSortBy, TasksListMode } from '../../utils/backlogTasks';
import type { BacklogSprintFilterOption } from '../../utils/taskSprintDisplay';
import { BacklogSortSelect } from './BacklogSortSelect';
import { BacklogSprintFilterSelect } from './BacklogSprintFilterSelect';
import { filterPillClass } from '../common/viewUi';
import { cn } from '../../utils/cn';

export interface TasksViewListModeToggleProps {
  mode: TasksListMode;
  onModeChange: (mode: TasksListMode) => void;
  backlogCount: number;
  totalCount: number;
  backlogSortBy?: BacklogSortBy;
  onBacklogSortChange?: (sort: BacklogSortBy) => void;
  backlogSprintFilter?: string;
  backlogSprintFilterOptions?: BacklogSprintFilterOption[];
  onBacklogSprintFilterChange?: (value: string) => void;
  disabled?: boolean;
}

export const TasksViewListModeToggle: React.FC<TasksViewListModeToggleProps> = ({
  mode,
  onModeChange,
  backlogCount,
  totalCount,
  backlogSortBy = 'priority',
  onBacklogSortChange,
  backlogSprintFilter = 'all',
  backlogSprintFilterOptions = [],
  onBacklogSprintFilterChange,
  disabled = false,
}) => (
  <div
    className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
    role="group"
    aria-label="Modo de listagem de tarefas"
  >
    <div className="task-toolbar-pill-group">
      <button
        type="button"
        disabled={disabled}
        className={cn(filterPillClass(mode === 'all'), 'min-h-[36px] sm:min-h-9')}
        aria-pressed={mode === 'all'}
        onClick={() => onModeChange('all')}
      >
        Todas as tarefas
        <span className="ml-1 tabular-nums opacity-75">({totalCount})</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        className={cn(filterPillClass(mode === 'backlog'), 'min-h-[36px] sm:min-h-9')}
        aria-pressed={mode === 'backlog'}
        onClick={() => onModeChange('backlog')}
      >
        Backlog
        <span className="ml-1 tabular-nums opacity-75">({backlogCount})</span>
      </button>
    </div>
    {mode === 'backlog' && (
      <div className="flex flex-col gap-2 sm:items-end">
        <p className="text-xs leading-relaxed text-[var(--brand-text-muted)] sm:text-right sm:text-sm">
          <strong className="text-[var(--brand-text-strong)]">To Do</strong> ou status Jira de fila
          (ex.: Backlog, A fazer) — exceto Epics.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {onBacklogSprintFilterChange && backlogSprintFilterOptions.length > 0 && (
            <BacklogSprintFilterSelect
              value={backlogSprintFilter}
              options={backlogSprintFilterOptions}
              onChange={onBacklogSprintFilterChange}
              disabled={disabled}
            />
          )}
          {onBacklogSortChange && (
            <BacklogSortSelect
              value={backlogSortBy}
              onChange={onBacklogSortChange}
              disabled={disabled}
            />
          )}
        </div>
      </div>
    )}
  </div>
);

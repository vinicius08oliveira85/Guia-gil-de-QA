import React from 'react';
import type { BacklogSortBy, TasksListMode } from '../../utils/backlogTasks';
import { BacklogSortSelect } from './BacklogSortSelect';
import { filterPillClass } from '../common/viewUi';
import { cn } from '../../utils/cn';

export interface TasksViewListModeToggleProps {
  mode: TasksListMode;
  onModeChange: (mode: TasksListMode) => void;
  backlogCount: number;
  totalCount: number;
  backlogSortBy?: BacklogSortBy;
  onBacklogSortChange?: (sort: BacklogSortBy) => void;
  disabled?: boolean;
}

export const TasksViewListModeToggle: React.FC<TasksViewListModeToggleProps> = ({
  mode,
  onModeChange,
  backlogCount,
  totalCount,
  backlogSortBy = 'priority',
  onBacklogSortChange,
  disabled = false,
}) => (
  <div
    className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
    role="group"
    aria-label="Modo de listagem de tarefas"
  >
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-base-300/70 bg-base-200/40 p-1">
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
        {onBacklogSortChange && (
          <BacklogSortSelect
            value={backlogSortBy}
            onChange={onBacklogSortChange}
            disabled={disabled}
          />
        )}
      </div>
    )}
  </div>
);

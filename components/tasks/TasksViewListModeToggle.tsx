import React from 'react';
import type { BacklogSortBy, TasksListMode } from '../../utils/backlogTasks';
import type { BacklogSprintFilterOption } from '../../utils/taskSprintDisplay';
import { BacklogSortSelect } from './BacklogSortSelect';
import { BacklogSprintFilterSelect } from './BacklogSprintFilterSelect';


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
    {/* Segmented control — abas "Todas" e "Backlog" integradas num único pill */}
    <div
      className="inline-flex items-center rounded-full border border-base-300/60 bg-base-200/50 p-0.5"
      role="group"
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === 'all'}
        onClick={() => onModeChange('all')}
        className={
          mode === 'all'
            ? 'inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-cta)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-50'
            : 'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-base-content/65 transition-all duration-150 hover:text-base-content disabled:opacity-50'
        }
      >
        Todas as tarefas
        <span
          className={
            mode === 'all'
              ? 'rounded-full bg-white/20 px-1.5 py-0 text-[10px] font-bold tabular-nums leading-none'
              : 'rounded-full bg-base-300/60 px-1.5 py-0 text-[10px] font-bold tabular-nums leading-none'
          }
          aria-label={`${totalCount} tarefas`}
        >
          {totalCount}
        </span>
      </button>

      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === 'backlog'}
        onClick={() => onModeChange('backlog')}
        className={
          mode === 'backlog'
            ? 'inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-cta)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-50'
            : 'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-base-content/65 transition-all duration-150 hover:text-base-content disabled:opacity-50'
        }
      >
        Backlog
        <span
          className={
            mode === 'backlog'
              ? 'rounded-full bg-white/20 px-1.5 py-0 text-[10px] font-bold tabular-nums leading-none'
              : 'rounded-full bg-base-300/60 px-1.5 py-0 text-[10px] font-bold tabular-nums leading-none'
          }
          aria-label={`${backlogCount} itens no backlog`}
        >
          {backlogCount}
        </span>
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

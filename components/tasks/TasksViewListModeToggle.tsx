import React from 'react';
import type {
  BacklogItemFilter,
  BacklogPriorityFilter,
  BacklogSortBy,
  BacklogStoryPointsFilter,
  BacklogTypeFilter,
  TasksListMode,
} from '../../utils/backlogTasks';
import type { BacklogSprintFilterOption } from '../../utils/taskSprintDisplay';
import { cn } from '../../utils/cn';
import { BacklogFiltersToolbar } from './BacklogFiltersToolbar';

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
  backlogItemFilter?: BacklogItemFilter;
  onBacklogItemFilterChange?: (value: BacklogItemFilter) => void;
  backlogTypeFilter?: BacklogTypeFilter;
  onBacklogTypeFilterChange?: (value: BacklogTypeFilter) => void;
  backlogPriorityFilter?: BacklogPriorityFilter;
  onBacklogPriorityFilterChange?: (value: BacklogPriorityFilter) => void;
  backlogStoryPointsFilter?: BacklogStoryPointsFilter;
  onBacklogStoryPointsFilterChange?: (value: BacklogStoryPointsFilter) => void;
  onClearBacklogSecondaryFilters?: () => void;
  disabled?: boolean;
}

const modeTabsClass =
  'inline-flex w-fit shrink-0 items-center rounded-full border border-base-300/60 bg-base-200/50 p-0.5';

const modeBtnActive =
  'inline-flex items-center gap-1 rounded-full bg-[var(--brand-cta)] px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-50';

const modeBtnIdle =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-base-content/65 transition-all duration-150 hover:text-base-content disabled:opacity-50';

const modeBadgeActive =
  'rounded-full bg-white/20 px-1 py-0 text-[10px] font-bold tabular-nums leading-none';

const modeBadgeIdle =
  'rounded-full bg-base-300/60 px-1 py-0 text-[10px] font-bold tabular-nums leading-none';

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
  backlogItemFilter = 'queue',
  onBacklogItemFilterChange,
  backlogTypeFilter = 'all',
  onBacklogTypeFilterChange,
  backlogPriorityFilter = 'all',
  onBacklogPriorityFilterChange,
  backlogStoryPointsFilter = 'all',
  onBacklogStoryPointsFilterChange,
  onClearBacklogSecondaryFilters,
  disabled = false,
}) => {
  const showBacklogToolbar =
    mode === 'backlog' &&
    onBacklogSortChange &&
    onBacklogItemFilterChange &&
    onBacklogTypeFilterChange &&
    onBacklogPriorityFilterChange &&
    onBacklogStoryPointsFilterChange &&
    onBacklogSprintFilterChange &&
    onClearBacklogSecondaryFilters;

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5" role="group" aria-label="Modo de listagem de tarefas">
      <div className={modeTabsClass} role="group">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={mode === 'all'}
          onClick={() => onModeChange('all')}
          className={mode === 'all' ? modeBtnActive : modeBtnIdle}
        >
          Todas as tarefas
          <span className={mode === 'all' ? modeBadgeActive : modeBadgeIdle} aria-label={`${totalCount} tarefas`}>
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          disabled={disabled}
          aria-pressed={mode === 'backlog'}
          onClick={() => onModeChange('backlog')}
          className={mode === 'backlog' ? modeBtnActive : modeBtnIdle}
        >
          Backlog
          <span
            className={mode === 'backlog' ? modeBadgeActive : modeBadgeIdle}
            aria-label={`${backlogCount} itens no backlog`}
          >
            {backlogCount}
          </span>
        </button>
      </div>

      {showBacklogToolbar ? (
        <BacklogFiltersToolbar
          itemFilter={backlogItemFilter}
          onItemFilterChange={onBacklogItemFilterChange}
          sprintFilter={backlogSprintFilter}
          sprintOptions={backlogSprintFilterOptions}
          onSprintFilterChange={onBacklogSprintFilterChange}
          typeFilter={backlogTypeFilter}
          onTypeFilterChange={onBacklogTypeFilterChange}
          priorityFilter={backlogPriorityFilter}
          onPriorityFilterChange={onBacklogPriorityFilterChange}
          storyPointsFilter={backlogStoryPointsFilter}
          onStoryPointsFilterChange={onBacklogStoryPointsFilterChange}
          sortBy={backlogSortBy}
          onSortChange={onBacklogSortChange}
          onClearSecondaryFilters={onClearBacklogSecondaryFilters}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
};

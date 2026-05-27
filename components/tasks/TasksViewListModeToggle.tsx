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
import { BacklogFiltersToolbar } from './BacklogFiltersToolbar';
import {
  tasksPanelModeCountActiveClass,
  tasksPanelModeCountIdleClass,
  tasksPanelModeTabActiveClass,
  tasksPanelModeTabIdleClass,
  tasksPanelModeTabsClass,
} from './tasksPanelNeuStyles';

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
      <div className={tasksPanelModeTabsClass} role="group">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={mode === 'all'}
          onClick={() => onModeChange('all')}
          className={mode === 'all' ? tasksPanelModeTabActiveClass : tasksPanelModeTabIdleClass}
        >
          Todas as tarefas
          <span
            className={mode === 'all' ? tasksPanelModeCountActiveClass : tasksPanelModeCountIdleClass}
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
          className={mode === 'backlog' ? tasksPanelModeTabActiveClass : tasksPanelModeTabIdleClass}
        >
          Backlog
          <span
            className={mode === 'backlog' ? tasksPanelModeCountActiveClass : tasksPanelModeCountIdleClass}
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

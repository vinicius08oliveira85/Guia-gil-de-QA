import React from 'react';
import { X } from 'lucide-react';
import type {
  BacklogItemFilter,
  BacklogPriorityFilter,
  BacklogSecondaryFilters,
  BacklogSortBy,
  BacklogStoryPointsFilter,
  BacklogTypeFilter,
} from '../../utils/backlogTasks';
import {
  BACKLOG_SECONDARY_FILTER_DEFAULTS,
  countActiveBacklogSecondaryFilters,
} from '../../utils/backlogTasks';
import type { BacklogSprintFilterOption } from '../../utils/taskSprintDisplay';
import { BACKLOG_SPRINT_FILTER_ALL } from '../../utils/taskSprintDisplay';
import { cn } from '../../utils/cn';
import { BacklogToolbarField } from './BacklogToolbarField';
import { AppSelect } from '../common/AppSelect';
import {
  backlogActiveChipClass,
  backlogChipRemoveBtnClass,
  backlogClearFiltersLinkClass,
  backlogToolbarChipsRowClass,
  backlogToolbarClearLinkClass,
  backlogToolbarFieldClass,
  backlogToolbarFieldHeaderClass,
  backlogToolbarGridClass,
  backlogToolbarHelpClass,
  backlogToolbarLabelClass,
  backlogToolbarPanelClass,
  backlogToolbarSelectClass,
} from './backlogToolbarLayout';

const BACKLOG_TYPE_OPTIONS: { value: BacklogTypeFilter; label: string }[] = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'Bug', label: 'Bug' },
  { value: 'História', label: 'História' },
  { value: 'Tarefa', label: 'Tarefa' },
];

const BACKLOG_PRIORITY_OPTIONS: { value: BacklogPriorityFilter; label: string }[] = [
  { value: 'all', label: 'Todas as prioridades' },
  { value: 'Urgente', label: 'Urgente' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Média', label: 'Média' },
  { value: 'Baixa', label: 'Baixa' },
];

const BACKLOG_SP_OPTIONS: { value: BacklogStoryPointsFilter; label: string }[] = [
  { value: 'all', label: 'Qualquer SP' },
  { value: 'withSp', label: 'Com Story Points' },
  { value: 'withoutSp', label: 'Sem Story Points' },
];

export interface BacklogFiltersToolbarProps {
  itemFilter: BacklogItemFilter;
  onItemFilterChange: (value: BacklogItemFilter) => void;
  sprintFilter: string;
  sprintOptions: BacklogSprintFilterOption[];
  onSprintFilterChange: (value: string) => void;
  typeFilter: BacklogTypeFilter;
  onTypeFilterChange: (value: BacklogTypeFilter) => void;
  priorityFilter: BacklogPriorityFilter;
  onPriorityFilterChange: (value: BacklogPriorityFilter) => void;
  storyPointsFilter: BacklogStoryPointsFilter;
  onStoryPointsFilterChange: (value: BacklogStoryPointsFilter) => void;
  sortBy: BacklogSortBy;
  onSortChange: (value: BacklogSortBy) => void;
  onClearSecondaryFilters: () => void;
  disabled?: boolean;
}

export const BacklogFiltersToolbar: React.FC<BacklogFiltersToolbarProps> = ({
  itemFilter,
  onItemFilterChange,
  sprintFilter,
  sprintOptions,
  onSprintFilterChange,
  typeFilter,
  onTypeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  storyPointsFilter,
  onStoryPointsFilterChange,
  sortBy,
  onSortChange,
  onClearSecondaryFilters,
  disabled = false,
}) => {
  const secondaryFilters: BacklogSecondaryFilters = {
    type: typeFilter,
    priority: priorityFilter,
    storyPoints: storyPointsFilter,
  };
  const activeSecondaryCount = countActiveBacklogSecondaryFilters(secondaryFilters);
  const showSprint = sprintOptions.length > 0;

  return (
    <div className={cn(backlogToolbarPanelClass, 'flex flex-col gap-1')}>
      <p className={backlogToolbarHelpClass}>
        {itemFilter === 'completed' ? (
          <>
            <strong>Concluídos</strong> — Done ou Jira encerrado — exceto Epics.
          </>
        ) : itemFilter === 'all' ? (
          <>
            <strong>Fila e concluídos</strong> — To Do, backlog Jira e itens Done/encerrados — exceto
            Epics.
          </>
        ) : (
          <>
            <strong>To Do</strong> ou fila Jira (Backlog, A fazer) — exceto Epics.
          </>
        )}
      </p>

      <div className={backlogToolbarGridClass}>
        <BacklogToolbarField
          id="backlog-item-filter"
          label="Exibir"
          value={itemFilter}
          disabled={disabled}
          onChange={v => onItemFilterChange(v as BacklogItemFilter)}
          ariaLabel="Filtrar itens do backlog"
        >
          <option value="all">Todos (Fila e Concluídos)</option>
          <option value="queue">Fila (To Do / backlog)</option>
          <option value="completed">Concluídos</option>
        </BacklogToolbarField>

        {showSprint ? (
          <div className={backlogToolbarFieldClass}>
            <div className={backlogToolbarFieldHeaderClass}>
              <label htmlFor="backlog-sprint-filter" className={backlogToolbarLabelClass}>
                Sprint
              </label>
              {sprintFilter !== BACKLOG_SPRINT_FILTER_ALL ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSprintFilterChange(BACKLOG_SPRINT_FILTER_ALL)}
                  className={backlogToolbarClearLinkClass}
                >
                  Limpar
                </button>
              ) : null}
            </div>
            <AppSelect
              id="backlog-sprint-filter"
              value={sprintFilter}
              disabled={disabled || sprintOptions.length <= 1}
              onChange={v => onSprintFilterChange(v)}
              className={backlogToolbarSelectClass}
              aria-label="Filtrar backlog por sprint"
            >
              {sprintOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.isActive ? `★ ${opt.label}` : opt.label}
                </option>
              ))}
            </AppSelect>
          </div>
        ) : null}

        <BacklogToolbarField
          id="backlog-type-filter"
          label="Tipo"
          value={typeFilter}
          disabled={disabled}
          onChange={v => onTypeFilterChange(v as BacklogTypeFilter)}
          ariaLabel="Filtrar backlog por tipo de issue"
        >
          {BACKLOG_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </BacklogToolbarField>

        <BacklogToolbarField
          id="backlog-priority-filter"
          label="Prioridade"
          value={priorityFilter}
          disabled={disabled}
          onChange={v => onPriorityFilterChange(v as BacklogPriorityFilter)}
          ariaLabel="Filtrar backlog por prioridade"
        >
          {BACKLOG_PRIORITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </BacklogToolbarField>

        <BacklogToolbarField
          id="backlog-sp-filter"
          label="Story Points"
          value={storyPointsFilter}
          disabled={disabled}
          onChange={v => onStoryPointsFilterChange(v as BacklogStoryPointsFilter)}
          ariaLabel="Filtrar backlog por story points"
        >
          {BACKLOG_SP_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </BacklogToolbarField>

        <BacklogToolbarField
          id="backlog-sort-by"
          label="Ordenar backlog"
          value={sortBy}
          disabled={disabled}
          onChange={v => onSortChange(v as BacklogSortBy)}
          ariaLabel="Ordenação do backlog"
        >
          <option value="priority">Prioridade (mais urgente primeiro)</option>
          <option value="storyPoints">Story Points (maior primeiro)</option>
          <option value="storyPointsAsc">Story Points (menor primeiro)</option>
          <option value="id">ID da issue</option>
        </BacklogToolbarField>
      </div>

      {activeSecondaryCount > 0 ? (
        <div className={backlogToolbarChipsRowClass}>
          {typeFilter !== BACKLOG_SECONDARY_FILTER_DEFAULTS.type ? (
            <span className={backlogActiveChipClass}>
              Tipo: {typeFilter}
              <button
                type="button"
                className={backlogChipRemoveBtnClass}
                aria-label="Remover filtro de tipo"
                onClick={() => onTypeFilterChange('all')}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ) : null}
          {priorityFilter !== BACKLOG_SECONDARY_FILTER_DEFAULTS.priority ? (
            <span className={backlogActiveChipClass}>
              Prioridade: {priorityFilter}
              <button
                type="button"
                className={backlogChipRemoveBtnClass}
                aria-label="Remover filtro de prioridade"
                onClick={() => onPriorityFilterChange('all')}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ) : null}
          {storyPointsFilter !== BACKLOG_SECONDARY_FILTER_DEFAULTS.storyPoints ? (
            <span className={backlogActiveChipClass}>
              SP: {storyPointsFilter === 'withSp' ? 'Com pontos' : 'Sem pontos'}
              <button
                type="button"
                className={backlogChipRemoveBtnClass}
                aria-label="Remover filtro de story points"
                onClick={() => onStoryPointsFilterChange('all')}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ) : null}
          <button
            type="button"
            disabled={disabled}
            onClick={onClearSecondaryFilters}
            className={backlogClearFiltersLinkClass}
          >
            Limpar filtros extras
          </button>
        </div>
      ) : null}
    </div>
  );
};

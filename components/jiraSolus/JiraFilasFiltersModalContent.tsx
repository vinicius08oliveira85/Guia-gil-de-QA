import React from 'react';
import { X } from 'lucide-react';
import type { SlaBucket } from '../../utils/jiraFilasMetrics';
import { getTaskAssigneeLabel, getTaskStatusLabel } from '../../utils/taskDisplayLabels';
import {
  tasksPanelActiveFiltersClearClass,
  tasksPanelFiltersModalChipClass,
  tasksPanelFiltersModalChipCountClass,
  tasksPanelFiltersModalSectionLabelClass,
} from '../tasks/tasksPanelNeuStyles';

export const SLA_FILTER_OPTIONS: { value: SlaBucket; label: string }[] = [
  { value: 'onTrack', label: 'No prazo' },
  { value: 'atRisk', label: 'Em risco' },
  { value: 'overdue', label: 'Atrasada' },
  { value: 'noDueDate', label: 'Sem prazo' },
];

export interface JiraFilasLocalFilters {
  statuses: string[];
  slaBuckets: SlaBucket[];
  types: string[];
  assignees: string[];
}

export const EMPTY_JIRA_FILAS_FILTERS: JiraFilasLocalFilters = {
  statuses: [],
  slaBuckets: [],
  types: [],
  assignees: [],
};

export function countActiveJiraFilasFilters(filters: JiraFilasLocalFilters): number {
  return (
    filters.statuses.length +
    filters.slaBuckets.length +
    filters.types.length +
    filters.assignees.length
  );
}

export { getTaskAssigneeLabel, getTaskStatusLabel };

interface FilterChipProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, count, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={tasksPanelFiltersModalChipClass(isActive)}
    aria-pressed={isActive}
  >
    {label}
    <span className={tasksPanelFiltersModalChipCountClass(isActive)}>{count}</span>
  </button>
);

export interface JiraFilasFiltersModalContentProps {
  filters: JiraFilasLocalFilters;
  onChange: (next: JiraFilasLocalFilters) => void;
  statusOptions: string[];
  typeOptions: string[];
  assigneeOptions: string[];
  counts: {
    status: (value: string) => number;
    sla: (value: SlaBucket) => number;
    type: (value: string) => number;
    assignee: (value: string) => number;
  };
  activeFiltersCount: number;
  onClearAll: () => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

/**
 * Conteúdo do modal de filtros das Filas (Jira) — chips multi-seleção de
 * Status, Status SLA, Tipo e Responsável, no mesmo padrão de Tarefas & Testes.
 */
export const JiraFilasFiltersModalContent: React.FC<JiraFilasFiltersModalContentProps> = ({
  filters,
  onChange,
  statusOptions,
  typeOptions,
  assigneeOptions,
  counts,
  activeFiltersCount,
  onClearAll,
}) => {
  return (
    <>
      {activeFiltersCount > 0 && (
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={onClearAll} className={tasksPanelActiveFiltersClearClass}>
            <X className="mr-1 h-3 w-3" aria-hidden />
            Limpar todos
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <div className="min-w-0">
          <p className={tasksPanelFiltersModalSectionLabelClass}>Status</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {statusOptions.length === 0 ? (
              <span className="text-xs text-[var(--brand-text-muted)]">Sem dados</span>
            ) : (
              statusOptions.map(status => (
                <FilterChip
                  key={status}
                  label={status}
                  count={counts.status(status)}
                  isActive={filters.statuses.includes(status)}
                  onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, status) })}
                />
              ))
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className={tasksPanelFiltersModalSectionLabelClass}>Status SLA</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SLA_FILTER_OPTIONS.map(({ value, label }) => (
              <FilterChip
                key={value}
                label={label}
                count={counts.sla(value)}
                isActive={filters.slaBuckets.includes(value)}
                onClick={() => onChange({ ...filters, slaBuckets: toggle(filters.slaBuckets, value) })}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <p className={tasksPanelFiltersModalSectionLabelClass}>Tipo de tarefa</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {typeOptions.length === 0 ? (
              <span className="text-xs text-[var(--brand-text-muted)]">Sem dados</span>
            ) : (
              typeOptions.map(type => (
                <FilterChip
                  key={type}
                  label={type}
                  count={counts.type(type)}
                  isActive={filters.types.includes(type)}
                  onClick={() => onChange({ ...filters, types: toggle(filters.types, type) })}
                />
              ))
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className={tasksPanelFiltersModalSectionLabelClass}>Responsável</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {assigneeOptions.length === 0 ? (
              <span className="text-xs text-[var(--brand-text-muted)]">Sem dados</span>
            ) : (
              assigneeOptions.map(assignee => (
                <FilterChip
                  key={assignee}
                  label={assignee}
                  count={counts.assignee(assignee)}
                  isActive={filters.assignees.includes(assignee)}
                  onClick={() =>
                    onChange({ ...filters, assignees: toggle(filters.assignees, assignee) })
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

JiraFilasFiltersModalContent.displayName = 'JiraFilasFiltersModalContent';

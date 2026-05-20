import React from 'react';
import type { BacklogSortBy } from '../../utils/backlogTasks';

export interface BacklogSortSelectProps {
  value: BacklogSortBy;
  onChange: (value: BacklogSortBy) => void;
  disabled?: boolean;
}

export const BacklogSortSelect: React.FC<BacklogSortSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <label htmlFor="backlog-sort-by" className="text-xs font-medium text-[var(--brand-text-muted)]">
      Ordenar backlog
    </label>
    <select
      id="backlog-sort-by"
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value as BacklogSortBy)}
      className="select select-bordered select-sm h-9 min-h-0 rounded-lg border-[var(--brand-surface-border)] bg-[var(--brand-surface)] text-sm text-[var(--brand-text-strong)] shadow-sm"
      aria-label="Ordenação do backlog"
    >
      <option value="priority">Prioridade (mais urgente primeiro)</option>
      <option value="storyPoints">Story Points (maior primeiro)</option>
      <option value="id">ID da issue</option>
    </select>
  </div>
);

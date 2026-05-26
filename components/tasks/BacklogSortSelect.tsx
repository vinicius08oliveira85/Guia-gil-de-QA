import React from 'react';
import type { BacklogSortBy } from '../../utils/backlogTasks';
import { AppSelect } from '../common/AppSelect';
import { cn } from '../../utils/cn';
import { appSelectClass } from '../common/viewUi';

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
    <label htmlFor="backlog-sort-by" className="text-xs font-medium text-[var(--leve-header-text-muted)]">
      Ordenar backlog
    </label>
    <AppSelect
      id="backlog-sort-by"
      value={value}
      disabled={disabled}
      onChange={v => onChange(v as BacklogSortBy)}
      className={cn(appSelectClass, 'max-w-none')}
      aria-label="Ordenação do backlog"
    >
      <option value="priority">Prioridade (mais urgente primeiro)</option>
      <option value="storyPoints">Story Points (maior primeiro)</option>
      <option value="storyPointsAsc">Story Points (menor primeiro)</option>
      <option value="id">ID da issue</option>
    </AppSelect>
  </div>
);

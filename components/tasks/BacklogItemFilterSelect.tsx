import React from 'react';
import type { BacklogItemFilter } from '../../utils/backlogTasks';
import { cn } from '../../utils/cn';
import { appSelectClass } from '../common/viewUi';

export interface BacklogItemFilterSelectProps {
  value: BacklogItemFilter;
  onChange: (value: BacklogItemFilter) => void;
  disabled?: boolean;
}

export const BacklogItemFilterSelect: React.FC<BacklogItemFilterSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <label
      htmlFor="backlog-item-filter"
      className="text-xs font-medium text-[var(--brand-text-muted)]"
    >
      Exibir
    </label>
    <select
      id="backlog-item-filter"
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value as BacklogItemFilter)}
      className={cn(appSelectClass, 'max-w-none')}
      aria-label="Filtrar itens do backlog"
    >
      <option value="queue">Fila (To Do / backlog)</option>
      <option value="completed">Concluídos</option>
    </select>
  </div>
);

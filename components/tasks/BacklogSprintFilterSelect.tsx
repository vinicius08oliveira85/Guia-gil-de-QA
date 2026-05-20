import React from 'react';
import type { BacklogSprintFilterOption } from '../../utils/taskSprintDisplay';
import { cn } from '../../utils/cn';
import { appSelectClass } from '../common/viewUi';

export interface BacklogSprintFilterSelectProps {
  value: string;
  options: BacklogSprintFilterOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const BacklogSprintFilterSelect: React.FC<BacklogSprintFilterSelectProps> = ({
  value,
  options,
  onChange,
  disabled = false,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <label
      htmlFor="backlog-sprint-filter"
      className="text-xs font-medium text-[var(--brand-text-muted)]"
    >
      Sprint
    </label>
    <select
      id="backlog-sprint-filter"
      value={value}
      disabled={disabled || options.length <= 1}
      onChange={e => onChange(e.target.value)}
      className={cn(appSelectClass, 'max-w-[min(100%,14rem)]')}
      aria-label="Filtrar backlog por sprint"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.isActive ? `★ ${opt.label}` : opt.label}
        </option>
      ))}
    </select>
    {value !== 'all' ? (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('all')}
        className={cn(
          'text-xs font-medium text-[var(--brand-text-muted)] underline-offset-2',
          'hover:text-[var(--brand-text-strong)] hover:underline'
        )}
      >
        Limpar sprint
      </button>
    ) : null}
  </div>
);

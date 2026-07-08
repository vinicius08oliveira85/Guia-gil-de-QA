import React from 'react';
import type { BacklogSprintFilterOption } from '../../utils/taskSprintDisplay';
import { cn } from '../../utils/cn';
import { appSelectClass } from '../common/viewUi';
import { AppSelect } from '../common/AppSelect';

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
      className="text-xs font-medium text-base-content/72"
    >
      Sprint
    </label>
    <AppSelect
      id="backlog-sprint-filter"
      value={value}
      disabled={disabled || options.length <= 1}
      onChange={v => onChange(v)}
      className={cn(appSelectClass, 'max-w-[min(100%,14rem)]')}
      aria-label="Filtrar backlog por sprint"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.isActive ? `★ ${opt.label}` : opt.label}
        </option>
      ))}
    </AppSelect>
    {value !== 'all' ? (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('all')}
        className={cn(
          'text-xs font-medium text-base-content/72 underline-offset-2',
          'hover:text-base-content hover:underline'
        )}
      >
        Limpar sprint
      </button>
    ) : null}
  </div>
);

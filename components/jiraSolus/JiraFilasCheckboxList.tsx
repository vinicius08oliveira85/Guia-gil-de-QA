import React, { useCallback, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import {
  jiraFilasQueueTreeItemClass,
  jiraFilasQueueTreeItemSelectedClass,
  jiraFilasQueueTreePanelClass,
  jiraFilasQueueTreeTitleClass,
} from './jiraSolusNeuUi';

export interface JiraFilasCheckboxListOption {
  value: string;
  label: string;
}

export interface JiraFilasCheckboxListProps {
  title: string;
  options: JiraFilasCheckboxListOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  'aria-label'?: string;
}

/**
 * Lista compacta com checkboxes para seleção de filas ou status de importação.
 */
export const JiraFilasCheckboxList: React.FC<JiraFilasCheckboxListProps> = ({
  title,
  options,
  selectedValues,
  onChange,
  disabled = false,
  isLoading = false,
  emptyMessage = 'Nenhuma opção disponível.',
  'aria-label': ariaLabel,
}) => {
  const selectedSet = new Set(selectedValues);
  const groupCheckboxRef = useRef<HTMLInputElement>(null);

  const allSelected = options.length > 0 && options.every(opt => selectedSet.has(opt.value));
  const partiallySelected = selectedValues.length > 0 && !allSelected;

  useEffect(() => {
    if (groupCheckboxRef.current) {
      groupCheckboxRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  const toggleValue = useCallback(
    (value: string) => {
      if (disabled) return;
      const next = new Set(selectedValues);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      onChange(Array.from(next));
    },
    [disabled, onChange, selectedValues]
  );

  const toggleAll = useCallback(() => {
    if (disabled || options.length === 0) return;
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map(opt => opt.value));
    }
  }, [allSelected, disabled, onChange, options]);

  return (
    <div className={jiraFilasQueueTreePanelClass} role="group" aria-label={ariaLabel ?? title}>
      <div className={jiraFilasQueueTreeTitleClass}>
        <span className="min-w-0 truncate">{title}</span>
        {options.length > 0 ? (
          <label className="ml-auto flex shrink-0 items-center gap-1.5 font-sans text-[10px] font-medium text-[var(--brand-text-muted)]">
            <input
              ref={groupCheckboxRef}
              type="checkbox"
              className="checkbox checkbox-xs checkbox-highlight"
              checked={allSelected}
              onChange={toggleAll}
              disabled={disabled || isLoading}
              aria-label={`Selecionar todos em ${title}`}
            />
            Todos
          </label>
        ) : null}
        {selectedValues.length > 0 ? (
          <span className="rounded-full bg-[var(--brand-chip)] px-2 py-0.5 text-[10px] font-semibold tabular-nums">
            {selectedValues.length}
          </span>
        ) : null}
      </div>

      <div className="max-h-44 overflow-y-auto py-1 sm:max-h-48">
        {isLoading ? (
          <p className="px-3 py-2 font-sans text-sm text-[var(--brand-text-muted)]">Carregando…</p>
        ) : options.length === 0 ? (
          <p className="px-3 py-2 font-sans text-sm text-[var(--brand-text-muted)]">{emptyMessage}</p>
        ) : (
          options.map(opt => {
            const isSelected = selectedSet.has(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  jiraFilasQueueTreeItemClass,
                  'pl-4',
                  isSelected && jiraFilasQueueTreeItemSelectedClass
                )}
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-highlight shrink-0"
                  checked={isSelected}
                  onChange={() => toggleValue(opt.value)}
                  disabled={disabled}
                  aria-label={opt.label}
                />
                <span className="min-w-0 flex-1 truncate" title={opt.label}>
                  {opt.label}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
};

JiraFilasCheckboxList.displayName = 'JiraFilasCheckboxList';

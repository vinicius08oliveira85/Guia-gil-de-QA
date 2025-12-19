import React from 'react';
import { FilterChip } from './FilterChip';

interface FilterOption {
  value: string;
  label: string;
  color?: 'default' | 'error' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
}

interface FilterBuilderProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onClear?: () => void;
  icon?: React.ReactNode;
}

/**
 * Builder de filtros inline estilo Vercel
 */
export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  title,
  options,
  selectedValues,
  onToggle,
  onClear,
  icon
}) => {
  const hasActiveFilters = selectedValues.length > 0;

  const getColorForValue = (value: string): 'default' | 'error' | 'warning' | 'info' | 'success' => {
    const option = options.find(opt => opt.value === value);
    return option?.color || 'default';
  };

  const getIconForValue = (value: string) => {
    const option = options.find(opt => opt.value === value);
    return option?.icon;
  };

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs">
          {icon && <span className="text-base-content/70">{icon}</span>}
          <p className="text-xs font-medium text-base-content/70 uppercase tracking-wide">
            {title}
          </p>
          {hasActiveFilters && (
            <span className="badge badge-sm badge-primary">
              {selectedValues.length}
            </span>
          )}
        </div>
        {hasActiveFilters && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="btn btn-xs btn-ghost text-xs"
            aria-label={`Limpar filtros de ${title}`}
          >
            Limpar
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-xs">
        {options.map((option) => {
          const isActive = selectedValues.includes(option.value);
          return (
            <FilterChip
              key={option.value}
              label={option.label}
              value={option.value}
              isActive={isActive}
              onToggle={() => onToggle(option.value)}
              onRemove={onClear ? () => {
                const newValues = selectedValues.filter(v => v !== option.value);
                if (newValues.length === 0 && onClear) {
                  onClear();
                } else {
                  onToggle(option.value);
                }
              } : undefined}
              color={option.color || getColorForValue(option.value)}
              icon={option.icon || getIconForValue(option.value)}
            />
          );
        })}
      </div>
    </div>
  );
};


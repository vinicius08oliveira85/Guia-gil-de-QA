import React from 'react';

interface FilterChipProps {
  label: string;
  value: string;
  isActive: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  color?: 'default' | 'error' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
}

/**
 * Chip de filtro removível com cores e indicadores visuais
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  isActive,
  onToggle,
  onRemove,
  color = 'default',
  icon,
}) => {
  const colorClasses = {
    default: isActive
      ? 'bg-primary text-primary-content border-primary'
      : 'bg-base-200 text-base-content border-base-300',
    error: isActive
      ? 'bg-error text-error-content border-error'
      : 'bg-error/10 text-error border-error/30',
    warning: isActive
      ? 'bg-warning text-warning-content border-warning'
      : 'bg-warning/10 text-warning border-warning/30',
    info: isActive
      ? 'bg-info text-info-content border-info'
      : 'bg-info/10 text-info border-info/30',
    success: isActive
      ? 'bg-success text-success-content border-success'
      : 'bg-success/10 text-success border-success/30',
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        inline-flex items-center gap-xs px-sm py-xs rounded-full
        border transition-all duration-200 text-xs font-medium
        hover:scale-105 active:scale-95
        ${colorClasses[color]}
        ${isActive ? 'ring-2 ring-offset-1 ring-offset-base-100' : ''}
      `}
      aria-pressed={isActive}
      aria-label={`Filtro ${label} ${isActive ? 'ativo' : 'inativo'}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {onRemove && isActive && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-xs hover:bg-black/10 rounded-full p-xs transition-colors"
          aria-label={`Remover filtro ${label}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </button>
  );
};

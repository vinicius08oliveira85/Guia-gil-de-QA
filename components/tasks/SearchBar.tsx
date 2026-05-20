import React from 'react';
import { cn } from '../../utils/cn';
import { taskChipSurfaceClass, taskSelectControlClass } from './taskActionLayout';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Barra de busca para filtrar testes em tempo real
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Buscar testes...',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-sm pointer-events-none">
        <svg
          className="w-4 h-4 text-base-content/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full py-xs pl-lg pr-sm text-sm transition-all duration-200 placeholder:text-[var(--brand-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]',
          taskSelectControlClass
        )}
        aria-label="Buscar testes"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn(
            'absolute inset-y-0 right-0 flex items-center rounded-r-[var(--radius)] pr-sm transition-colors',
            taskChipSurfaceClass
          )}
          aria-label="Limpar busca"
        >
          <svg
            className="w-4 h-4 text-base-content/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

import React from 'react';

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
  className = ''
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full pl-lg pr-sm py-xs
          bg-base-100 border border-base-300 rounded-lg
          text-sm text-base-content
          placeholder:text-base-content/50
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-all duration-200
        `}
        aria-label="Buscar testes"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center pr-sm hover:bg-base-200 rounded-r-lg transition-colors"
          aria-label="Limpar busca"
        >
          <svg className="w-4 h-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};


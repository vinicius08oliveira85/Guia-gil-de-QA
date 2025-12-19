import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  suggestions?: string[];
  icon?: React.ReactNode;
}

/**
 * Estado vazio melhorado com ilustração e mensagens úteis
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nenhum teste encontrado',
  message = 'Não há testes reprovados que correspondam aos filtros aplicados.',
  suggestions = [],
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-xl px-md text-center">
      {icon || (
        <svg
          className="w-16 h-16 text-base-content/30 mb-md"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )}

      <h3 className="text-lg font-semibold text-base-content mb-xs">
        {title}
      </h3>

      <p className="text-sm text-base-content/70 mb-md max-w-md">
        {message}
      </p>

      {suggestions.length > 0 && (
        <div className="space-y-xs">
          <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
            Sugestões:
          </p>
          <ul className="text-xs text-base-content/60 space-y-xs">
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-center gap-xs justify-center">
                <span className="w-1 h-1 rounded-full bg-primary"></span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


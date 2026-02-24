import React from 'react';
import { Project } from '../../types';
import { generateSuggestions, Suggestion } from '../../utils/suggestionService';
import { Card } from './Card';

interface SuggestionsPanelProps {
  project: Project;
  onSuggestionAction?: (suggestion: Suggestion) => void;
  maxSuggestions?: number;
}

const suggestionTypeStyles = {
  info: 'border-blue-500/30 bg-blue-500/5 text-blue-200',
  warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-200',
  success: 'border-green-500/30 bg-green-500/5 text-green-200',
  tip: 'border-accent/30 bg-accent/5 text-accent-light',
};

const suggestionIcons = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  tip: '💡',
};

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  project,
  onSuggestionAction,
  maxSuggestions = 5,
}) => {
  const suggestions = generateSuggestions(project).slice(0, maxSuggestions);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-text-primary">💡 Sugestões rápidas</h3>
        <span className="text-[0.72rem] text-text-secondary">{suggestions.length} itens</span>
      </div>
      <div className="space-y-2">
        {suggestions.map(suggestion => (
          <div
            key={suggestion.id}
            className={`rounded-2xl border px-3 py-2.5 flex items-center gap-2 ${suggestionTypeStyles[suggestion.type]}`}
          >
            <span className="text-base flex-shrink-0">{suggestionIcons[suggestion.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[0.85rem] font-semibold text-text-primary line-clamp-2">
                {suggestion.title}
              </p>
              <p className="text-[0.72rem] text-text-secondary line-clamp-2">
                {suggestion.message}
              </p>
            </div>
            {suggestion.action && (
              <button
                onClick={() => onSuggestionAction?.(suggestion)}
                className="text-[0.72rem] text-accent-light hover:text-accent whitespace-nowrap"
              >
                Ver mais →
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

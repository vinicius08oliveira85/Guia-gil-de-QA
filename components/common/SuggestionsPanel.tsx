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
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
    success: 'bg-green-500/20 border-green-500/30 text-green-300',
    tip: 'bg-accent/20 border-accent/30 text-accent'
};

const suggestionIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    tip: '💡'
};

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ 
    project, 
    onSuggestionAction,
    maxSuggestions = 5 
}) => {
    const suggestions = generateSuggestions(project).slice(0, maxSuggestions);

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <Card className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">💡 Sugestões para seu Projeto</h3>
            <div className="space-y-3">
                {suggestions.map(suggestion => (
                    <div
                        key={suggestion.id}
                        className={`p-3 rounded-lg border ${suggestionTypeStyles[suggestion.type]}`}
                    >
                        <div className="flex items-start gap-2">
                            <span className="text-lg flex-shrink-0">{suggestionIcons[suggestion.type]}</span>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm mb-1">{suggestion.title}</h4>
                                <p className="text-xs opacity-90">{suggestion.message}</p>
                                {suggestion.action && (
                                    <button
                                        onClick={() => onSuggestionAction?.(suggestion)}
                                        className="mt-2 text-xs font-medium underline hover:no-underline"
                                    >
                                        {suggestion.action.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};


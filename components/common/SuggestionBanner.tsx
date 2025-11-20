import React, { useState } from 'react';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';

interface Suggestion {
    id: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    type?: 'info' | 'tip' | 'warning';
    dismissible?: boolean;
}

interface SuggestionBannerProps {
    suggestion: Suggestion | null;
    onDismiss?: (id: string) => void;
}

export const SuggestionBanner: React.FC<SuggestionBannerProps> = ({
    suggestion,
    onDismiss
}) => {
    const { isBeginnerMode } = useBeginnerMode();
    const [dismissed, setDismissed] = useState(false);

    if (!suggestion || !isBeginnerMode || dismissed) return null;

    const typeStyles = {
        info: 'border-blue-500/25 bg-blue-500/10 text-blue-200',
        tip: 'border-accent/30 bg-accent/10 text-accent-light',
        warning: 'border-yellow-500/25 bg-yellow-500/10 text-yellow-100'
    };

    const typeIcons = {
        info: 'ℹ️',
        tip: '💡',
        warning: '⚠️'
    };

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.(suggestion.id);
    };

    return (
        <div className={`rounded-xl border px-3 py-3 mb-3 flex items-center gap-3 ${typeStyles[suggestion.type || 'tip']} animate-fade-in`}>
            <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="text-base leading-none flex-shrink-0">
                    {typeIcons[suggestion.type || 'tip']}
                </span>
                <div className="min-w-0">
                    <p className="text-[0.85rem] font-semibold text-text-primary line-clamp-2">
                        {suggestion.message}
                    </p>
                    {suggestion.action && (
                        <button
                            onClick={suggestion.action.onClick}
                            className="text-[0.72rem] text-accent-light hover:text-accent underline-offset-2 hover:underline mt-1"
                        >
                            Ver mais →
                        </button>
                    )}
                </div>
            </div>
            {suggestion.dismissible !== false && (
                <button
                    onClick={handleDismiss}
                    className="text-text-secondary hover:text-text-primary transition-colors w-7 h-7 rounded-full flex items-center justify-center border border-transparent hover:border-surface-border text-xs"
                    aria-label="Fechar sugestão"
                >
                    ✕
                </button>
            )}
        </div>
    );
};


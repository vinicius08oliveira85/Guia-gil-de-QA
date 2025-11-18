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
        info: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
        tip: 'bg-accent/20 border-accent/30 text-accent-light',
        warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
    };

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.(suggestion.id);
    };

    return (
        <div className={`p-4 rounded-lg border mb-4 ${typeStyles[suggestion.type || 'tip']} animate-fade-in`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <p className="text-sm font-medium">
                        💡 {suggestion.message}
                    </p>
                    {suggestion.action && (
                        <button
                            onClick={suggestion.action.onClick}
                            className="mt-2 text-sm underline hover:no-underline"
                        >
                            {suggestion.action.label} →
                        </button>
                    )}
                </div>
                {suggestion.dismissible !== false && (
                    <button
                        onClick={handleDismiss}
                        className="text-text-secondary hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Fechar sugestão"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};


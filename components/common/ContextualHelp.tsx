import React, { useState } from 'react';
import { HelpTooltip } from './HelpTooltip';

interface ContextualHelpProps {
    title: string;
    content: string | React.ReactNode;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    variant?: 'tooltip' | 'banner' | 'inline';
    icon?: React.ReactNode;
}

const InfoIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

/**
 * Componente de ajuda contextual que fornece informações úteis
 * baseadas no contexto atual do usuário
 */
export const ContextualHelp: React.FC<ContextualHelpProps> = ({
    title,
    content,
    placement = 'top',
    variant = 'tooltip',
    icon
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (variant === 'tooltip') {
        return (
            <HelpTooltip content={content} placement={placement}>
                <button
                    type="button"
                    className="inline-flex items-center gap-1 text-text-secondary hover:text-accent transition-colors"
                    aria-label={title}
                >
                    {icon || <InfoIcon />}
                </button>
            </HelpTooltip>
        );
    }

    if (variant === 'banner') {
        return (
            <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {icon || <InfoIcon className="w-5 h-5 text-accent" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-text-primary mb-1">{title}</h4>
                        <div className="text-sm text-text-secondary">
                            {typeof content === 'string' ? <p>{content}</p> : content}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // inline variant
    return (
        <div className="inline-flex items-start gap-2">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-shrink-0 mt-0.5 text-text-secondary hover:text-accent transition-colors"
                aria-label={title}
                aria-expanded={isExpanded}
            >
                {icon || <InfoIcon />}
            </button>
            {isExpanded && (
                <div className="flex-1 rounded-lg border border-surface-border bg-surface p-3 text-sm text-text-secondary">
                    <h4 className="font-semibold text-text-primary mb-1">{title}</h4>
                    {typeof content === 'string' ? <p>{content}</p> : content}
                </div>
            )}
        </div>
    );
};

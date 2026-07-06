import React, { useState } from 'react';
import { HelpTooltip } from './HelpTooltip';
import {
  neuBrandTextMutedClass,
  neuBrandTextStrongClass,
  neuLegacySurfacePanelClass,
} from './neuUi';
import { cn } from '../../utils/cn';

interface ContextualHelpProps {
  title: string;
  content: string | React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'tooltip' | 'banner' | 'inline';
  icon?: React.ReactNode;
}

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'h-4 w-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
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
  icon,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (variant === 'tooltip') {
    return (
      <HelpTooltip content={content} placement={placement}>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 transition-colors',
            neuBrandTextMutedClass,
            'hover:text-[var(--leve-header-accent)]'
          )}
          aria-label={title}
        >
          {icon || <InfoIcon />}
        </button>
      </HelpTooltip>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          neuLegacySurfacePanelClass,
          'border border-[color-mix(in_srgb,var(--leve-header-accent)_28%,transparent)]',
          'bg-[color-mix(in_srgb,var(--leve-header-accent)_8%,var(--leve-neu-bg))]'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 text-[var(--leve-header-accent)]">
            {icon || <InfoIcon className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className={cn('mb-1 text-sm font-semibold', neuBrandTextStrongClass)}>{title}</h4>
            <div className={cn('text-sm', neuBrandTextMutedClass)}>
              {typeof content === 'string' ? <p>{content}</p> : content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-start gap-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'mt-0.5 shrink-0 transition-colors',
          neuBrandTextMutedClass,
          'hover:text-[var(--leve-header-accent)]'
        )}
        aria-label={title}
        aria-expanded={isExpanded}
      >
        {icon || <InfoIcon />}
      </button>
      {isExpanded ? (
        <div className={cn(neuLegacySurfacePanelClass, 'flex-1 text-sm', neuBrandTextMutedClass)}>
          <h4 className={cn('mb-1 font-semibold', neuBrandTextStrongClass)}>{title}</h4>
          {typeof content === 'string' ? <p>{content}</p> : content}
        </div>
      ) : null}
    </div>
  );
};

import React from 'react';
import { HelpTooltip } from './HelpTooltip';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tip?: string;
  tips?: string[];
  helpContent?: {
    title: string;
    content: string;
  };
  helpText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  action,
  secondaryAction,
  tip,
  tips,
  helpContent,
  helpText
}) => {
  const { isBeginnerMode } = useBeginnerMode();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center" role="status" aria-live="polite">
      <div className="text-6xl mb-6" aria-hidden="true">{icon}</div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="heading-section text-text-primary">{title}</h3>
        {helpContent && (
          <HelpTooltip title={helpContent.title} content={helpContent.content} />
        )}
      </div>
      {description && (
        <p className="text-lead text-text-secondary max-w-md mb-6">{description}</p>
      )}
      {tip && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6 max-w-md">
          <p className="text-sm text-text-primary leading-relaxed">
            💡 <strong>Dica:</strong> {tip}
          </p>
        </div>
      )}
      {isBeginnerMode && tips && tips.length > 0 && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6 max-w-md text-left">
          <p className="text-sm font-semibold text-accent mb-2">💡 Dicas:</p>
          <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
            {tips.map((tipItem, index) => (
              <li key={index}>{tipItem}</li>
            ))}
          </ul>
        </div>
      )}
      {helpText && (
        <p className="text-xs text-text-secondary max-w-md mb-6">{helpText}</p>
      )}
      <div className="flex gap-3 flex-wrap justify-center">
        {action && (
          <button 
            onClick={action.onClick} 
            className={`btn ${action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} min-h-[44px]`}
            aria-label={action.label}
          >
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button 
            onClick={secondaryAction.onClick} 
            className="btn btn-secondary min-h-[44px]"
            aria-label={secondaryAction.label}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
};


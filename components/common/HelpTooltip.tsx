import React from 'react';
import { Tooltip } from './Tooltip';

interface HelpTooltipProps {
  content: React.ReactNode;
  title?: React.ReactNode;
  /** Prefer `placement` (compatibilidade com uso legado) */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Posição do tooltip (alias de `position`) */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Elemento disparador; se omitido, usa ícone padrão */
  children?: React.ReactElement;
  ariaLabel?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  position = 'top',
  placement,
  children,
  ariaLabel,
}) => {
  const resolvedPosition = placement ?? position;
  const tooltipContent = (
    <div className="space-y-1">
      {title ? <div className="font-semibold text-base-content">{title}</div> : null}
      {typeof content === 'string' ? (
        <div className="text-sm text-base-content/70 whitespace-pre-line max-w-xs">{content}</div>
      ) : (
        <div className="text-sm text-base-content/70 max-w-xs">{content}</div>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position={resolvedPosition} ariaLabel={ariaLabel}>
      {children ?? (
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-circle ml-1 text-base-content/70 hover:text-base-content"
          aria-label={typeof title === 'string' ? title : (ariaLabel ?? 'Ajuda')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </button>
      )}
    </Tooltip>
  );
};

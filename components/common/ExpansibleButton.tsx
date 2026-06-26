import * as React from 'react';
import { cn } from '../../utils/cn';
import { headerNeuToolbarPillSecondaryClass } from './headerNeuUi';

export interface ExpansibleButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  title?: string;
  isExpanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** `header` — chip neumórfico com paleta do header global. */
  neuVariant?: 'default' | 'header';
}

/**
 * Botão estático com ícone + rótulo sempre visíveis (sem expansão no hover).
 * Mantém a interface de props anterior por compatibilidade com o Header.
 */
export const ExpansibleButton: React.FC<ExpansibleButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  className,
  ariaLabel,
  title,
  isExpanded,
  onExpandedChange,
  neuVariant = 'default',
}) => {
  const isHeaderNeu = neuVariant === 'header';

  const handleClick = () => {
    onExpandedChange?.(!isExpanded);
    onClick();
  };

  return (
    <button
      title={title}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      className={cn(
        isHeaderNeu
          ? headerNeuToolbarPillSecondaryClass
          : cn(
              'btn btn-ghost relative flex min-h-[44px] items-center justify-start gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
              'text-[color-mix(in_srgb,var(--foreground)_68%,transparent)]',
              'hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]',
              'border-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(var(--p))]'
            ),
        className
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
};

ExpansibleButton.displayName = 'ExpansibleButton';

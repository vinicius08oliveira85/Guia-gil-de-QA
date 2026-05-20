import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface NewProjectCardProps {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Card tracejado para criar novo projeto na grade do dashboard.
 */
export const NewProjectCard: React.FC<NewProjectCardProps> = ({
  onClick,
  className,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'group flex h-full min-h-[11.5rem] w-full flex-col items-center justify-center gap-2 rounded-[var(--rounded-box)] sm:min-h-[14.5rem] sm:gap-3',
      'border-2 border-dashed border-base-300/80 bg-base-100/50 p-4 text-center transition-all duration-200 sm:p-6',
      'hover:border-[color-mix(in_srgb,var(--brand-cta)_45%,transparent)] hover:bg-base-100 hover:shadow-md',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_40%,transparent)] focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    aria-label="Criar novo projeto"
  >
    <span
      className="flex h-11 w-11 items-center justify-center rounded-full bg-info/10 text-info ring-1 ring-info/20 transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none sm:h-14 sm:w-14"
      aria-hidden
    >
      <Plus className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} />
    </span>
    <span className="font-heading text-sm font-semibold text-base-content/75 group-hover:text-base-content sm:text-base">
      Novo Projeto
    </span>
  </button>
);

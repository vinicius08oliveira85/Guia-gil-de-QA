import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  projectCardAccentBarClass,
  projectCardOrbCtaClass,
  projectCardOrbHighlightClass,
  projectCardShellClass,
} from '../common/projectCardUi';

export interface NewProjectCardProps {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

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
      projectCardShellClass,
      'min-h-[12.5rem] w-full cursor-pointer items-center justify-center gap-2.5 border-dashed p-4 text-center sm:min-h-[14.5rem] sm:gap-3 sm:p-5',
      'border-2 border-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]',
      'hover:border-[var(--project-card-accent)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--project-card-accent)_55%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--project-card-bg)]',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none',
      className
    )}
    aria-label="Criar novo projeto"
  >
    <div className={projectCardAccentBarClass} aria-hidden />
    <div
      className={cn(projectCardOrbCtaClass, 'opacity-0 group-hover:opacity-[0.12] group-disabled:group-hover:opacity-0')}
      aria-hidden
    />
    <div
      className={cn(
        projectCardOrbHighlightClass,
        'opacity-0 group-hover:opacity-[0.08] group-disabled:group-hover:opacity-0'
      )}
      aria-hidden
    />

    <span
      className={cn(
        'relative flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14',
        'bg-[color-mix(in_srgb,var(--project-card-accent)_18%,transparent)]',
        'ring-1 ring-[color-mix(in_srgb,var(--project-card-accent)_40%,transparent)]',
        'transition-all duration-300 group-hover:scale-105 group-hover:ring-[var(--project-card-accent)]',
        'group-hover:shadow-[0_0_18px_-4px_rgba(252,76,2,0.45)]',
        'motion-reduce:transform-none'
      )}
      aria-hidden
    >
      <Plus
        className="h-6 w-6 text-[var(--project-card-accent)] transition-transform duration-300 group-hover:rotate-90 sm:h-7 sm:w-7 motion-reduce:transform-none"
        strokeWidth={2}
      />
    </span>

    <div className="relative flex flex-col items-center gap-1">
      <span className="font-sans text-sm font-extrabold text-[var(--project-card-text)] sm:text-base">
        Novo Projeto
      </span>
      <span
        className={cn(
          'flex items-center gap-1 text-[10px] font-medium text-[var(--project-card-text-muted)] sm:text-[11px]',
          'opacity-80 transition-opacity group-hover:opacity-100'
        )}
      >
        <Sparkles className="h-3 w-3 text-[var(--project-card-accent)]" aria-hidden />
        Clique para começar
      </span>
    </div>
  </button>
);

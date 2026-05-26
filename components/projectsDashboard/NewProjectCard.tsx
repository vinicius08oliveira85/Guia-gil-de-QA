import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  projectCardAccentBarClass,
  projectCardIconWrapClass,
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
      'min-h-[12.5rem] w-full cursor-pointer items-center justify-center gap-2.5 p-4 text-center sm:min-h-[14.5rem] sm:gap-3 sm:p-5',
      'border border-dashed border-[color-mix(in_srgb,var(--project-card-accent)_40%,transparent)]',
      'hover:border-[color-mix(in_srgb,var(--project-card-accent)_65%,transparent)]',
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

    <span className={cn(projectCardIconWrapClass, 'relative h-12 w-12 sm:h-14 sm:w-14')} aria-hidden>
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

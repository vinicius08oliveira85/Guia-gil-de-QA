import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import {
  projectCardShellClass,
  projectCardAccentBarClass,
  projectCardOrbCtaClass,
  projectCardOrbHighlightClass,
  projectCardIconWrapClass,
} from '../common/projectCardUi';
import { cn } from '../../utils/cn';

export interface LandingMenuCardProps {
  to: string;
  ariaLabel: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Card de menu neumórfico da LandingPage — mesma identidade visual dos cards de projeto.
 */
export const LandingMenuCard = React.memo<LandingMenuCardProps>(
  ({ to, ariaLabel, title, description, icon: Icon }) => (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={cn(
        projectCardShellClass,
        'block w-full cursor-pointer p-7 text-left no-underline sm:p-8',
        'shadow-[var(--project-card-neu-hover)]'
      )}
    >
      <div className={projectCardAccentBarClass} aria-hidden />
      <div className={projectCardOrbCtaClass} aria-hidden />
      <div className={projectCardOrbHighlightClass} aria-hidden />

      <div className="relative flex items-center gap-3.5">
        <div className={projectCardIconWrapClass} aria-hidden>
          <Icon
            className="h-5 w-5 text-[var(--project-card-accent)] sm:h-[1.375rem] sm:w-[1.375rem]"
            aria-hidden
          />
        </div>
        <h3 className="text-2xl font-bold text-[var(--project-card-text)] transition-colors duration-200 group-hover:text-[var(--project-card-accent)]">
          {title}
        </h3>
      </div>

      <p className="relative mt-3 text-[var(--project-card-text-muted)]">{description}</p>

      <div className="relative mt-auto flex items-center justify-between gap-2 pt-6">
        <span className="font-sans text-sm font-semibold uppercase text-[var(--project-card-text-subtle)] transition-colors duration-200 group-hover:text-[var(--project-card-accent)]">
          Acessar
        </span>
        <span className={cn(projectCardIconWrapClass, 'h-9 w-9 sm:h-10 sm:w-10')} aria-hidden>
          <ArrowRight
            className="h-4 w-4 text-[var(--project-card-accent)] transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  )
);

LandingMenuCard.displayName = 'LandingMenuCard';

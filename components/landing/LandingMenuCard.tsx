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

export type LandingMenuCardVariant = 'primary' | 'secondary';

export interface LandingMenuCardProps {
  to: string;
  ariaLabel: string;
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: LandingMenuCardVariant;
  badge?: string;
  ctaLabel?: string;
}

/**
 * Card de menu neumórfico da LandingPage — mesma identidade visual dos cards de projeto.
 */
export const LandingMenuCard = React.memo<LandingMenuCardProps>(
  ({
    to,
    ariaLabel,
    title,
    description,
    icon: Icon,
    variant = 'secondary',
    badge,
    ctaLabel = 'Acessar',
  }) => {
    const isPrimary = variant === 'primary';

    return (
      <Link
        to={to}
        aria-label={ariaLabel}
        className={cn(
          projectCardShellClass,
          'block w-full cursor-pointer text-left no-underline',
          isPrimary && 'shadow-[var(--project-card-neu-hover)] sm:col-span-2',
          isPrimary ? 'p-7 sm:p-8' : 'p-5 sm:p-6'
        )}
      >
        <div className={projectCardAccentBarClass} aria-hidden />
        <div className={projectCardOrbCtaClass} aria-hidden />
        <div className={projectCardOrbHighlightClass} aria-hidden />

        <div className="relative flex items-center gap-3.5">
          <div className={projectCardIconWrapClass} aria-hidden>
            <Icon
              className={cn(
                'text-[var(--project-card-accent)]',
                isPrimary ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-5 w-5 sm:h-[1.375rem] sm:w-[1.375rem]'
              )}
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className={cn(
                  'font-bold text-[var(--project-card-text)] transition-colors duration-200 group-hover:text-[var(--project-card-accent)]',
                  isPrimary ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                )}
              >
                {title}
              </h2>
              {badge ? (
                <span
                  className="rounded-full bg-[color-mix(in_srgb,var(--project-card-accent)_14%,transparent)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--project-card-accent)]"
                  role="status"
                >
                  {badge}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <p
          className={cn(
            'relative mt-3 text-[var(--project-card-text-muted)]',
            isPrimary ? 'max-w-xl text-base' : 'text-sm sm:text-base'
          )}
        >
          {description}
        </p>

        <div className="relative mt-auto flex items-center justify-between gap-2 pt-5">
          <span className="font-sans text-sm font-semibold uppercase text-[var(--project-card-text-subtle)] transition-colors duration-200 group-hover:text-[var(--project-card-accent)]">
            {ctaLabel}
          </span>
          <span className={cn(projectCardIconWrapClass, 'h-9 w-9 sm:h-10 sm:w-10')} aria-hidden>
            <ArrowRight
              className="h-4 w-4 text-[var(--project-card-accent)] transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </Link>
    );
  }
);

LandingMenuCard.displayName = 'LandingMenuCard';

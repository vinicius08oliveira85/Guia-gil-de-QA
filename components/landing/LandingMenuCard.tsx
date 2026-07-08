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
  className?: string;
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
    className,
  }) => {
    const isPrimary = variant === 'primary';

    return (
      <Link
        to={to}
        aria-label={ariaLabel}
        className={cn(
          projectCardShellClass,
          'landing-menu-card flex h-full w-full cursor-pointer flex-col text-left no-underline',
          isPrimary && 'landing-menu-card--primary shadow-[var(--project-card-neu-hover)]',
          isPrimary ? 'p-6 sm:p-7 lg:min-h-[14rem]' : 'p-5 sm:p-6',
          className
        )}
      >
        <div className={projectCardAccentBarClass} aria-hidden />
        <div className={projectCardOrbCtaClass} aria-hidden />
        <div className={projectCardOrbHighlightClass} aria-hidden />

        <Icon
          className={cn(
            'landing-menu-card__watermark',
            isPrimary
              ? 'landing-menu-card__watermark--primary'
              : 'landing-menu-card__watermark--secondary'
          )}
          aria-hidden
        />

        <div className="relative z-[1] flex items-center gap-3">
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
                  'min-w-0 font-bold leading-tight text-[var(--project-card-text)] transition-colors duration-200 group-hover:text-[var(--project-card-accent)]',
                  isPrimary
                    ? 'text-2xl sm:text-3xl'
                    : 'text-[clamp(1.05rem,0.55rem+1.15vw,1.5rem)]'
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
            'relative z-[1] mt-3 text-[var(--project-card-text-muted)]',
            isPrimary ? 'max-w-xl text-base' : 'text-sm sm:text-base'
          )}
        >
          {description}
        </p>

        <div className="relative z-[1] mt-auto flex items-center justify-between gap-2 border-t border-[color-mix(in_srgb,var(--project-card-border)_65%,transparent)] pt-4 sm:pt-5">
          <span className="font-sans text-sm font-semibold uppercase tracking-wide text-[var(--project-card-text-subtle)] transition-colors duration-200 group-hover:text-[var(--project-card-accent)]">
            {ctaLabel}
          </span>
          <span
            className={cn(
              projectCardIconWrapClass,
              'landing-menu-card__arrow h-9 w-9 sm:h-10 sm:w-10'
            )}
            aria-hidden
          >
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

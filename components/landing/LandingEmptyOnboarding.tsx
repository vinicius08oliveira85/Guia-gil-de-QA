import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import {
  landingAccentTextClass,
  landingTextMutedClass,
  landingTextStrongClass,
} from './landingNeuUi';
import { cn } from '../../utils/cn';

/**
 * CTA de primeiro acesso quando não há projetos.
 */
export const LandingEmptyOnboarding = React.memo(() => (
  <section
    className="app-surface w-full rounded-[calc(var(--project-card-radius)-4px)] p-5 text-left sm:p-6"
    aria-labelledby="landing-onboarding-heading"
  >
    <div className="flex items-start gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--project-card-accent)_14%,transparent)]"
        aria-hidden
      >
        <Sparkles className={cn('h-5 w-5', landingAccentTextClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <h2
          id="landing-onboarding-heading"
          className={cn('text-base font-semibold', landingTextStrongClass)}
        >
          Crie seu primeiro projeto
        </h2>
        <p className={cn('mt-1 text-sm font-medium', landingTextMutedClass)}>
          Importe do Jira ou comece do zero para organizar tarefas, casos de teste e dossiês de
          regras de negócio.
        </p>
        <Link
          to="/projects"
          className={cn(
            'btn btn-sm mt-4 gap-1.5 border-0 bg-[var(--project-card-accent)] text-white',
            'hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]'
          )}
          aria-label="Ir para projetos e criar o primeiro"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Começar agora
        </Link>
      </div>
    </div>
  </section>
));

LandingEmptyOnboarding.displayName = 'LandingEmptyOnboarding';

import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import {
  landingAccentTextClass,
  landingNeuAccentBarClass,
  landingNeuCtaBtnClass,
  landingNeuIconPlateClass,
  landingNeuOrbCtaClass,
  landingNeuOrbHighlightClass,
  landingNeuPanelBodyClass,
  landingNeuPanelClass,
  landingTextMutedClass,
  landingTextStrongClass,
} from './landingNeuUi';
import { cn } from '../../utils/cn';

/**
 * CTA de primeiro acesso quando não há projetos.
 */
export const LandingEmptyOnboarding = React.memo(() => (
  <section
    className={cn(landingNeuPanelClass, 'group h-full')}
    aria-labelledby="landing-onboarding-heading"
  >
    <div className={landingNeuAccentBarClass} aria-hidden />
    <div className={landingNeuOrbCtaClass} aria-hidden />
    <div className={landingNeuOrbHighlightClass} aria-hidden />

    <div className={landingNeuPanelBodyClass}>
        <div className="flex items-start gap-3">
        <div className={landingNeuIconPlateClass} aria-hidden>
          <Sparkles className={cn('h-5 w-5', landingAccentTextClass)} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'mb-1 text-[0.6875rem] font-bold uppercase tracking-wider',
              landingTextMutedClass
            )}
          >
            Primeiros passos
          </p>
          <h2
            id="landing-onboarding-heading"
            className={cn('text-base font-semibold sm:text-lg', landingTextStrongClass)}
          >
            Crie seu primeiro projeto
          </h2>
          <p className={cn('mt-1 text-sm font-medium', landingTextMutedClass)}>
            Importe do Jira ou comece do zero para organizar tarefas, casos de teste e dossiês de
            regras de negócio.
          </p>
          <Link
            to="/projects"
            className={cn(landingNeuCtaBtnClass, 'mt-4')}
            aria-label="Ir para projetos e criar o primeiro"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Começar agora
          </Link>
        </div>
      </div>
    </div>
  </section>
));

LandingEmptyOnboarding.displayName = 'LandingEmptyOnboarding';

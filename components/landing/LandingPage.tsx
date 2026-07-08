import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, GitCompare, Settings, Sparkles } from 'lucide-react';
import { useProjectsStore } from '../../store/projectsStore';
import { getRecentProjectsForLanding } from '../../utils/landingRecentProjects';
import { cn } from '../../utils/cn';
import { LandingMenuCard } from './LandingMenuCard';
import { LandingRecentProjects } from './LandingRecentProjects';
import { LandingTaskFollowUp } from './LandingTaskFollowUp';
import { LandingIntegrationStatus } from './LandingIntegrationStatus';
import { LandingEmptyOnboarding } from './LandingEmptyOnboarding';
import { LandingHomeFooter } from './LandingHomeFooter';
import { APP_BRAND, LANDING_SECTIONS } from './landingSections';
import {
  landingAsideClass,
  landingEyebrowClass,
  landingHeroClass,
  landingHeroShellClass,
  landingMainGridClass,
  landingMenuCardPrimaryGridClass,
  landingMenuCardSecondaryGridClass,
  landingMenuGridClass,
  landingNavClass,
  landingNeuActionBtnClass,
  landingNeuLogoPlateClass,
  landingNeuSectionDescClass,
  landingNeuSectionLabelClass,
  landingPageContainerClass,
  landingPageShellClass,
  landingTextMutedClass,
  landingTextStrongClass,
  landingTopBarBrandClass,
  landingTopBarClass,
  landingTopBarLogoClass,
} from './landingNeuUi';

const LOGO_PRIMARY_SRC = '/icons/icon-192x192.png';
const LOGO_FALLBACK_SRC = '/qa-agile-guide-logo.svg';

/**
 * Tela inicial do QA Agile Guide — marca, continuar, navegação e status.
 */
export const LandingPage = React.memo(() => {
  const [logoSrc, setLogoSrc] = useState(LOGO_PRIMARY_SRC);
  const projects = useProjectsStore(s => s.projects);
  const isLoading = useProjectsStore(s => s.isLoading);

  const recentProjects = useMemo(() => getRecentProjectsForLanding(projects), [projects]);
  const hasProjects = projects.length > 0;
  const showAside = !isLoading;

  const handleLogoError = useCallback(() => {
    setLogoSrc(prev => (prev === LOGO_FALLBACK_SRC ? prev : LOGO_FALLBACK_SRC));
  }, []);

  return (
    <div className={landingPageShellClass} data-theme="leve">
      <header className={landingTopBarClass}>
        <Link to="/" className={landingTopBarBrandClass} aria-label={`${APP_BRAND.title} — início`}>
          <span className={landingTopBarLogoClass}>
            <img
              src={logoSrc}
              alt=""
              className="h-full w-full object-cover"
              onError={handleLogoError}
            />
          </span>
          <span className="app-brand-title truncate font-sans text-sm font-bold tracking-tight sm:text-base">
            {APP_BRAND.title}
          </span>
        </Link>

        <Link
          to="/settings"
          aria-label="Abrir configurações"
          title="Configurações"
          className={cn(landingNeuActionBtnClass, 'group shrink-0')}
        >
          <Settings
            className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:rotate-45"
            aria-hidden
          />
          <span className="hidden sm:inline">Configurações</span>
        </Link>
      </header>

      <div className={landingPageContainerClass}>
        <section className={landingHeroShellClass} aria-labelledby="landing-hero-title">
          <div className={landingHeroClass}>
            <div className={landingNeuLogoPlateClass}>
              <img
                src={logoSrc}
                alt=""
                className="h-16 w-16 sm:h-20 sm:w-20 lg:h-[4.5rem] lg:w-[4.5rem]"
                onError={handleLogoError}
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5 sm:gap-3 lg:items-start lg:gap-3.5">
              <span className={landingEyebrowClass}>
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Workspace QA · Agile + DevOps
              </span>

              <h1
                id="landing-hero-title"
                className="app-brand-title text-2xl font-bold sm:text-3xl lg:text-[2.125rem] lg:leading-tight"
              >
                {APP_BRAND.title}
              </h1>
              <p className={cn('max-w-2xl text-base font-semibold sm:text-lg', landingTextStrongClass)}>
                {APP_BRAND.subtitle}
              </p>
              <p
                className={cn(
                  'max-w-2xl text-sm font-medium leading-relaxed lg:text-[0.9375rem]',
                  landingTextMutedClass
                )}
              >
                {APP_BRAND.tagline}
              </p>
              <LandingIntegrationStatus className="mt-0.5 lg:justify-start" />
            </div>
          </div>
        </section>

        <div className={landingMainGridClass}>
          {showAside ? (
            <aside className={landingAsideClass}>
              {!isLoading && !hasProjects ? <LandingEmptyOnboarding /> : null}
              {!isLoading && hasProjects ? (
                <LandingRecentProjects projects={recentProjects} layout="stack" />
              ) : null}
            </aside>
          ) : null}

          <nav
            className={cn(landingNavClass, !showAside && 'lg:col-span-12')}
            aria-label="Menu principal"
            aria-labelledby="landing-quick-access-heading"
          >
            <div className="flex flex-col gap-1 border-b border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] pb-3 sm:gap-1.5">
              <h2 id="landing-quick-access-heading" className={landingNeuSectionLabelClass}>
                Acesso rápido
              </h2>
              <p className={landingNeuSectionDescClass}>
                Projetos, acompanhamento Jira × Solus e preferências do workspace.
              </p>
            </div>

            <div className={landingMenuGridClass}>
              <LandingMenuCard
                to="/projects"
                ariaLabel={`Acessar ${LANDING_SECTIONS.projects.title}`}
                title={LANDING_SECTIONS.projects.title}
                description={LANDING_SECTIONS.projects.description}
                icon={LayoutGrid}
                variant="primary"
                badge={LANDING_SECTIONS.projects.badge}
                ctaLabel={hasProjects ? 'Abrir projetos' : 'Criar projeto'}
                className={landingMenuCardPrimaryGridClass}
              />
              <LandingMenuCard
                to="/jira-solus"
                ariaLabel={`Acessar ${LANDING_SECTIONS.jiraSolus.title}`}
                title={LANDING_SECTIONS.jiraSolus.title}
                description={LANDING_SECTIONS.jiraSolus.description}
                icon={GitCompare}
                variant="secondary"
                className={landingMenuCardSecondaryGridClass}
              />
              <LandingMenuCard
                to="/settings"
                ariaLabel={`Acessar ${LANDING_SECTIONS.settings.title}`}
                title={LANDING_SECTIONS.settings.title}
                description={LANDING_SECTIONS.settings.description}
                icon={Settings}
                variant="secondary"
                ctaLabel="Abrir configurações"
                className={landingMenuCardSecondaryGridClass}
              />
            </div>
          </nav>
        </div>

        {!isLoading ? <LandingTaskFollowUp /> : null}

        <LandingHomeFooter />
      </div>
    </div>
  );
});

LandingPage.displayName = 'LandingPage';

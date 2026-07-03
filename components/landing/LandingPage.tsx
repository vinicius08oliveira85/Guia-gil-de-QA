import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, GitCompare, Settings } from 'lucide-react';
import { useProjectsStore } from '../../store/projectsStore';
import { getRecentProjectsForLanding } from '../../utils/landingRecentProjects';
import { cn } from '../../utils/cn';
import { LandingMenuCard } from './LandingMenuCard';
import { LandingRecentProjects } from './LandingRecentProjects';
import { LandingIntegrationStatus } from './LandingIntegrationStatus';
import { LandingEmptyOnboarding } from './LandingEmptyOnboarding';
import { LandingHomeFooter } from './LandingHomeFooter';
import { APP_BRAND, LANDING_SECTIONS } from './landingSections';
import { landingTextMutedClass, landingTextStrongClass } from './landingNeuUi';

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

  const handleLogoError = useCallback(() => {
    setLogoSrc(prev => (prev === LOGO_FALLBACK_SRC ? prev : LOGO_FALLBACK_SRC));
  }, []);

  return (
    <div
      className={cn(
        'app-neu-scope relative flex min-h-screen flex-col items-center',
        'px-4 pb-8 pt-14 text-center sm:px-6 sm:pb-10 sm:pt-16'
      )}
    >
      <Link
        to="/settings"
        aria-label="Abrir configurações"
        title="Configurações"
        className={cn(
          'app-surface app-surface-strong group absolute right-4 top-4 z-10',
          'inline-flex h-11 items-center gap-2 rounded-full px-3.5',
          'text-sm font-semibold transition-[color,transform] duration-200',
          landingTextStrongClass,
          'hover:-translate-y-0.5 hover:text-[var(--project-card-accent)]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]',
          'sm:right-6 sm:top-6'
        )}
      >
        <Settings
          className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:rotate-45"
          aria-hidden
        />
        <span className="hidden sm:inline">Configurações</span>
      </Link>

      <div className="flex w-full max-w-3xl flex-col items-center gap-6 sm:gap-7">
        <header className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="app-surface app-surface-strong flex items-center justify-center rounded-full p-3.5 sm:p-4">
            <img
              src={logoSrc}
              alt=""
              className="h-20 w-20 sm:h-24 sm:w-24"
              onError={handleLogoError}
            />
          </div>
          <h1 className="app-brand-title text-2xl font-bold sm:text-3xl">{APP_BRAND.title}</h1>
          <p className={cn('max-w-lg text-base font-medium sm:text-lg', landingTextStrongClass)}>
            {APP_BRAND.subtitle}
          </p>
          <p className={cn('max-w-md text-sm font-medium leading-relaxed', landingTextMutedClass)}>
            {APP_BRAND.tagline}
          </p>
        </header>

        <LandingIntegrationStatus />

        {!isLoading && !hasProjects ? <LandingEmptyOnboarding /> : null}

        {!isLoading && hasProjects ? <LandingRecentProjects projects={recentProjects} /> : null}

        <nav
          className="app-surface flex w-full flex-col items-stretch gap-4 rounded-[var(--project-card-radius)] p-5 sm:gap-5 sm:p-7"
          aria-label="Menu principal"
        >
          <h2 className="sr-only">Navegação principal</h2>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <LandingMenuCard
              to="/projects"
              ariaLabel={`Acessar ${LANDING_SECTIONS.projects.title}`}
              title={LANDING_SECTIONS.projects.title}
              description={LANDING_SECTIONS.projects.description}
              icon={LayoutGrid}
              variant="primary"
              badge={LANDING_SECTIONS.projects.badge}
              ctaLabel={hasProjects ? 'Abrir projetos' : 'Criar projeto'}
            />
            <LandingMenuCard
              to="/jira-solus"
              ariaLabel={`Acessar ${LANDING_SECTIONS.jiraSolus.title}`}
              title={LANDING_SECTIONS.jiraSolus.title}
              description={LANDING_SECTIONS.jiraSolus.description}
              icon={GitCompare}
              variant="secondary"
            />
            <LandingMenuCard
              to="/settings"
              ariaLabel={`Acessar ${LANDING_SECTIONS.settings.title}`}
              title={LANDING_SECTIONS.settings.title}
              description={LANDING_SECTIONS.settings.description}
              icon={Settings}
              variant="secondary"
              ctaLabel="Abrir configurações"
            />
          </div>
        </nav>

        <LandingHomeFooter />
      </div>
    </div>
  );
});

LandingPage.displayName = 'LandingPage';

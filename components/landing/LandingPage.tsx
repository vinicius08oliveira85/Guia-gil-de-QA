import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, GitCompare, Settings } from 'lucide-react';
import { LandingMenuCard } from './LandingMenuCard';
import { LANDING_SECTIONS } from './landingSections';
import { cn } from '../../utils/cn';

const LOGO_PRIMARY_SRC = '/icons/icon-192x192.png';
const LOGO_FALLBACK_SRC = '/qa-agile-guide-logo.svg';

/**
 * Tela inicial do QA Agile Guide — logo, título e cards de navegação.
 */
export const LandingPage = React.memo(() => {
  const [logoSrc, setLogoSrc] = useState(LOGO_PRIMARY_SRC);

  const handleLogoError = useCallback(() => {
    setLogoSrc(prev => (prev === LOGO_FALLBACK_SRC ? prev : LOGO_FALLBACK_SRC));
  }, []);

  return (
    <div className="app-neu-scope relative flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <Link
        to="/settings"
        aria-label="Abrir configurações"
        title="Configurações"
        className={cn(
          'app-surface app-surface-strong group absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full',
          'text-[var(--brand-text-muted)] transition-[color,transform] duration-200',
          'hover:-translate-y-0.5 hover:text-[var(--project-card-accent)]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]',
          'sm:right-6 sm:top-6'
        )}
      >
        <Settings
          className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45"
          aria-hidden
        />
      </Link>

      <div className="app-surface flex w-full max-w-3xl flex-col items-center gap-8 rounded-[var(--project-card-radius)] p-8 sm:p-10">
        <div className="flex flex-col items-center gap-5">
          <div className="app-surface app-surface-strong flex items-center justify-center rounded-full p-5 sm:p-6">
            <img
              src={logoSrc}
              alt="QA Agile Guide Logo"
              className="h-32 w-32 sm:h-40 sm:w-40"
              onError={handleLogoError}
            />
          </div>
          <h1 className="app-brand-title text-3xl font-bold sm:text-4xl">QA Agile Guide</h1>
          <p className="max-w-md text-lg text-[var(--brand-text-muted)]">
            Sua ferramenta para gestão de projetos de QA com metodologias ágeis.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
          <LandingMenuCard
            to="/projects"
            ariaLabel={`Acessar ${LANDING_SECTIONS.projects.title}`}
            title={LANDING_SECTIONS.projects.title}
            description={LANDING_SECTIONS.projects.description}
            icon={LayoutGrid}
          />
          <LandingMenuCard
            to="/jira-solus"
            ariaLabel={`Acessar ${LANDING_SECTIONS.jiraSolus.title}`}
            title={LANDING_SECTIONS.jiraSolus.title}
            description={LANDING_SECTIONS.jiraSolus.description}
            icon={GitCompare}
          />
        </div>
      </div>
    </div>
  );
});

LandingPage.displayName = 'LandingPage';

import React, { useId } from 'react';
import { Search } from 'lucide-react';
import {
  projectsDashboardSearchBtnClass,
  projectsDashboardSearchFieldClass,
  projectsDashboardSearchIconClass,
} from './projectsDashboardUi';
import { LANDING_SECTIONS } from '../landing/landingSections';

export interface ProjectsDashboardHeaderProps {
  projectCount: number;
  lastActivityText: string | null;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

/**
 * Cabeçalho compacto do workspace: título, meta e busca local.
 */
export const ProjectsDashboardHeader: React.FC<ProjectsDashboardHeaderProps> = ({
  projectCount,
  lastActivityText,
  searchQuery,
  onSearchQueryChange,
}) => {
  const headingId = useId();
  const searchId = useId();

  const metaParts = [
    `${projectCount} ${projectCount === 1 ? 'projeto' : 'projetos'}`,
    lastActivityText ? `última atividade ${lastActivityText}` : null,
  ].filter(Boolean);

  return (
    <section aria-labelledby={headingId} className="relative mb-1 sm:mb-2">
      <div className="flex flex-col gap-3 sm:gap-3.5 max-md:gap-2">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
            <h1
              id={headingId}
              className="app-brand-title font-sans text-2xl font-bold tracking-tight text-[var(--workspace-panel-text)] max-md:text-xl sm:text-[1.75rem]"
            >
              {LANDING_SECTIONS.projects.title}
            </h1>
            <span
              className="projects-dash-neu-badge shrink-0 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              role="status"
            >
              {projectCount}
            </span>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
              className={projectsDashboardSearchBtnClass}
              aria-label="Abrir busca global (Ctrl+K)"
              title="Busca global (Ctrl+K)"
            >
              <Search className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {metaParts.length > 0 ? (
            <p className="mt-1.5 text-sm font-medium text-[var(--workspace-panel-text-muted)]">
              {metaParts.join(' · ')}
            </p>
          ) : null}
        </div>

        {projectCount > 0 ? (
          <div className="relative">
            <label htmlFor={searchId} className="sr-only">
              Filtrar projetos por nome
            </label>
            <Search className={projectsDashboardSearchIconClass} aria-hidden />
            <input
              id={searchId}
              type="search"
              value={searchQuery}
              onChange={e => onSearchQueryChange(e.target.value)}
              placeholder="Filtrar projetos por nome, tag ou chave Jira…"
              className={projectsDashboardSearchFieldClass}
              autoComplete="off"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
};

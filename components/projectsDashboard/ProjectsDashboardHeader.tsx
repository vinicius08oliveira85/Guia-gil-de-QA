import React, { useId } from 'react';
import { LayoutGrid, Search } from 'lucide-react';
import {
  projectsDashboardEyebrowClass,
  projectsDashboardHeaderBadgeClass,
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
 * Cabeçalho do workspace: eyebrow, título, meta e busca local.
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
    <section aria-labelledby={headingId} className="relative">
      <div className="flex flex-col gap-3 sm:gap-4 max-md:gap-2">
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <span className={projectsDashboardEyebrowClass}>
            <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Workspace · QA Agile
          </span>

          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
            <h1
              id={headingId}
              className="app-brand-title font-sans text-2xl font-bold tracking-tight text-base-content max-md:text-xl sm:text-[1.75rem]"
            >
              {LANDING_SECTIONS.projects.title}
            </h1>
            <span className={projectsDashboardHeaderBadgeClass} role="status">
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
            <p className="text-sm font-medium text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]">
              {metaParts.join(' · ')}
            </p>
          ) : null}
        </div>

        {projectCount > 0 ? (
          <div className="relative max-w-xl">
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

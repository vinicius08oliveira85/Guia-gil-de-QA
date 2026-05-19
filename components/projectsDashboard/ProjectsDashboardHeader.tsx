import React, { useId } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ProjectsDashboardSortBy = 'name' | 'updatedAt';

export interface ProjectsDashboardHeaderProps {
  projectCount: number;
  sortBy: ProjectsDashboardSortBy;
  onSortByChange: (value: ProjectsDashboardSortBy) => void;
  lastActivityText: string | null;
}

export const ProjectsDashboardHeader: React.FC<ProjectsDashboardHeaderProps> = ({
  projectCount,
  sortBy,
  onSortByChange,
  lastActivityText,
}) => {
  const headingId = useId();
  const showSort = projectCount > 1;

  return (
    <section aria-labelledby={headingId} className="relative mb-1 sm:mb-2">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h1
              id={headingId}
              className="font-heading text-2xl font-bold tracking-tight text-base-content sm:text-[1.75rem]"
            >
              Meus Projetos
            </h1>
            <span className="shrink-0 rounded-full border border-[color-mix(in_srgb,var(--brand-highlight)_35%,transparent)] bg-[color-mix(in_srgb,var(--brand-highlight)_12%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--brand-highlight)]">
              Workspace
            </span>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
              className={cn(
                'win-icon-button shrink-0 text-base-content/60',
                'hover:bg-base-200 hover:text-base-content'
              )}
              aria-label="Abrir busca (Ctrl+K)"
            >
              <Search className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div
            role="group"
            aria-label="Atividade e ordenação do workspace"
            className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-base-content/70 sm:justify-end"
          >
            {lastActivityText && (
              <span className="text-xs sm:text-sm" title="Última alteração em qualquer projeto">
                Última atividade:{' '}
                <span className="font-medium text-base-content/85">{lastActivityText}</span>
              </span>
            )}
            {showSort && (
              <label className="inline-flex min-h-[44px] items-center gap-2 sm:min-h-0">
                <span className="text-xs font-medium text-base-content/65">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={e => onSortByChange(e.target.value as ProjectsDashboardSortBy)}
                  className="select select-bordered select-sm h-9 min-h-[44px] rounded-lg border-base-300/80 bg-base-100 py-1 pl-2 pr-8 text-xs font-medium text-base-content focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:min-h-8 sm:h-8"
                  aria-label="Ordenar projetos por"
                >
                  <option value="name">Nome</option>
                  <option value="updatedAt">Última atualização</option>
                </select>
              </label>
            )}
          </div>
        </div>

        <p className="max-w-2xl text-sm leading-relaxed text-base-content/70">
          Crie, organize e acompanhe o QA por projeto.
        </p>
      </div>
    </section>
  );
};

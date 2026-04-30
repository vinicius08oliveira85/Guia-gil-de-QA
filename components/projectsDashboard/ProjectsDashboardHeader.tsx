import React, { useId } from 'react';
import { Search } from 'lucide-react';

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
  const showStatusRow = projectCount > 0;
  const showIndicatorStrip = showStatusRow && Boolean(lastActivityText);

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-base-300/60 bg-gradient-to-br from-base-100 via-base-100 to-base-200/25 px-4 py-5 shadow-sm shadow-base-content/[0.03] ring-1 ring-base-content/[0.02] sm:px-6 sm:py-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] sm:opacity-100"
        aria-hidden
      >
        <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-primary/[0.06] blur-2xl" />
        <div className="absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-secondary/[0.05] blur-2xl" />
      </div>

      <section
        aria-labelledby={headingId}
        className="relative z-[1] flex flex-col gap-4 sm:gap-5"
      >
        {/* Linha 1: título + busca (fixo) | meta com rolagem horizontal no mobile */}
        <div className="flex min-w-0 flex-nowrap items-center gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-2">
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <h1
              id={headingId}
              className="text-2xl font-bold tracking-tight text-base-content md:text-3xl md:tracking-tight"
            >
              Meus Projetos
            </h1>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
              className="btn btn-circle btn-ghost btn-sm shrink-0 min-h-[44px] min-w-[44px] rounded-xl border border-transparent hover:border-base-300/60 hover:bg-base-200/50 sm:min-h-0 sm:min-w-0 sm:rounded-lg"
              aria-label="Abrir busca (Ctrl+K)"
            >
              <Search className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div
            role="group"
            aria-label="Workspace: quantidade de projetos e ordenação da lista"
            className="min-w-0 flex flex-1 flex-nowrap items-center gap-x-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0"
          >
            <span className="shrink-0 badge badge-sm border-primary/25 bg-primary/10 font-semibold tracking-wide text-primary shadow-sm">
              Workspace
            </span>
            <span className="shrink-0 text-sm text-base-content/55">
              {projectCount} {projectCount === 1 ? 'projeto' : 'projetos'}
            </span>
            {showSort && (
              <div className="flex shrink-0 min-h-[44px] items-center gap-2 sm:min-h-0">
                <span className="text-xs font-medium text-base-content/50">Ordenar</span>
                <select
                  value={sortBy}
                  onChange={(e) => onSortByChange(e.target.value as ProjectsDashboardSortBy)}
                  className="select select-bordered select-sm h-9 min-h-[44px] rounded-xl border-base-300/80 bg-base-100/90 py-1 text-xs shadow-sm backdrop-blur-sm transition-[box-shadow,border-color] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:min-h-8 sm:h-8 sm:rounded-lg"
                  aria-label="Ordenar projetos por"
                >
                  <option value="name">Nome</option>
                  <option value="updatedAt">Última atualização</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Linha 2: descrição | indicadores (rolagem horizontal no mobile quando necessário) */}
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="max-w-2xl text-sm leading-relaxed text-base-content/70 sm:flex-1 sm:min-w-[14rem]">
            Crie, organize e acompanhe o QA por projeto — templates, métricas e integrações opcionais quando fizer
            sentido.
          </p>
          {showIndicatorStrip && (
            <div
              role="group"
              aria-label="Indicadores de atividade do workspace"
              className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:gap-3 sm:pb-0"
            >
              {lastActivityText && (
                <span
                  className="inline-flex shrink-0 items-center rounded-lg border border-base-300/40 bg-base-200/20 px-3 py-1.5 text-xs text-base-content/65 sm:text-sm"
                  title="Última alteração em qualquer projeto"
                >
                  Última atividade: {lastActivityText}
                </span>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

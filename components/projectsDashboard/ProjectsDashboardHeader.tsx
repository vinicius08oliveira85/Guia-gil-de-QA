import React, { useId } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { AppSelect } from '../common/AppSelect';
import { viewHeroJiraBadgeClass } from '../common/viewHeroChromeUi';
import {
  projectsDashboardSearchBtnClass,
  projectsDashboardSelectClass,
} from './projectsDashboardUi';

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
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
            <h1
              id={headingId}
              className="font-heading text-2xl font-bold tracking-tight text-[var(--workspace-panel-text)] sm:text-[1.75rem]"
            >
              Meus Projetos
            </h1>
            <span className={viewHeroJiraBadgeClass}>Workspace</span>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
              className={projectsDashboardSearchBtnClass}
              aria-label="Abrir busca (Ctrl+K)"
            >
              <Search className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div
            role="group"
            aria-label="Atividade e ordenação do workspace"
            className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:justify-end"
          >
            {lastActivityText && (
              <span
                className="text-xs text-[var(--workspace-panel-text-muted)] sm:text-sm"
                title="Última alteração em qualquer projeto"
              >
                Última atividade:{' '}
                <span className="font-medium text-[var(--workspace-panel-text)]">{lastActivityText}</span>
              </span>
            )}
            {showSort && (
              <label className="inline-flex min-h-[44px] items-center gap-2 sm:min-h-0">
                <span className="text-xs font-medium text-[var(--workspace-panel-text-muted)]">Ordenar:</span>
                <AppSelect
                  value={sortBy}
                  onChange={v => onSortByChange(v as ProjectsDashboardSortBy)}
                  className={projectsDashboardSelectClass}
                  aria-label="Ordenar projetos por"
                >
                  <option value="name">Nome</option>
                  <option value="updatedAt">Última atualização</option>
                </AppSelect>
              </label>
            )}
          </div>
        </div>

        <p className="max-w-2xl text-sm leading-relaxed text-[var(--workspace-panel-text-muted)]">
          Crie, organize e acompanhe o QA por projeto.
        </p>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Download, Filter, ChevronDown, X } from 'lucide-react';
import type { DashboardFilters } from './DashboardFiltersModal';
import { cn } from '../../utils/cn';

export interface QADashboardHeaderToolbarProps {
  jiraProjectKey?: string;
  lastUpdatedText: string | null;
  activeFiltersCount: number;
  filters: DashboardFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  onOpenFiltersModal: () => void;
  onOpenExportModal: () => void;
}

function periodLabel(period: 'week' | 'month' | 'quarter'): string {
  if (period === 'month') return 'Mês';
  if (period === 'quarter') return 'Trimestre';
  return 'Semana';
}

function testStatusLabel(s: NonNullable<DashboardFilters['testStatus']>[number]): string {
  if (s === 'Not Run') return 'Não executado';
  if (s === 'Passed') return 'Passou';
  if (s === 'Failed') return 'Falhou';
  return 'Bloqueado';
}

const outlineBtn =
  'inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-base-300/80 bg-base-100 px-3.5 py-2 text-sm font-medium text-base-content/85 shadow-sm transition-colors hover:border-base-300 hover:bg-base-200/50 sm:min-h-9';

/**
 * Cabeçalho do dashboard do projeto: título, badge Jira, filtros e exportação.
 */
export const QADashboardHeaderToolbar: React.FC<QADashboardHeaderToolbarProps> = ({
  jiraProjectKey,
  lastUpdatedText,
  activeFiltersCount,
  filters,
  onFiltersChange,
  onOpenFiltersModal,
  onOpenExportModal,
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  return (
    <header className="flex flex-col gap-4 border-b border-base-300/60 pb-4 sm:pb-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-base-content sm:text-[1.65rem]">
              Dashboard
            </h1>
            {jiraProjectKey && (
              <span className="shrink-0 rounded-md border border-base-300/70 bg-base-200/50 px-2 py-0.5 text-xs font-medium text-base-content/65">
                Jira: {jiraProjectKey}
              </span>
            )}
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-base-content/70">
            Indicadores calculados a partir das tarefas do projeto (status, prazos e responsáveis).
          </p>
          <p className="mt-0.5 text-sm text-base-content/60">
            Respeita os filtros aplicados.
          </p>
          {lastUpdatedText && (
            <p className="mt-1 text-xs text-base-content/50" title="Última alteração do projeto">
              Projeto atualizado {lastUpdatedText}
            </p>
          )}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              className={outlineBtn}
              onClick={onOpenFiltersModal}
              aria-label="Filtrar dados do dashboard"
            >
              <Filter className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              Filtrar{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </button>
            <button
              type="button"
              className={outlineBtn}
              onClick={onOpenExportModal}
              aria-label="Exportar dados do projeto"
            >
              <Download className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              Exportar
            </button>
          </div>

          <div className="relative ml-auto md:hidden">
            <button
              type="button"
              className={outlineBtn}
              onClick={() => setShowActionsMenu(v => !v)}
              aria-expanded={showActionsMenu}
              aria-label="Menu de ações"
            >
              Ações
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
            {showActionsMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setShowActionsMenu(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-base-300/70 bg-base-100 py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenFiltersModal();
                      setShowActionsMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-base-200/60"
                  >
                    <Filter className="h-4 w-4 shrink-0" aria-hidden />
                    Filtrar{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenExportModal();
                      setShowActionsMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-base-200/60"
                  >
                    <Download className="h-4 w-4 shrink-0" aria-hidden />
                    Exportar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.period && filters.period !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-base-300/70 bg-base-200/40 pl-2.5 pr-1 py-1 text-xs">
              Período: {periodLabel(filters.period)}
              <button
                type="button"
                onClick={() => onFiltersChange(prev => ({ ...prev, period: 'all' }))}
                className="win-icon-button rounded-full"
                aria-label="Remover filtro período"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {(filters.taskType ?? []).map(t => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-base-300/70 bg-base-200/40 pl-2.5 pr-1 py-1 text-xs"
            >
              Tipo: {t}
              <button
                type="button"
                onClick={() =>
                  onFiltersChange(prev => ({
                    ...prev,
                    taskType: prev.taskType?.filter(x => x !== t) ?? [],
                  }))
                }
                className="win-icon-button rounded-full"
                aria-label={`Remover filtro tipo ${t}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {(filters.testStatus ?? []).map(s => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full border border-base-300/70 bg-base-200/40 pl-2.5 pr-1 py-1 text-xs"
            >
              Status teste: {testStatusLabel(s)}
              <button
                type="button"
                onClick={() =>
                  onFiltersChange(prev => ({
                    ...prev,
                    testStatus: prev.testStatus?.filter(x => x !== s) ?? [],
                  }))
                }
                className="win-icon-button rounded-full"
                aria-label={`Remover filtro status ${s}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {(filters.phase ?? []).map(p => (
            <span
              key={p}
              className="inline-flex items-center gap-1 rounded-full border border-base-300/70 bg-base-200/40 pl-2.5 pr-1 py-1 text-xs"
            >
              Fase: {p}
              <button
                type="button"
                onClick={() =>
                  onFiltersChange(prev => ({
                    ...prev,
                    phase: prev.phase?.filter(x => x !== p) ?? [],
                  }))
                }
                className="win-icon-button rounded-full"
                aria-label={`Remover filtro fase ${p}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </header>
  );
};

QADashboardHeaderToolbar.displayName = 'QADashboardHeaderToolbar';

import React, { useState } from 'react';
import { ClipboardCheck, Download, Filter, ChevronDown, X } from 'lucide-react';
import type { DashboardFilters } from './DashboardFiltersModal';

export interface QADashboardHeaderToolbarProps {
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

/**
 * Cabeçalho do dashboard do projeto, ações (filtrar / exportar) e chips de filtros ativos.
 */
export const QADashboardHeaderToolbar: React.FC<QADashboardHeaderToolbarProps> = ({
  lastUpdatedText,
  activeFiltersCount,
  filters,
  onFiltersChange,
  onOpenFiltersModal,
  onOpenExportModal,
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="h-6 w-6 text-primary shrink-0" aria-hidden />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-base-content">Dashboard</h2>
          </div>
          <p className="text-base-content/70 text-sm max-w-2xl">
            Indicadores calculados a partir das tarefas do projeto (status, prazos e responsáveis). Respeita os filtros
            abaixo.
          </p>
          {lastUpdatedText && (
            <p className="text-xs text-base-content/50 mt-1" title="Última alteração do projeto">
              Projeto atualizado {lastUpdatedText}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenFiltersModal}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors flex items-center gap-1.5 border border-transparent"
              aria-label="Filtrar dados do dashboard"
            >
              <Filter className="w-3.5 h-3.5" aria-hidden />
              <span>{`Filtrar${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}</span>
            </button>
            <button
              type="button"
              onClick={onOpenExportModal}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors flex items-center gap-1.5 border border-transparent"
              aria-label="Exportar dados do projeto"
            >
              <Download className="w-3.5 h-3.5" aria-hidden />
              <span>Exportar</span>
            </button>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {filters.period && filters.period !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs bg-base-200 border border-base-300">
                  Período: {periodLabel(filters.period)}
                  <button
                    type="button"
                    onClick={() => onFiltersChange((prev) => ({ ...prev, period: 'all' }))}
                    className="btn btn-ghost btn-xs rounded-full p-0.5"
                    aria-label="Remover filtro período"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filters.taskType ?? []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs bg-base-200 border border-base-300"
                >
                  Tipo: {t}
                  <button
                    type="button"
                    onClick={() =>
                      onFiltersChange((prev) => ({
                        ...prev,
                        taskType: prev.taskType?.filter((x) => x !== t) ?? [],
                      }))
                    }
                    className="btn btn-ghost btn-xs rounded-full p-0.5"
                    aria-label={`Remover filtro tipo ${t}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {(filters.testStatus ?? []).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs bg-base-200 border border-base-300"
                >
                  Status teste: {testStatusLabel(s)}
                  <button
                    type="button"
                    onClick={() =>
                      onFiltersChange((prev) => ({
                        ...prev,
                        testStatus: prev.testStatus?.filter((x) => x !== s) ?? [],
                      }))
                    }
                    className="btn btn-ghost btn-xs rounded-full p-0.5"
                    aria-label={`Remover filtro status ${s}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {(filters.phase ?? []).map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs bg-base-200 border border-base-300"
                >
                  Fase: {p}
                  <button
                    type="button"
                    onClick={() =>
                      onFiltersChange((prev) => ({
                        ...prev,
                        phase: prev.phase?.filter((x) => x !== p) ?? [],
                      }))
                    }
                    className="btn btn-ghost btn-xs rounded-full p-0.5"
                    aria-label={`Remover filtro fase ${p}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative md:hidden ml-auto">
            <button
              type="button"
              onClick={() => setShowActionsMenu((v) => !v)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-base-content/70 hover:bg-base-200 border border-base-300 flex items-center gap-1.5"
              aria-expanded={showActionsMenu}
              aria-label="Menu de ações"
            >
              <span>Ações</span>
              <ChevronDown className="w-3.5 h-3.5" aria-hidden />
            </button>
            {showActionsMenu && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setShowActionsMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 py-1 rounded-xl border border-base-300 bg-base-100 shadow-lg min-w-[180px]">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenFiltersModal();
                      setShowActionsMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-base-200 flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    {`Filtrar${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenExportModal();
                      setShowActionsMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-base-200 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

QADashboardHeaderToolbar.displayName = 'QADashboardHeaderToolbar';

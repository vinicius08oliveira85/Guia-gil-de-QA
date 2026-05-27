import React, { useState } from 'react';
import { Download, Filter, ChevronDown, X } from 'lucide-react';
import type { DashboardFilters } from './DashboardFiltersModal';
import { cn } from '../../utils/cn';
import {
  qaDashboardHeaderActionBtnClass,
  qaDashboardHeaderFilterChipClass,
  qaDashboardHeaderJiraBadgeClass,
  qaDashboardHeaderMutedClass,
  qaDashboardHeaderShellClass,
  qaDashboardHeaderSubtitleClass,
  qaDashboardHeaderTitleClass,
} from '../common/projectCardUi';
import {
  dashboardFilterBtnActiveClass,
  dashboardFilterBtnClass,
  dashboardFilterToolbarClass,
  dashboardFilterToolbarDividerClass,
  dashboardMobileActionBtnClass,
} from './dashboardNeuUi';
import { appMenuItemClass, appMenuPanelClass } from '../common/viewUi';

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
    <header className={qaDashboardHeaderShellClass}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h1 className={qaDashboardHeaderTitleClass}>Dashboard</h1>
            {jiraProjectKey ? (
              <span className={qaDashboardHeaderJiraBadgeClass}>Jira: {jiraProjectKey}</span>
            ) : null}
          </div>
          <p className={qaDashboardHeaderSubtitleClass}>
            Indicadores calculados a partir das tarefas do projeto (status, prazos e responsáveis).
          </p>
          <p className={cn(qaDashboardHeaderMutedClass, 'mt-0.5 text-sm')}>
            Respeita os filtros aplicados.
          </p>
          {lastUpdatedText ? (
            <p
              className={cn(qaDashboardHeaderMutedClass, 'mt-1 text-xs')}
              title="Última alteração do projeto"
            >
              Projeto atualizado {lastUpdatedText}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          <div
            className={cn(dashboardFilterToolbarClass, 'hidden md:inline-flex')}
            role="group"
            aria-label="Filtrar e exportar"
          >
            <button
              type="button"
              onClick={onOpenFiltersModal}
              className={cn(
                'rounded-l-full',
                activeFiltersCount > 0 ? dashboardFilterBtnActiveClass : dashboardFilterBtnClass
              )}
              aria-label={`Filtrar dados do dashboard${activeFiltersCount > 0 ? `, ${activeFiltersCount} ativos` : ''}`}
            >
              <Filter className="h-4 w-4 shrink-0" aria-hidden />
              <span>Filtrar{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}</span>
              {activeFiltersCount > 0 ? (
                <span className="inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--leve-header-accent)_14%,var(--app-neu-bg))] px-1 font-sans text-[10px] font-bold tabular-nums text-[var(--leve-header-accent)]">
                  {activeFiltersCount}
                </span>
              ) : null}
            </button>

            <div className={dashboardFilterToolbarDividerClass} aria-hidden />

            <button
              type="button"
              onClick={onOpenExportModal}
              className={cn(dashboardFilterBtnClass, 'rounded-r-full')}
              aria-label="Exportar dados do projeto"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              <span>Exportar</span>
            </button>
          </div>

          <div className="relative ml-auto md:hidden">
            <button
              type="button"
              className={dashboardMobileActionBtnClass}
              onClick={() => setShowActionsMenu(v => !v)}
              aria-expanded={showActionsMenu}
              aria-label="Menu de ações"
            >
              Ações
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
            {showActionsMenu ? (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setShowActionsMenu(false)}
                />
                <div
                  className={cn(
                    appMenuPanelClass,
                    'absolute right-0 top-full z-20 mt-1 min-w-[180px] py-1'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onOpenFiltersModal();
                      setShowActionsMenu(false);
                    }}
                    className={appMenuItemClass}
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
                    className={appMenuItemClass}
                  >
                    <Download className="h-4 w-4 shrink-0" aria-hidden />
                    Exportar
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {activeFiltersCount > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filters.period && filters.period !== 'all' ? (
            <span className={qaDashboardHeaderFilterChipClass}>
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
          ) : null}
          {(filters.taskType ?? []).map(t => (
            <span key={t} className={qaDashboardHeaderFilterChipClass}>
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
            <span key={s} className={qaDashboardHeaderFilterChipClass}>
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
            <span key={p} className={qaDashboardHeaderFilterChipClass}>
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
      ) : null}
    </header>
  );
};

QADashboardHeaderToolbar.displayName = 'QADashboardHeaderToolbar';

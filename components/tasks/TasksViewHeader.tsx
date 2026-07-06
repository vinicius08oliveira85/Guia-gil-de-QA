import React, { useState } from 'react';
import { Plus, Filter, ChevronDown, ClipboardList } from 'lucide-react';
import { GeneralIAAnalysisButton } from './GeneralIAAnalysisButton';
import { cn } from '../../utils/cn';
import { appMenuItemClass, appMenuPanelClass } from '../common/viewUi';
import { viewHeroMobileActionBtnClass } from '../common/viewHeroChromeUi';
import {
  tasksViewHeaderFilterCountClass,
  tasksViewHeaderFilterIconClass,
  tasksViewHeaderIaIconClass,
  tasksViewHeaderIconWrapClass,
  tasksViewHeaderPrimaryBtnClass,
  tasksViewHeaderPrimaryCtaClass,
  tasksViewHeaderProgressFillClass,
  tasksViewHeaderProgressTrackClass,
  tasksViewHeaderSecondaryBtnActiveClass,
  tasksViewHeaderSecondaryBtnClass,
  tasksViewHeaderSecondaryToolbarClass,
  tasksViewHeaderSecondaryToolbarDividerClass,
  tasksViewHeaderActionsClass,
  tasksViewPageHeaderShellClass,
  tasksViewPageJiraBadgeClass,
  tasksViewPageSubtitleClass,
  tasksViewPageTitleClass,
} from './tasksPanelNeuStyles';
import { tasksViewEyebrowClass } from './tasksViewNeuUi';

export interface TasksViewHeaderProps {
  jiraProjectKey?: string;
  onAddTask: () => void;
  onOpenFilters: () => void;
  onAnalyze: () => void;
  isRunningGeneralAnalysis: boolean;
  analysisProgress: {
    current: number;
    total: number;
    message?: string;
    estimatedSeconds?: number;
  } | null;
  activeFiltersCount: number;
}

export const TasksViewHeader: React.FC<TasksViewHeaderProps> = ({
  jiraProjectKey,
  onAddTask,
  onOpenFilters,
  onAnalyze,
  isRunningGeneralAnalysis,
  analysisProgress,
  activeFiltersCount,
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  return (
    <header className={tasksViewPageHeaderShellClass}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className={tasksViewEyebrowClass}>
            <ClipboardList className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Projeto · Tarefas & Testes
          </p>
          <div className="mb-1.5 mt-2 flex flex-wrap items-center gap-2 sm:mt-2.5">
            <h1 className={tasksViewPageTitleClass}>Tarefas & Casos de Teste</h1>
            {jiraProjectKey ? (
              <span className={tasksViewPageJiraBadgeClass}>Jira: {jiraProjectKey}</span>
            ) : null}
          </div>
          <p className={cn(tasksViewPageSubtitleClass, 'max-w-2xl')}>
            Progresso das atividades, casos de teste e resultados de QA do projeto.
          </p>
        </div>

        <div className={tasksViewHeaderActionsClass}>
          <button
            type="button"
            onClick={onAddTask}
            disabled={isRunningGeneralAnalysis}
            title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
            className={cn(tasksViewHeaderPrimaryBtnClass, tasksViewHeaderPrimaryCtaClass, 'shrink-0')}
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Adicionar Tarefa</span>
            <span className="sm:hidden">Tarefa</span>
          </button>

          {/* Desktop: IA + Filtros no trilho inset (modelo Filtrar/Exportar) */}
          <div
            className={cn(tasksViewHeaderSecondaryToolbarClass, 'hidden md:inline-flex')}
            role="group"
            aria-label="Ações secundárias"
          >
            <GeneralIAAnalysisButton
              onAnalyze={onAnalyze}
              isAnalyzing={isRunningGeneralAnalysis}
              progress={analysisProgress}
              grouped
              groupedBtnClassName={tasksViewHeaderSecondaryBtnClass}
              groupedIconClassName={tasksViewHeaderIaIconClass}
              groupedIconWrapClassName={tasksViewHeaderIconWrapClass}
              groupedProgressTrackClassName={tasksViewHeaderProgressTrackClass}
              groupedProgressFillClassName={tasksViewHeaderProgressFillClass}
            />

            <div className={tasksViewHeaderSecondaryToolbarDividerClass} aria-hidden />

            <button
              type="button"
              onClick={onOpenFilters}
              disabled={isRunningGeneralAnalysis}
              title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
              className={
                activeFiltersCount > 0
                  ? tasksViewHeaderSecondaryBtnActiveClass
                  : tasksViewHeaderSecondaryBtnClass
              }
              aria-label={`Filtros${activeFiltersCount > 0 ? `, ${activeFiltersCount} ativos` : ''}`}
            >
              <span className={tasksViewHeaderIconWrapClass} aria-hidden>
                <Filter className={tasksViewHeaderFilterIconClass} />
              </span>
              <span className="hidden lg:inline">
                Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </span>
              <span className="lg:hidden">Filtros</span>
              {activeFiltersCount > 0 ? (
                <span className={tasksViewHeaderFilterCountClass}>{activeFiltersCount}</span>
              ) : null}
            </button>
          </div>

          {/* Mobile: menu compacto (evita overflow da toolbar com texto longo da IA) */}
          <div className="relative w-full md:hidden">
            <button
              type="button"
              className={cn(viewHeroMobileActionBtnClass, 'w-full justify-center')}
              onClick={() => setShowActionsMenu(v => !v)}
              aria-expanded={showActionsMenu}
              aria-label="Menu de ações"
              disabled={isRunningGeneralAnalysis}
            >
              Ações
              <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
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
                    'absolute right-0 top-full z-20 mt-1 min-w-[min(100%,16rem)] py-1'
                  )}
                >
                  <button
                    type="button"
                    className={appMenuItemClass}
                    onClick={() => {
                      void onAnalyze();
                      setShowActionsMenu(false);
                    }}
                    disabled={isRunningGeneralAnalysis}
                  >
                    Análise geral com IA
                  </button>
                  <button
                    type="button"
                    className={appMenuItemClass}
                    onClick={() => {
                      onOpenFilters();
                      setShowActionsMenu(false);
                    }}
                    disabled={isRunningGeneralAnalysis}
                  >
                    <Filter className="h-4 w-4 shrink-0" aria-hidden />
                    Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

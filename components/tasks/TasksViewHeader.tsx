import React from 'react';
import { Plus, Filter } from 'lucide-react';
import { GeneralIAAnalysisButton } from './GeneralIAAnalysisButton';
import { cn } from '../../utils/cn';
import {
  tasksViewHeaderFilterCountClass,
  tasksViewHeaderFilterIconClass,
  tasksViewHeaderIaIconClass,
  tasksViewHeaderIconWrapClass,
  tasksViewHeaderPrimaryBtnClass,
  tasksViewHeaderProgressFillClass,
  tasksViewHeaderProgressTrackClass,
  tasksViewHeaderSecondaryBtnActiveClass,
  tasksViewHeaderSecondaryBtnClass,
  tasksViewHeaderSecondaryToolbarClass,
  tasksViewHeaderSecondaryToolbarDividerClass,
  tasksViewPageHeaderShellClass,
  tasksViewPageJiraBadgeClass,
  tasksViewPageSubtitleClass,
  tasksViewPageTitleClass,
} from './tasksPanelNeuStyles';

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
}) => (
  <header className={tasksViewPageHeaderShellClass}>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <h1 className={tasksViewPageTitleClass}>Tarefas & Casos de Teste</h1>
          {jiraProjectKey ? (
            <span className={tasksViewPageJiraBadgeClass}>Jira: {jiraProjectKey}</span>
          ) : null}
        </div>
        <p className={cn(tasksViewPageSubtitleClass, 'max-w-2xl')}>
          Progresso das atividades, casos de teste e resultados de QA do projeto.
        </p>
      </div>

      <div className="flex w-full items-center gap-2 lg:w-auto lg:justify-end">
        <button
          type="button"
          onClick={onAddTask}
          disabled={isRunningGeneralAnalysis}
          title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
          className={tasksViewHeaderPrimaryBtnClass}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Adicionar Tarefa</span>
          <span className="sm:hidden">Tarefa</span>
        </button>

        <div
          className={tasksViewHeaderSecondaryToolbarClass}
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
            className={cn(
              'rounded-r-full',
              activeFiltersCount > 0
                ? tasksViewHeaderSecondaryBtnActiveClass
                : tasksViewHeaderSecondaryBtnClass
            )}
            aria-label={`Filtros${activeFiltersCount > 0 ? `, ${activeFiltersCount} ativos` : ''}`}
          >
            <span className={tasksViewHeaderIconWrapClass} aria-hidden>
              <Filter className={tasksViewHeaderFilterIconClass} />
            </span>
            <span className="hidden sm:inline">
              Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </span>
            {activeFiltersCount > 0 ? (
              <span className={tasksViewHeaderFilterCountClass}>
                {activeFiltersCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </div>
  </header>
);

import React from 'react';
import { Plus, Filter } from 'lucide-react';
import { GeneralIAAnalysisButton } from './GeneralIAAnalysisButton';
import { cn } from '../../utils/cn';
import {
  contextBadgeClass,
  outlineActionBtn,
  pageSubtitleClass,
  pageTitleClass,
  primaryActionBtn,
} from '../common/viewUi';

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
  <header className="flex flex-col gap-3 border-b border-[var(--brand-surface-border)] pb-4 sm:gap-4 sm:pb-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <h1 className={pageTitleClass}>Tarefas & Casos de Teste</h1>
          {jiraProjectKey && (
            <span className={contextBadgeClass}>Jira: {jiraProjectKey}</span>
          )}
        </div>
        <p className={cn(pageSubtitleClass, 'max-w-2xl')}>
          Progresso das atividades, casos de teste e resultados de QA do projeto.
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
        <button
          type="button"
          onClick={onAddTask}
          disabled={isRunningGeneralAnalysis}
          title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
          className={primaryActionBtn}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Adicionar Tarefa
        </button>

        <GeneralIAAnalysisButton
          onAnalyze={onAnalyze}
          isAnalyzing={isRunningGeneralAnalysis}
          progress={analysisProgress}
        />

        <button
          type="button"
          onClick={onOpenFilters}
          disabled={isRunningGeneralAnalysis}
          title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
          className={cn(outlineActionBtn, activeFiltersCount > 0 && 'border-[color-mix(in_srgb,var(--brand-cta)_45%,transparent)] text-[var(--brand-cta)]')}
          aria-label={`Filtros${activeFiltersCount > 0 ? `, ${activeFiltersCount} ativos` : ''}`}
        >
          <Filter className="h-4 w-4 shrink-0" aria-hidden />
          Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
        </button>
      </div>
    </div>
  </header>
);

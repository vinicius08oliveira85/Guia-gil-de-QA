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

      {/* Toolbar de ações — ação primária + ações secundárias agrupadas */}
      <div className="flex w-full items-center gap-2 lg:w-auto lg:justify-end">
        {/* Botão primário: Adicionar Tarefa */}
        <button
          type="button"
          onClick={onAddTask}
          disabled={isRunningGeneralAnalysis}
          title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
          className={primaryActionBtn}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Adicionar Tarefa</span>
          <span className="sm:hidden">Tarefa</span>
        </button>

        {/* Grupo secundário: IA + Filtros numa única barra pill */}
        <div
          className="inline-flex items-stretch rounded-[var(--radius)] border border-base-300/60 bg-base-100 shadow-sm"
          role="group"
          aria-label="Ações secundárias"
        >
          <GeneralIAAnalysisButton
            onAnalyze={onAnalyze}
            isAnalyzing={isRunningGeneralAnalysis}
            progress={analysisProgress}
            grouped
          />

          <div className="my-1.5 w-px shrink-0 bg-base-300/60" aria-hidden />

          <button
            type="button"
            onClick={onOpenFilters}
            disabled={isRunningGeneralAnalysis}
            title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
            className={cn(
              'inline-flex min-h-[36px] items-center gap-1.5 rounded-r-[var(--radius)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-base-200/60 disabled:opacity-50 sm:min-h-0',
              activeFiltersCount > 0
                ? 'text-[var(--brand-cta)]'
                : 'text-base-content/70 hover:text-base-content'
            )}
            aria-label={`Filtros${activeFiltersCount > 0 ? `, ${activeFiltersCount} ativos` : ''}`}
          >
            <Filter className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">
              Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-cta)] text-[10px] font-bold text-white sm:hidden">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  </header>
);

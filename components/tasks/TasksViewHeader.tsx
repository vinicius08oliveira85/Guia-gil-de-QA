import React from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button } from '../common/Button';
import { SectionHeader } from '../common/SectionHeader';
import { GeneralIAAnalysisButton } from './GeneralIAAnalysisButton';

export interface TasksViewHeaderProps {
    onAddTask: () => void;
    onOpenFilters: () => void;
    onAnalyze: () => void;
    isRunningGeneralAnalysis: boolean;
    analysisProgress: { current: number; total: number; message?: string; estimatedSeconds?: number } | null;
    activeFiltersCount: number;
}

export const TasksViewHeader: React.FC<TasksViewHeaderProps> = ({
    onAddTask,
    onOpenFilters,
    onAnalyze,
    isRunningGeneralAnalysis,
    analysisProgress,
    activeFiltersCount,
}) => (
    <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <SectionHeader
            as="h1"
            align="left"
            fullWidth
            titleSize="page"
            title="Tarefas & Casos de Teste"
            description="Acompanhe o progresso das atividades e resultados de QA."
            className="max-w-2xl"
        />
        <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end">
            <Button
                variant="default"
                size="sm"
                onClick={onAddTask}
                disabled={isRunningGeneralAnalysis}
                title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
                className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] sm:min-h-0"
            >
                <Plus className="h-4 w-4" aria-hidden />
                <span>Adicionar Tarefa</span>
            </Button>

            <div className="shrink-0">
                <GeneralIAAnalysisButton
                    onAnalyze={onAnalyze}
                    isAnalyzing={isRunningGeneralAnalysis}
                    progress={analysisProgress}
                />
            </div>

            <div className="hidden h-8 w-px shrink-0 bg-base-300 sm:block" aria-hidden />

            <Button
                variant="ghost"
                size="sm"
                onClick={onOpenFilters}
                disabled={isRunningGeneralAnalysis}
                title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
                className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-base-300 px-3 text-sm transition-all duration-200 hover:bg-base-200/60 active:scale-[0.98] sm:min-h-0"
            >
                <Filter className="h-4 w-4" aria-hidden />
                <span>{`Filtros${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}</span>
            </Button>
        </div>
    </div>
);

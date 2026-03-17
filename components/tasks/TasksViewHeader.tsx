import React from 'react';
import { Button } from '../common/Button';
import { Plus, Filter } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        <div className="flex-shrink-0 text-left">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-base-content">Tarefas & Casos de Teste</h2>
            <p className="text-base-content/70 text-sm mt-1">Acompanhe o progresso das atividades e resultados de QA.</p>
        </div>
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
            <Button
                variant="default"
                size="sm"
                onClick={onAddTask}
                disabled={isRunningGeneralAnalysis}
                title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
                className="rounded-full px-3 py-1.5 text-xs min-h-0 flex items-center gap-1.5 font-semibold flex-shrink-0 shadow-sm transition-all active:scale-95"
            >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Tarefa</span>
            </Button>

            <div className="flex-shrink-0">
                <GeneralIAAnalysisButton
                    onAnalyze={onAnalyze}
                    isAnalyzing={isRunningGeneralAnalysis}
                    progress={analysisProgress}
                />
            </div>

            <div className="w-px h-8 bg-base-300 flex-shrink-0 hidden sm:block" />

            <Button
                variant="outline"
                size="sm"
                onClick={onOpenFilters}
                disabled={isRunningGeneralAnalysis}
                title={isRunningGeneralAnalysis ? 'Conclua a análise em andamento' : undefined}
                className="rounded-full px-3 py-1.5 text-xs min-h-0 flex items-center gap-1.5 flex-shrink-0 hover:bg-base-200"
            >
                <Filter className="w-3.5 h-3.5" />
                <span>{`Filtros${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}</span>
            </Button>
        </div>
    </div>
);

import React from 'react';
import { Card } from '../common/Card';
import {
  dashboardInsetTileClass,
  dashboardPanelClass,
  dashboardSectionDividerClass,
} from './dashboardNeuUi';

interface QuickAnalysisCardProps {
  averageFailuresPerDay: number;
  topProblematicTasks: Array<{
    taskId: string;
    taskTitle: string;
    failureCount: number;
  }>;
  reexecutedTests: number;
}

/**
 * Card de análises rápidas (média falhas, top problemáticas, retrabalho)
 */
export const QuickAnalysisCard: React.FC<QuickAnalysisCardProps> = React.memo(
  ({ averageFailuresPerDay, topProblematicTasks, reexecutedTests }) => {
    return (
      <Card className={dashboardPanelClass} aria-label="Análises rápidas">
        <h3 className="text-lg font-semibold text-base-content">Análises Rápidas</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={dashboardInsetTileClass}>
            <p className="mb-1 text-xs text-base-content/70">Média de Falhas/Dia</p>
            <p className="text-xl font-bold text-base-content">
              {averageFailuresPerDay.toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-base-content/70">Últimos 30 dias</p>
          </div>

          <div className={dashboardInsetTileClass}>
            <p className="mb-1 text-xs text-base-content/70">Testes Reexecutados</p>
            <p className="text-xl font-bold text-base-content">{reexecutedTests}</p>
            <p className="mt-1 text-xs text-base-content/70">Indicador de retrabalho</p>
          </div>

          <div className={dashboardInsetTileClass}>
            <p className="mb-1 text-xs text-base-content/70">Funcionalidades Problemáticas</p>
            <p className="text-xl font-bold text-base-content">{topProblematicTasks.length}</p>
            <p className="mt-1 text-xs text-base-content/70">Top 3 identificadas</p>
          </div>
        </div>

        {topProblematicTasks.length > 0 && (
          <div className={dashboardSectionDividerClass}>
            <p className="mb-3 text-sm font-medium text-base-content">Top 3 Mais Problemáticas:</p>
            <div className="space-y-2">
              {topProblematicTasks.map((task, index) => (
                <div
                  key={task.taskId}
                  className="flex items-center justify-between rounded-xl border border-error/30 bg-error/10 p-4"
                  aria-label={`${index + 1}º lugar: ${task.taskTitle} com ${task.failureCount} falhas`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex-shrink-0 text-sm font-bold text-error">#{index + 1}</span>
                    <p className="truncate text-sm font-medium text-base-content">
                      {task.taskTitle}
                    </p>
                  </div>
                  <span className="ml-2 flex-shrink-0 text-sm font-semibold text-error">
                    {task.failureCount} falhas
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {topProblematicTasks.length === 0 && (
          <div className="py-4 text-center text-sm text-base-content/70">
            Nenhuma funcionalidade problemática identificada.
          </div>
        )}
      </Card>
    );
  }
);

QuickAnalysisCard.displayName = 'QuickAnalysisCard';

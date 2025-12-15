import React from 'react';
import { Card } from '../common/Card';

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
export const QuickAnalysisCard: React.FC<QuickAnalysisCardProps> = React.memo(({
  averageFailuresPerDay,
  topProblematicTasks,
  reexecutedTests,
}) => {
  return (
    <Card className="p-5 space-y-4" aria-label="Análises rápidas">
      <h3 className="text-lg font-semibold text-base-content">Análises Rápidas</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Média de falhas por dia */}
        <div className="p-4 bg-base-200 rounded-xl border border-base-300">
          <p className="text-xs text-base-content/70 mb-1">Média de Falhas/Dia</p>
          <p className="text-xl font-bold text-base-content">
            {averageFailuresPerDay.toFixed(1)}
          </p>
          <p className="text-xs text-base-content/70 mt-1">Últimos 30 dias</p>
        </div>

        {/* Retrabalho */}
        <div className="p-4 bg-base-200 rounded-xl border border-base-300">
          <p className="text-xs text-base-content/70 mb-1">Testes Reexecutados</p>
          <p className="text-xl font-bold text-base-content">{reexecutedTests}</p>
          <p className="text-xs text-base-content/70 mt-1">Indicador de retrabalho</p>
        </div>

        {/* Top problemáticas */}
        <div className="p-4 bg-base-200 rounded-xl border border-base-300">
          <p className="text-xs text-base-content/70 mb-1">Funcionalidades Problemáticas</p>
          <p className="text-xl font-bold text-base-content">{topProblematicTasks.length}</p>
          <p className="text-xs text-base-content/70 mt-1">Top 3 identificadas</p>
        </div>
      </div>

      {/* Lista de top problemáticas */}
      {topProblematicTasks.length > 0 && (
        <div className="pt-4 border-t border-base-300">
          <p className="text-sm font-medium text-base-content mb-3">Top 3 Mais Problemáticas:</p>
          <div className="space-y-2">
            {topProblematicTasks.map((task, index) => (
              <div
                key={task.taskId}
                className="flex items-center justify-between p-4 bg-error/10 rounded-xl border border-error/30"
                aria-label={`${index + 1}º lugar: ${task.taskTitle} com ${task.failureCount} falhas`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-bold flex-shrink-0 text-error">
                    #{index + 1}
                  </span>
                  <p className="text-sm text-base-content truncate font-medium">{task.taskTitle}</p>
                </div>
                <span className="text-sm font-semibold ml-2 flex-shrink-0 text-error">
                  {task.failureCount} falhas
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topProblematicTasks.length === 0 && (
        <div className="text-center py-4 text-sm text-base-content/70">
          Nenhuma funcionalidade problemática identificada.
        </div>
      )}
    </Card>
  );
});

QuickAnalysisCard.displayName = 'QuickAnalysisCard';


import React, { useMemo, useState } from 'react';
import { TaskIAAnalysis, JiraTask } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

interface TaskAnalysisCardProps {
  analysis: TaskIAAnalysis;
  task?: JiraTask;
  onTaskClick?: (taskId: string) => void;
  compact?: boolean;
}

export const TaskAnalysisCard: React.FC<TaskAnalysisCardProps> = ({
  analysis,
  task,
  onTaskClick,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(!compact);

  const riskBadgeClass = useMemo(() => {
    switch (analysis.riskLevel) {
      case 'Crítico':
        return 'badge badge-error badge-outline';
      case 'Alto':
        return 'badge badge-warning badge-outline';
      case 'Médio':
        return 'badge badge-info badge-outline';
      case 'Baixo':
        return 'badge badge-success badge-outline';
      default:
        return 'badge badge-neutral badge-outline';
    }
  }, [analysis.riskLevel]);

  return (
    <div
      className={cn(
        'p-5 bg-base-100 border rounded-xl transition-all',
        expanded ? 'shadow-lg border-primary/30' : 'shadow-sm border-base-300',
        analysis.isOutdated ? 'bg-warning/5 border-warning/30' : undefined
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {task && onTaskClick ? (
            <button
              type="button"
              onClick={() => onTaskClick(task.id)}
              className="text-left hover:text-primary transition-colors"
            >
              <h4 className="font-semibold text-base-content mb-1">{task.title}</h4>
              <p className="text-xs text-base-content/70">ID: {task.id}</p>
            </button>
          ) : (
            <div>
              <h4 className="font-semibold text-base-content mb-1">Tarefa {analysis.taskId}</h4>
              <p className="text-xs text-base-content/70">ID: {analysis.taskId}</p>
            </div>
          )}
        </div>

        {/* Risk Badge */}
        <div className={cn('badge badge-sm whitespace-nowrap', riskBadgeClass)}>
          {analysis.riskLevel}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-3">
        <p className="text-sm text-base-content line-clamp-2">{analysis.summary}</p>
      </div>

      {/* Expand/Collapse */}
      {compact && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="btn btn-ghost btn-sm w-full rounded-full"
        >
          <span>{expanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
          <svg
            className={cn('w-4 h-4 transition-transform', expanded ? 'rotate-180' : undefined)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-3 mt-3 pt-3 border-t border-base-300">
          {/* Problems */}
          {analysis.detectedProblems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                Problemas ({analysis.detectedProblems.length})
              </p>
              <div className="space-y-1">
                {analysis.detectedProblems.slice(0, 3).map((problem, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-error/10 border border-error/20 rounded-lg text-xs text-base-content hover:bg-error/15 hover:border-error/30 transition-all"
                  >
                    {problem}
                  </div>
                ))}
                {analysis.detectedProblems.length > 3 && (
                  <p className="text-xs text-base-content/70">
                    +{analysis.detectedProblems.length - 3} mais...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Missing Items */}
          {analysis.missingItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                Itens Faltantes ({analysis.missingItems.length})
              </p>
              <div className="space-y-1">
                {analysis.missingItems.slice(0, 2).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-warning/10 border border-warning/20 rounded-lg text-xs text-base-content flex items-start gap-2 hover:bg-warning/15 hover:border-warning/30 transition-all"
                  >
                    <span>⚠️</span>
                    <span>{item}</span>
                  </div>
                ))}
                {analysis.missingItems.length > 2 && (
                  <p className="text-xs text-base-content/70">
                    +{analysis.missingItems.length - 2} mais...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* BDD Suggestions */}
          {analysis.bddSuggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                Sugestões BDD ({analysis.bddSuggestions.length})
              </p>
              <div className="space-y-1">
                {analysis.bddSuggestions.slice(0, 2).map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-primary/10 border border-primary/20 rounded-lg text-xs text-base-content/70 font-mono hover:bg-primary/15 hover:border-primary/30 transition-all"
                  >
                    {suggestion}
                  </div>
                ))}
                {analysis.bddSuggestions.length > 2 && (
                  <p className="text-xs text-base-content/70">
                    +{analysis.bddSuggestions.length - 2} mais...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* QA Improvements */}
          {analysis.qaImprovements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                Melhorias ({analysis.qaImprovements.length})
              </p>
              <div className="space-y-1">
                {analysis.qaImprovements.slice(0, 2).map((improvement, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-success/10 border border-success/20 rounded-lg text-xs text-base-content flex items-start gap-2 hover:bg-success/15 hover:border-success/30 transition-all"
                  >
                    <span>💡</span>
                    <span>{improvement}</span>
                  </div>
                ))}
                {analysis.qaImprovements.length > 2 && (
                  <p className="text-xs text-base-content/70">
                    +{analysis.qaImprovements.length - 2} mais...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-2 border-t border-base-300">
            <p className="text-xs text-base-content/70 flex items-center gap-2">
              <span>
                Gerada em {format(new Date(analysis.generatedAt), "dd/MM/yyyy 'às' HH:mm")}
              </span>
              {analysis.isOutdated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 animate-pulse">
                  ⚠️ Desatualizada
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

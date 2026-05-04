import React, { useMemo, useState } from 'react';
import { TestIAAnalysis, TestCase, JiraTask } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

interface TestAnalysisCardProps {
  analysis: TestIAAnalysis;
  testCase?: TestCase;
  task?: JiraTask;
  onTaskClick?: (taskId: string) => void;
  compact?: boolean;
}

export const TestAnalysisCard: React.FC<TestAnalysisCardProps> = ({
  analysis,
  testCase,
  task,
  onTaskClick,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(!compact);

  const statusBadgeClass = useMemo(() => {
    if (!testCase) return 'badge badge-neutral badge-outline';
    switch (testCase.status) {
      case 'Passed':
        return 'badge badge-success badge-outline';
      case 'Failed':
        return 'badge badge-error badge-outline';
      case 'Not Run':
        return 'badge badge-neutral badge-outline';
      default:
        return 'badge badge-neutral badge-outline';
    }
  }, [testCase]);

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
          {testCase ? (
            <div>
              <h4 className="font-semibold text-base-content mb-1 line-clamp-1">
                {testCase.description}
              </h4>
              {task && onTaskClick ? (
                <button
                  type="button"
                  onClick={() => onTaskClick(task.id)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Tarefa: {task.title}
                </button>
              ) : (
                <p className="text-xs text-base-content/70">Tarefa: {analysis.taskId}</p>
              )}
            </div>
          ) : (
            <div>
              <h4 className="font-semibold text-base-content mb-1">Teste {analysis.testId}</h4>
              <p className="text-xs text-base-content/70">Tarefa: {analysis.taskId}</p>
            </div>
          )}
        </div>

        {/* Status Badge */}
        {testCase && (
          <div className={cn('badge badge-sm whitespace-nowrap', statusBadgeClass)}>
            {testCase.status}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mb-3">
        <p className="text-sm text-base-content line-clamp-2">{analysis.summary}</p>
      </div>

      {/* Coverage */}
      <div className="mb-3 p-3 bg-base-200 rounded-lg border border-base-300 hover:border-primary/30 transition-all">
        <p className="text-xs font-semibold text-base-content/70 mb-1">Cobertura</p>
        <p className="text-sm text-base-content">{analysis.coverage}</p>
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
                {analysis.detectedProblems.map((problem, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-error/10 border border-error/20 rounded-lg text-xs text-base-content hover:bg-error/15 hover:border-error/30 transition-all"
                  >
                    {problem}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                Sugestões ({analysis.suggestions.length})
              </p>
              <div className="space-y-1">
                {analysis.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-primary/10 border border-primary/20 rounded-lg text-xs text-base-content flex items-start gap-2 hover:bg-primary/15 hover:border-primary/30 transition-all"
                  >
                    <span>💡</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
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

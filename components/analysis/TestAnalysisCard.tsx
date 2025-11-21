import React, { useState } from 'react';
import { TestIAAnalysis, TestCase, JiraTask } from '../../types';
import { format } from 'date-fns';
import { windows12Styles, getStatusStyle } from '../../utils/windows12Styles';

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
  compact = false
}) => {
  const [expanded, setExpanded] = useState(!compact);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'Failed': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'Not Run': return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
      default: return 'text-text-secondary bg-surface-hover border-surface-border';
    }
  };

  return (
    <div className={`
      ${windows12Styles.card}
      ${windows12Styles.spacing.md}
      ${expanded ? `${windows12Styles.glow('accent')} shadow-xl` : 'shadow'}
      ${windows12Styles.transition.normal}
      hover:shadow-xl hover:border-accent/30 hover:scale-[1.01]
      ${analysis.isOutdated ? 'border-yellow-400/30 bg-yellow-400/5' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {testCase ? (
            <div>
              <h4 className="font-semibold text-text-primary mb-1 line-clamp-1">
                {testCase.description}
              </h4>
              {task && onTaskClick ? (
                <button
                  onClick={() => onTaskClick(task.id)}
                  className="text-xs text-accent hover:text-accent-light transition-colors"
                >
                  Tarefa: {task.title}
                </button>
              ) : (
                <p className="text-xs text-text-secondary">Tarefa: {analysis.taskId}</p>
              )}
            </div>
          ) : (
            <div>
              <h4 className="font-semibold text-text-primary mb-1">
                Teste {analysis.testId}
              </h4>
              <p className="text-xs text-text-secondary">Tarefa: {analysis.taskId}</p>
            </div>
          )}
        </div>
        
        {/* Status Badge */}
        {testCase && (
          <div className={`
            ${getStatusStyle(testCase.status)}
            ${windows12Styles.transition.fast}
          `}>
            {testCase.status}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mb-3">
        <p className="text-sm text-text-primary line-clamp-2">
          {analysis.summary}
        </p>
      </div>

      {/* Coverage */}
      <div className={`
        mb-3 p-2 bg-surface-hover rounded-lg border border-surface-border
        ${windows12Styles.transition.fast}
        hover:border-accent/30
      `}>
        <p className="text-xs font-semibold text-text-secondary mb-1">Cobertura</p>
        <p className="text-sm text-text-primary">{analysis.coverage}</p>
      </div>

      {/* Expand/Collapse */}
      {compact && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`
            w-full flex items-center justify-center gap-2 py-2 text-sm
            text-text-secondary hover:text-text-primary
            ${windows12Styles.transition.fast}
            rounded-lg hover:bg-surface-hover
          `}
        >
          <span>{expanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
          <svg
            className={`w-4 h-4 ${windows12Styles.transition.normal} ${expanded ? 'rotate-180' : ''}`}
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
        <div className={`
          space-y-3 mt-3 pt-3 border-t border-surface-border
          ${windows12Styles.transition.normal}
        `}>
          {/* Problems */}
          {analysis.detectedProblems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                Problemas ({analysis.detectedProblems.length})
              </p>
              <div className="space-y-1">
                {analysis.detectedProblems.map((problem, idx) => (
                  <div
                    key={idx}
                    className={`
                      p-2 bg-red-400/10 border border-red-400/20 rounded-lg
                      text-xs text-text-primary
                      ${windows12Styles.transition.fast}
                      hover:bg-red-400/15 hover:border-red-400/30
                    `}
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
              <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                Sugestões ({analysis.suggestions.length})
              </p>
              <div className="space-y-1">
                {analysis.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`
                      p-2 bg-accent/10 border border-accent/20 rounded-lg
                      text-xs text-text-primary flex items-start gap-2
                      ${windows12Styles.transition.fast}
                      hover:bg-accent/15 hover:border-accent/30
                    `}
                  >
                    <span>💡</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-2 border-t border-surface-border">
            <p className="text-xs text-text-secondary flex items-center gap-2">
              <span>Gerada em {format(new Date(analysis.generatedAt), "dd/MM/yyyy 'às' HH:mm")}</span>
              {analysis.isOutdated && (
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded
                  bg-yellow-400/20 text-yellow-400 border border-yellow-400/30
                  ${windows12Styles.transition.fast}
                  animate-pulse
                `}>
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


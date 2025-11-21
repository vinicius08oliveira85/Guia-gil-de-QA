import React, { useState } from 'react';
import { TaskIAAnalysis, JiraTask } from '../../types';
import { format } from 'date-fns';

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
  compact = false
}) => {
  const [expanded, setExpanded] = useState(!compact);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Crítico': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'Alto': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'Médio': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'Baixo': return 'text-green-400 bg-green-400/20 border-green-400/30';
      default: return 'text-text-secondary bg-surface-hover border-surface-border';
    }
  };

  return (
    <div className={`mica rounded-xl border border-surface-border p-4 transition-all ${
      expanded ? 'shadow-lg' : 'shadow'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {task && onTaskClick ? (
            <button
              onClick={() => onTaskClick(task.id)}
              className="text-left hover:text-accent transition-colors"
            >
              <h4 className="font-semibold text-text-primary mb-1">{task.title}</h4>
              <p className="text-xs text-text-secondary">ID: {task.id}</p>
            </button>
          ) : (
            <div>
              <h4 className="font-semibold text-text-primary mb-1">
                Tarefa {analysis.taskId}
              </h4>
              <p className="text-xs text-text-secondary">ID: {analysis.taskId}</p>
            </div>
          )}
        </div>
        
        {/* Risk Badge */}
        <div className={`px-3 py-1 rounded-lg border text-xs font-semibold ${getRiskColor(analysis.riskLevel)}`}>
          {analysis.riskLevel}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-3">
        <p className="text-sm text-text-primary line-clamp-2">
          {analysis.summary}
        </p>
      </div>

      {/* Expand/Collapse */}
      {compact && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span>{expanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
        <div className="space-y-3 mt-3 pt-3 border-t border-surface-border">
          {/* Problems */}
          {analysis.detectedProblems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                Problemas ({analysis.detectedProblems.length})
              </p>
              <div className="space-y-1">
                {analysis.detectedProblems.slice(0, 3).map((problem, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-red-400/10 border border-red-400/20 rounded text-xs text-text-primary"
                  >
                    {problem}
                  </div>
                ))}
                {analysis.detectedProblems.length > 3 && (
                  <p className="text-xs text-text-secondary">
                    +{analysis.detectedProblems.length - 3} mais...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Missing Items */}
          {analysis.missingItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                Itens Faltantes ({analysis.missingItems.length})
              </p>
              <div className="space-y-1">
                {analysis.missingItems.slice(0, 2).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-yellow-400/10 border border-yellow-400/20 rounded text-xs text-text-primary flex items-start gap-2"
                  >
                    <span>⚠️</span>
                    <span>{item}</span>
                  </div>
                ))}
                {analysis.missingItems.length > 2 && (
                  <p className="text-xs text-text-secondary">
                    +{analysis.missingItems.length - 2} mais...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* BDD Suggestions */}
          {analysis.bddSuggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                Sugestões BDD ({analysis.bddSuggestions.length})
              </p>
              <div className="space-y-1">
                {analysis.bddSuggestions.slice(0, 2).map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-accent/10 border border-accent/20 rounded text-xs text-text-secondary font-mono"
                  >
                    {suggestion}
                  </div>
                ))}
                {analysis.bddSuggestions.length > 2 && (
                  <p className="text-xs text-text-secondary">
                    +{analysis.bddSuggestions.length - 2} mais...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* QA Improvements */}
          {analysis.qaImprovements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                Melhorias ({analysis.qaImprovements.length})
              </p>
              <div className="space-y-1">
                {analysis.qaImprovements.slice(0, 2).map((improvement, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-green-400/10 border border-green-400/20 rounded text-xs text-text-primary flex items-start gap-2"
                  >
                    <span>💡</span>
                    <span>{improvement}</span>
                  </div>
                ))}
                {analysis.qaImprovements.length > 2 && (
                  <p className="text-xs text-text-secondary">
                    +{analysis.qaImprovements.length - 2} mais...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-2 border-t border-surface-border">
            <p className="text-xs text-text-secondary">
              Gerada em {format(new Date(analysis.generatedAt), "dd/MM/yyyy 'às' HH:mm")}
              {analysis.isOutdated && (
                <span className="ml-2 text-yellow-400">⚠️ Desatualizada</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


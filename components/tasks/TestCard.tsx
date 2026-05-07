import React, { useState } from 'react';
import { TestCase, JiraTask } from '../../types';
import { getPriorityVariant } from '../../utils/taskHelpers';
import { Badge } from '../common/Badge';

interface TestCardProps {
  testCase: TestCase;
  task: JiraTask;
  isSelected: boolean;
  onToggle: () => void;
  onExpand?: () => void;
}

/**
 * Card de teste com hover states, expansão de detalhes e indicadores visuais
 */
export const TestCard: React.FC<TestCardProps> = ({
  testCase,
  task,
  isSelected,
  onToggle,
  onExpand,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (onExpand) {
      onExpand();
    }
  };

  const getPriorityDotColor = (priority?: string): string => {
    switch (priority) {
      case 'Urgente':
        return 'bg-error';
      case 'Alta':
        return 'bg-warning';
      case 'Média':
        return 'bg-info';
      case 'Baixa':
        return 'bg-success';
      default:
        return 'bg-base-content/30';
    }
  };

  return (
    <div
      className={`
        group relative
        border rounded-lg transition-all duration-200
        ${
          isSelected
            ? 'bg-primary/10 border-primary shadow-md ring-2 ring-primary/20'
            : 'bg-base-100 border-base-300 hover:border-primary/50 hover:shadow-sm hover:bg-base-200'
        }
        cursor-pointer
      `}
      onClick={e => {
        // Se clicar no checkbox ou botão de expandir, não toggle o card
        if (
          (e.target as HTMLElement).closest('.test-checkbox') ||
          (e.target as HTMLElement).closest('.test-expand')
        ) {
          return;
        }
        onToggle();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (e.target === e.currentTarget) {
            onToggle();
          }
        }
      }}
      aria-label={`Teste: ${testCase.action || 'Sem ação definida'}`}
      aria-pressed={isSelected}
    >
      <div className="p-sm">
        <div className="flex items-start gap-sm">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            onClick={e => e.stopPropagation()}
            className="test-checkbox checkbox checkbox-sm mt-1"
            aria-label={`Selecionar teste: ${testCase.action || 'Sem ação definida'}`}
          />

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            {/* Header com status e prioridade */}
            <div className="flex items-start justify-between gap-sm mb-xs">
              <div className="flex items-center gap-xs flex-1 min-w-0">
                {/* Status dot */}
                <span
                  className="w-2 h-2 rounded-full bg-error flex-shrink-0"
                  aria-label="Teste falhado"
                ></span>

                {/* Prioridade dot (tarefa) */}
                {task.priority && (
                  <span
                    className={`w-2 h-2 rounded-full ${getPriorityDotColor(task.priority)} flex-shrink-0`}
                    aria-label={`Prioridade da tarefa: ${task.priority}`}
                  ></span>
                )}

                {/* Roteiro: ação (campo action) */}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-base-content/50">
                    Ação necessária
                  </p>
                  <p className="text-sm font-medium text-base-content truncate font-mono">
                    {testCase.action || 'Sem ação definida'}
                  </p>
                </div>
              </div>

              {/* Badge de prioridade da tarefa */}
              {task.priority && (
                <Badge
                  appearance="pill"
                  variant={getPriorityVariant(task.priority)}
                  size="sm"
                  className="flex-shrink-0"
                >
                  {task.priority}
                </Badge>
              )}
            </div>

            {/* Task info */}
            <p className="text-xs text-base-content/70 mb-xs">
              {task.id} - {task.title || 'Sem título'}
            </p>

            {/* Trechos úteis dos parâmetros */}
            {testCase.parameters?.trim() ? (
              <p className="text-xs text-base-content/60 line-clamp-2 whitespace-pre-wrap">
                {testCase.parameters}
              </p>
            ) : null}

            {/* Detalhes expandidos */}
            {isExpanded && (
              <div className="mt-sm pt-sm border-t border-base-300 space-y-xs">
                {testCase.observedResult && (
                  <div>
                    <p className="text-xs font-semibold text-base-content/70 mb-xs">
                      Resultado Obtido:
                    </p>
                    <p className="text-xs text-base-content/80 font-mono bg-base-200 p-xs rounded">
                      {testCase.observedResult}
                    </p>
                  </div>
                )}

                {testCase.parameters?.trim() ? (
                  <div>
                    <p className="text-xs font-semibold text-base-content/70 mb-xs">
                      Parâmetros necessários:
                    </p>
                    <p className="text-xs text-base-content/80 font-mono bg-base-200 p-xs rounded whitespace-pre-wrap">
                      {testCase.parameters}
                    </p>
                  </div>
                ) : null}

                {testCase.expectedResult && (
                  <div>
                    <p className="text-xs font-semibold text-base-content/70 mb-xs">
                      Resultado esperado:
                    </p>
                    <p className="text-xs text-base-content/80 font-mono bg-base-200 p-xs rounded">
                      {testCase.expectedResult}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Botão expandir/colapsar */}
            {(testCase.observedResult ||
              testCase.parameters?.trim() ||
              testCase.expectedResult) && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handleExpand();
                }}
                className="test-expand mt-xs btn btn-xs btn-ghost"
                aria-label={isExpanded ? 'Colapsar detalhes' : 'Expandir detalhes'}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                    <span className="text-xs">Menos</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    <span className="text-xs">Mais</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

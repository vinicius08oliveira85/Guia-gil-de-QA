import React from 'react';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { TestStrategy } from '../../types';
import { ToolsSelector } from './ToolsSelector';
import {
  taskCardFieldLabelClass,
  taskCardMutedClass,
  taskCardShellClass,
  taskPanelBorderClass,
  taskTextStrongClass,
} from './taskActionLayout';
import { cn } from '../../utils/cn';

interface TestStrategyCardProps {
  strategy: TestStrategy;
  strategyIndex: number;
  isExecuted?: boolean;
  onToggleExecuted?: (index: number, executed: boolean) => void;
  toolsUsed?: string[];
  onToolsChange?: (index: number, tools: string[]) => void;
}

export const TestStrategyCard: React.FC<TestStrategyCardProps> = ({
  strategy,
  strategyIndex,
  isExecuted = false,
  onToggleExecuted,
  toolsUsed = [],
  onToolsChange,
}) => {
  if (!strategy || !strategy.testType) {
    return null;
  }

  const handleToggleExecuted = () => {
    if (onToggleExecuted) {
      onToggleExecuted(strategyIndex, !isExecuted);
    }
  };

  const handleToolsChange = (tools: string[]) => {
    if (onToolsChange) {
      onToolsChange(strategyIndex, tools);
    }
  };

  return (
    <div
      className={cn(
        taskCardShellClass,
        'flex flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,oklch(var(--p))_35%,transparent)] hover:ring-1 hover:ring-[color-mix(in_oklch,oklch(var(--p))_22%,transparent)] motion-reduce:transform-none motion-reduce:hover:ring-0'
      )}
    >
      <div className="flex-grow p-5">
        <div className="mb-3 flex items-start justify-between">
          <h2 className="flex-1 pr-2 text-base font-bold leading-tight text-[oklch(var(--p))]">
            {strategy.testType}
          </h2>
          {onToggleExecuted && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={taskCardFieldLabelClass}>
                {isExecuted ? 'Concluir Teste' : 'Iniciar Teste'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isExecuted}
                  onChange={handleToggleExecuted}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-amber-500 peer-checked:bg-green-500 transition-colors peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-focus:outline-none after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          )}
        </div>

        <p className={cn('text-xs mb-4 leading-relaxed', taskCardMutedClass)}>{strategy.description}</p>

        {strategy.howToExecute && strategy.howToExecute.length > 0 && (
          <div className="mb-4">
            <h3 className={cn(taskCardFieldLabelClass, 'mb-2 flex items-center gap-1.5')}>
              <ListChecks className="w-3.5 h-3.5" aria-hidden />
              Como Executar:
            </h3>
            <ul className="space-y-1.5">
              {strategy.howToExecute.map((step, i) => (
                <li key={i} className={cn('flex items-start gap-2 text-xs', taskTextStrongClass)}>
                  {isExecuted ? (
                    <CheckCircle2
                      className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5"
                      aria-hidden
                    />
                  ) : (
                    <Circle
                      className={cn('w-4 h-4 flex-shrink-0 mt-0.5', taskCardMutedClass)}
                      aria-hidden
                    />
                  )}
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {strategy.tools && (
          <div>
            <h3 className={cn(taskCardFieldLabelClass, 'mb-1')}>
              Ferramentas Sugeridas:
            </h3>
            <p className={cn('text-xs italic', taskCardMutedClass)}>{strategy.tools}</p>
          </div>
        )}
      </div>

      {onToolsChange && (
        <div className={cn('border-t border-[var(--brand-surface-border)] bg-[var(--brand-chip)] px-5 py-4', taskPanelBorderClass)}>
          <p className={cn(taskCardFieldLabelClass, 'mb-3')}>
            Ferramentas Utilizadas
          </p>
          {toolsUsed.length === 0 && (
            <p className={cn('text-xs italic mb-3', taskCardMutedClass)}>
              Nenhuma ferramenta adicionada ainda.
            </p>
          )}
          <ToolsSelector
            selectedTools={toolsUsed}
            onToolsChange={handleToolsChange}
            label=""
            compact={true}
          />
        </div>
      )}
    </div>
  );
};

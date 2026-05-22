import React from 'react';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { TestStrategy } from '../../types';
import { ToolsSelector } from './ToolsSelector';
import { cn } from '../../utils/cn';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalInsetClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalSectionClass,
  leveTaskModalStrongClass,
} from '../common/projectCardUi';

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
        leveTaskModalSectionClass,
        'flex flex-col overflow-hidden transition-all duration-300 ease-out',
        'hover:border-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)]',
        'hover:shadow-[0_4px_18px_rgba(252,76,2,0.1)] motion-reduce:transform-none'
      )}
    >
      <div className="flex-grow p-5">
        <div className="mb-3 flex items-start justify-between">
          <h2 className="flex-1 pr-2 font-sans text-base font-bold leading-tight text-[var(--leve-header-accent)]">
            {strategy.testType}
          </h2>
          {onToggleExecuted && (
            <div className="flex shrink-0 items-center gap-2">
              <span className={leveTaskModalFieldLabelClass}>
                {isExecuted ? 'Concluir Teste' : 'Iniciar Teste'}
              </span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isExecuted}
                  onChange={handleToggleExecuted}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-[color-mix(in_srgb,var(--leve-header-text)_18%,transparent)] transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:bg-white after:transition-all peer-checked:bg-[color-mix(in_srgb,oklch(var(--su))_75%,transparent)] peer-checked:after:translate-x-full peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)]" />
              </label>
            </div>
          )}
        </div>

        <p className={cn('mb-4 text-xs leading-relaxed', leveTaskModalMutedClass)}>
          {strategy.description}
        </p>

        {strategy.howToExecute && strategy.howToExecute.length > 0 && (
          <div className="mb-4">
            <h3 className={cn(leveTaskModalFieldLabelClass, 'mb-2 flex items-center gap-1.5')}>
              <ListChecks className="h-3.5 w-3.5" aria-hidden />
              Como Executar:
            </h3>
            <ul className="space-y-1.5">
              {strategy.howToExecute.map((step, i) => (
                <li key={i} className={cn('flex items-start gap-2 text-xs', leveTaskModalStrongClass)}>
                  {isExecuted ? (
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-[color-mix(in_srgb,oklch(var(--su))_88%,transparent)]"
                      aria-hidden
                    />
                  ) : (
                    <Circle className={cn('mt-0.5 h-4 w-4 shrink-0', leveTaskModalMutedClass)} aria-hidden />
                  )}
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {strategy.tools && (
          <div>
            <h3 className={cn(leveTaskModalFieldLabelClass, 'mb-1')}>Ferramentas Sugeridas:</h3>
            <p className={cn('text-xs italic', leveTaskModalMutedXsClass)}>{strategy.tools}</p>
          </div>
        )}
      </div>

      {onToolsChange && (
        <div className={cn(leveTaskModalInsetClass, 'border-t border-[var(--leve-header-border)] px-5 py-4')}>
          <p className={cn(leveTaskModalFieldLabelClass, 'mb-3')}>Ferramentas Utilizadas</p>
          {toolsUsed.length === 0 && (
            <p className={cn('mb-3 text-xs italic', leveTaskModalMutedXsClass)}>
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

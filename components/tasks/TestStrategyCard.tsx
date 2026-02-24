import React from 'react';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { TestStrategy } from '../../types';
import { ToolsSelector } from './ToolsSelector';

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
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden flex flex-col transition-shadow hover:shadow-md">
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-base font-bold text-brand-orange leading-tight flex-1 pr-2">
            {strategy.testType}
          </h2>
          {onToggleExecuted && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-semibold text-base-content/60 uppercase tracking-wider">
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

        <p className="text-xs text-base-content/70 mb-4 leading-relaxed">{strategy.description}</p>

        {strategy.howToExecute && strategy.howToExecute.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[10px] font-bold text-base-content/60 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" aria-hidden />
              Como Executar:
            </h3>
            <ul className="space-y-1.5">
              {strategy.howToExecute.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-base-content/80">
                  {isExecuted ? (
                    <CheckCircle2
                      className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5"
                      aria-hidden
                    />
                  ) : (
                    <Circle
                      className="w-4 h-4 text-base-content/40 flex-shrink-0 mt-0.5"
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
            <h3 className="text-[10px] font-bold text-base-content/60 uppercase tracking-widest mb-1">
              Ferramentas Sugeridas:
            </h3>
            <p className="text-xs text-base-content/70 italic">{strategy.tools}</p>
          </div>
        )}
      </div>

      {onToolsChange && (
        <div className="bg-base-200/50 dark:bg-base-300/30 px-5 py-4 rounded-b-2xl border-t border-base-200">
          <p className="text-[10px] font-bold text-base-content/60 uppercase mb-3">
            Ferramentas Utilizadas
          </p>
          {toolsUsed.length === 0 && (
            <p className="text-xs text-base-content/60 italic mb-3">
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

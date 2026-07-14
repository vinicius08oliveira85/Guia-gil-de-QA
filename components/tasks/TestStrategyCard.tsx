import React, { useState } from 'react';
import { CheckCircle2, Circle, ListChecks, Loader2, Sparkles } from 'lucide-react';
import { TestStrategy } from '../../types';
import { ToolsSelector } from './ToolsSelector';
import { cn } from '../../utils/cn';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalStrongClass,
} from '../common/projectCardUi';
import {
  testStrategyCardClass,
  testStrategyStepsListClass,
  testStrategyToggleTrackClass,
  testStrategyInsetPanelClass,
} from './taskDetailsNeuUi';

interface TestStrategyCardProps {
  strategy: TestStrategy;
  strategyIndex: number;
  isExecuted?: boolean;
  onToggleExecuted?: (index: number, executed: boolean) => void;
  toolsUsed?: string[];
  onToolsChange?: (index: number, tools: string[]) => void;
  /** Gera/atualiza {@link TestStrategy.howToExecute} com IA para as ferramentas selecionadas. */
  onGenerateHowToExecute?: (index: number) => Promise<void>;
  isGeneratingHowToExecute?: boolean;
}

export const TestStrategyCard: React.FC<TestStrategyCardProps> = ({
  strategy,
  strategyIndex,
  isExecuted = false,
  onToggleExecuted,
  toolsUsed = [],
  onToolsChange,
  onGenerateHowToExecute,
  isGeneratingHowToExecute = false,
}) => {
  const [localGenerating, setLocalGenerating] = useState(false);

  if (!strategy || !strategy.testType) {
    return null;
  }

  const generating = isGeneratingHowToExecute || localGenerating;
  const canGenerateSteps =
    Boolean(onGenerateHowToExecute) && toolsUsed.length > 0 && !generating;

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

  const handleGenerateSteps = async () => {
    if (!onGenerateHowToExecute || toolsUsed.length === 0 || generating) return;
    setLocalGenerating(true);
    try {
      await onGenerateHowToExecute(strategyIndex);
    } finally {
      setLocalGenerating(false);
    }
  };

  return (
    <div className={testStrategyCardClass}>
      <div className="flex-grow p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="flex-1 pr-2 font-sans text-base font-bold leading-tight text-primary">
            {strategy.testType}
          </h2>
          {onToggleExecuted && (
            <div className="flex shrink-0 items-center gap-2">
              <span className={cn(leveTaskModalFieldLabelClass, 'whitespace-nowrap')}>
                {isExecuted ? 'Concluir Teste' : 'Iniciar Teste'}
              </span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isExecuted}
                  onChange={handleToggleExecuted}
                  className="peer sr-only"
                  aria-label={
                    isExecuted ? 'Marcar teste como não iniciado' : 'Marcar teste como iniciado'
                  }
                />
                <div className={testStrategyToggleTrackClass} aria-hidden />
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
            <ul className={testStrategyStepsListClass}>
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
        <div className={cn(testStrategyInsetPanelClass, 'mx-3 mb-3 sm:mx-4 sm:mb-4')}>
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
            neuVariant="taskModal"
          />

          {onGenerateHowToExecute ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void handleGenerateSteps()}
                disabled={!canGenerateSteps}
                className={cn(
                  'btn btn-primary btn-sm gap-1.5',
                  !canGenerateSteps && 'btn-disabled'
                )}
                aria-label={`Gerar passos com IA para ${strategy.testType}`}
                title={
                  toolsUsed.length === 0
                    ? 'Selecione ao menos uma ferramenta'
                    : 'Gera um passo a passo alinhado às ferramentas e à análise da tarefa'
                }
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                )}
                {generating ? 'Gerando passos…' : 'Gerar passos com IA'}
              </button>
              {toolsUsed.length === 0 ? (
                <p className={cn('mt-1.5 text-[11px]', leveTaskModalMutedXsClass)}>
                  Selecione uma ferramenta para gerar o passo a passo.
                </p>
              ) : (
                <p className={cn('mt-1.5 text-[11px]', leveTaskModalMutedXsClass)}>
                  Usa a análise da tarefa e as ferramentas selecionadas para montar o “Como executar”.
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

TestStrategyCard.displayName = 'TestStrategyCard';

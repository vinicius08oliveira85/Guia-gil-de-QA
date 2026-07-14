import React, { useEffect, useRef, useState } from 'react';
import { Bot, CheckCircle2, Circle, Copy, ListChecks, Loader2, Sparkles } from 'lucide-react';
import type { StrategyCursorAgentTestPrompt, TestStrategy } from '../../types';
import { ToolsSelector } from './ToolsSelector';
import { StructuredCursorPrompt } from './StructuredCursorPrompt';
import { cn } from '../../utils/cn';
import {
  CURSOR_AGENT_ACTION_BADGE_CLASS,
  CURSOR_AGENT_ACTION_LABELS,
} from '../../utils/cursorAgentUi';
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
import toast from 'react-hot-toast';

interface TestStrategyCardProps {
  strategy: TestStrategy;
  strategyIndex: number;
  isExecuted?: boolean;
  onToggleExecuted?: (index: number, executed: boolean) => void;
  toolsUsed?: string[];
  onToolsChange?: (index: number, tools: string[]) => void;
  /** Gera/atualiza passos e prompts do Agente do Cursor para as ferramentas selecionadas. */
  onGenerateHowToExecute?: (index: number) => Promise<void>;
  isGeneratingHowToExecute?: boolean;
}

function normalizeSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(step => (typeof step === 'string' ? step.trim() : String(step ?? '').trim()))
    .filter(Boolean);
}

async function copyPrompt(tool: string, prompt: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(prompt);
    toast.success(`Prompt ${tool} copiado.`);
  } catch {
    toast.error('Não foi possível copiar o prompt.');
  }
}

const StrategyCursorPromptPanel: React.FC<{ item: StrategyCursorAgentTestPrompt }> = ({
  item,
}) => {
  const action = item.action ?? 'create';
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Bot className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {item.tool}
          </span>
          <span className={cn('badge badge-sm', CURSOR_AGENT_ACTION_BADGE_CLASS[action])}>
            {CURSOR_AGENT_ACTION_LABELS[action]}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void copyPrompt(item.tool, item.prompt)}
          className="btn btn-primary btn-xs gap-1"
          aria-label={`Copiar prompt do Agente para ${item.tool}`}
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Copiar prompt
        </button>
      </div>
      <p className={cn('mb-2 text-[11px]', leveTaskModalMutedXsClass)}>
        Cole no chat do Agente do Cursor para criar o artefato de teste (código/collection).
      </p>
      <StructuredCursorPrompt prompt={item.prompt} />
    </div>
  );
};

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
  const howToExecuteRef = useRef<HTMLDivElement>(null);
  const prevStepsCountRef = useRef(0);

  const steps = normalizeSteps(strategy?.howToExecute);
  const agentPrompts = (strategy?.cursorAgentTestPrompts || []).filter(
    item => item?.tool?.trim() && item?.prompt?.trim()
  );
  const generating = isGeneratingHowToExecute || localGenerating;
  const canGenerateSteps =
    Boolean(onGenerateHowToExecute) && toolsUsed.length > 0 && !generating;

  useEffect(() => {
    const prev = prevStepsCountRef.current;
    prevStepsCountRef.current = steps.length;
    if (steps.length > 0 && steps.length !== prev) {
      howToExecuteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [steps.length]);

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
                aria-label={`Gerar passos e prompts do Agente para ${strategy.testType}`}
                title={
                  toolsUsed.length === 0
                    ? 'Selecione ao menos uma ferramenta'
                    : 'Gera o Como executar e um prompt do Agente do Cursor por ferramenta'
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
                  Selecione uma ferramenta para gerar o passo a passo e os prompts do Agente.
                </p>
              ) : (
                <p className={cn('mt-1.5 text-[11px]', leveTaskModalMutedXsClass)}>
                  Gera o “Como executar” e um prompt do Agente (código/collection) por ferramenta.
                </p>
              )}
            </div>
          ) : null}

          <div ref={howToExecuteRef} className="mt-4" aria-live="polite">
            <h3 className={cn(leveTaskModalFieldLabelClass, 'mb-2 flex items-center gap-1.5')}>
              <ListChecks className="h-3.5 w-3.5" aria-hidden />
              Como executar
            </h3>
            {generating ? (
              <p className={cn('text-xs italic', leveTaskModalMutedXsClass)}>
                Gerando passo a passo e prompts do Agente…
              </p>
            ) : steps.length > 0 ? (
              <ul className={testStrategyStepsListClass}>
                {steps.map((step, i) => (
                  <li
                    key={`${i}-${step.slice(0, 24)}`}
                    className={cn('flex items-start gap-2 text-xs', leveTaskModalStrongClass)}
                  >
                    {isExecuted ? (
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-[color-mix(in_srgb,oklch(var(--su))_88%,transparent)]"
                        aria-hidden
                      />
                    ) : (
                      <Circle
                        className={cn('mt-0.5 h-4 w-4 shrink-0', leveTaskModalMutedClass)}
                        aria-hidden
                      />
                    )}
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={cn('text-xs italic', leveTaskModalMutedXsClass)}>
                Nenhum passo ainda. Selecione as ferramentas e clique em “Gerar passos com IA”.
              </p>
            )}
          </div>

          {(generating || agentPrompts.length > 0) && (
            <div className="mt-4 space-y-3" aria-live="polite">
              <h3 className={cn(leveTaskModalFieldLabelClass, 'flex items-center gap-1.5')}>
                <Bot className="h-3.5 w-3.5" aria-hidden />
                Prompts — Agente do Cursor
              </h3>
              {generating && agentPrompts.length === 0 ? (
                <p className={cn('text-xs italic', leveTaskModalMutedXsClass)}>
                  Montando prompts por ferramenta…
                </p>
              ) : (
                agentPrompts.map(item => (
                  <StrategyCursorPromptPanel key={item.tool} item={item} />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {!onToolsChange && steps.length > 0 ? (
        <div className="space-y-4 px-5 pb-5">
          <div>
            <h3 className={cn(leveTaskModalFieldLabelClass, 'mb-2 flex items-center gap-1.5')}>
              <ListChecks className="h-3.5 w-3.5" aria-hidden />
              Como executar
            </h3>
            <ul className={testStrategyStepsListClass}>
              {steps.map((step, i) => (
                <li
                  key={`${i}-${step.slice(0, 24)}`}
                  className={cn('flex items-start gap-2 text-xs', leveTaskModalStrongClass)}
                >
                  <Circle className={cn('mt-0.5 h-4 w-4 shrink-0', leveTaskModalMutedClass)} aria-hidden />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
          {agentPrompts.length > 0 ? (
            <div className="space-y-3">
              <h3 className={cn(leveTaskModalFieldLabelClass, 'flex items-center gap-1.5')}>
                <Bot className="h-3.5 w-3.5" aria-hidden />
                Prompts — Agente do Cursor
              </h3>
              {agentPrompts.map(item => (
                <StrategyCursorPromptPanel key={item.tool} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

TestStrategyCard.displayName = 'TestStrategyCard';

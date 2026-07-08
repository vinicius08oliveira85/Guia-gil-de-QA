import React from 'react';
import { Spinner } from '../common/Spinner';
import { cn } from '../../utils/cn';
import { leveViewSecondaryToolbarBtnClass } from '../common/projectCardUi';
import { taskNeuBorderDividerClass, taskNeuTrackClass } from './taskActionLayout';

interface GeneralIAAnalysisButtonProps {
  onAnalyze: () => void | Promise<void>;
  isAnalyzing?: boolean;
  progress?: {
    current: number;
    total: number;
    message?: string;
    estimatedSeconds?: number;
  } | null;
  /** Quando true, remove bordas próprias e arredondamento lateral para se encaixar num grupo */
  grouped?: boolean;
  /** Sobrescreve estilos do botão no modo agrupado (ex.: paleta do TasksViewHeader) */
  groupedBtnClassName?: string;
  /** Sobrescreve cor do ícone da lâmpada */
  groupedIconClassName?: string;
  /** Círculo creme do ícone no modo agrupado */
  groupedIconWrapClassName?: string;
  groupedProgressTrackClassName?: string;
  groupedProgressFillClassName?: string;
}

export const GeneralIAAnalysisButton: React.FC<GeneralIAAnalysisButtonProps> = ({
  onAnalyze,
  isAnalyzing = false,
  progress,
  grouped = false,
  groupedBtnClassName,
  groupedIconClassName,
  groupedIconWrapClassName,
  groupedProgressTrackClassName,
  groupedProgressFillClassName,
}) => {
  const handleClick = async () => {
    if (isAnalyzing) return;
    try {
      await onAnalyze();
    } catch {
      // Caller handles error
    }
  };

  const stepLabel =
    isAnalyzing && progress && progress.total > 0
      ? `Etapa ${progress.current} de ${progress.total}`
      : null;
  const estimatedLabel =
    isAnalyzing && progress?.estimatedSeconds != null
      ? progress.estimatedSeconds < 60
        ? `~${progress.estimatedSeconds}s`
        : `~${Math.ceil(progress.estimatedSeconds / 60)} min`
      : null;
  const defaultTooltip =
    'Executa análise de risco e recomendações e pode gerar BDD e casos de teste para tarefas sem eles.';

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isAnalyzing}
        title={defaultTooltip}
        className={cn(
          grouped
            ? (groupedBtnClassName ?? leveViewSecondaryToolbarBtnClass)
            : cn(
                'btn btn-ghost btn-sm flex min-h-[44px] items-center gap-1.5 rounded-[var(--radius)] border px-3 text-xs font-semibold transition-colors duration-300 sm:min-h-0',
                taskNeuBorderDividerClass,
                'text-base-content/72 hover:bg-base-300/25 hover:text-base-content'
              ),
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
        aria-label={isAnalyzing ? 'Analisando' : 'Análise geral com IA'}
      >
        {isAnalyzing ? (
          grouped && groupedIconWrapClassName ? (
            <span className={groupedIconWrapClassName} aria-hidden>
              <Spinner small />
            </span>
          ) : (
            <Spinner small />
          )
        ) : (
          (() => {
            const bulbIcon = (
              <svg
                className={cn(
                  grouped && groupedIconClassName ? groupedIconClassName : 'h-3.5 w-3.5',
                  !(grouped && groupedIconClassName) && 'text-primary'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            );
            return grouped && groupedIconWrapClassName ? (
              <span className={groupedIconWrapClassName}>{bulbIcon}</span>
            ) : (
              bulbIcon
            );
          })()
        )}
        {grouped ? (
          <span
            className={cn(
              isAnalyzing && progress?.message && 'general-ia-analysis-btn__label--long'
            )}
          >
            {isAnalyzing
              ? progress?.message
                ? progress.message
                : 'Analisando…'
              : 'Análise geral com IA'}
          </span>
        ) : (
          <>
            <span className="hidden sm:inline">
              {isAnalyzing
                ? progress?.message
                  ? progress.message
                  : 'Analisando…'
                : 'Análise geral com IA'}
            </span>
            <span className="sm:hidden">{isAnalyzing ? '…' : 'IA'}</span>
          </>
        )}
      </button>
      {isAnalyzing && progress && (
        <div className="flex flex-col gap-0.5 w-full" aria-live="polite">
          {stepLabel && <span className="text-[10px] text-base-content/60">{stepLabel}</span>}
          {progress.total > 0 && (
            <div
              className={cn(
                grouped && groupedProgressTrackClassName
                  ? groupedProgressTrackClassName
                  : cn(taskNeuTrackClass, 'h-1 w-full overflow-hidden')
              )}
            >
              <div
                className={
                  grouped && groupedProgressFillClassName
                    ? groupedProgressFillClassName
                    : 'h-1 bg-primary transition-all duration-500'
                }
                style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
              />
            </div>
          )}
          {estimatedLabel && (
            <span className="text-[10px] text-base-content/50">{estimatedLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

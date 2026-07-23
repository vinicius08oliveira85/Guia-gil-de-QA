import React from 'react';
import { Lightbulb } from 'lucide-react';
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
  grouped?: boolean;
  groupedBtnClassName?: string;
  groupedIconClassName?: string;
  groupedIconWrapClassName?: string;
  groupedProgressTrackClassName?: string;
  groupedProgressFillClassName?: string;
  label?: string;
  tooltip?: string;
  ariaLabel?: string;
}

const formatEstimated = (seconds: number): string =>
  seconds < 60 ? `~${seconds}s` : `~${Math.ceil(seconds / 60)} min`;

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
  label = 'Análise geral com IA',
  tooltip = 'Executa análise de risco e recomendações e pode gerar BDD e casos de teste para tarefas sem eles.',
  ariaLabel,
}) => {
  const isBusy = isAnalyzing;
  const progressInfo = isBusy && progress && progress.total > 0 ? progress : null;
  const stepLabel = progressInfo ? `Etapa ${progressInfo.current} de ${progressInfo.total}` : null;
  const estimatedLabel = progress?.estimatedSeconds != null ? formatEstimated(progress.estimatedSeconds) : null;
  const labelText = isBusy ? (progress?.message ?? 'Analisando…') : label;
  const shortLabel = isBusy ? '…' : 'IA';

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isBusy}
        title={tooltip}
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
        aria-label={isBusy ? 'Analisando' : (ariaLabel ?? label)}
      >
        {isBusy ? (
          grouped && groupedIconWrapClassName ? (
            <span className={groupedIconWrapClassName} aria-hidden><Spinner small /></span>
          ) : (
            <Spinner small />
          )
        ) : (
          grouped && groupedIconWrapClassName ? (
            <span className={groupedIconWrapClassName}>
              <Lightbulb className={cn(groupedIconClassName ?? 'h-3.5 w-3.5 text-primary')} aria-hidden />
            </span>
          ) : (
            <Lightbulb className="h-3.5 w-3.5 text-primary" aria-hidden />
          )
        )}
        {grouped ? (
          <span>{labelText}</span>
        ) : (
          <>
            <span className="hidden sm:inline">{labelText}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </>
        )}
      </button>

      {progressInfo && (
        <div className="flex w-full flex-col gap-0.5" aria-live="polite">
          {stepLabel && <span className="text-[10px] text-base-content/60">{stepLabel}</span>}
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
              style={{ width: `${Math.round((progressInfo.current / progressInfo.total) * 100)}%` }}
            />
          </div>
          {estimatedLabel && (
            <span className="text-[10px] text-base-content/50">{estimatedLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

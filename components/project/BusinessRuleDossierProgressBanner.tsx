import React from 'react';
import { Loader2 } from 'lucide-react';
import type { DossierAiProgress } from '../../utils/businessRuleDossierProgress';
import { cn } from '../../utils/cn';

export interface BusinessRuleDossierProgressBannerProps {
  progress: DossierAiProgress;
  className?: string;
}

/**
 * Banner de progresso durante geração/reanálise do dossiê (lotes + síntese).
 */
export const BusinessRuleDossierProgressBanner: React.FC<BusinessRuleDossierProgressBannerProps> = ({
  progress,
  className,
}) => {
  const pct =
    progress.totalSteps > 0
      ? Math.min(100, Math.round((progress.step / progress.totalSteps) * 100))
      : 0;

  return (
    <div
      className={cn(
        'rounded-lg border border-info/30 bg-info/5 px-3 py-2.5 text-sm text-base-content/85',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Progresso da análise: ${progress.label}`}
    >
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-info" aria-hidden />
        <span className="min-w-0 flex-1">{progress.label}</span>
        {progress.totalSteps > 1 ? (
          <span className="shrink-0 text-xs tabular-nums text-base-content/60">
            {progress.step}/{progress.totalSteps}
          </span>
        ) : null}
      </div>
      {progress.totalSteps > 1 ? (
        <progress
          className="progress progress-info mt-2 h-1.5 w-full"
          value={progress.step}
          max={progress.totalSteps}
          aria-label={`${pct}% concluído`}
        />
      ) : null}
    </div>
  );
};

BusinessRuleDossierProgressBanner.displayName = 'BusinessRuleDossierProgressBanner';

import React, { useMemo } from 'react';
import { AlertTriangle, BookOpen, ClipboardList, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Tooltip } from '../common/Tooltip';
import type { TaskQaAlert } from '../../utils/taskCardQa';

export interface TaskTestExecutionCounts {
  total: number;
  passed: number;
  failed: number;
  pending: number;
}

export interface TaskCardQaInsightsProps {
  counts: TaskTestExecutionCounts;
  qaAlerts: TaskQaAlert[];
  iaAnalysisStale?: boolean;
  className?: string;
}

const ALERT_ICONS: Record<string, React.ReactNode> = {
  bdd: <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />,
  strategy: <ClipboardList className="h-3.5 w-3.5 shrink-0" aria-hidden />,
};

/**
 * Barra de execução, contadores e alertas compactos de QA no card da tarefa.
 */
export const TaskCardQaInsights: React.FC<TaskCardQaInsightsProps> = ({
  counts,
  qaAlerts,
  iaAnalysisStale = false,
  className,
}) => {
  const segments = useMemo(() => {
    const { total, passed, failed, pending } = counts;
    if (total <= 0) {
      return { passedPct: 0, failedPct: 0, pendingPct: 100 };
    }
    return {
      passedPct: (passed / total) * 100,
      failedPct: (failed / total) * 100,
      pendingPct: (pending / total) * 100,
    };
  }, [counts]);

  const hasAlerts = qaAlerts.length > 0 || iaAnalysisStale;

  if (counts.total === 0 && !hasAlerts) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1',
        className
      )}
      role="group"
      aria-label="Indicadores de QA da tarefa"
    >
      {counts.total > 0 ? (
        <div className="flex min-w-[7.5rem] max-w-[10rem] flex-col gap-0.5">
          <div
            className="flex h-1.5 w-full overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--brand-chip)]"
            role="progressbar"
            aria-valuenow={counts.passed + counts.failed}
            aria-valuemin={0}
            aria-valuemax={counts.total}
            aria-label={`Execução: ${counts.passed} passou, ${counts.failed} falhou, ${counts.pending} pendente de ${counts.total}`}
          >
            {segments.passedPct > 0 ? (
              <div
                className="h-full bg-success transition-[width] duration-300"
                style={{ width: `${segments.passedPct}%` }}
              />
            ) : null}
            {segments.failedPct > 0 ? (
              <div
                className="h-full bg-error transition-[width] duration-300"
                style={{ width: `${segments.failedPct}%` }}
              />
            ) : null}
            {segments.pendingPct > 0 ? (
              <div
                className="h-full bg-warning/75 transition-[width] duration-300"
                style={{ width: `${segments.pendingPct}%` }}
              />
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 font-body text-[9px] font-medium tabular-nums text-base-content/70">
            <span className="inline-flex items-center gap-0.5" title="Passou">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
              {counts.passed}
            </span>
            <span className="inline-flex items-center gap-0.5" title="Falhou">
              <span className="h-1.5 w-1.5 rounded-full bg-error" aria-hidden />
              {counts.failed}
            </span>
            <span className="inline-flex items-center gap-0.5" title="Pendente">
              <span className="h-1.5 w-1.5 rounded-full bg-warning/80" aria-hidden />
              {counts.pending}
            </span>
          </div>
        </div>
      ) : (
        <span className="rounded-md bg-[var(--brand-chip)] px-1.5 py-0.5 text-[9px] font-medium text-base-content/55">
          Sem casos de teste
        </span>
      )}

      {hasAlerts ? (
        <div className="flex shrink-0 items-center gap-1">
          {iaAnalysisStale ? (
            <Tooltip
              content="Análise de IA desatualizada em relação ao estado atual da tarefa. Gere novamente na aba de análises."
              position="top"
              ariaLabel="Análise IA desatualizada"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-warning/10 text-warning ring-1 ring-warning/25">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Tooltip>
          ) : null}
          {qaAlerts.map(alert => (
            <Tooltip key={alert.id} content={alert.tooltip} position="top" ariaLabel={alert.tooltip}>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[var(--brand-chip)] text-[var(--brand-text-muted)] ring-1 ring-[var(--brand-surface-border)]">
                {ALERT_ICONS[alert.id] ?? (
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden />
                )}
              </span>
            </Tooltip>
          ))}
        </div>
      ) : null}
    </div>
  );
};

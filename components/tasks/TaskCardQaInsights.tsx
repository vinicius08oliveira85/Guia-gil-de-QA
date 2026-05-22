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
  /** `inline` — barra e contadores na mesma linha do título do card. */
  variant?: 'stacked' | 'inline';
  className?: string;
}

const ALERT_ICONS: Record<string, React.ReactNode> = {
  bdd: <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />,
  strategy: <ClipboardList className="h-3.5 w-3.5 shrink-0" aria-hidden />,
};

const ALERT_BTN_CLASS =
  'inline-flex h-6 w-6 items-center justify-center rounded-md';

/**
 * Barra de execução, contadores e alertas compactos de QA no card da tarefa.
 */
export const TaskCardQaInsights: React.FC<TaskCardQaInsightsProps> = ({
  counts,
  qaAlerts,
  iaAnalysisStale = false,
  variant = 'stacked',
  className,
}) => {
  const isInline = variant === 'inline';
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
        'flex min-w-0 items-center',
        isInline
          ? 'shrink-0 flex-nowrap justify-end gap-1.5 sm:gap-2'
          : 'flex-wrap items-center gap-x-2 gap-y-1',
        className
      )}
      role="group"
      aria-label="Indicadores de QA da tarefa"
    >
      {counts.total > 0 ? (
        <div
          className={cn(
            'flex min-w-0 items-center',
            isInline
              ? 'shrink-0 flex-nowrap items-center justify-end gap-1.5 sm:gap-2'
              : 'min-w-[8rem] max-w-[12rem] flex-col gap-1'
          )}
        >
          <div
            className={cn(
              'flex shrink-0 overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--brand-chip)]',
              isInline ? 'h-2 w-[4.5rem] shrink-0 sm:w-[5.5rem]' : 'h-2 w-full'
            )}
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
                className="h-full bg-warning/80 transition-[width] duration-300"
                style={{ width: `${segments.pendingPct}%` }}
              />
            ) : null}
          </div>
          <div
            className={cn(
              'flex shrink-0 items-center font-sans font-semibold tabular-nums leading-none tracking-[var(--letter-spacing)] text-[var(--brand-text-muted)]',
              isInline ? 'gap-1.5 text-[10px]' : 'gap-1.5 text-[10px]'
            )}
          >
            <span className="inline-flex items-center gap-0.5" title="Passou">
              <span
                className={cn('rounded-full bg-success', isInline ? 'h-2 w-2' : 'h-2 w-2')}
                aria-hidden
              />
              {counts.passed}
            </span>
            <span className="inline-flex items-center gap-0.5" title="Falhou">
              <span className="h-2 w-2 rounded-full bg-error" aria-hidden />
              {counts.failed}
            </span>
            <span className="inline-flex items-center gap-0.5" title="Pendente">
              <span className="h-2 w-2 rounded-full bg-warning/85" aria-hidden />
              {counts.pending}
            </span>
          </div>
        </div>
      ) : (
        <span
          className={cn(
            'shrink-0 rounded-md bg-[var(--brand-chip)] font-medium text-[var(--brand-text-muted)]',
            isInline ? 'px-1.5 py-0.5 text-[10px]' : 'px-1.5 py-0.5 text-[10px]'
          )}
        >
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
              <span
                className={cn(
                  ALERT_BTN_CLASS,
                  'bg-warning/10 text-warning ring-1 ring-warning/25'
                )}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Tooltip>
          ) : null}
          {qaAlerts.map(alert => (
            <Tooltip key={alert.id} content={alert.tooltip} position="top" ariaLabel={alert.tooltip}>
              <span
                className={cn(
                  ALERT_BTN_CLASS,
                  'bg-[var(--brand-chip)] text-[var(--brand-text-muted)] ring-1 ring-[var(--brand-surface-border)]'
                )}
              >
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

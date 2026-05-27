import React from 'react';
import { Zap } from 'lucide-react';
import type { TaskTestStatus } from '../../types';
import { cn } from '../../utils/cn';
import { TaskTestStatusBadge } from '../common/TaskTestStatusBadge';
import { TestMetricBadge } from '../common/TestMetricBadge';
import {
  TASK_ACTION_SLOT_CLASSNAMES,
  TASK_ACTION_STRIP_GRID,
  taskCardActionChipBusy,
  taskCardActionChipCta,
} from './taskActionLayout';

export interface TaskExecutionSummary {
  passed: number;
  failed: number;
  pending: number;
}

interface TaskActionStripProps {
  aiPhaseMessage?: string | null;
  isAiProcessing?: boolean;
  showMetrics: boolean;
  metrics: TaskExecutionSummary;
  showGenerateAll: boolean;
  onGenerateAll?: React.MouseEventHandler<HTMLButtonElement>;
  isGenerateAllBusy?: boolean;
  isGenerateAllDisabled?: boolean;
  /** Substitui `taskCardActionChipCta` (ex.: listagem clara). */
  actionChipClassName?: string;
  /** Layout do chip de status de teste (`variant="card"`). */
  testStatusChipLayoutClassName?: string;
  /** Relevo dos contadores de métricas. */
  metricChipClassName?: string;
  generateAllClassName?: string;
  generateAllTitle: string;
  generateAllAriaLabel: string;
  testStatus: TaskTestStatus | 'sem_testes';
  testStatusLabelOverride?: string;
  onTestStatusClick?: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * Faixa desktop de ações da tarefa com slots fixos para alinhamento consistente.
 */
export const TaskActionStrip: React.FC<TaskActionStripProps> = ({
  aiPhaseMessage,
  isAiProcessing = false,
  showMetrics,
  metrics,
  showGenerateAll,
  onGenerateAll,
  isGenerateAllBusy = false,
  isGenerateAllDisabled = false,
  actionChipClassName = taskCardActionChipCta,
  testStatusChipLayoutClassName,
  metricChipClassName,
  generateAllClassName,
  generateAllTitle,
  generateAllAriaLabel,
  testStatus,
  testStatusLabelOverride,
  onTestStatusClick,
}) => {
  return (
    <div className="hidden md:flex md:w-full md:max-w-[22.5rem] md:flex-shrink-0 md:flex-col md:items-stretch md:gap-1">
      {isAiProcessing && aiPhaseMessage ? (
        <span
          className="inline-flex min-w-0 items-center justify-end gap-1 truncate text-[10px] font-medium text-primary/90"
          title={aiPhaseMessage}
        >
          <span className="loading loading-spinner loading-xs shrink-0 text-primary" aria-hidden />
          <span className="truncate">{aiPhaseMessage}</span>
        </span>
      ) : null}

      <div className={TASK_ACTION_STRIP_GRID}>
      <div className={cn('flex justify-end', TASK_ACTION_SLOT_CLASSNAMES.metrics)}>
        {showMetrics ? (
          <div className="flex items-center gap-1" role="group" aria-label="Métricas de teste">
            <TestMetricBadge
              value={metrics.passed}
              label="Aprovados"
              tone="success"
              size="sm"
              chipClassName={metricChipClassName}
            />
            <TestMetricBadge
              value={metrics.failed}
              label="Reprovados"
              tone="error"
              size="sm"
              chipClassName={metricChipClassName}
            />
            <TestMetricBadge
              value={metrics.pending}
              label="Pendentes"
              tone="warning"
              size="sm"
              chipClassName={metricChipClassName}
            />
          </div>
        ) : null}
      </div>

      <div className={cn('flex justify-center', TASK_ACTION_SLOT_CLASSNAMES.generateAll)}>
        {showGenerateAll && onGenerateAll ? (
          <button
            type="button"
            onClick={onGenerateAll}
            disabled={isGenerateAllDisabled}
            className={cn(
              actionChipClassName,
              'max-md:min-h-[44px]',
              isGenerateAllBusy && taskCardActionChipBusy,
              generateAllClassName
            )}
            title={generateAllTitle}
            aria-label={generateAllAriaLabel}
          >
            {isGenerateAllBusy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Zap className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            <span>{isGenerateAllBusy ? 'Gerando…' : 'Gerar Tudo'}</span>
          </button>
        ) : null}
      </div>

      <TaskTestStatusBadge
        status={testStatus}
        labelOverride={testStatusLabelOverride}
        onClick={onTestStatusClick}
        variant="card"
        chipLayoutClassName={testStatusChipLayoutClassName}
        className={TASK_ACTION_SLOT_CLASSNAMES.testStatus}
      />
      </div>
    </div>
  );
};

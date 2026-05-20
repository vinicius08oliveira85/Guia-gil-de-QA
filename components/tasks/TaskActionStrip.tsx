import React from 'react';
import { Zap } from 'lucide-react';
import type { TaskTestStatus } from '../../types';
import { cn } from '../../utils/cn';
import { TaskTestStatusBadge } from '../common/TaskTestStatusBadge';
import { TestMetricBadge } from '../common/TestMetricBadge';
import { TASK_ACTION_SLOT_CLASSNAMES, TASK_ACTION_STRIP_GRID } from './taskActionLayout';

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
  generateAllClassName?: string;
  generateAllTitle: string;
  generateAllAriaLabel: string;
  testStatus: TaskTestStatus | 'sem_testes';
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
  generateAllClassName,
  generateAllTitle,
  generateAllAriaLabel,
  testStatus,
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
            <TestMetricBadge value={metrics.passed} label="Aprovados" tone="success" size="sm" />
            <TestMetricBadge value={metrics.failed} label="Reprovados" tone="error" size="sm" />
            <TestMetricBadge value={metrics.pending} label="Pendentes" tone="warning" size="sm" />
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
              'w-full justify-center rounded-full px-3 py-2 sm:py-1.5 sm:px-4 min-h-[44px] sm:min-h-0 text-[10px] sm:text-xs font-bold inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-content shrink-0',
              generateAllClassName
            )}
            title={generateAllTitle}
            aria-label={generateAllAriaLabel}
          >
            {isGenerateAllBusy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{isGenerateAllBusy ? 'Gerando…' : 'Gerar Tudo'}</span>
          </button>
        ) : null}
      </div>

      <TaskTestStatusBadge
        status={testStatus}
        onClick={onTestStatusClick}
        className={cn('shrink-0 text-[10px] sm:text-xs', TASK_ACTION_SLOT_CLASSNAMES.testStatus)}
      />
      </div>
    </div>
  );
};

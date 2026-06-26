import React, { useMemo } from 'react';
import { User, UserCheck, Clock, CalendarPlus } from 'lucide-react';
import type { JiraTask } from '../../types';
import { cn } from '../../utils/cn';
import { classifyTaskSla, type SlaBucket } from '../../utils/jiraFilasMetrics';
import { tasksListMetadataBadgeClass } from './tasksListNeuUi';

const SLA_BUCKET_LABELS: Record<SlaBucket, string> = {
  onTrack: 'No prazo',
  atRisk: 'Em risco',
  overdue: 'Atrasada',
  noDueDate: 'Sem prazo',
};

function formatDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('pt-BR');
}

function resolveSlaToneClass(bucket: SlaBucket): string {
  switch (bucket) {
    case 'overdue':
      return 'text-error';
    case 'atRisk':
      return 'text-warning';
    default:
      return '';
  }
}

const chipClass = cn(tasksListMetadataBadgeClass, 'inline-flex min-w-0 items-center gap-1');

export interface JiraQueueMetaChipsProps {
  task: JiraTask;
}

/**
 * Chips de acompanhamento das Filas (Jira): Relator, Responsável, SLA e Data de
 * Criação. Alinhados à direita do card via slot `titleTrailing` do `TaskCardHeader`.
 */
export const JiraQueueMetaChips: React.FC<JiraQueueMetaChipsProps> = ({ task }) => {
  const meta = useMemo(() => {
    const slaBucket = classifyTaskSla(task);
    const dueLabel = formatDate(task.dueDate);
    return {
      reporter: task.reporter?.displayName?.trim() || '—',
      assignee: (task.jiraAssignee?.displayName ?? task.assignee)?.trim() || '—',
      slaBucket,
      slaLabel: dueLabel ? `${SLA_BUCKET_LABELS[slaBucket]} · ${dueLabel}` : SLA_BUCKET_LABELS[slaBucket],
      createdAt: formatDate(task.createdAt) ?? '—',
    };
  }, [task]);

  const slaToneClass = resolveSlaToneClass(meta.slaBucket);

  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-1.5 sm:gap-2">
      <span className={chipClass} title={`Relator: ${meta.reporter}`}>
        <User className="h-3 w-3 shrink-0" aria-hidden />
        <span className="max-w-[8rem] truncate">{meta.reporter}</span>
      </span>
      <span className={chipClass} title={`Responsável: ${meta.assignee}`}>
        <UserCheck className="h-3 w-3 shrink-0" aria-hidden />
        <span className="max-w-[8rem] truncate">{meta.assignee}</span>
      </span>
      <span
        className={cn(tasksListMetadataBadgeClass, 'inline-flex shrink-0 items-center gap-1', slaToneClass)}
        title={`SLA: ${meta.slaLabel}`}
      >
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
        {meta.slaLabel}
      </span>
      <span
        className={cn(tasksListMetadataBadgeClass, 'inline-flex shrink-0 items-center gap-1')}
        title={`Data de criação: ${meta.createdAt}`}
      >
        <CalendarPlus className="h-3 w-3 shrink-0" aria-hidden />
        {meta.createdAt}
      </span>
    </div>
  );
};

JiraQueueMetaChips.displayName = 'JiraQueueMetaChips';

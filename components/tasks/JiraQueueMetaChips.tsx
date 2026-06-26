import React, { useMemo } from 'react';
import { User, UserCheck, Clock, CalendarPlus, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { JiraTask } from '../../types';
import { cn } from '../../utils/cn';
import { classifyTaskSla, type SlaBucket } from '../../utils/jiraFilasMetrics';
import {
  classifyJiraSlaDisplay,
  formatJiraSlaChipLabel,
  formatJiraSlaTooltip,
  getJiraSlaToneClass,
  sortJiraSlasForDisplay,
  taskHasJiraSlas,
} from '../../utils/jiraSla';
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

function resolveDueDateToneClass(bucket: SlaBucket): string {
  switch (bucket) {
    case 'overdue':
      return 'text-error';
    case 'atRisk':
      return 'text-warning';
    case 'onTrack':
      return 'text-success';
    default:
      return '';
  }
}

const chipClass = cn(tasksListMetadataBadgeClass, 'inline-flex min-w-0 items-center gap-1');

function SlaStatusIcon({ status }: { status: ReturnType<typeof classifyJiraSlaDisplay> }) {
  if (status === 'met' || status === 'onTrack') {
    return <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />;
  }
  if (status === 'breached' || status === 'atRisk') {
    return <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />;
  }
  return <Clock className="h-3 w-3 shrink-0" aria-hidden />;
}

export interface JiraQueueMetaChipsProps {
  task: JiraTask;
}

/**
 * Chips de acompanhamento das Filas (Jira): Relator, Responsável, SLAs e Data de
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
      dueDateFallbackLabel: dueLabel
        ? `${SLA_BUCKET_LABELS[slaBucket]} · ${dueLabel}`
        : SLA_BUCKET_LABELS[slaBucket],
      createdAt: formatDate(task.createdAt) ?? '—',
      jiraSlas: taskHasJiraSlas(task) ? sortJiraSlasForDisplay(task.jiraSlas!) : [],
    };
  }, [task]);

  const dueDateToneClass = resolveDueDateToneClass(meta.slaBucket);

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

      {meta.jiraSlas.length > 0 ? (
        meta.jiraSlas.map(sla => {
          const displayStatus = classifyJiraSlaDisplay(sla);
          const toneClass = getJiraSlaToneClass(displayStatus);
          const label = formatJiraSlaChipLabel(sla, displayStatus);
          return (
            <span
              key={sla.name}
              className={cn(
                tasksListMetadataBadgeClass,
                'inline-flex shrink-0 items-center gap-1',
                toneClass
              )}
              title={formatJiraSlaTooltip(sla, displayStatus)}
            >
              <SlaStatusIcon status={displayStatus} />
              <span className="max-w-[9rem] truncate">{label}</span>
            </span>
          );
        })
      ) : (
        <span
          className={cn(
            tasksListMetadataBadgeClass,
            'inline-flex shrink-0 items-center gap-1',
            dueDateToneClass
          )}
          title={`SLA: ${meta.dueDateFallbackLabel}`}
        >
          <Clock className="h-3 w-3 shrink-0" aria-hidden />
          {meta.dueDateFallbackLabel}
        </span>
      )}

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

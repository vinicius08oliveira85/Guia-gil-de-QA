import React, { useMemo } from 'react';
import { User, UserCheck, Clock, CalendarPlus, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { JiraTask } from '../../types';
import { cn } from '../../utils/cn';
import { classifyTaskSla, type SlaBucket } from '../../utils/jiraFilasMetrics';
import {
  classifyJiraSlaDisplay,
  classifyTaskSlaFromJiraSlas,
  formatJiraSlaTooltip,
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

function resolveSlaToneClass(bucket: SlaBucket): string {
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

const chipClass = cn(tasksListMetadataBadgeClass, 'flex w-full min-w-0 items-center gap-1');

function SlaStatusIcon({ bucket }: { bucket: SlaBucket }) {
  if (bucket === 'onTrack') {
    return <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />;
  }
  if (bucket === 'overdue' || bucket === 'atRisk') {
    return <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />;
  }
  return <Clock className="h-3 w-3 shrink-0" aria-hidden />;
}

export interface JiraQueueMetaChipsProps {
  task: JiraTask;
}

/**
 * Chips de acompanhamento das Filas (Jira), na ordem:
 * Relator · Responsável · Status SLA · Data de Criação.
 *
 * O Status SLA é consolidado (pior caso entre os SLAs do Jira); o detalhamento
 * por SLA fica no tooltip e no resumo expandido (`JiraTaskSlaSummary`).
 * Alinhados à direita do card via slot `titleTrailing` do `TaskCardHeader`.
 */
export const JiraQueueMetaChips: React.FC<JiraQueueMetaChipsProps> = ({ task }) => {
  const meta = useMemo(() => {
    const jiraSlas = taskHasJiraSlas(task) ? sortJiraSlasForDisplay(task.jiraSlas!) : [];
    const slaBucket = classifyTaskSlaFromJiraSlas(jiraSlas) ?? classifyTaskSla(task);

    const slaTooltip =
      jiraSlas.length > 0
        ? jiraSlas
            .map(sla => formatJiraSlaTooltip(sla, classifyJiraSlaDisplay(sla)))
            .join('\n')
        : SLA_BUCKET_LABELS[slaBucket];

    return {
      reporter: task.reporter?.displayName?.trim() || '—',
      assignee: (task.jiraAssignee?.displayName ?? task.assignee)?.trim() || '—',
      slaBucket,
      slaLabel: SLA_BUCKET_LABELS[slaBucket],
      slaTooltip,
      createdAt: formatDate(task.createdAt) ?? '—',
    };
  }, [task]);

  const slaToneClass = resolveSlaToneClass(meta.slaBucket);

  return (
    <div
      className={cn(
        'grid shrink-0 items-center gap-1.5 sm:gap-2',
        'grid-cols-[minmax(0,9.5rem)_minmax(0,9.5rem)_minmax(0,7rem)_minmax(0,6rem)]'
      )}
      role="group"
      aria-label="Relator, Responsável, Status SLA e Data de Criação"
    >
      <span className={chipClass} title={`Relator: ${meta.reporter}`}>
        <User className="h-3 w-3 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{meta.reporter}</span>
      </span>

      <span className={chipClass} title={`Responsável: ${meta.assignee}`}>
        <UserCheck className="h-3 w-3 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{meta.assignee}</span>
      </span>

      <span
        className={cn(chipClass, slaToneClass)}
        title={`Status SLA: ${meta.slaTooltip}`}
      >
        <SlaStatusIcon bucket={meta.slaBucket} />
        <span className="min-w-0 flex-1 truncate">{meta.slaLabel}</span>
      </span>

      <span className={chipClass} title={`Data de criação: ${meta.createdAt}`}>
        <CalendarPlus className="h-3 w-3 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{meta.createdAt}</span>
      </span>
    </div>
  );
};

JiraQueueMetaChips.displayName = 'JiraQueueMetaChips';

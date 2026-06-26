import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import type { JiraTask } from '../../types';
import { cn } from '../../utils/cn';
import { taskModalSectionClass } from './taskActionLayout';
import {
  classifyJiraSlaDisplay,
  formatJiraSlaDateTimeLong,
  formatJiraSlaTooltip,
  getJiraSlaToneClass,
  sortJiraSlasForDisplay,
  taskHasJiraSlas,
  type JiraSlaDisplayStatus,
} from '../../utils/jiraSla';
import { classifyTaskSla } from '../../utils/jiraFilasMetrics';

function SlaRowIcon({ status }: { status: JiraSlaDisplayStatus }) {
  const className = 'h-3.5 w-3.5 shrink-0';
  if (status === 'met' || status === 'onTrack') {
    return <CheckCircle2 className={className} aria-hidden />;
  }
  if (status === 'breached' || status === 'atRisk') {
    return <AlertTriangle className={className} aria-hidden />;
  }
  return <Clock className={className} aria-hidden />;
}

/** Coluna esquerda: data/hora + ícone, com realce arredondado para SLAs atendidos. */
const SlaTimeCell: React.FC<{
  label: string;
  status: JiraSlaDisplayStatus;
  toneClass: string;
}> = ({ label, status, toneClass }) => (
  <div
    className={cn(
      'flex min-w-[8.5rem] shrink-0 items-center justify-between gap-2 rounded-full px-2.5 py-1',
      status === 'met'
        ? 'bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)]'
        : 'bg-transparent',
      toneClass
    )}
  >
    <span className="text-sm font-semibold tabular-nums leading-tight">{label}</span>
    <SlaRowIcon status={status} />
  </div>
);

export interface JiraTaskSlaSummaryProps {
  task: JiraTask;
  className?: string;
}

/**
 * Bloco de SLAs no formato do Jira Service Management (cabeçalho colapsável "SLAs",
 * data/ícone à esquerda + nome/meta à direita). Usado na aba Resumo das Filas (Jira).
 */
export const JiraTaskSlaSummary: React.FC<JiraTaskSlaSummaryProps> = ({ task, className }) => {
  const [isOpen, setIsOpen] = useState(true);

  const slas = useMemo(
    () => (taskHasJiraSlas(task) ? sortJiraSlasForDisplay(task.jiraSlas!) : []),
    [task]
  );

  const dueDateFallback = useMemo(() => {
    if (slas.length > 0 || !task.dueDate) return null;
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) return null;
    return {
      label: formatJiraSlaDateTimeLong(task.dueDate) ?? due.toLocaleDateString('pt-BR'),
      bucket: classifyTaskSla(task),
    };
  }, [slas.length, task]);

  const hasContent = slas.length > 0 || !!dueDateFallback;

  return (
    <section className={cn(taskModalSectionClass, 'p-3', className)} aria-label="SLAs">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex w-full items-center gap-1.5 text-left"
        aria-expanded={isOpen}
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--leve-header-text-muted)] transition-transform',
            isOpen ? '' : '-rotate-90'
          )}
          aria-hidden
        />
        <span className="text-sm font-semibold text-[var(--leve-header-text)]">SLAs</span>
      </button>

      {isOpen ? (
        <div className="mt-3">
          {!hasContent ? (
            <p className="text-sm text-[var(--leve-header-text-muted)]">
              Nenhum SLA retornado pelo Jira. Atualize a tarefa do Jira após importar.
            </p>
          ) : slas.length > 0 ? (
            <ul className="space-y-3" role="list">
              {slas.map(sla => {
                const status = classifyJiraSlaDisplay(sla);
                const toneClass = getJiraSlaToneClass(status);
                const when =
                  status === 'met'
                    ? formatJiraSlaDateTimeLong(sla.completedAt)
                    : formatJiraSlaDateTimeLong(sla.deadlineAt);

                return (
                  <li
                    key={sla.name}
                    className="flex items-center gap-3"
                    title={formatJiraSlaTooltip(sla, status)}
                  >
                    <SlaTimeCell label={when ?? '—'} status={status} toneClass={toneClass} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-[var(--leve-header-text)]">
                        {sla.name}
                      </p>
                      {sla.goalFriendly ? (
                        <p className="mt-0.5 text-xs text-[var(--leve-header-text-muted)]">
                          {sla.goalFriendly}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : dueDateFallback ? (
            <div className="flex items-center gap-3">
              <SlaTimeCell
                label={dueDateFallback.label}
                status={
                  dueDateFallback.bucket === 'overdue'
                    ? 'breached'
                    : dueDateFallback.bucket === 'atRisk'
                      ? 'atRisk'
                      : 'onTrack'
                }
                toneClass={
                  dueDateFallback.bucket === 'overdue'
                    ? 'text-error'
                    : dueDateFallback.bucket === 'atRisk'
                      ? 'text-warning'
                      : 'text-success'
                }
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--leve-header-text)]">Due Date</p>
                <p className="mt-0.5 text-xs text-[var(--leve-header-text-muted)]">
                  Prazo do Jira (SLA de fila indisponível)
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

JiraTaskSlaSummary.displayName = 'JiraTaskSlaSummary';

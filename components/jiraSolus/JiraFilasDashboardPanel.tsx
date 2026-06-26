import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListChecks,
  ListTodo,
  Loader2,
  Ban,
  CalendarClock,
  CalendarOff,
  ShieldCheck,
} from 'lucide-react';
import type { JiraTask } from '../../types';
import { cn } from '../../utils/cn';
import {
  computeJiraFilasMetrics,
  type JiraFilasFilter,
} from '../../utils/jiraFilasMetrics';
import { EmptyState } from '../common/EmptyState';
import {
  workspaceDaisyStatCardClass,
  workspaceDaisyStatLabelClass,
  workspaceDaisyStatValueClass,
  formatWorkspaceStatCount,
  formatWorkspaceStatPercent,
} from '../common/projectCardUi';
import {
  tasksViewPageHeaderShellClass,
  tasksViewPageJiraBadgeClass,
  tasksViewPageSubtitleClass,
  tasksViewPageTitleClass,
} from '../tasks/tasksPanelNeuStyles';
import {
  jiraSolusInnerPanelClass,
  jiraSolusSectionTitleClass,
} from './jiraSolusNeuUi';
import {
  JiraFilasDistributionBar,
  type JiraFilasDistributionSegment,
} from './JiraFilasDistributionBar';

export interface JiraFilasDashboardPanelProps {
  tasks: JiraTask[];
  selectedProjectKey?: string;
  slaRiskWindowHours: number;
  activeFilter: JiraFilasFilter;
  onApplyFilter: (filter: JiraFilasFilter) => void;
}

const statRegionClass = cn(
  'grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3',
  'max-md:gap-2'
);

const iconClass = 'h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-accent)] sm:h-4 sm:w-4';

interface IndicatorItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  filter?: JiraFilasFilter;
}

function filterKey(filter?: JiraFilasFilter): string {
  if (!filter || filter.kind === 'all') return 'all';
  if (filter.kind === 'status') return `status:${filter.status}`;
  return `sla:${filter.bucket}`;
}

const IndicatorGrid: React.FC<{
  items: IndicatorItem[];
  activeFilter: JiraFilasFilter;
  onApplyFilter: (filter: JiraFilasFilter) => void;
}> = ({ items, activeFilter, onApplyFilter }) => (
  <div className={statRegionClass}>
    {items.map(item => {
      const isActive = filterKey(item.filter) === filterKey(activeFilter);
      return (
        <button
          key={item.key}
          type="button"
          className={cn(
            workspaceDaisyStatCardClass,
            'w-full cursor-pointer border-0 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-stat-accent)]',
            isActive && 'dashboard-glass-indicator-card--active'
          )}
          title={`${item.label}: filtrar lista`}
          onClick={() => onApplyFilter(item.filter ?? { kind: 'all' })}
          aria-pressed={isActive}
        >
          <div className="flex items-center justify-center gap-1.5">
            {item.icon}
            <span className={workspaceDaisyStatLabelClass}>{item.label}</span>
          </div>
          <span className={workspaceDaisyStatValueClass}>{item.value}</span>
        </button>
      );
    })}
  </div>
);

/**
 * Dashboard das Filas (Jira) — indicadores de Status e SLA das tarefas importadas,
 * seguindo o modelo de cards do Dashboard de Projetos.
 */
export const JiraFilasDashboardPanel: React.FC<JiraFilasDashboardPanelProps> = ({
  tasks,
  selectedProjectKey,
  slaRiskWindowHours,
  activeFilter,
  onApplyFilter,
}) => {
  const metrics = useMemo(
    () => computeJiraFilasMetrics(tasks, Date.now(), slaRiskWindowHours),
    [tasks, slaRiskWindowHours]
  );

  if (tasks.length === 0) {
    return (
      <div className={cn(jiraSolusInnerPanelClass)}>
        <EmptyState
          icon={<ListChecks className="mx-auto h-12 w-12 text-[var(--brand-text-muted)]" aria-hidden />}
          title="Sem tarefas para analisar"
          description="Importe tarefas na aba Filas (Jira) para visualizar os indicadores de Status e SLA aqui."
        />
      </div>
    );
  }

  const summaryItems: IndicatorItem[] = [
    {
      key: 'total',
      icon: <ListChecks className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Total de tarefas',
      value: formatWorkspaceStatCount(metrics.total),
      filter: { kind: 'all' },
    },
    {
      key: 'done',
      icon: <CheckCircle2 className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Concluídas',
      value: formatWorkspaceStatPercent(metrics.donePercent),
      filter: { kind: 'status', status: 'Done' },
    },
    {
      key: 'progress',
      icon: <Loader2 className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Em andamento',
      value: formatWorkspaceStatCount(metrics.inProgressCount),
      filter: { kind: 'status', status: 'In Progress' },
    },
    {
      key: 'overdue',
      icon: <AlertTriangle className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'SLA estourado',
      value: formatWorkspaceStatCount(metrics.slaCounts.overdue),
      filter: { kind: 'sla', bucket: 'overdue' },
    },
  ];

  const statusItems: IndicatorItem[] = [
    {
      key: 'todo',
      icon: <ListTodo className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'A fazer',
      value: formatWorkspaceStatCount(metrics.statusCounts['To Do']),
      filter: { kind: 'status', status: 'To Do' },
    },
    {
      key: 'in-progress',
      icon: <Loader2 className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Em andamento',
      value: formatWorkspaceStatCount(metrics.statusCounts['In Progress']),
      filter: { kind: 'status', status: 'In Progress' },
    },
    {
      key: 'done',
      icon: <CheckCircle2 className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Concluídas',
      value: formatWorkspaceStatCount(metrics.statusCounts.Done),
      filter: { kind: 'status', status: 'Done' },
    },
    {
      key: 'blocked',
      icon: <Ban className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Bloqueadas',
      value: formatWorkspaceStatCount(metrics.statusCounts.Blocked),
      filter: { kind: 'status', status: 'Blocked' },
    },
  ];

  const slaItems: IndicatorItem[] = [
    {
      key: 'on-track',
      icon: <ShieldCheck className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'No prazo',
      value: formatWorkspaceStatCount(metrics.slaCounts.onTrack),
      filter: { kind: 'sla', bucket: 'onTrack' },
    },
    {
      key: 'at-risk',
      icon: <CalendarClock className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Em risco',
      value: formatWorkspaceStatCount(metrics.slaCounts.atRisk),
      filter: { kind: 'sla', bucket: 'atRisk' },
    },
    {
      key: 'overdue',
      icon: <Clock className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Atrasadas',
      value: formatWorkspaceStatCount(metrics.slaCounts.overdue),
      filter: { kind: 'sla', bucket: 'overdue' },
    },
    {
      key: 'no-due',
      icon: <CalendarOff className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Sem prazo',
      value: formatWorkspaceStatCount(metrics.slaCounts.noDueDate),
      filter: { kind: 'sla', bucket: 'noDueDate' },
    },
  ];

  const statusSegments: JiraFilasDistributionSegment[] = [
    {
      key: 'todo',
      label: 'A fazer',
      value: metrics.statusCounts['To Do'],
      colorClass: 'bg-[var(--brand-cta)]',
      filter: { kind: 'status', status: 'To Do' },
    },
    {
      key: 'in-progress',
      label: 'Em andamento',
      value: metrics.statusCounts['In Progress'],
      colorClass: 'bg-warning',
      filter: { kind: 'status', status: 'In Progress' },
    },
    {
      key: 'done',
      label: 'Concluídas',
      value: metrics.statusCounts.Done,
      colorClass: 'bg-success',
      filter: { kind: 'status', status: 'Done' },
    },
    {
      key: 'blocked',
      label: 'Bloqueadas',
      value: metrics.statusCounts.Blocked,
      colorClass: 'bg-error',
      filter: { kind: 'status', status: 'Blocked' },
    },
  ];

  const slaSegments: JiraFilasDistributionSegment[] = [
    {
      key: 'on-track',
      label: 'No prazo',
      value: metrics.slaCounts.onTrack,
      colorClass: 'bg-success',
      filter: { kind: 'sla', bucket: 'onTrack' },
    },
    {
      key: 'at-risk',
      label: 'Em risco',
      value: metrics.slaCounts.atRisk,
      colorClass: 'bg-warning',
      filter: { kind: 'sla', bucket: 'atRisk' },
    },
    {
      key: 'overdue',
      label: 'Atrasadas',
      value: metrics.slaCounts.overdue,
      colorClass: 'bg-error',
      filter: { kind: 'sla', bucket: 'overdue' },
    },
    {
      key: 'no-due',
      label: 'Sem prazo',
      value: metrics.slaCounts.noDueDate,
      colorClass: 'bg-[color-mix(in_srgb,var(--brand-text-muted)_45%,transparent)]',
      filter: { kind: 'sla', bucket: 'noDueDate' },
    },
  ];

  const slaCompliance =
    metrics.total > 0
      ? Math.round((metrics.slaCounts.onTrack / metrics.total) * 100)
      : 0;
  const slaAtRiskOrOverdue = metrics.slaCounts.atRisk + metrics.slaCounts.overdue;

  return (
    <div className="space-y-5" role="region" aria-label="Indicadores das filas do Jira">
      <header className={tasksViewPageHeaderShellClass}>
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h1 className={tasksViewPageTitleClass}>Dashboard</h1>
            {selectedProjectKey ? (
              <span className={tasksViewPageJiraBadgeClass}>Jira: {selectedProjectKey}</span>
            ) : null}
          </div>
          <p className={cn(tasksViewPageSubtitleClass, 'max-w-2xl')}>
            Visão consolidada de status e SLA das tarefas importadas. Clique em um indicador para
            filtrar a lista na aba Filas (Jira).
          </p>
        </div>
      </header>

      <section aria-label="Resumo das filas">
        <IndicatorGrid
          items={summaryItems}
          activeFilter={activeFilter}
          onApplyFilter={onApplyFilter}
        />
      </section>

      <section className={cn(jiraSolusInnerPanelClass, 'space-y-4')} aria-label="Distribuição por status">
        <h3 className={jiraSolusSectionTitleClass}>Status das tarefas</h3>
        <IndicatorGrid
          items={statusItems}
          activeFilter={activeFilter}
          onApplyFilter={onApplyFilter}
        />
        <JiraFilasDistributionBar
          segments={statusSegments}
          total={metrics.total}
          ariaLabel={`Distribuição de status: ${metrics.statusCounts['To Do']} a fazer, ${metrics.statusCounts['In Progress']} em andamento, ${metrics.statusCounts.Done} concluídas, ${metrics.statusCounts.Blocked} bloqueadas`}
          onApplyFilter={onApplyFilter}
        />
      </section>

      <section className={cn(jiraSolusInnerPanelClass, 'space-y-4')} aria-label="Indicadores de SLA">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className={jiraSolusSectionTitleClass}>SLA das tarefas</h3>
            <p className="mt-1 font-sans text-xs text-[var(--brand-text-muted)]">
              <strong className="font-semibold text-[var(--brand-text-strong)]">
                {slaCompliance}%
              </strong>{' '}
              no prazo
              {slaAtRiskOrOverdue > 0 ? (
                <>
                  {' · '}
                  <strong className="font-semibold text-[var(--brand-text-strong)]">
                    {formatWorkspaceStatCount(slaAtRiskOrOverdue)}
                  </strong>{' '}
                  exigindo atenção
                </>
              ) : null}
            </p>
          </div>
          <p className="font-sans text-[11px] text-[var(--brand-text-muted)]">
            SLA conforme o prazo definido no Jira.
          </p>
        </div>
        <IndicatorGrid items={slaItems} activeFilter={activeFilter} onApplyFilter={onApplyFilter} />
        <JiraFilasDistributionBar
          segments={slaSegments}
          total={metrics.total}
          ariaLabel={`Distribuição de SLA: ${metrics.slaCounts.onTrack} no prazo, ${metrics.slaCounts.atRisk} em risco, ${metrics.slaCounts.overdue} atrasadas, ${metrics.slaCounts.noDueDate} sem prazo`}
          onApplyFilter={onApplyFilter}
        />
      </section>
    </div>
  );
};

JiraFilasDashboardPanel.displayName = 'JiraFilasDashboardPanel';

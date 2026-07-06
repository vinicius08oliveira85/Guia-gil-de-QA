import React, { useMemo } from 'react';
import {
  AlertTriangle,
  BarChart3,
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
import {
  formatWorkspaceStatCount,
  formatWorkspaceStatPercent,
} from '../common/projectCardUi';
import {
  jiraSolusEyebrowClass,
  jiraSolusHeroChromeClass,
  jiraSolusHeroJiraBadgeClass,
  jiraSolusHeroShellClass,
  jiraSolusHeroSubtitleClass,
  jiraSolusHeroTitleClass,
  jiraSolusKpiCardActiveClass,
  jiraSolusKpiCardClass,
  jiraSolusKpiGridClass,
  jiraSolusKpiIconPlateClass,
  jiraSolusKpiLabelClass,
  jiraSolusKpiValueClass,
  jiraSolusPanelClass,
  jiraSolusSectionDescClass,
  jiraSolusSectionHeaderClass,
  jiraSolusSectionLabelClass,
} from './jiraSolusViewNeuUi';
import {
  jiraSolusInnerPanelClass,
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

const kpiIconClass = 'h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4';

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
  <div className={jiraSolusKpiGridClass}>
    {items.map(item => {
      const isActive = filterKey(item.filter) === filterKey(activeFilter);
      return (
        <button
          key={item.key}
          type="button"
          className={cn(
            jiraSolusKpiCardClass,
            isActive && jiraSolusKpiCardActiveClass
          )}
          title={`${item.label}: filtrar lista`}
          onClick={() => onApplyFilter(item.filter ?? { kind: 'all' })}
          aria-pressed={isActive}
        >
          <span className={jiraSolusKpiIconPlateClass} aria-hidden>
            {item.icon}
          </span>
          <span className={jiraSolusKpiLabelClass}>{item.label}</span>
          <span className={jiraSolusKpiValueClass}>{item.value}</span>
        </button>
      );
    })}
  </div>
);

/**
 * Dashboard das Filas (Jira) — indicadores de Status e SLA das tarefas importadas.
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
      <div className="space-y-3 sm:space-y-4">
        <div className={jiraSolusHeroShellClass}>
          <div className={jiraSolusHeroChromeClass}>
            <p className={jiraSolusEyebrowClass}>
              <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Acompanhamento · Dashboard
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className={jiraSolusHeroTitleClass}>Dashboard</h1>
            </div>
            <p className={cn(jiraSolusHeroSubtitleClass, 'mt-1')}>
              Visão consolidada de status e SLA das tarefas importadas do Jira Service Management.
            </p>
          </div>
        </div>
        <div className={jiraSolusPanelClass}>
          <EmptyState
            icon={<ListChecks className="mx-auto h-12 w-12 text-[var(--brand-text-muted)]" aria-hidden />}
            title="Sem tarefas para analisar"
            description="Importe tarefas na aba Filas (Jira) para visualizar os indicadores de Status e SLA aqui."
          />
        </div>
      </div>
    );
  }

  const summaryItems: IndicatorItem[] = [
    {
      key: 'total',
      icon: <ListChecks className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Total de tarefas',
      value: formatWorkspaceStatCount(metrics.total),
      filter: { kind: 'all' },
    },
    {
      key: 'done',
      icon: <CheckCircle2 className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Concluídas',
      value: formatWorkspaceStatPercent(metrics.donePercent),
      filter: { kind: 'status', status: 'Done' },
    },
    {
      key: 'progress',
      icon: <Loader2 className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Em andamento',
      value: formatWorkspaceStatCount(metrics.inProgressCount),
      filter: { kind: 'status', status: 'In Progress' },
    },
    {
      key: 'overdue',
      icon: <AlertTriangle className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'SLA estourado',
      value: formatWorkspaceStatCount(metrics.slaCounts.overdue),
      filter: { kind: 'sla', bucket: 'overdue' },
    },
  ];

  const statusItems: IndicatorItem[] = [
    {
      key: 'todo',
      icon: <ListTodo className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'A fazer',
      value: formatWorkspaceStatCount(metrics.statusCounts['To Do']),
      filter: { kind: 'status', status: 'To Do' },
    },
    {
      key: 'in-progress',
      icon: <Loader2 className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Em andamento',
      value: formatWorkspaceStatCount(metrics.statusCounts['In Progress']),
      filter: { kind: 'status', status: 'In Progress' },
    },
    {
      key: 'done',
      icon: <CheckCircle2 className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Concluídas',
      value: formatWorkspaceStatCount(metrics.statusCounts.Done),
      filter: { kind: 'status', status: 'Done' },
    },
    {
      key: 'blocked',
      icon: <Ban className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Bloqueadas',
      value: formatWorkspaceStatCount(metrics.statusCounts.Blocked),
      filter: { kind: 'status', status: 'Blocked' },
    },
  ];

  const slaItems: IndicatorItem[] = [
    {
      key: 'on-track',
      icon: <ShieldCheck className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'No prazo',
      value: formatWorkspaceStatCount(metrics.slaCounts.onTrack),
      filter: { kind: 'sla', bucket: 'onTrack' },
    },
    {
      key: 'at-risk',
      icon: <CalendarClock className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Em risco',
      value: formatWorkspaceStatCount(metrics.slaCounts.atRisk),
      filter: { kind: 'sla', bucket: 'atRisk' },
    },
    {
      key: 'overdue',
      icon: <Clock className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Atrasadas',
      value: formatWorkspaceStatCount(metrics.slaCounts.overdue),
      filter: { kind: 'sla', bucket: 'overdue' },
    },
    {
      key: 'no-due',
      icon: <CalendarOff className={kpiIconClass} strokeWidth={1.75} aria-hidden />,
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
    <div className="space-y-3 sm:space-y-4" role="region" aria-label="Indicadores das filas do Jira">
      <div className={jiraSolusHeroShellClass}>
        <div className={jiraSolusHeroChromeClass}>
          <p className={jiraSolusEyebrowClass}>
            <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Acompanhamento · Dashboard
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className={jiraSolusHeroTitleClass}>Dashboard</h1>
            {selectedProjectKey ? (
              <span className={jiraSolusHeroJiraBadgeClass}>Jira: {selectedProjectKey}</span>
            ) : null}
          </div>
          <p className={cn(jiraSolusHeroSubtitleClass, 'mt-1')}>
            Visão consolidada de status e SLA das tarefas importadas. Clique em um indicador para
            filtrar a lista na aba Filas (Jira).
          </p>
          <IndicatorGrid
            items={summaryItems}
            activeFilter={activeFilter}
            onApplyFilter={onApplyFilter}
          />
        </div>
      </div>

      <section className={cn(jiraSolusInnerPanelClass, 'space-y-4')} aria-label="Distribuição por status">
        <header className={jiraSolusSectionHeaderClass}>
          <h2 className={jiraSolusSectionLabelClass}>Status das tarefas</h2>
          <p className={jiraSolusSectionDescClass}>
            Distribuição por estado de workflow do Jira. Clique para filtrar na aba Filas.
          </p>
        </header>
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
        <header className={jiraSolusSectionHeaderClass}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className={jiraSolusSectionLabelClass}>SLA das tarefas</h2>
              <p className={jiraSolusSectionDescClass}>
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
            <p className="font-sans text-[11px] text-[color-mix(in_srgb,var(--brand-text-strong)_62%,transparent)]">
              SLA conforme o prazo definido no Jira.
            </p>
          </div>
        </header>
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

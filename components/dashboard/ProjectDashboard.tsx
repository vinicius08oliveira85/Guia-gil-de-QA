import React, { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Layers,
  PieChart,
  ShieldCheck,
  Target,
  UserRound,
} from 'lucide-react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { Tooltip } from '../common/Tooltip';
import { RadialProgress } from '../common/RadialProgress';
import { cn } from '../../utils/cn';
import {
  projectDashboardInsightAccentClass,
  projectDashboardInsightChipClass,
  projectDashboardInsightCodeClass,
  projectDashboardInsightCountBadgeClass,
  projectDashboardInsightMetricBadgeClass,
  projectDashboardInsightMutedClass,
  projectDashboardInsightTextClass,
  projectDashboardInsightTrackClass,
  projectDashboardInsightTrackFillClass,
} from '../common/projectCardUi';
import {
  averageBugLeadTimeDays,
  BUG_SEVERITY_ORDER,
  computeOpenBugsByModule,
  computeStoryWorkflow,
  countBugsWithReopenLinks,
  defectCreatedPerWeekSeries,
} from './projectDashboardHelpers';
import {
  dashboardDonutWellClass,
  dashboardInsightCardFeaturedGridClass,
  dashboardInsightsBentoGridClass,
} from './dashboardNeuUi';
import { InsightMetricCard } from './insights/InsightMetricCard';
import { ExecutionStatusDonut } from './insights/ExecutionStatusDonut';
import { DefectTrendChart } from './insights/DefectTrendChart';
import { INSIGHT_COLORS } from './insights/insightTokens';
import type { InsightDrillDownPayload } from './insights/insightDrillDown';
import type { BugSeverity } from '../../types';

const LABEL_CLASS = projectDashboardInsightMutedClass;
const VALUE_STRONG_CLASS = projectDashboardInsightTextClass;
const VALUE_ACCENT_CLASS = projectDashboardInsightAccentClass;

const SEVERITY_META = {
  Crítico: { color: INSIGHT_COLORS.critical, icon: AlertTriangle, pulse: true },
  Alto: { color: INSIGHT_COLORS.high, icon: AlertTriangle, pulse: false },
  Médio: { color: INSIGHT_COLORS.medium, icon: Layers, pulse: false },
  Baixo: { color: INSIGHT_COLORS.low, icon: CheckCircle2, pulse: false },
} as const;

function PassRateRing(props: { percent: number; tooltip: React.ReactNode }) {
  const { percent, tooltip } = props;
  const tone =
    percent >= 90 ? INSIGHT_COLORS.passed : percent >= 70 ? INSIGHT_COLORS.medium : INSIGHT_COLORS.failed;

  const ring = (
    <div className={dashboardDonutWellClass}>
      <div className="relative mx-auto flex aspect-square w-full max-w-[13rem] items-center justify-center">
        <RadialProgress
          value={percent}
          size={168}
          strokeWidth={12}
          ariaLabel="Taxa de aprovação"
          style={
            {
              '--radial-accent': tone,
              '--radial-track': INSIGHT_COLORS.track,
            } as React.CSSProperties
          }
          className="dashboard-pass-rate-ring"
        >
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: tone }}>
              {percent}%
            </span>
            <span className={cn('text-[11px] font-semibold uppercase tracking-wider', LABEL_CLASS)}>
              Pass rate
            </span>
          </div>
        </RadialProgress>
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltip} delay={150} position="top">
      <div className="block w-full">{ring}</div>
    </Tooltip>
  );
}

export interface ProjectDashboardProps {
  project: Project;
  isLoading?: boolean;
  /** Ao clicar em severidade/módulo, navega para filtrar bugs na aba Tarefas. */
  onInsightDrillDown?: (payload: InsightDrillDownPayload) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = React.memo(
  ({ project, isLoading, onInsightDrillDown }) => {
    const m = useProjectMetrics(project);
    const tasks = project.tasks ?? [];

    const bugsByModule = useMemo(() => computeOpenBugsByModule(tasks), [tasks]);
    const reopenCount = useMemo(() => countBugsWithReopenLinks(tasks), [tasks]);
    const leadDays = useMemo(() => averageBugLeadTimeDays(tasks), [tasks]);
    const storyWf = useMemo(() => computeStoryWorkflow(tasks), [tasks]);
    const defectSeries = useMemo(() => defectCreatedPerWeekSeries(tasks, 10), [tasks]);

    const manualCases = Math.max(0, m.totalTestCases - m.automatedTestCases);
    const severityOrder = BUG_SEVERITY_ORDER;
    const maxModule = Math.max(...bugsByModule.map(b => b.count), 1);
    const openBugsTotal = severityOrder.reduce((acc, sev) => acc + m.bugsBySeverity[sev], 0);

    const drillSeverity = (sev: BugSeverity) => {
      onInsightDrillDown?.({ kind: 'severity', value: sev });
    };
    const drillModule = (label: string) => {
      onInsightDrillDown?.({ kind: 'module', value: label });
    };

    if (isLoading) {
      return (
        <div
          className={cn(dashboardInsightsBentoGridClass, 'aria-busy')}
          aria-busy="true"
          aria-label="Carregando indicadores do dashboard"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'dashboard-neu-insight-card dashboard-insight-bento-card h-40 animate-pulse opacity-80'
              )}
              style={{ animationDelay: `${i * 40}ms` }}
              aria-hidden
            />
          ))}
        </div>
      );
    }

    const storyTotal = storyWf.total || 1;
    const todoPct = (storyWf.todo / storyTotal) * 100;
    const progPct = (storyWf.inProgress / storyTotal) * 100;
    const donePct = (storyWf.done / storyTotal) * 100;

    const passTooltip = (
      <span>
        <strong>{m.passedTestCases}</strong> passaram de <strong>{m.executedTestCases}</strong> casos já
        executados.
        <br />
        Falhas: {m.failedTestCases} · Bloqueados: {m.blockedTestCases}
      </span>
    );

    const coverageTone = m.testCoverage >= 70 ? 'success' : m.testCoverage >= 40 ? 'warning' : 'danger';

    return (
      <section
        className={dashboardInsightsBentoGridClass}
        aria-label="Indicadores de qualidade e execução"
      >
        <InsightMetricCard
          title="Cobertura de testes"
          subtitle="Tarefas com ao menos um caso vinculado"
          className="dashboard-insight-bento-card--coverage"
          icon={Target}
          tone={coverageTone}
          index={0}
          hint={
            <span>
              {m.tasksWithTestCases} de {m.totalTasks} tarefas tipo &quot;Tarefa&quot; têm casos de teste.
              Cobertura: <strong>{m.testCoverage}%</strong>.
            </span>
          }
        >
          <div className="flex items-end justify-between gap-3">
            <p className={cn('text-3xl font-extrabold tabular-nums tracking-tight', VALUE_ACCENT_CLASS)}>
              {m.tasksWithTestCases}
              <span className={cn('ml-1.5 text-base font-medium', LABEL_CLASS)}>de {m.totalTasks}</span>
            </p>
            <span className={projectDashboardInsightMetricBadgeClass}>{m.testCoverage}%</span>
          </div>
          <Tooltip
            content={
              <span>
                Barra = % de tarefas &quot;Tarefa&quot; com ao menos um caso vinculado ({m.testCoverage}%).
              </span>
            }
            delay={120}
          >
            <div className={cn(projectDashboardInsightTrackClass, 'mt-4 h-3 w-full')}>
              <div
                className={cn(projectDashboardInsightTrackFillClass, 'relative transition-all duration-700')}
                style={{ width: `${m.testCoverage}%` }}
              >
                <span className="dashboard-insight-bar-knob" aria-hidden />
              </div>
            </div>
          </Tooltip>
          <p className={cn('mt-3 text-xs', LABEL_CLASS)}>Escopo atual dos filtros do dashboard</p>
        </InsightMetricCard>

        <InsightMetricCard
          title="Taxa de aprovação"
          subtitle="Estabilidade entre casos já executados"
          className={cn('dashboard-insight-bento-card--pass-rate', dashboardInsightCardFeaturedGridClass)}
          icon={ShieldCheck}
          tone={m.testPassRate >= 90 ? 'success' : m.testPassRate >= 70 ? 'warning' : 'danger'}
          index={1}
        >
          <div className="flex w-full flex-1 items-center justify-center py-2">
            <PassRateRing percent={m.testPassRate} tooltip={passTooltip} />
          </div>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className={cn('rounded-lg px-1.5 py-2', projectDashboardInsightChipClass)}>
              <dt className={LABEL_CLASS}>Passou</dt>
              <dd className={cn('mt-0.5 font-bold tabular-nums', VALUE_STRONG_CLASS)}>
                {m.passedTestCases}
              </dd>
            </div>
            <div className={cn('rounded-lg px-1.5 py-2', projectDashboardInsightChipClass)}>
              <dt className={LABEL_CLASS}>Falhou</dt>
              <dd className="mt-0.5 font-bold tabular-nums" style={{ color: INSIGHT_COLORS.failed }}>
                {m.failedTestCases}
              </dd>
            </div>
            <div className={cn('rounded-lg px-1.5 py-2', projectDashboardInsightChipClass)}>
              <dt className={LABEL_CLASS}>Bloq.</dt>
              <dd className="mt-0.5 font-bold tabular-nums" style={{ color: INSIGHT_COLORS.blocked }}>
                {m.blockedTestCases}
              </dd>
            </div>
          </dl>
        </InsightMetricCard>

        <InsightMetricCard
          title="Bugs por severidade"
          subtitle="Apenas bugs em aberto"
          icon={AlertTriangle}
          tone={m.bugsBySeverity.Crítico > 0 ? 'danger' : openBugsTotal > 0 ? 'warning' : 'success'}
          index={2}
          hint={
            onInsightDrillDown
              ? 'Clique em uma severidade para filtrar bugs abertos na aba Tarefas. Crítico pulsa quando há bugs.'
              : 'Passe o mouse em cada severidade para ver a contagem. Crítico pulsa quando há bugs.'
          }
        >
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <span className={cn('text-xs font-medium', LABEL_CLASS)}>Abertos agora</span>
            <span className={cn('text-2xl font-extrabold tabular-nums', VALUE_STRONG_CLASS)}>
              {openBugsTotal}
            </span>
          </div>
          <ul className="space-y-2.5" aria-label="Bugs abertos por severidade">
            {severityOrder.map(sev => {
              const count = m.bugsBySeverity[sev];
              const maxSev = Math.max(...severityOrder.map(s => m.bugsBySeverity[s]), 1);
              const barPct = (count / maxSev) * 100;
              const meta = SEVERITY_META[sev];
              const SevIcon = meta.icon;
              const interactive = Boolean(onInsightDrillDown) && count > 0;
              const rowInner = (
                <>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={cn('inline-flex items-center gap-1.5 font-semibold', VALUE_STRONG_CLASS)}>
                      <SevIcon
                        className={cn('h-3.5 w-3.5', meta.pulse && count > 0 && 'animate-pulse')}
                        style={{ color: meta.color }}
                        aria-hidden
                      />
                      {sev}
                    </span>
                    <span className={cn('tabular-nums font-bold', VALUE_STRONG_CLASS)}>{count}</span>
                  </div>
                  <div className={cn(projectDashboardInsightTrackClass, 'h-1.5 w-full')}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barPct}%`,
                        background: `linear-gradient(90deg, color-mix(in srgb, ${meta.color} 70%, white), ${meta.color})`,
                      }}
                    />
                  </div>
                </>
              );
              return (
                <li key={sev} className="space-y-1">
                  {interactive ? (
                    <button
                      type="button"
                      className="dashboard-insight-drill-row w-full rounded-lg px-1 py-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--project-dashboard-insight-accent)_45%,transparent)]"
                      style={{ ['--insight-drill-accent' as string]: meta.color }}
                      onClick={() => drillSeverity(sev)}
                      aria-label={`Filtrar bugs abertos com severidade ${sev}: ${count}`}
                    >
                      {rowInner}
                    </button>
                  ) : (
                    <div className="px-1 py-1">{rowInner}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <div
            className={cn(
              'mt-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5',
              projectDashboardInsightChipClass
            )}
          >
            <span className={cn('text-[11px] font-semibold', LABEL_CLASS)}>Bugs reabertos</span>
            <span className={projectDashboardInsightCountBadgeClass}>{reopenCount}</span>
          </div>
        </InsightMetricCard>

        <InsightMetricCard
          title="Status da execução"
          subtitle="Casos de teste — fatias interativas"
          icon={PieChart}
          tone="info"
          index={3}
          hint="Total de casos de teste nas tarefas. Pairar nas fatias revela totais e percentuais."
        >
          <ExecutionStatusDonut
            passed={m.passedTestCases}
            failed={m.failedTestCases}
            blocked={m.blockedTestCases}
            pending={m.notRunTestCases}
          />
        </InsightMetricCard>

        <InsightMetricCard
          title="Bugs por módulo"
          subtitle='Tag, componente ou "Sem módulo"'
          icon={Layers}
          tone="warning"
          index={4}
          hint={
            onInsightDrillDown
              ? 'Clique em um módulo para filtrar bugs abertos na aba Tarefas.'
              : 'Volume de bugs abertos agrupados pela primeira tag ou componente Jira.'
          }
        >
          {bugsByModule.length === 0 ? (
            <p className={cn('text-sm', LABEL_CLASS)}>Nenhum bug aberto com tag ou componente.</p>
          ) : (
            <ul className="space-y-2.5" aria-label="Bugs abertos por módulo">
              {bugsByModule.map(row => {
                const pctBar = Math.round((row.count / maxModule) * 100);
                const interactive = Boolean(onInsightDrillDown) && row.count > 0;
                const rowBody = (
                  <>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className={cn('truncate font-medium', LABEL_CLASS)}>{row.label}</span>
                      <span className={cn('shrink-0 tabular-nums font-bold', VALUE_STRONG_CLASS)}>
                        {row.count}
                      </span>
                    </div>
                    <div className={cn(projectDashboardInsightTrackClass, 'h-2 w-full')}>
                      <div
                        className={cn(
                          projectDashboardInsightTrackFillClass,
                          'transition-all duration-500'
                        )}
                        style={{ width: `${(row.count / maxModule) * 100}%` }}
                      />
                    </div>
                  </>
                );
                return (
                  <li key={row.label}>
                    {interactive ? (
                      <button
                        type="button"
                        className="dashboard-insight-drill-row dashboard-insight-module-row w-full rounded-lg px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--project-dashboard-insight-accent)_45%,transparent)]"
                        onClick={() => drillModule(row.label)}
                        aria-label={`Filtrar bugs abertos do módulo ${row.label}: ${row.count}`}
                        title={`${row.label}: ${row.count} bug${row.count === 1 ? '' : 's'} (${pctBar}% do maior)`}
                      >
                        {rowBody}
                      </button>
                    ) : (
                      <Tooltip
                        content={
                          <span>
                            <strong>{row.label}</strong>: {row.count} bug{row.count === 1 ? '' : 's'}{' '}
                            abertos
                            <br />
                            Proporção relativa ao maior módulo: {pctBar}%
                          </span>
                        }
                        delay={100}
                      >
                        <div className="dashboard-insight-module-row cursor-default rounded-lg px-1 py-1">
                          {rowBody}
                        </div>
                      </Tooltip>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </InsightMetricCard>

        <InsightMetricCard
          title="Automação vs. manuais"
          subtitle="Distribuição dos casos de teste"
          icon={Bot}
          tone="brand"
          index={5}
          hint={
            <span>
              Total {m.totalTestCases} casos · Automação: {m.automationRatio}% ({m.automatedTestCases}) ·
              Manual: {manualCases}
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className={cn('rounded-xl px-3 py-3', projectDashboardInsightChipClass)}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" style={{ color: INSIGHT_COLORS.automation }} aria-hidden />
                <span className={cn('text-[11px] font-semibold', LABEL_CLASS)}>Automação</span>
              </div>
              <p className={cn('text-xl font-extrabold tabular-nums', VALUE_ACCENT_CLASS)}>
                {m.automatedTestCases}
              </p>
              <p className={cn('text-[11px]', LABEL_CLASS)}>{m.automationRatio}%</p>
            </div>
            <div className={cn('rounded-xl px-3 py-3', projectDashboardInsightChipClass)}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5 opacity-70" aria-hidden />
                <span className={cn('text-[11px] font-semibold', LABEL_CLASS)}>Manual</span>
              </div>
              <p className={cn('text-xl font-extrabold tabular-nums', VALUE_STRONG_CLASS)}>{manualCases}</p>
              <p className={cn('text-[11px]', LABEL_CLASS)}>
                {Math.max(0, 100 - m.automationRatio)}%
              </p>
            </div>
          </div>
          <div className={cn(projectDashboardInsightTrackClass, 'mt-3 flex h-3.5 w-full overflow-hidden')}>
            <div
              className="h-full shrink-0 rounded-l-full transition-all duration-500"
              style={{
                width: `${m.automationRatio}%`,
                background: `linear-gradient(90deg, ${INSIGHT_COLORS.brandSoft}, ${INSIGHT_COLORS.automation})`,
              }}
              title={`Automação: ${m.automatedTestCases} casos (${m.automationRatio}%)`}
            />
            <div
              className="h-full shrink-0 rounded-r-full transition-all duration-500"
              style={{
                width: `${Math.max(0, 100 - m.automationRatio)}%`,
                background: INSIGHT_COLORS.manual,
              }}
              title={`Manual: ${manualCases} casos`}
            />
          </div>
        </InsightMetricCard>

        <InsightMetricCard
          title="Tendência de defeitos"
          subtitle="Bugs criados por semana (10 semanas)"
          icon={Activity}
          tone="brand"
          index={6}
          hint="Passe o mouse nos pontos — a dica mostra a semana e a contagem."
        >
          <DefectTrendChart values={defectSeries} />
          <p className={cn('mt-2 text-xs', LABEL_CLASS)}>
            Série temporal derivada das datas de criação dos bugs.
          </p>
        </InsightMetricCard>

        <InsightMetricCard
          title="Status das User Stories"
          subtitle="Categoria de status Jira"
          icon={CheckCircle2}
          tone="success"
          index={7}
          hint={
            <span>
              Histórias no escopo: {storyWf.total}. To Do / In Progress / Done conforme categorização do
              status Jira.
            </span>
          }
        >
          {storyWf.total === 0 ? (
            <p className={cn('text-sm', LABEL_CLASS)}>Nenhuma tarefa do tipo História no escopo.</p>
          ) : (
            <>
              <div
                className={cn(
                  projectDashboardInsightTrackClass,
                  'flex h-3.5 w-full overflow-hidden rounded-full'
                )}
              >
                <div
                  className="h-full transition-[filter] duration-150 hover:brightness-110"
                  style={{ width: `${todoPct}%`, background: INSIGHT_COLORS.todo }}
                  title={`To Do: ${storyWf.todo} (${Math.round(todoPct)}%)`}
                />
                <div
                  className="h-full transition-[filter] duration-150 hover:brightness-110"
                  style={{ width: `${progPct}%`, background: INSIGHT_COLORS.inProgress }}
                  title={`In Progress: ${storyWf.inProgress} (${Math.round(progPct)}%)`}
                />
                <div
                  className="h-full transition-[filter] duration-150 hover:brightness-110"
                  style={{ width: `${donePct}%`, background: INSIGHT_COLORS.done }}
                  title={`Done: ${storyWf.done} (${Math.round(donePct)}%)`}
                />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                {(
                  [
                    { label: 'To Do', value: storyWf.todo, color: INSIGHT_COLORS.todo },
                    { label: 'In Progress', value: storyWf.inProgress, color: INSIGHT_COLORS.inProgress },
                    { label: 'Done', value: storyWf.done, color: INSIGHT_COLORS.done },
                  ] as const
                ).map(item => (
                  <div
                    key={item.label}
                    className={cn('rounded-xl px-1.5 py-2.5', projectDashboardInsightChipClass)}
                  >
                    <dt className={cn('mb-1.5 flex items-center justify-center gap-1', LABEL_CLASS)}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: item.color }}
                        aria-hidden
                      />
                      {item.label}
                    </dt>
                    <dd>
                      <span className={projectDashboardInsightCountBadgeClass}>{item.value}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </InsightMetricCard>

        <InsightMetricCard
          title="Lead time de bugs"
          subtitle="Média criação → conclusão (fechados)"
          icon={Clock3}
          tone="info"
          index={8}
          hint={
            <span>
              Média em dias entre <code className={projectDashboardInsightCodeClass}>createdAt</code> e{' '}
              <code className={projectDashboardInsightCodeClass}>completedAt</code> nos bugs já fechados.
            </span>
          }
        >
          <Tooltip
            content={
              leadDays == null ? (
                <span>Sem bugs fechados com as duas datas preenchidas.</span>
              ) : (
                <span>
                  Média de{' '}
                  <strong>{leadDays < 1 ? leadDays.toFixed(1) : Math.round(leadDays)}</strong> dias por bug
                  fechado.
                </span>
              )
            }
            delay={120}
          >
            <div
              className={cn(
                'inline-flex cursor-default items-baseline gap-2 rounded-2xl px-5 py-4',
                projectDashboardInsightChipClass
              )}
              style={{
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${INSIGHT_COLORS.brand} 28%, transparent)`,
              }}
            >
              <span className={cn('text-4xl font-extrabold tabular-nums tracking-tight', VALUE_ACCENT_CLASS)}>
                {leadDays == null
                  ? '—'
                  : `${leadDays < 1 ? leadDays.toFixed(1) : Math.round(leadDays)}`}
              </span>
              {leadDays != null && (
                <span className={cn('text-sm font-semibold', LABEL_CLASS)}>dias</span>
              )}
            </div>
          </Tooltip>
          <p className={cn('mt-3 text-xs leading-relaxed', LABEL_CLASS)}>
            Calculado sobre bugs com{' '}
            <code className={projectDashboardInsightCodeClass}>createdAt</code> e{' '}
            <code className={projectDashboardInsightCodeClass}>completedAt</code>.
          </p>
        </InsightMetricCard>
      </section>
    );
  }
);

ProjectDashboard.displayName = 'ProjectDashboard';

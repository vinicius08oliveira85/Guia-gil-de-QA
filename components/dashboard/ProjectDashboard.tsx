import React, { useMemo, useState } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { Tooltip } from '../common/Tooltip';
import { cn } from '../../utils/cn';
import {
  projectDashboardInsightAccentClass,
  projectDashboardInsightCardClass,
  projectDashboardInsightChipClass,
  projectDashboardInsightCodeClass,
  projectDashboardInsightCountBadgeClass,
  projectDashboardInsightHeaderClass,
  projectDashboardInsightMetricBadgeClass,
  projectDashboardInsightMutedClass,
  projectDashboardInsightSubtitleClass,
  projectDashboardInsightTextClass,
  projectDashboardInsightTitleClass,
  projectDashboardInsightTrackClass,
  projectDashboardInsightTrackFillClass,
} from '../common/projectCardUi';
import {
  averageBugLeadTimeDays,
  computeOpenBugsByModule,
  computeStoryWorkflow,
  countBugsWithReopenLinks,
  defectCreatedPerWeekSeries,
} from './projectDashboardHelpers';
import { dashboardDonutWellClass, dashboardInsightWellClass } from './dashboardNeuUi';

const LABEL_CLASS = projectDashboardInsightMutedClass;
const VALUE_STRONG_CLASS = projectDashboardInsightTextClass;
const VALUE_ACCENT_CLASS = projectDashboardInsightAccentClass;

const PIE_PASSED = 'var(--project-dashboard-insight-accent)';
const PIE_FAILED = '#e54b4f';
const PIE_BLOCKED =
  'color-mix(in srgb, var(--project-dashboard-insight-text-muted) 50%, var(--project-dashboard-insight-text))';
const PIE_PENDING = 'color-mix(in srgb, var(--project-dashboard-insight-text) 35%, transparent)';

function sectorPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`;
}

const ExecutionPieSvg = React.memo(function ExecutionPieSvg(props: {
  passed: number;
  failed: number;
  blocked: number;
  pending: number;
}) {
  const { passed, failed, blocked, pending } = props;
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const total = passed + failed + blocked + pending;
  const cx = 52;
  const cy = 52;
  const r = 40;
  if (total === 0) {
    return (
      <p className={cn('text-sm', LABEL_CLASS)}>Sem casos de teste para exibir.</p>
    );
  }
  const slices: { value: number; fill: string; label: string }[] = [
    { value: passed, fill: PIE_PASSED, label: 'Passou' },
    { value: failed, fill: PIE_FAILED, label: 'Falhou' },
    { value: blocked, fill: PIE_BLOCKED, label: 'Bloqueado' },
    { value: pending, fill: PIE_PENDING, label: 'Pendente' },
  ];
  let angle = -Math.PI / 2;
  const paths: React.ReactNode[] = [];
  for (const s of slices) {
    if (s.value <= 0) continue;
    const sweep = (s.value / total) * 2 * Math.PI;
    const d = sectorPath(cx, cy, r, angle, angle + sweep);
    const pct = Math.round((s.value / total) * 100);
    const dimmed = hoverLabel !== null && hoverLabel !== s.label;
    paths.push(
      <path
        key={s.label}
        d={d}
        fill={s.fill}
        className="cursor-pointer stroke-[color-mix(in_srgb,var(--project-dashboard-insight-text)_12%,transparent)]"
        strokeWidth={hoverLabel === s.label ? 1.2 : 0.5}
        style={{
          opacity: dimmed ? 0.42 : 1,
          filter: hoverLabel === s.label ? 'brightness(1.08)' : undefined,
          transition: 'opacity 0.15s ease, stroke-width 0.15s ease, filter 0.15s ease',
        }}
        onMouseEnter={() => setHoverLabel(s.label)}
        onMouseLeave={() => setHoverLabel(null)}
      >
        <title>
          {s.label}: {s.value} casos ({pct}% do total)
        </title>
      </path>
    );
    angle += sweep;
  }
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg
        width={112}
        height={112}
        viewBox="0 0 104 104"
        className="shrink-0"
        role="img"
        aria-label="Distribuição da execução de testes"
      >
        <desc>Passe o mouse nas fatias para ver totais e percentuais.</desc>
        {paths}
      </svg>
      <ul className={cn('flex w-full flex-wrap gap-x-4 gap-y-2 text-xs sm:w-auto', LABEL_CLASS)}>
        {slices.map(s => (
          <li
            key={s.label}
            className={cn(
              'flex cursor-default items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors',
              hoverLabel === s.label && projectDashboardInsightChipClass
            )}
            onMouseEnter={() => s.value > 0 && setHoverLabel(s.label)}
            onMouseLeave={() => setHoverLabel(null)}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: s.fill }}
              aria-hidden
            />
            <span>
              {s.label}: <strong className={VALUE_STRONG_CLASS}>{s.value}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});

const MiniSparkline = React.memo(function MiniSparkline({ values }: { values: number[] }) {
  const w = 140;
  const h = 44;
  const pad = 6;
  const max = Math.max(...values, 1);
  const n = values.length;
  const pts = values.map((v, i) => {
    const x = pad + (n <= 1 ? w / 2 - pad : (i / (n - 1)) * (w - pad * 2));
    const y = pad + (1 - v / max) * (h - pad * 2);
    return { x, y, v, i };
  });
  const points = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <div className={cn(dashboardInsightWellClass, 'relative')}>
      <svg
        width={w}
        height={h}
        className="overflow-visible"
        role="img"
        aria-label="Tendência de bugs criados por semana"
      >
        <desc>Passe o mouse nos pontos ao longo da linha para ver bugs por semana.</desc>
        <polyline
          fill="none"
          stroke="var(--project-dashboard-insight-accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="pointer-events-none"
        />
        {pts.map(p => (
          <circle
            key={`hit-${p.i}`}
            cx={p.x}
            cy={p.y}
            r={9}
            fill="transparent"
            className="cursor-help"
          >
            <title>
              Semana {p.i + 1}: {p.v} bug{p.v === 1 ? '' : 's'} (esquerda = mais antiga)
            </title>
          </circle>
        ))}
        {pts.map(p => (
          <circle
            key={`dot-${p.i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="var(--project-dashboard-insight-accent)"
            className="pointer-events-none opacity-80 transition-opacity duration-150 group-hover:opacity-100"
          />
        ))}
      </svg>
    </div>
  );
});

function PassRateRing(props: { percent: number; tooltip: React.ReactNode }) {
  const { percent, tooltip } = props;
  const cx = 44;
  const cy = 44;
  const r = 36;
  const strokeWidth = 7;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  const ring = (
    <div className={dashboardDonutWellClass}>
      <div className="relative aspect-square w-full">
        <svg viewBox="0 0 88 88" className="h-full w-full" aria-hidden>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-[color-mix(in_srgb,var(--project-dashboard-insight-text-muted)_35%,transparent)]"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--project-dashboard-insight-accent)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-[stroke-dashoffset] duration-300"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className={cn('text-2xl leading-none sm:text-3xl', VALUE_ACCENT_CLASS)}>
            {percent}%
          </span>
          <span className={cn('text-[11px] font-medium sm:text-xs', LABEL_CLASS)}>Pass rate</span>
        </div>
      </div>
    </div>
  );
  return (
    <Tooltip content={tooltip} delay={150} position="top">
      <div className="block w-full">{ring}</div>
    </Tooltip>
  );
}

type InsightCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  hint?: React.ReactNode;
};

function InsightCard({ title, subtitle, children, className, hint }: InsightCardProps) {
  const card = (
    <article className={cn(projectDashboardInsightCardClass, className)}>
      <header className={projectDashboardInsightHeaderClass}>
        <h3 className={projectDashboardInsightTitleClass}>{title}</h3>
        {subtitle ? <p className={projectDashboardInsightSubtitleClass}>{subtitle}</p> : null}
      </header>
      {children}
    </article>
  );
  if (!hint) return card;
  return (
    <Tooltip content={hint} delay={220} position="top" triggerClassName="block w-full min-w-0">
      <div className="block h-full w-full cursor-default">{card}</div>
    </Tooltip>
  );
}

export interface ProjectDashboardProps {
  project: Project;
  isLoading?: boolean;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = React.memo(
  ({ project, isLoading }) => {
    const m = useProjectMetrics(project);
    const tasks = project.tasks ?? [];

    const bugsByModule = useMemo(() => computeOpenBugsByModule(tasks), [tasks]);
    const reopenCount = useMemo(() => countBugsWithReopenLinks(tasks), [tasks]);
    const leadDays = useMemo(() => averageBugLeadTimeDays(tasks), [tasks]);
    const storyWf = useMemo(() => computeStoryWorkflow(tasks), [tasks]);
    const defectSeries = useMemo(() => defectCreatedPerWeekSeries(tasks, 10), [tasks]);

    const manualCases = Math.max(0, m.totalTestCases - m.automatedTestCases);
    const severityOrder = ['Crítico', 'Alto', 'Médio', 'Baixo'] as const;
    const maxModule = Math.max(...bugsByModule.map(b => b.count), 1);

    if (isLoading) {
      return (
        <div
          className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Carregando indicadores do dashboard"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={cn(projectDashboardInsightCardClass, 'h-36 animate-pulse opacity-80')}
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
        <strong>{m.passedTestCases}</strong> passaram de <strong>{m.executedTestCases}</strong>{' '}
        casos já executados.
        <br />
        Falhas: {m.failedTestCases} · Bloqueados: {m.blockedTestCases}
      </span>
    );

    return (
      <section
        className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
        aria-label="Indicadores de qualidade e execução"
      >
        <InsightCard
          title="Cobertura de testes"
          subtitle="Tarefas com ao menos um caso de teste vinculado"
          hint={
            <span>
              {m.tasksWithTestCases} de {m.totalTasks} tarefas tipo &quot;Tarefa&quot; têm casos de
              teste. Cobertura: <strong>{m.testCoverage}%</strong>.
            </span>
          }
        >
          <div className="flex items-end justify-between gap-2">
            <p className={cn('text-2xl font-semibold tabular-nums', VALUE_ACCENT_CLASS)}>
              {m.tasksWithTestCases}{' '}
              <span className={cn('text-base font-normal', LABEL_CLASS)}>de {m.totalTasks}</span>
            </p>
            <span className={projectDashboardInsightMetricBadgeClass}>{m.testCoverage}%</span>
          </div>
          <Tooltip
            content={
              <span>
                Barra = % de tarefas &quot;Tarefa&quot; com ao menos um caso vinculado (
                {m.testCoverage}%).
              </span>
            }
            delay={120}
          >
            <div className={cn(projectDashboardInsightTrackClass, 'mt-3 h-2.5 w-full')}>
              <div
                className={cn(projectDashboardInsightTrackFillClass, 'transition-all duration-500')}
                style={{ width: `${m.testCoverage}%` }}
              />
            </div>
          </Tooltip>
          <p className={cn('mt-2 text-xs', LABEL_CLASS)}>Tarefas cobertas no escopo atual do dashboard</p>
        </InsightCard>

        <InsightCard
          title="Taxa de aprovação"
          subtitle="Estabilidade entre casos já executados"
        >
          <div className="flex w-full items-center justify-center">
            <PassRateRing percent={m.testPassRate} tooltip={passTooltip} />
          </div>
        </InsightCard>

        <InsightCard
          title="Bugs por severidade"
          subtitle="Apenas bugs em aberto"
          hint="Passe o mouse em cada severidade para ver a contagem. Crítico pulsa quando há bugs."
        >
          <ul className="space-y-2.5">
            {severityOrder.map(sev => {
              const count = m.bugsBySeverity[sev];
              const maxSev = Math.max(...severityOrder.map(s => m.bugsBySeverity[s]), 1);
              const barPct = (count / maxSev) * 100;
              const barColor =
                sev === 'Crítico'
                  ? 'bg-[#e54b4f]'
                  : sev === 'Alto'
                    ? 'bg-[var(--project-dashboard-insight-accent)]'
                    : sev === 'Médio'
                      ? 'bg-[color-mix(in_srgb,var(--project-dashboard-insight-title)_55%,var(--project-dashboard-insight-accent))]'
                      : 'bg-[color-mix(in_srgb,var(--project-dashboard-insight-text)_28%,transparent)]';
              const icon =
                sev === 'Crítico' ? '🚨' : sev === 'Alto' ? '⚠️' : sev === 'Médio' ? '◆' : '○';
              return (
                <li key={sev} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 font-medium',
                        projectDashboardInsightTextClass
                      )}
                    >
                      <span aria-hidden>{icon}</span>
                      {sev}
                    </span>
                    <span className={cn('tabular-nums font-semibold', VALUE_STRONG_CLASS)}>{count}</span>
                  </div>
                  <div className={cn(projectDashboardInsightTrackClass, 'h-1.5 w-full')}>
                    <div
                      className={cn('h-full rounded-full transition-all', barColor)}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div
            className={cn(
              'mt-3 flex items-center justify-between gap-2 px-2.5 py-2',
              projectDashboardInsightChipClass
            )}
          >
            <span className={cn('text-[11px] font-medium', LABEL_CLASS)}>Bugs reabertos</span>
            <span className={projectDashboardInsightCountBadgeClass}>{reopenCount}</span>
          </div>
          <p className={cn('mt-1.5 text-[10px] leading-snug', LABEL_CLASS)}>
            Vínculos Jira que sugerem reabertura, quando sincronizados.
          </p>
        </InsightCard>

        <InsightCard
          title="Status da execução"
          subtitle="Casos de teste no projeto — fatias interativas"
          hint="Total de casos de teste nas tarefas. Dica nativa ao pairar nas fatias da pizza (canto da janela)."
        >
          <ExecutionPieSvg
            passed={m.passedTestCases}
            failed={m.failedTestCases}
            blocked={m.blockedTestCases}
            pending={m.notRunTestCases}
          />
        </InsightCard>

        <InsightCard
          title="Bugs por módulo"
          subtitle='Tag, componente ou "Sem módulo"'
          hint="Volume de bugs abertos agrupados pela primeira tag ou componente Jira."
        >
          {bugsByModule.length === 0 ? (
            <p className={cn('text-sm', LABEL_CLASS)}>Nenhum bug aberto com tag ou componente.</p>
          ) : (
            <ul className="space-y-2">
              {bugsByModule.map(row => {
                const pctBar = Math.round((row.count / maxModule) * 100);
                return (
                  <li key={row.label} className="space-y-1">
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
                      <div
                        className={cn(
                          'cursor-default rounded-md py-0.5 transition-[box-shadow] duration-200',
                          'hover:shadow-[var(--workspace-panel-neu-inset)]'
                        )}
                      >
                        <div className="flex justify-between gap-2 text-xs">
                          <span className={cn('truncate', LABEL_CLASS)}>{row.label}</span>
                          <span className={cn('shrink-0 tabular-nums', VALUE_STRONG_CLASS)}>{row.count}</span>
                        </div>
                        <div className={cn(projectDashboardInsightTrackClass, 'h-1.5 w-full')}>
                          <div
                            className={cn(
                              projectDashboardInsightTrackFillClass,
                              'transition-[filter] duration-150 hover:brightness-110'
                            )}
                            style={{ width: `${(row.count / maxModule) * 100}%` }}
                          />
                        </div>
                      </div>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          )}
        </InsightCard>

        <InsightCard
          title="Automação vs. manuais"
          subtitle="Distribuição dos casos de teste"
          hint={
            <span>
              Total {m.totalTestCases} casos · Automação: {m.automationRatio}% (
              {m.automatedTestCases}) · Manual: {manualCases}
            </span>
          }
        >
          <div className="flex items-start justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                🤖
              </span>
              <div>
                <p className={cn('font-medium tabular-nums', VALUE_ACCENT_CLASS)}>{m.automatedTestCases}</p>
                <p className={cn('text-xs', LABEL_CLASS)}>Automação ({m.automationRatio}%)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                👤
              </span>
              <div className="text-right">
                <p className={cn('font-medium tabular-nums', VALUE_STRONG_CLASS)}>{manualCases}</p>
                <p className={cn('text-xs', LABEL_CLASS)}>Manual</p>
              </div>
            </div>
          </div>
          <div className={cn(projectDashboardInsightTrackClass, 'mt-3 flex h-3 w-full')}>
            <div
              className={cn(projectDashboardInsightTrackFillClass, 'shrink-0')}
              style={{ width: `${m.automationRatio}%` }}
              title={`Automação: ${m.automatedTestCases} casos (${m.automationRatio}%)`}
            />
            <div
              className="h-full shrink-0 bg-[color-mix(in_srgb,var(--project-dashboard-insight-title)_22%,transparent)]"
              style={{ width: `${Math.max(0, 100 - m.automationRatio)}%` }}
              title={`Manual / não automatizado: ${manualCases} casos`}
            />
          </div>
        </InsightCard>

        <InsightCard
          title="Tendência de defeitos"
          subtitle="Bugs criados por semana (10 semanas)"
          hint="Passe o mouse nos pontos ao longo da linha — dica nativa do sistema mostra a semana e a contagem."
        >
          <div className="group">
            <MiniSparkline values={defectSeries} />
          </div>
          <p className={cn('mt-1 text-xs', LABEL_CLASS)}>Série temporal derivada das datas de criação dos bugs.</p>
        </InsightCard>

        <InsightCard
          title="Status das User Stories"
          subtitle="Agrupamento por categoria de status Jira"
          hint={
            <span>
              Histórias no escopo: {storyWf.total}. To Do / In Progress / Done conforme
              categorização do status Jira.
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
                  'flex h-3 w-full cursor-default transition-shadow duration-200',
                  'hover:ring-2 hover:ring-[color-mix(in_srgb,var(--project-dashboard-insight-accent)_18%,transparent)]'
                )}
              >
                <div
                  className="h-full bg-[color-mix(in_srgb,var(--project-dashboard-insight-title)_28%,transparent)] transition-[filter] duration-150 hover:brightness-110"
                  style={{ width: `${todoPct}%` }}
                  title={`To Do: ${storyWf.todo} (${Math.round(todoPct)}%)`}
                />
                <div
                  className="h-full bg-[color-mix(in_srgb,var(--project-dashboard-insight-accent)_45%,transparent)] transition-[filter] duration-150 hover:brightness-110"
                  style={{ width: `${progPct}%` }}
                  title={`In Progress: ${storyWf.inProgress} (${Math.round(progPct)}%)`}
                />
                <div
                  className="h-full bg-[var(--project-dashboard-insight-accent)] transition-[filter] duration-150 hover:brightness-110"
                  style={{ width: `${donePct}%` }}
                  title={`Done: ${storyWf.done} (${Math.round(donePct)}%)`}
                />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <dt className={LABEL_CLASS}>To Do</dt>
                  <dd>
                    <span className={projectDashboardInsightMetricBadgeClass}>{storyWf.todo}</span>
                  </dd>
                </div>
                <div>
                  <dt className={LABEL_CLASS}>In Progress</dt>
                  <dd>
                    <span className={projectDashboardInsightMetricBadgeClass}>{storyWf.inProgress}</span>
                  </dd>
                </div>
                <div>
                  <dt className={LABEL_CLASS}>Done</dt>
                  <dd>
                    <span className={projectDashboardInsightCountBadgeClass}>{storyWf.done}</span>
                  </dd>
                </div>
              </dl>
            </>
          )}
        </InsightCard>

        <InsightCard
          title="Lead time de bugs"
          subtitle="Tempo médio do bug fechado (criação → conclusão)"
          hint={
            <span>
              Média em dias entre{' '}
              <code className={projectDashboardInsightCodeClass}>createdAt</code> e{' '}
              <code className={projectDashboardInsightCodeClass}>completedAt</code>{' '}
              nos bugs já fechados.
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
                  <strong>{leadDays < 1 ? leadDays.toFixed(1) : Math.round(leadDays)}</strong> dias
                  por bug fechado.
                </span>
              )
            }
            delay={120}
          >
            <div
              className={cn(
                'inline-flex cursor-default items-baseline gap-2 px-4 py-3',
                projectDashboardInsightChipClass,
                'border-[color-mix(in_srgb,var(--project-dashboard-insight-accent)_28%,transparent)]'
              )}
            >
              <span className={cn('text-2xl tabular-nums', VALUE_ACCENT_CLASS)}>
                {leadDays == null
                  ? '—'
                  : `${leadDays < 1 ? leadDays.toFixed(1) : Math.round(leadDays)}`}
              </span>
              {leadDays != null && (
                <span className={cn('text-sm font-medium', LABEL_CLASS)}>dias</span>
              )}
            </div>
          </Tooltip>
          <p className={cn('mt-2 text-xs', LABEL_CLASS)}>
            Média sobre bugs com{' '}
            <code className={projectDashboardInsightCodeClass}>createdAt</code> e{' '}
            <code className={projectDashboardInsightCodeClass}>completedAt</code>
            .
          </p>
        </InsightCard>
      </section>
    );
  }
);

ProjectDashboard.displayName = 'ProjectDashboard';

import React, { useMemo, useState } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { Card } from '../common/Card';
import { Tooltip } from '../common/Tooltip';
import { cn } from '../../utils/cn';
import {
  averageBugLeadTimeDays,
  computeOpenBugsByModule,
  computeStoryWorkflow,
  countBugsWithReopenLinks,
  defectCreatedPerWeekSeries,
} from './projectDashboardHelpers';

const LABEL_STYLE: React.CSSProperties = { color: 'var(--text-secondary)' };
const PRIMARY_STYLE: React.CSSProperties = { color: 'var(--color-primary)' };

const CARD_HOVER =
  'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none';

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
      <p className="text-sm" style={LABEL_STYLE}>
        Sem casos de teste para exibir.
      </p>
    );
  }
  const slices: { value: number; fill: string; label: string }[] = [
    { value: passed, fill: 'var(--chart-1)', label: 'Passou' },
    { value: failed, fill: 'var(--destructive)', label: 'Falhou' },
    { value: blocked, fill: 'var(--chart-4)', label: 'Bloqueado' },
    { value: pending, fill: 'var(--chart-5)', label: 'Pendente' },
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
        stroke="rgba(0,0,0,0.06)"
        className="cursor-pointer dark:stroke-white/10"
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
        className="shrink-0 glow-blue"
        role="img"
        aria-label="Distribuição da execução de testes"
      >
        <desc>Passe o mouse nas fatias para ver totais e percentuais.</desc>
        {paths}
      </svg>
      <ul className="flex w-full flex-wrap gap-x-4 gap-y-2 text-xs sm:w-auto" style={LABEL_STYLE}>
        {slices.map((s) => (
          <li
            key={s.label}
            className={cn(
              'flex cursor-default items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors',
              hoverLabel === s.label && 'bg-base-200/80 dark:bg-base-300/50'
            )}
            onMouseEnter={() => s.value > 0 && setHoverLabel(s.label)}
            onMouseLeave={() => setHoverLabel(null)}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.fill }} aria-hidden />
            <span>
              {s.label}: <strong className="text-base-content">{s.value}</strong>
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
  const points = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <div className="relative w-full max-w-[168px]">
      <svg width={w} height={h} className="glow-green overflow-visible" role="img" aria-label="Tendência de bugs criados por semana">
        <desc>Passe o mouse nos pontos ao longo da linha para ver bugs por semana.</desc>
        <polyline
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="pointer-events-none"
        />
        {pts.map((p) => (
          <circle key={`hit-${p.i}`} cx={p.x} cy={p.y} r={9} fill="transparent" className="cursor-help">
            <title>
              Semana {p.i + 1}: {p.v} bug{p.v === 1 ? '' : 's'} (esquerda = mais antiga)
            </title>
          </circle>
        ))}
        {pts.map((p) => (
          <circle
            key={`dot-${p.i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="var(--color-primary)"
            className="pointer-events-none opacity-80 transition-opacity duration-150 group-hover:opacity-100"
          />
        ))}
      </svg>
    </div>
  );
});

function PassRateRing(props: { percent: number; tooltip: React.ReactNode }) {
  const { percent, tooltip } = props;
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  const ring = (
    <div className="group flex cursor-default items-center gap-4">
      <svg width={96} height={96} viewBox="0 0 88 88" className="shrink-0 glow-green transition-transform duration-200 ease-out group-hover:scale-[1.03]" aria-hidden>
        <circle cx={44} cy={44} r={r} fill="none" stroke="oklch(var(--b3) / 0.5)" strokeWidth={8} />
        <circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
          className="transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <div>
        <p className="text-3xl font-semibold tabular-nums" style={PRIMARY_STYLE}>
          {percent}%
        </p>
        <p className="mt-0.5 text-xs" style={LABEL_STYLE}>
          Casos executados que passaram
        </p>
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
    <Card
      variant="outlined"
      hoverable={false}
      className={cn('mica glass hover-glow w-full p-4 sm:p-5', CARD_HOVER, className)}
    >
      <header className="mb-3 space-y-0.5">
        <h3 className="text-sm font-semibold tracking-tight text-base-content">{title}</h3>
        {subtitle ? (
          <p className="text-xs leading-snug" style={LABEL_STYLE}>
            {subtitle}
          </p>
        ) : null}
      </header>
      {children}
    </Card>
  );
  if (!hint) return card;
  return (
    <Tooltip content={hint} delay={220} position="top">
      <div className="block h-full w-full cursor-default">{card}</div>
    </Tooltip>
  );
}

export interface ProjectDashboardProps {
  project: Project;
  isLoading?: boolean;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = React.memo(({ project, isLoading }) => {
  const m = useProjectMetrics(project);
  const tasks = project.tasks ?? [];

  const bugsByModule = useMemo(() => computeOpenBugsByModule(tasks), [tasks]);
  const reopenCount = useMemo(() => countBugsWithReopenLinks(tasks), [tasks]);
  const leadDays = useMemo(() => averageBugLeadTimeDays(tasks), [tasks]);
  const storyWf = useMemo(() => computeStoryWorkflow(tasks), [tasks]);
  const defectSeries = useMemo(() => defectCreatedPerWeekSeries(tasks, 10), [tasks]);

  const manualCases = Math.max(0, m.totalTestCases - m.automatedTestCases);
  const severityOrder = ['Crítico', 'Alto', 'Médio', 'Baixo'] as const;
  const maxModule = Math.max(...bugsByModule.map((b) => b.count), 1);

  if (isLoading) {
    return (
      <div
        className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="Carregando indicadores do dashboard"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="mica glass h-36 w-full animate-pulse rounded-xl border border-base-200" />
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
      <strong>{m.passedTestCases}</strong> passaram de <strong>{m.executedTestCases}</strong> casos já executados.
      <br />
      Falhas: {m.failedTestCases} · Bloqueados: {m.blockedTestCases}
    </span>
  );

  return (
    <section className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Indicadores de qualidade e execução">
      <InsightCard
        title="Cobertura de testes"
        subtitle="Tarefas com ao menos um caso de teste vinculado"
        hint={
          <span>
            {m.tasksWithTestCases} de {m.totalTasks} tarefas tipo &quot;Tarefa&quot; têm casos de teste. Cobertura:{' '}
            <strong>{m.testCoverage}%</strong>.
          </span>
        }
      >
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-semibold tabular-nums" style={PRIMARY_STYLE}>
            {m.tasksWithTestCases}{' '}
            <span className="text-base font-normal text-base-content/80">de {m.totalTasks}</span>
          </p>
          <span className="text-sm font-medium tabular-nums" style={LABEL_STYLE}>
            {m.testCoverage}%
          </span>
        </div>
        <Tooltip
          content={
            <span>
              Barra = % de tarefas &quot;Tarefa&quot; com ao menos um caso vinculado ({m.testCoverage}%).
            </span>
          }
          delay={120}
        >
          <div className="mt-3 h-2.5 w-full cursor-pointer overflow-hidden rounded-full bg-base-300/80 transition-shadow duration-200 hover:ring-2 hover:ring-primary/25">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${m.testCoverage}%`, background: 'var(--color-primary)' }}
            />
          </div>
        </Tooltip>
        <p className="mt-2 text-xs" style={LABEL_STYLE}>
          Tarefas cobertas no escopo atual do dashboard
        </p>
      </InsightCard>

      <InsightCard title="Taxa de aprovação (Pass rate) ✅" subtitle="Estabilidade entre casos já executados">
        <PassRateRing percent={m.testPassRate} tooltip={passTooltip} />
      </InsightCard>

      <InsightCard
        title="Bugs por severidade"
        subtitle="Apenas bugs em aberto"
        hint="Passe o mouse em cada severidade para ver a contagem. Crítico pulsa quando há bugs."
      >
        <ul className="flex flex-wrap gap-2">
          {severityOrder.map((sev) => {
            const count = m.bugsBySeverity[sev];
            const isCritical = sev === 'Crítico';
            const pill = (
              <span
                className={cn(
                  'inline-flex cursor-default items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-transform duration-150 hover:scale-[1.02] motion-reduce:hover:scale-100',
                  isCritical && count > 0 && 'border-error/50 bg-error/10 animate-pulse-subtle glow-red',
                  !isCritical && 'border-base-300 bg-base-200/40 hover:border-primary/25 hover:bg-base-200/90'
                )}
              >
                <span aria-hidden>{isCritical ? '🚨' : ''}</span>
                {sev}: <strong className="tabular-nums text-base-content">{count}</strong>
              </span>
            );
            return (
              <li key={sev}>
                <Tooltip
                  content={
                    <span>
                      Bugs abertos classificados como <strong>{sev}</strong>: {count}
                    </span>
                  }
                  delay={100}
                >
                  {pill}
                </Tooltip>
              </li>
            );
          })}
        </ul>
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
          <p className="text-sm" style={LABEL_STYLE}>
            Nenhum bug aberto com tag ou componente.
          </p>
        ) : (
          <ul className="space-y-2">
            {bugsByModule.map((row) => {
              const pctBar = Math.round((row.count / maxModule) * 100);
              return (
                <li key={row.label} className="space-y-1">
                  <Tooltip
                    content={
                      <span>
                        <strong>{row.label}</strong>: {row.count} bug{row.count === 1 ? '' : 's'} abertos
                        <br />
                        Proporção relativa ao maior módulo: {pctBar}%
                      </span>
                    }
                    delay={100}
                  >
                    <div className="cursor-default rounded-md py-0.5 transition-colors hover:bg-base-200/50">
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="truncate" style={LABEL_STYLE}>
                          {row.label}
                        </span>
                        <span className="shrink-0 tabular-nums text-base-content">{row.count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-300/70">
                        <div
                          className="h-full rounded-full bg-primary/80 transition-[filter] duration-150 hover:brightness-110"
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
            Total {m.totalTestCases} casos · Automação: {m.automationRatio}% ({m.automatedTestCases}) · Manual:{' '}
            {manualCases}
          </span>
        }
      >
        <div className="flex items-start justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              🤖
            </span>
            <div>
              <p className="font-medium tabular-nums" style={PRIMARY_STYLE}>
                {m.automatedTestCases}
              </p>
              <p className="text-xs" style={LABEL_STYLE}>
                Automação ({m.automationRatio}%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              👤
            </span>
            <div className="text-right">
              <p className="font-medium tabular-nums text-base-content">{manualCases}</p>
              <p className="text-xs" style={LABEL_STYLE}>
                Manual
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex h-3 w-full cursor-default overflow-hidden rounded-full bg-base-300/80 transition-shadow duration-200 hover:ring-2 hover:ring-primary/20">
          <div
            className="h-full shrink-0 transition-[filter] duration-150 hover:brightness-110"
            style={{ width: `${m.automationRatio}%`, background: 'var(--color-primary)' }}
            title={`Automação: ${m.automatedTestCases} casos (${m.automationRatio}%)`}
          />
          <div
            className="h-full shrink-0 bg-base-content/15 transition-[filter] duration-150 hover:brightness-125"
            style={{ width: `${Math.max(0, 100 - m.automationRatio)}%` }}
            title={`Manual / não automatizado: ${manualCases} casos`}
          />
        </div>
      </InsightCard>

      <InsightCard
        title="Bugs reabertos"
        subtitle="Contagem por vínculos Jira cujo tipo sugere reabertura (quando sincronizados)"
        hint="Bugs com issue link cujo nome sugere reabertura (ex.: Reopened). Sem link, o valor tende a 0."
      >
        <p className="glow-orange w-fit text-3xl font-semibold tabular-nums transition-transform duration-200 hover:scale-105 motion-reduce:hover:scale-100" style={PRIMARY_STYLE}>
          {reopenCount}
        </p>
        <p className="mt-2 text-xs" style={LABEL_STYLE}>
          Indicador de reincidência quando o Jira expõe links de reabertura.
        </p>
      </InsightCard>

      <InsightCard
        title="Tendência de defeitos"
        subtitle="Bugs criados por semana (10 semanas)"
        hint="Passe o mouse nos pontos ao longo da linha — dica nativa do sistema mostra a semana e a contagem."
      >
        <div className="group">
          <MiniSparkline values={defectSeries} />
        </div>
        <p className="mt-1 text-xs" style={LABEL_STYLE}>
          Série temporal derivada das datas de criação dos bugs.
        </p>
      </InsightCard>

      <InsightCard
        title="Status das User Stories"
        subtitle="Agrupamento por categoria de status Jira"
        hint={
          <span>
            Histórias no escopo: {storyWf.total}. To Do / In Progress / Done conforme categorização do status Jira.
          </span>
        }
      >
        {storyWf.total === 0 ? (
          <p className="text-sm" style={LABEL_STYLE}>
            Nenhuma tarefa do tipo História no escopo.
          </p>
        ) : (
          <>
            <div className="flex h-3 w-full cursor-default overflow-hidden rounded-full border border-base-300/60 transition-shadow duration-200 hover:ring-2 hover:ring-primary/15">
              <div
                className="h-full bg-base-content/25 transition-[filter] duration-150 hover:brightness-110"
                style={{ width: `${todoPct}%` }}
                title={`To Do: ${storyWf.todo} (${Math.round(todoPct)}%)`}
              />
              <div
                className="h-full bg-warning/80 transition-[filter] duration-150 hover:brightness-110"
                style={{ width: `${progPct}%` }}
                title={`In Progress: ${storyWf.inProgress} (${Math.round(progPct)}%)`}
              />
              <div
                className="h-full transition-[filter] duration-150 hover:brightness-110"
                style={{ width: `${donePct}%`, background: 'var(--color-primary)' }}
                title={`Done: ${storyWf.done} (${Math.round(donePct)}%)`}
              />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <dt style={LABEL_STYLE}>To Do</dt>
                <dd className="font-semibold tabular-nums text-base-content">{storyWf.todo}</dd>
              </div>
              <div>
                <dt style={LABEL_STYLE}>In Progress</dt>
                <dd className="font-semibold tabular-nums text-base-content">{storyWf.inProgress}</dd>
              </div>
              <div>
                <dt style={LABEL_STYLE}>Done</dt>
                <dd className="font-semibold tabular-nums" style={PRIMARY_STYLE}>
                  {storyWf.done}
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
            Média em dias entre <code className="rounded bg-base-300/40 px-1">createdAt</code> e{' '}
            <code className="rounded bg-base-300/40 px-1">completedAt</code> nos bugs já fechados.
          </span>
        }
      >
        <Tooltip
          content={
            leadDays == null ? (
              <span>Sem bugs fechados com as duas datas preenchidas.</span>
            ) : (
              <span>
                Média de <strong>{leadDays < 1 ? leadDays.toFixed(1) : Math.round(leadDays)}</strong> dias por bug
                fechado.
              </span>
            )
          }
          delay={120}
        >
          <div className="inline-flex cursor-default items-baseline gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 glow-green transition-transform duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100">
            <span className="text-2xl font-bold tabular-nums" style={PRIMARY_STYLE}>
              {leadDays == null ? '—' : `${leadDays < 1 ? leadDays.toFixed(1) : Math.round(leadDays)}`}
            </span>
            {leadDays != null && <span className="text-sm font-medium text-base-content/80">dias</span>}
          </div>
        </Tooltip>
        <p className="mt-2 text-xs" style={LABEL_STYLE}>
          Média sobre bugs com <code className="text-[0.7rem]">createdAt</code> e{' '}
          <code className="text-[0.7rem]">completedAt</code>.
        </p>
      </InsightCard>
    </section>
  );
});

ProjectDashboard.displayName = 'ProjectDashboard';

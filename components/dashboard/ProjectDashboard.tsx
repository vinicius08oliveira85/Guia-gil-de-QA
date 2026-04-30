import React, { useMemo } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { Card } from '../common/Card';
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

function sectorPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`;
}

function ExecutionPieSvg(props: {
  passed: number;
  failed: number;
  blocked: number;
  pending: number;
}) {
  const { passed, failed, blocked, pending } = props;
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
    paths.push(
      <path key={s.label} d={d} fill={s.fill} stroke="rgba(0,0,0,0.06)" className="dark:stroke-white/10" strokeWidth={0.5} />
    );
    angle += sweep;
  }
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg
        width={112}
        height={112}
        viewBox="0 0 104 104"
        className="shrink-0 glow-blue"
        role="img"
        aria-label="Distribuição da execução de testes"
      >
        <title>Distribuição da execução de testes</title>
        {paths}
      </svg>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs w-full sm:w-auto" style={LABEL_STYLE}>
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: s.fill }} aria-hidden />
            <span>
              {s.label}: <strong className="text-base-content">{s.value}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  const w = 140;
  const h = 40;
  const pad = 3;
  const max = Math.max(...values, 1);
  const n = values.length;
  const points = values
    .map((v, i) => {
      const x = pad + (n <= 1 ? w / 2 : (i / (n - 1)) * (w - pad * 2));
      const y = pad + (1 - v / max) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="w-full max-w-[160px] glow-green" role="img" aria-label="Tendência de bugs criados por semana">
      <title>Tendência de bugs criados por semana</title>
      <polyline
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function PassRateRing({ percent }: { percent: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div className="flex items-center gap-4">
      <svg width={96} height={96} viewBox="0 0 88 88" className="shrink-0 glow-green" aria-hidden>
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
        />
      </svg>
      <div>
        <p className="text-3xl font-semibold tabular-nums" style={PRIMARY_STYLE}>
          {percent}%
        </p>
        <p className="text-xs mt-0.5" style={LABEL_STYLE}>
          Casos executados que passaram
        </p>
      </div>
    </div>
  );
}

type InsightCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

function InsightCard({ title, subtitle, children, className }: InsightCardProps) {
  return (
    <Card variant="outlined" hoverable={false} className={cn('mica glass hover-glow w-full p-4 sm:p-5', className)}>
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
}

export interface ProjectDashboardProps {
  project: Project;
  /** Skeleton quando ainda não há tarefas carregadas. */
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

  return (
    <section className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Indicadores de qualidade e execução">
      <InsightCard title="Cobertura de testes" subtitle="Tarefas com ao menos um caso de teste vinculado">
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-semibold tabular-nums" style={PRIMARY_STYLE}>
            {m.tasksWithTestCases}{' '}
            <span className="text-base font-normal text-base-content/80">de {m.totalTasks}</span>
          </p>
          <span className="text-sm font-medium tabular-nums" style={LABEL_STYLE}>
            {m.testCoverage}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-base-300/80">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${m.testCoverage}%`, background: 'var(--color-primary)' }}
          />
        </div>
        <p className="mt-2 text-xs" style={LABEL_STYLE}>
          Tarefas cobertas no escopo atual do dashboard
        </p>
      </InsightCard>

      <InsightCard title="Taxa de aprovação (Pass rate) ✅" subtitle="Estabilidade entre casos já executados">
        <PassRateRing percent={m.testPassRate} />
      </InsightCard>

      <InsightCard title="Bugs por severidade" subtitle="Apenas bugs em aberto">
        <ul className="flex flex-wrap gap-2">
          {severityOrder.map((sev) => {
            const count = m.bugsBySeverity[sev];
            const isCritical = sev === 'Crítico';
            return (
              <li
                key={sev}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium',
                  isCritical && count > 0 && 'border-error/50 bg-error/10 animate-pulse-subtle glow-red',
                  !isCritical && 'border-base-300 bg-base-200/40'
                )}
              >
                <span aria-hidden>{isCritical ? '🚨' : ''}</span>
                {sev}: <strong className="tabular-nums text-base-content">{count}</strong>
              </li>
            );
          })}
        </ul>
      </InsightCard>

      <InsightCard title="Status da execução" subtitle="Casos de teste no projeto">
        <ExecutionPieSvg
          passed={m.passedTestCases}
          failed={m.failedTestCases}
          blocked={m.blockedTestCases}
          pending={m.notRunTestCases}
        />
      </InsightCard>

      <InsightCard title="Bugs por módulo" subtitle='Tag, componente ou "Sem módulo"'>
        {bugsByModule.length === 0 ? (
          <p className="text-sm" style={LABEL_STYLE}>
            Nenhum bug aberto com tag ou componente.
          </p>
        ) : (
          <ul className="space-y-2">
            {bugsByModule.map((row) => (
              <li key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs gap-2">
                  <span className="truncate" style={LABEL_STYLE}>
                    {row.label}
                  </span>
                  <span className="tabular-nums shrink-0 text-base-content">{row.count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-300/70">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${(row.count / maxModule) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </InsightCard>

      <InsightCard title="Automação vs. manuais" subtitle="Distribuição dos casos de teste">
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
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-base-300/80">
          <div
            className="h-full shrink-0"
            style={{ width: `${m.automationRatio}%`, background: 'var(--color-primary)' }}
            title="Automação"
          />
          <div
            className="h-full shrink-0 bg-base-content/15"
            style={{ width: `${Math.max(0, 100 - m.automationRatio)}%` }}
            title="Manual"
          />
        </div>
      </InsightCard>

      <InsightCard
        title="Bugs reabertos"
        subtitle="Contagem por vínculos Jira cujo tipo sugere reabertura (quando sincronizados)"
      >
        <p className="text-3xl font-semibold tabular-nums glow-orange w-fit" style={PRIMARY_STYLE}>
          {reopenCount}
        </p>
        <p className="mt-2 text-xs" style={LABEL_STYLE}>
          Indicador de reincidência quando o Jira expõe links de reabertura.
        </p>
      </InsightCard>

      <InsightCard title="Tendência de defeitos" subtitle="Bugs criados por semana (10 semanas)">
        <MiniSparkline values={defectSeries} />
        <p className="mt-1 text-xs" style={LABEL_STYLE}>
          Série temporal derivada das datas de criação dos bugs.
        </p>
      </InsightCard>

      <InsightCard title="Status das User Stories" subtitle="Agrupamento por categoria de status Jira">
        {storyWf.total === 0 ? (
          <p className="text-sm" style={LABEL_STYLE}>
            Nenhuma tarefa do tipo História no escopo.
          </p>
        ) : (
          <>
            <div className="flex h-3 w-full overflow-hidden rounded-full border border-base-300/60">
              <div className="h-full bg-base-content/25" style={{ width: `${todoPct}%` }} title="To Do" />
              <div className="h-full bg-warning/80" style={{ width: `${progPct}%` }} title="In Progress" />
              <div className="h-full" style={{ width: `${donePct}%`, background: 'var(--color-primary)' }} title="Done" />
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

      <InsightCard title="Lead time de bugs" subtitle="Tempo médio do bug fechado (criação → conclusão)">
        <div className="inline-flex items-baseline gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 glow-green">
          <span className="text-2xl font-bold tabular-nums" style={PRIMARY_STYLE}>
            {leadDays == null ? '—' : `${leadDays < 1 ? leadDays.toFixed(1) : Math.round(leadDays)}`}
          </span>
          {leadDays != null && <span className="text-sm font-medium text-base-content/80">dias</span>}
        </div>
        <p className="mt-2 text-xs" style={LABEL_STYLE}>
          Média sobre bugs com <code className="text-[0.7rem]">createdAt</code> e{' '}
          <code className="text-[0.7rem]">completedAt</code>.
        </p>
      </InsightCard>
    </section>
  );
});

ProjectDashboard.displayName = 'ProjectDashboard';

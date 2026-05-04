import React, { useMemo } from 'react';
import { JiraTask } from '../../types';
import { Card } from '../common/Card';
import { cn } from '../../utils/cn';
import {
  computeRegressionDensity,
  computeStoryPointsLoad,
  countOpenCriticalRiskTasks,
  countTechnicalDebtTasks,
  openBugsWeightDistribution,
} from './taskOperationMetrics';
import { Scale, Bug, Wrench, BarChart3, ShieldAlert } from 'lucide-react';

function formatUnits(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function ComparativeLoadBar(props: { donePct: number; doneUnits: number; todoUnits: number }) {
  const { donePct, doneUnits, todoUnits } = props;
  const total = doneUnits + todoUnits;
  return (
    <div className="flex flex-col gap-tasks-panel-tight">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-base-300/80">
        <div
          className="h-full shrink-0 rounded-l-full transition-all duration-500"
          style={{ width: `${donePct}%`, background: 'var(--color-primary)' }}
          title="Concluído / validado"
        />
        <div
          className="h-full shrink-0 rounded-r-full bg-base-content/10"
          style={{ width: `${100 - donePct}%` }}
          title="Em aberto"
        />
      </div>
      <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-xs tabular-nums text-base-content/75">
        <span>
          Feito: <strong className="text-base-content">{formatUnits(doneUnits)}</strong>
        </span>
        <span>
          Aberto: <strong className="text-base-content">{formatUnits(todoUnits)}</strong>
        </span>
        {total <= 0 && <span className="text-base-content/55">Sem pontos ou horas estimadas</span>}
      </div>
    </div>
  );
}

function BugWeightBarsSvg({ rows }: { rows: { weight: number; count: number }[] }) {
  const max = Math.max(...rows.map(r => r.count), 1);
  const chartW = 200;
  const rowH = 14;
  const pad = 2;
  const h = pad * 2 + rows.length * rowH;
  if (rows.length === 0) {
    return <p className="text-xs text-base-content/70">Sem bugs em aberto para agrupar.</p>;
  }
  const labelW = 30;
  const barMax = chartW - labelW - 22;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${chartW} ${h}`}
      preserveAspectRatio="xMinYMid meet"
      className="max-h-[120px] text-base-content"
      role="img"
      aria-label="Bugs em aberto por peso estimado"
    >
      <title>Bugs em aberto por peso estimado</title>
      {rows.map((r, i) => {
        const y = pad + i * rowH;
        const bw = (r.count / max) * barMax;
        return (
          <g key={`w-${r.weight}`} className="text-base-content">
            <text x={0} y={y + 10} fontSize={11} fill="currentColor" opacity={0.72}>
              P{r.weight}
            </text>
            <rect
              x={labelW}
              y={y + 2}
              width={Math.max(bw, 2)}
              height={8}
              rx={2}
              fill="var(--destructive)"
              opacity={0.78}
            />
            <text x={labelW + bw + 4} y={y + 10} fontSize={11} fill="currentColor">
              {r.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

type MicaCardProps = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/** Card denso estilo painel (glass + borda suave), inspirado em dashboards tipo MCP. */
function MicaMetricCard({ title, subtitle, icon, children, className }: MicaCardProps) {
  return (
    <Card
      variant="outlined"
      hoverable={false}
      className={cn(
        'mica glass hover-glow w-full border-base-200/80 bg-base-100/85 p-2.5 shadow-md sm:p-3',
        'ring-1 ring-inset ring-base-content/[0.04]',
        className
      )}
    >
      <div className="flex gap-tasks-panel-tight">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary"
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold uppercase tracking-wide text-base-content">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-base-content/75">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-2 min-h-0">{children}</div>
    </Card>
  );
}

export interface TaskMetricsHeaderProps {
  tasks: JiraTask[];
  metricsTasks?: JiraTask[];
}

export const TaskMetricsHeader: React.FC<TaskMetricsHeaderProps> = React.memo(
  ({ tasks, metricsTasks }) => {
    const sourceTasks = metricsTasks ?? tasks;
    const scopedToFilter = metricsTasks !== undefined;

    const load = useMemo(() => computeStoryPointsLoad(sourceTasks), [sourceTasks]);
    const regression = useMemo(() => computeRegressionDensity(sourceTasks), [sourceTasks]);
    const debtCount = useMemo(() => countTechnicalDebtTasks(sourceTasks), [sourceTasks]);
    const bugWeights = useMemo(() => openBugsWeightDistribution(sourceTasks), [sourceTasks]);
    const criticalOpen = useMemo(() => countOpenCriticalRiskTasks(sourceTasks), [sourceTasks]);

    const regressionSubtitle = regression.anchor
      ? `Após cerimônia: ${regression.regressionBugCount} bug(s).`
      : 'Sem referência de Revisão/Daily; proporção bugs/histórias.';

    return (
      <section
        className="flex w-full flex-col gap-tasks-panel"
        aria-labelledby="task-operation-metrics-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-tasks-panel-tight">
          <div className="flex min-w-0 flex-wrap items-center gap-tasks-panel-tight">
            <h2
              id="task-operation-metrics-heading"
              className="text-xs font-bold uppercase tracking-wider text-base-content/80"
            >
              Indicadores de operação
            </h2>
            {scopedToFilter && (
              <span
                className="rounded-md border border-primary/25 bg-primary/8 px-2 py-0.5 text-xs font-medium text-base-content"
                title="Métricas apenas sobre as tarefas visíveis com filtro ou busca."
              >
                Filtrado · {sourceTasks.length} tarefa{sourceTasks.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        {criticalOpen > 0 && (
          <div
            className="animate-pulse-subtle flex w-full items-center gap-tasks-panel-tight rounded-lg border border-error/35 bg-error/10 px-2.5 py-1.5 text-sm leading-snug text-base-content"
            role="status"
          >
            <ShieldAlert className="h-4 w-4 shrink-0 text-error" aria-hidden />
            <span>
              <strong className="text-error">{criticalOpen}</strong> crítico(s) em aberto — priorize
              segurança / LGPD.
            </span>
          </div>
        )}

        <div className="grid w-full grid-cols-1 gap-tasks-panel-tight sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-tasks-panel">
          <MicaMetricCard
            title="Carga (Story Points)"
            subtitle="Pontos Jira ou horas estimadas · feito vs aberto"
            icon={<Scale className="h-4 w-4" />}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span
                className="text-xl font-bold tabular-nums sm:text-2xl"
                style={{ color: 'var(--color-primary)' }}
              >
                {formatUnits(load.totalUnits)}
              </span>
              <span className="text-xs font-semibold tabular-nums text-base-content/75">
                {load.totalUnits > 0 ? `${load.donePct}% fechado` : '—'}
              </span>
            </div>
            <ComparativeLoadBar
              donePct={load.donePct}
              doneUnits={load.doneUnits}
              todoUnits={load.todoUnits}
            />
          </MicaMetricCard>

          <MicaMetricCard
            title="Bugs / regressão"
            subtitle={regressionSubtitle}
            icon={<Bug className="h-4 w-4" />}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-bold tabular-nums text-base-content sm:text-2xl">
                {regression.regressionBugCount}
              </span>
              <span
                className={cn(
                  'rounded-md border px-2 py-0.5 text-xs font-semibold',
                  regression.alertHigh
                    ? 'border-error/45 bg-error/15 text-error'
                    : 'border-base-300 bg-base-200/60 text-base-content'
                )}
              >
                {regression.alertHigh ? 'Proporção alta' : 'Estável'}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-snug text-base-content/75">
              Pós-cerimônia: {regression.regressionBugCount} · Histórias: {regression.storyCount} ·
              Bugs: {regression.bugCount}
            </p>
          </MicaMetricCard>

          <MicaMetricCard
            title="Débito técnico"
            subtitle="Manutenção (flag ou título/tags)"
            icon={<Wrench className="h-4 w-4" />}
          >
            <p
              className="text-xl font-bold tabular-nums sm:text-2xl"
              style={{ color: 'var(--color-primary)' }}
            >
              {debtCount}
            </p>
            <p className="mt-1 text-xs leading-snug text-base-content/75">
              <code className="rounded bg-base-200/90 px-1 py-0.5 text-[11px] text-base-content sm:text-xs">
                isTechnicalDebt
              </code>{' '}
              ou palavras-chave no título/tags.
            </p>
          </MicaMetricCard>

          <MicaMetricCard
            title="Falhas por peso"
            subtitle="Bugs abertos (pontos ou severidade)"
            icon={<BarChart3 className="h-4 w-4" />}
          >
            <BugWeightBarsSvg rows={bugWeights} />
          </MicaMetricCard>

          <MicaMetricCard
            title="Críticos"
            subtitle="LGPD, segurança, isCriticalPath"
            icon={<ShieldAlert className="h-4 w-4" />}
            className={cn(
              criticalOpen > 0 &&
                'animate-pulse-subtle border-error/40 bg-error/[0.07] shadow-[0_0_0_1px_color-mix(in_srgb,var(--destructive)_28%,transparent)]'
            )}
          >
            <p
              className="text-xl font-bold tabular-nums sm:text-2xl"
              style={
                criticalOpen > 0
                  ? { color: 'var(--destructive)' }
                  : { color: 'var(--color-primary)' }
              }
            >
              {criticalOpen}
            </p>
            <p className="mt-1 text-xs leading-snug text-base-content/75">
              {criticalOpen === 0
                ? 'Nada sensível pendente neste escopo.'
                : 'Priorize regressão e testes de segurança.'}
            </p>
          </MicaMetricCard>
        </div>
      </section>
    );
  }
);

TaskMetricsHeader.displayName = 'TaskMetricsHeader';

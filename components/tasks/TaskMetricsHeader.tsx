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

const LABEL: React.CSSProperties = { color: 'var(--text-secondary)' };

function formatUnits(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function ComparativeLoadBar(props: { donePct: number; doneUnits: number; todoUnits: number }) {
  const { donePct, doneUnits, todoUnits } = props;
  const total = doneUnits + todoUnits;
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-base-300/80">
        <div
          className="h-full shrink-0 rounded-l-full transition-all duration-500"
          style={{ width: `${donePct}%`, background: 'var(--color-primary)' }}
          title="Concluído / validado"
        />
        <div
          className="h-full shrink-0 rounded-r-full bg-base-content/12"
          style={{ width: `${100 - donePct}%` }}
          title="Em aberto"
        />
      </div>
      <div className="flex justify-between gap-2 text-xs tabular-nums" style={LABEL}>
        <span>
          Feito: <strong className="text-base-content">{formatUnits(doneUnits)}</strong>
        </span>
        <span>
          Aberto: <strong className="text-base-content">{formatUnits(todoUnits)}</strong>
        </span>
        {total <= 0 && <span className="text-base-content/60">Sem pontos ou horas estimadas</span>}
      </div>
    </div>
  );
}

function BugWeightBarsSvg({ rows }: { rows: { weight: number; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  const chartW = 200;
  const rowH = 16;
  const pad = 4;
  const h = pad * 2 + rows.length * rowH;
  if (rows.length === 0) {
    return (
      <p className="text-xs" style={LABEL}>
        Sem bugs em aberto para agrupar.
      </p>
    );
  }
  const labelW = 28;
  const barMax = chartW - labelW - 24;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${chartW} ${h}`}
      preserveAspectRatio="xMinYMid meet"
      className="max-h-[140px] text-base-content"
      role="img"
      aria-label="Bugs em aberto por peso estimado"
    >
      <title>Bugs em aberto por peso estimado</title>
      {rows.map((r, i) => {
        const y = pad + i * rowH;
        const bw = (r.count / max) * barMax;
        return (
          <g key={`w-${r.weight}`}>
            <text x={0} y={y + 11} fontSize={10} fill="currentColor" style={{ opacity: 0.65 }}>
              P{r.weight}
            </text>
            <rect
              x={labelW}
              y={y + 3}
              width={Math.max(bw, 2)}
              height={9}
              rx={2}
              fill="var(--destructive)"
              opacity={0.75}
            />
            <text x={labelW + bw + 4} y={y + 11} fontSize={10} fill="currentColor">
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
  /** Classes extras no container (ex.: alerta crítico). */
  className?: string;
};

function MicaMetricCard({ title, subtitle, icon, children, className }: MicaCardProps) {
  return (
    <Card
      variant="outlined"
      hoverable={false}
      className={cn('mica glass hover-glow w-full p-3 sm:p-4', className)}
    >
      <div className="mb-2 flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-primary opacity-90" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold leading-tight text-base-content sm:text-sm">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-snug sm:text-xs" style={LABEL}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </Card>
  );
}

export interface TaskMetricsHeaderProps {
  /** Base do projeto (usada quando `metricsTasks` não é passado). */
  tasks: JiraTask[];
  /**
   * Subconjunto opcional para as métricas (ex.: lista após filtro/busca).
   * Quando omitido, os indicadores refletem `tasks` inteiro.
   */
  metricsTasks?: JiraTask[];
}

/**
 * Faixa de indicadores operacionais (Mica/Glass) para a aba de tarefas.
 * Não altera filtros nem a lista — apenas leitura dos arrays recebidos.
 */
export const TaskMetricsHeader: React.FC<TaskMetricsHeaderProps> = React.memo(({ tasks, metricsTasks }) => {
  const sourceTasks = metricsTasks ?? tasks;
  const scopedToFilter = metricsTasks !== undefined;

  const load = useMemo(() => computeStoryPointsLoad(sourceTasks), [sourceTasks]);
  const regression = useMemo(() => computeRegressionDensity(sourceTasks), [sourceTasks]);
  const debtCount = useMemo(() => countTechnicalDebtTasks(sourceTasks), [sourceTasks]);
  const bugWeights = useMemo(() => openBugsWeightDistribution(sourceTasks), [sourceTasks]);
  const criticalOpen = useMemo(() => countOpenCriticalRiskTasks(sourceTasks), [sourceTasks]);

  const regressionSubtitle = regression.anchor
    ? `Após referência de cerimônia (${regression.regressionBugCount} bugs).`
    : 'Sem tarefa de Revisão/Daily como referência temporal; proporção geral bugs/histórias.';

  return (
    <section className="w-full space-y-3" aria-labelledby="task-operation-metrics-heading">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="task-operation-metrics-heading" className="text-sm font-semibold text-base-content">
          Indicadores de operação
        </h2>
        {scopedToFilter && (
          <span
            className="rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-base-content/90"
            title="Números calculados apenas sobre as tarefas visíveis com o filtro ou a busca atuais."
          >
            Escopo: lista filtrada ({sourceTasks.length} {sourceTasks.length === 1 ? 'tarefa' : 'tarefas'})
          </span>
        )}
      </div>

      {criticalOpen > 0 && (
        <div
          className="animate-pulse-subtle flex w-full items-center gap-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-base-content"
          role="status"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-error" aria-hidden />
          <span>
            <strong className="text-error">{criticalOpen}</strong> itens críticos em aberto (segurança / LGPD /
            isCriticalPath). Priorize validação.
          </span>
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5 md:gap-4">
        <MicaMetricCard
          title="Carga de esforço (Story Points)"
          subtitle="Pontos customizados ou horas estimadas · Concluído vs aberto"
          icon={<Scale className="h-4 w-4 sm:h-5 sm:w-5" />}
        >
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-lg font-semibold tabular-nums sm:text-xl" style={{ color: 'var(--color-primary)' }}>
              {formatUnits(load.totalUnits)}
            </span>
            <span className="text-xs font-medium tabular-nums" style={LABEL}>
              {load.totalUnits > 0 ? `${load.donePct}% fechado` : '—'}
            </span>
          </div>
          <span className="mb-1 block text-[11px]" style={LABEL} aria-hidden>
            ⚖️
          </span>
          <ComparativeLoadBar donePct={load.donePct} doneUnits={load.doneUnits} todoUnits={load.todoUnits} />
        </MicaMetricCard>

        <MicaMetricCard
          title="Densidade de bugs / regressão"
          subtitle={regressionSubtitle}
          icon={<Bug className="h-4 w-4 sm:h-5 sm:w-5" />}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums text-base-content">{regression.regressionBugCount}</span>
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 text-[11px] font-medium',
                regression.alertHigh
                  ? 'border-error/50 bg-error/15 text-error'
                  : 'border-base-300 bg-base-200/50 text-base-content/80'
              )}
            >
              {regression.alertHigh ? 'Atenção: proporção alta' : 'Dentro do esperado'}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-snug sm:text-xs" style={LABEL}>
            Bugs após última cerimônia: {regression.regressionBugCount} · Histórias: {regression.storyCount} · Bugs
            totais: {regression.bugCount}
          </p>
          <span className="mt-1 block text-[11px]" style={LABEL} aria-hidden>
            🐛
          </span>
        </MicaMetricCard>

        <MicaMetricCard
          title="Débito técnico"
          subtitle="Esforço de manutenção"
          icon={<Wrench className="h-4 w-4 sm:h-5 sm:w-5" />}
        >
          <p className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--color-primary)' }}>
            {debtCount}
          </p>
          <p className="mt-1 text-xs" style={LABEL}>
            Flag <code className="rounded bg-base-200 px-0.5 text-[10px]">isTechnicalDebt</code> ou título/tags com
            Ajuste, Sincronização ou Correção.
          </p>
          <span className="mt-1 block text-[11px]" style={LABEL} aria-hidden>
            🛠️
          </span>
        </MicaMetricCard>

        <MicaMetricCard
          title="Complexidade das falhas"
          subtitle="Bugs abertos por peso (pontos ou severidade)"
          icon={<BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />}
        >
          <BugWeightBarsSvg rows={bugWeights} />
          <span className="mt-1 block text-[11px]" style={LABEL} aria-hidden>
            📈
          </span>
        </MicaMetricCard>

        <MicaMetricCard
          title="Funcionalidades críticas"
          subtitle="Logout, LGPD, segurança, isCriticalPath — em aberto"
          icon={<ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" />}
          className={cn(
            criticalOpen > 0 &&
              'animate-pulse-subtle border-error/45 bg-error/10 shadow-[0_0_0_1px_color-mix(in_srgb,var(--destructive)_35%,transparent)]'
          )}
        >
          <p
            className="text-2xl font-semibold tabular-nums"
            style={criticalOpen > 0 ? { color: 'var(--destructive)' } : { color: 'var(--color-primary)' }}
          >
            {criticalOpen}
          </p>
          <p className="mt-1 text-xs" style={LABEL}>
            {criticalOpen === 0
              ? 'Nenhum item sensível pendente neste escopo.'
              : 'Priorize regressão e testes de segurança nestes itens.'}
          </p>
          <span className="mt-1 block text-[11px]" style={LABEL} aria-hidden>
            🔐
          </span>
        </MicaMetricCard>
      </div>
    </section>
  );
});

TaskMetricsHeader.displayName = 'TaskMetricsHeader';

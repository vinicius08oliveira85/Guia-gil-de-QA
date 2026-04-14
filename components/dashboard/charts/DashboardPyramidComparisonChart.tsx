import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { Card } from '../../common/Card';
import { cn } from '../../../utils/cn';
import type { PyramidChartRow } from '../../../utils/testPyramidFromCases';

export interface DashboardPyramidComparisonChartProps {
  rows: PyramidChartRow[];
  isLoading?: boolean;
  /** Carregamento explícito pelo botão “Atualizar pirâmide IA”. */
  isRefreshingIdeal?: boolean;
  rateLimitHint?: string | null;
  errorHint?: string | null;
  /** Quando definido, exibe ação para nova chamada à IA e persistência no projeto (via pai). */
  onRefreshIdeal?: () => void | Promise<void>;
  /** Desativa o botão (ex.: outra operação Gemini em andamento no dashboard). */
  refreshLocked?: boolean;
  className?: string;
}

export const DashboardPyramidComparisonChart: React.FC<DashboardPyramidComparisonChartProps> = ({
  rows,
  isLoading,
  isRefreshingIdeal,
  rateLimitHint,
  errorHint,
  onRefreshIdeal,
  refreshLocked,
  className,
}) => {
  const chartBusy = isLoading || isRefreshingIdeal;
  const refreshDisabled = chartBusy || refreshLocked;
  const data = rows.map((r) => ({
    name: r.level,
    ideal: r.idealPercent,
    atual: r.currentPercent,
    casos: r.currentCount,
  }));

  return (
    <Card className={cn('!p-4 sm:!p-6', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-base-content">Pirâmide de testes</h4>
          <p className="text-xs text-base-content/60 mt-0.5">
            Comparativo entre a distribuição ideal sugerida pela IA e os casos de teste criados no projeto.
          </p>
        </div>
        {onRefreshIdeal && (
          <button
            type="button"
            onClick={() => void onRefreshIdeal()}
            disabled={refreshDisabled}
            className="btn btn-ghost btn-sm shrink-0 gap-1.5 text-primary border border-primary/20 hover:bg-primary/10 disabled:opacity-50 disabled:pointer-events-none"
            title="Nova análise da pirâmide ideal com Gemini (substitui a salva no projeto)"
            aria-busy={refreshDisabled}
            aria-label="Atualizar pirâmide ideal com IA"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshingIdeal && 'animate-spin')} aria-hidden />
            Atualizar pirâmide IA
          </button>
        )}
      </div>
      {rateLimitHint && (
        <p className="text-sm text-warning mb-2" role="status">
          {rateLimitHint}
        </p>
      )}
      {errorHint && !rateLimitHint && (
        <p className="text-sm text-error mb-2" role="status">
          {errorHint}
        </p>
      )}
      <div className="h-[280px] w-full mt-2">
        {chartBusy ? (
          <div className="flex h-full items-center justify-center text-sm text-base-content/60">
            {isRefreshingIdeal ? 'Atualizando pirâmide com IA…' : 'Carregando pirâmide…'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--bc) / 0.7)', fontSize: 12 }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--bc) / 0.6)', fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--b1))',
                  border: '1px solid hsl(var(--b3))',
                  borderRadius: 8,
                }}
                formatter={(value: number, name: string) => [`${value}%`, name]}
                labelFormatter={(label) => `Nível: ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ideal" name="Ideal (IA)" fill="hsl(var(--p))" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="atual" name="Atual (casos)" fill="hsl(var(--s))" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

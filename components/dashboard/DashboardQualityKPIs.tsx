import React from 'react';
import { cn } from '../../utils/cn';

export interface DashboardKpiMetrics {
  passRate: number;
  defectRate: number;
  coverage: number;
  avgExecutionTimeMinutes: number;
}

interface DashboardQualityKPIsProps {
  metrics: DashboardKpiMetrics;
  className?: string;
}

interface KpiRowProps {
  label: string;
  value: string;
  barPercent: number;
  barColor: string;
}

function KpiRow({ label, value, barPercent, barColor }: KpiRowProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-base-content">{label}</span>
        <span className="text-sm font-bold text-base-content">{value}</span>
      </div>
      <div className="h-2 bg-base-300 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${Math.min(100, barPercent)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Bloco "KPIs de Qualidade": Taxa de Aprovação, Taxa de Defeitos, Cobertura, Tempo Médio Execução.
 */
export const DashboardQualityKPIs = React.memo<DashboardQualityKPIsProps>(({ metrics, className }) => {
  const defectBarPercent = Math.min(100, metrics.defectRate * 5);

  return (
    <section className={cn('space-y-6', className)}>
      <h4 className="text-sm font-bold text-base-content/60 uppercase tracking-widest mb-4">
        KPIs de Qualidade
      </h4>
      <div className="space-y-6">
        <KpiRow
          label="Taxa de Aprovação"
          value={`${metrics.passRate}%`}
          barPercent={metrics.passRate}
          barColor="bg-success"
        />
        <KpiRow
          label="Taxa de Defeitos"
          value={`${metrics.defectRate}%`}
          barPercent={defectBarPercent}
          barColor="bg-error"
        />
        <KpiRow
          label="Cobertura"
          value={`${metrics.coverage}%`}
          barPercent={metrics.coverage}
          barColor="bg-primary"
        />
        <KpiRow
          label="Tempo Médio Execução"
          value={`${metrics.avgExecutionTimeMinutes}m`}
          barPercent={65}
          barColor="bg-primary"
        />
      </div>
    </section>
  );
});

DashboardQualityKPIs.displayName = 'DashboardQualityKPIs';

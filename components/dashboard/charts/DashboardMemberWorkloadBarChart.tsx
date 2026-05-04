import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../../common/Card';
import { cn } from '../../../utils/cn';
import type { DashboardMemberBarRow } from '../../../hooks/useDashboardMetrics';

export interface DashboardMemberWorkloadBarChartProps {
  data: DashboardMemberBarRow[];
  className?: string;
}

export const DashboardMemberWorkloadBarChart: React.FC<DashboardMemberWorkloadBarChartProps> = ({
  data,
  className,
}) => {
  const hasRows = data.length > 0 && data.some(d => d.value > 0);

  if (!hasRows) {
    return (
      <Card className={cn('!p-4 sm:!p-6', className)}>
        <h4 className="text-base font-semibold text-base-content mb-1">
          Carga de trabalho por membro
        </h4>
        <p className="text-sm text-base-content/60">
          Nenhuma tarefa com responsável identificado. Preencha o responsável no Jira ou o papel na
          tarefa.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('!p-4 sm:!p-6', className)}>
      <h4 className="text-base font-semibold text-base-content mb-1">
        Carga de trabalho por membro
      </h4>
      <p className="text-xs text-base-content/60 mb-3">
        Quantidade de tarefas por responsável (nome Jira ou papel).
      </p>
      <div className="h-[280px] w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 12, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: 'oklch(var(--bc) / 0.6)', fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={188}
              tick={{ fill: 'oklch(var(--bc) / 0.75)', fontSize: 10 }}
              tickFormatter={(v: string) => (v.length > 26 ? `${v.slice(0, 24)}…` : v)}
              interval={0}
            />
            <Tooltip
              contentStyle={{
                background: 'oklch(var(--b1))',
                border: '1px solid oklch(var(--b3))',
                borderRadius: 8,
              }}
              formatter={(v: number) => [`${v} tarefa(s)`, 'Quantidade']}
            />
            <Bar dataKey="value" name="Tarefas" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {data.map(row => (
                <Cell key={row.name} fill={row.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

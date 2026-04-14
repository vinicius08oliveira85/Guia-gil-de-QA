import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
  const hasRows = data.length > 0 && data.some((d) => d.value > 0);

  if (!hasRows) {
    return (
      <Card className={cn('!p-4 sm:!p-6', className)}>
        <h4 className="text-base font-semibold text-base-content mb-1">Carga de trabalho por membro</h4>
        <p className="text-sm text-base-content/60">
          Nenhuma tarefa com responsável identificado. Preencha o responsável no Jira ou o papel na tarefa.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('!p-4 sm:!p-6', className)}>
      <h4 className="text-base font-semibold text-base-content mb-1">Carga de trabalho por membro</h4>
      <p className="text-xs text-base-content/60 mb-3">Quantidade de tarefas por responsável (nome Jira ou papel).</p>
      <div className="h-[280px] w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: 'hsl(var(--bc) / 0.6)', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={118}
              tick={{ fill: 'hsl(var(--bc) / 0.75)', fontSize: 10 }}
              interval={0}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--b1))',
                border: '1px solid hsl(var(--b3))',
                borderRadius: 8,
              }}
              formatter={(v: number) => [`${v} tarefa(s)`, 'Quantidade']}
            />
            <Bar dataKey="value" name="Tarefas" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {data.map((row) => (
                <Cell key={row.name} fill={row.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

import React from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../../common/Card';
import { cn } from '../../../utils/cn';
import type { DashboardPieSlice } from '../../../hooks/useDashboardMetrics';

export interface DashboardTaskStatusPieChartProps {
  data: DashboardPieSlice[];
  className?: string;
}

export const DashboardTaskStatusPieChart: React.FC<DashboardTaskStatusPieChartProps> = ({
  data,
  className,
}) => {
  if (data.length === 0) {
    return (
      <Card className={cn('!p-4 sm:!p-6', className)}>
        <h4 className="text-base font-semibold text-base-content mb-1">Status do projeto</h4>
        <p className="text-sm text-base-content/60">Não há tarefas para exibir a distribuição por status.</p>
      </Card>
    );
  }

  return (
    <Card className={cn('!p-4 sm:!p-6', className)}>
      <h4 className="text-base font-semibold text-base-content mb-1">Status do projeto</h4>
      <p className="text-xs text-base-content/60 mb-2">Proporção de tarefas por status de fluxo (dados locais).</p>
      <div className="h-[280px] w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={88}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} stroke="hsl(var(--b1))" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--b1))',
                border: '1px solid hsl(var(--b3))',
                borderRadius: 8,
              }}
              formatter={(value: number) => [`${value} tarefa(s)`, 'Quantidade']}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(var(--bc) / 0.85)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

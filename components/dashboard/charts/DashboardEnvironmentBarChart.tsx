import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { Card } from '../../common/Card';
import { cn } from '../../../utils/cn';
import type { Project } from '../../../types';

const COLORS = [
  'hsl(var(--p))',
  'hsl(var(--s))',
  'hsl(var(--a))',
  'hsl(var(--in))',
  'hsl(var(--su))',
  'hsl(var(--wa))',
];

export interface DashboardEnvironmentBarChartProps {
  project: Project;
  className?: string;
}

export const DashboardEnvironmentBarChart: React.FC<DashboardEnvironmentBarChartProps> = ({
  project,
  className,
}) => {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of project.tasks || []) {
      for (const tc of task.testCases || []) {
        const env = (tc.testEnvironment || '').trim() || 'Não definido';
        map.set(env, (map.get(env) ?? 0) + 1);
      }
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [project.tasks]);

  if (data.length === 0) {
    return (
      <Card className={cn('!p-4 sm:!p-6', className)}>
        <h4 className="text-base font-semibold text-base-content mb-1">
          Distribuição por ambiente
        </h4>
        <p className="text-sm text-base-content/60">
          Nenhum caso de teste com ambiente informado ainda.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('!p-4 sm:!p-6', className)}>
      <h4 className="text-base font-semibold text-base-content mb-1">
        Distribuição de testes por ambiente
      </h4>
      <p className="text-xs text-base-content/60 mb-3">
        Campo <strong>testEnvironment</strong> dos casos de teste.
      </p>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: 'hsl(var(--bc) / 0.6)', fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fill: 'hsl(var(--bc) / 0.75)', fontSize: 11 }}
              interval={0}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--b1))',
                border: '1px solid hsl(var(--b3))',
                borderRadius: 8,
              }}
              formatter={(v: number) => [`${v} caso(s)`, 'Quantidade']}
            />
            <Bar dataKey="value" name="Casos" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {data.map((_, i) => (
                <Cell key={data[i].name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Card } from '../../common/Card';
import { cn } from '../../../utils/cn';
import type { Project, TestCase } from '../../../types';

export interface DashboardFailuresChartProps {
  project: Project;
  /** Ao clicar no gráfico (área das falhas), navega para Tarefas com filtro de casos falhos. */
  onFailuresClick?: (statuses: TestCase['status'][]) => void;
  className?: string;
}

export const DashboardFailuresChart: React.FC<DashboardFailuresChartProps> = ({
  project,
  onFailuresClick,
  className,
}) => {
  const rows = useMemo(() => {
    let failed = 0;
    let blocked = 0;
    let notRun = 0;
    let passed = 0;
    for (const task of project.tasks || []) {
      for (const tc of task.testCases || []) {
        if (tc.status === 'Failed') failed++;
        else if (tc.status === 'Blocked') blocked++;
        else if (tc.status === 'Not Run') notRun++;
        else if (tc.status === 'Passed') passed++;
      }
    }
    return [
      { name: 'Falhas', value: failed, key: 'failed' as const },
      { name: 'Bloqueados', value: blocked, key: 'blocked' as const },
      { name: 'Não executados', value: notRun, key: 'notRun' as const },
      { name: 'Passou', value: passed, key: 'passed' as const },
    ];
  }, [project.tasks]);

  const clickable = !!onFailuresClick;
  const hasFailures = rows[0].value > 0;

  const handleClick = () => {
    if (!onFailuresClick || !hasFailures) return;
    onFailuresClick(['Failed']);
  };

  return (
    <Card
      className={cn(
        '!p-4 sm:!p-6',
        clickable && hasFailures && 'cursor-pointer hover:ring-2 hover:ring-primary/25 transition-shadow',
        className
      )}
      role={clickable && hasFailures ? 'button' : undefined}
      tabIndex={clickable && hasFailures ? 0 : undefined}
      onClick={clickable && hasFailures ? handleClick : undefined}
      onKeyDown={
        clickable && hasFailures
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      aria-label={clickable && hasFailures ? 'Ver tarefas com casos de teste falhos' : undefined}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="text-base font-semibold text-base-content">Resultado dos casos de teste</h4>
          <p className="text-xs text-base-content/60 mt-0.5">
            {clickable && hasFailures
              ? 'Clique no gráfico para abrir a lista de tarefas filtrada por falhas.'
              : 'Resumo por status de execução dos casos.'}
          </p>
        </div>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--bc) / 0.7)', fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--bc) / 0.6)', fontSize: 11 }} width={36} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--b1))',
                border: '1px solid hsl(var(--b3))',
                borderRadius: 8,
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {rows.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={
                    entry.key === 'failed'
                      ? 'hsl(var(--er))'
                      : entry.key === 'blocked'
                        ? 'hsl(var(--wa))'
                        : entry.key === 'notRun'
                          ? 'hsl(var(--bc) / 0.35)'
                          : 'hsl(var(--su))'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

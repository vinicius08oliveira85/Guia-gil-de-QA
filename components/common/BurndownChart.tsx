import React, { useMemo } from 'react';
import { Project } from '../../types';
import { calculateProjectEstimations } from '../../utils/estimationService';
import { cn } from '../../utils/cn';
import { neuCardInsetClass, neuDividerClass } from './neuUi';

interface BurndownChartProps {
  project: Project;
  sprintDays?: number;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({ project, sprintDays = 14 }) => {
  const estimations = useMemo(() => calculateProjectEstimations(project), [project]);

  // Simular progresso ao longo do tempo (em produção, viria de dados reais)
  const burndownData = useMemo(() => {
    const data = [];
    const totalHours = estimations.totalEstimated || 100;
    const dailyBurn = totalHours / sprintDays;

    for (let day = 0; day <= sprintDays; day++) {
      const idealRemaining = totalHours - dailyBurn * day;
      const actualRemaining = Math.max(0, idealRemaining - (Math.random() * 10 - 5));

      data.push({
        day,
        ideal: Math.max(0, idealRemaining),
        actual: Math.max(0, actualRemaining),
        completed: totalHours - actualRemaining,
      });
    }

    return data;
  }, [estimations.totalEstimated, sprintDays]);

  const maxHours = Math.max(...burndownData.map(d => d.ideal), 1);
  const chartHeight = 300;
  const chartWidth = 800;
  const padding = 40;

  const getX = (day: number) => padding + (day / sprintDays) * (chartWidth - padding * 2);
  const getY = (hours: number) =>
    chartHeight - padding - (hours / maxHours) * (chartHeight - padding * 2);

  return (
    <div className={cn(neuCardInsetClass, 'rounded-[1.4rem]')}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-base-content">Burndown Chart</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-4 rounded-sm bg-info" />
            <span className="text-base-content/70">Ideal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-4 rounded-sm bg-success" />
            <span className="text-base-content/70">Real</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight + 60} className="min-w-full">
          {/* Eixos */}
          <line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="hsl(var(--bc) / 0.35)"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke="hsl(var(--bc) / 0.35)"
            strokeWidth="2"
          />

          {/* Linha ideal */}
          <polyline
            points={burndownData.map(d => `${getX(d.day)},${getY(d.ideal)}`).join(' ')}
            fill="none"
            stroke="var(--chart-4)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Linha real */}
          <polyline
            points={burndownData.map(d => `${getX(d.day)},${getY(d.actual)}`).join(' ')}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth="3"
          />

          {/* Pontos */}
          {burndownData.map((d, i) => (
            <g key={i}>
              <circle cx={getX(d.day)} cy={getY(d.ideal)} r="4" fill="var(--chart-4)" />
              <circle cx={getX(d.day)} cy={getY(d.actual)} r="5" fill="var(--chart-1)" />
            </g>
          ))}

          {/* Labels do eixo X */}
          {burndownData
            .filter((_, i) => i % 2 === 0 || i === burndownData.length - 1)
            .map((d, i) => (
              <text
                key={i}
                x={getX(d.day)}
                y={chartHeight - padding + 20}
                textAnchor="middle"
                fill="hsl(var(--bc) / 0.45)"
                fontSize="10"
              >
                Dia {d.day}
              </text>
            ))}

          {/* Labels do eixo Y */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line
                x1={padding - 5}
                y1={getY(maxHours * ratio)}
                x2={padding}
                y2={getY(maxHours * ratio)}
                stroke="hsl(var(--bc) / 0.35)"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={getY(maxHours * ratio) + 4}
                textAnchor="end"
                fill="hsl(var(--bc) / 0.45)"
                fontSize="10"
              >
                {Math.round(maxHours * ratio)}h
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Estatísticas */}
      <div className={cn('mt-4 grid grid-cols-3 gap-4 border-t pt-4', neuDividerClass)}>
        <div className="text-center">
          <div className="text-2xl font-bold text-base-content">
            {Math.round(estimations.totalEstimated)}h
          </div>
          <div className="text-sm text-base-content/70">Total Estimado</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-base-content">
            {Math.round(estimations.totalActual)}h
          </div>
          <div className="text-sm text-base-content/70">Total Real</div>
        </div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              estimations.averageAccuracy >= 80
                ? 'text-success'
                : estimations.averageAccuracy >= 60
                  ? 'text-warning'
                  : 'text-error'
            }`}
          >
            {Math.round(estimations.averageAccuracy)}%
          </div>
          <div className="text-sm text-base-content/70">Precisão Média</div>
        </div>
      </div>
    </div>
  );
};

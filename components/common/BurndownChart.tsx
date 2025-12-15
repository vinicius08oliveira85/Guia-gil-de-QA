import React, { useMemo } from 'react';
import { Project } from '../../types';
import { calculateProjectEstimations } from '../../utils/estimationService';

interface BurndownChartProps {
  project: Project;
  sprintDays?: number;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({
  project,
  sprintDays = 14
}) => {
  const estimations = useMemo(() => calculateProjectEstimations(project), [project]);

  // Simular progresso ao longo do tempo (em produção, viria de dados reais)
  const burndownData = useMemo(() => {
    const data = [];
    const totalHours = estimations.totalEstimated || 100;
    const dailyBurn = totalHours / sprintDays;
    
    for (let day = 0; day <= sprintDays; day++) {
      const idealRemaining = totalHours - (dailyBurn * day);
      const actualRemaining = Math.max(0, idealRemaining - (Math.random() * 10 - 5));
      
      data.push({
        day,
        ideal: Math.max(0, idealRemaining),
        actual: Math.max(0, actualRemaining),
        completed: totalHours - actualRemaining
      });
    }
    
    return data;
  }, [estimations.totalEstimated, sprintDays]);

  const maxHours = Math.max(...burndownData.map(d => d.ideal), 1);
  const chartHeight = 300;
  const chartWidth = 800;
  const padding = 40;

  const getX = (day: number) => padding + (day / sprintDays) * (chartWidth - padding * 2);
  const getY = (hours: number) => chartHeight - padding - (hours / maxHours) * (chartHeight - padding * 2);

  return (
    <div className="p-4 bg-surface border border-surface-border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Burndown Chart</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-blue-500"></div>
            <span className="text-text-secondary">Ideal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-green-500"></div>
            <span className="text-text-secondary">Real</span>
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
            stroke="#64748b"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke="#64748b"
            strokeWidth="2"
          />

          {/* Linha ideal */}
          <polyline
            points={burndownData.map(d => `${getX(d.day)},${getY(d.ideal)}`).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Linha real */}
          <polyline
            points={burndownData.map(d => `${getX(d.day)},${getY(d.actual)}`).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
          />

          {/* Pontos */}
          {burndownData.map((d, i) => (
            <g key={i}>
              <circle
                cx={getX(d.day)}
                cy={getY(d.ideal)}
                r="4"
                fill="#3b82f6"
              />
              <circle
                cx={getX(d.day)}
                cy={getY(d.actual)}
                r="5"
                fill="#10b981"
              />
            </g>
          ))}

          {/* Labels do eixo X */}
          {burndownData.filter((_, i) => i % 2 === 0 || i === burndownData.length - 1).map((d, i) => (
            <text
              key={i}
              x={getX(d.day)}
              y={chartHeight - padding + 20}
              textAnchor="middle"
              fill="#94a3b8"
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
                stroke="#64748b"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={getY(maxHours * ratio) + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="10"
              >
                {Math.round(maxHours * ratio)}h
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-surface-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary">{Math.round(estimations.totalEstimated)}h</div>
          <div className="text-sm text-text-secondary">Total Estimado</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary">{Math.round(estimations.totalActual)}h</div>
          <div className="text-sm text-text-secondary">Total Real</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            estimations.averageAccuracy >= 80 ? 'text-green-400' : estimations.averageAccuracy >= 60 ? 'text-orange-400' : 'text-red-400'
          }`}>
            {Math.round(estimations.averageAccuracy)}%
          </div>
          <div className="text-sm text-text-secondary">Precisão Média</div>
        </div>
      </div>
    </div>
  );
};


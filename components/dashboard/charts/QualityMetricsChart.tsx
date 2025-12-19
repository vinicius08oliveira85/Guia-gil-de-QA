import React, { useMemo } from 'react';
import { Card } from '../../common/Card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Project } from '../../../types';
import { useProjectMetrics } from '../../../hooks/useProjectMetrics';
import { cn } from '../../../utils/cn';

/**
 * Props do componente QualityMetricsChart
 */
interface QualityMetricsChartProps {
  /** Projeto para calcular métricas */
  project: Project;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Props do CustomTooltip
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

/**
 * Componente de tooltip customizado com melhor legibilidade
 */
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={cn(
        'rounded-lg border border-base-300',
        'bg-base-100 shadow-lg',
        'p-4 min-w-[180px]',
        'backdrop-blur-sm'
      )}>
        <p className="mb-2 font-semibold text-base-content text-sm">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="text-xs text-base-content/70 flex-1">
                {entry.name}:
              </span>
              <span className="font-semibold text-base-content text-sm">
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Gráfico de barras mostrando métricas de qualidade por fase de teste
 * 
 * @example
 * ```tsx
 * <QualityMetricsChart project={project} />
 * ```
 */
export const QualityMetricsChart = React.memo<QualityMetricsChartProps>(({ project, className }) => {
  const metrics = useProjectMetrics(project);

  // Calcular métricas por fase baseado nas fases do projeto
  const chartData = useMemo(() => {
    const phases = project.phases || [];
    const tasks = project.tasks || [];
    
    // Mapear fases para dados de cobertura e qualidade
    return phases.map(phase => {
      // Filtrar tarefas relacionadas a esta fase (simplificado)
      const phaseTasks = tasks.filter(task => {
        // Lógica simplificada: distribuir tarefas entre fases
        const phaseIndex = phases.findIndex(p => p.name === phase.name);
        const taskIndex = tasks.findIndex(t => t.id === task.id);
        return Math.floor((taskIndex / tasks.length) * phases.length) === phaseIndex;
      });
      
      const phaseTestCases = phaseTasks.flatMap(t => t.testCases || []);
      const total = phaseTestCases.length;
      const passed = phaseTestCases.filter(tc => tc.status === 'Passed').length;
      
      const coverage = total > 0 ? Math.round((total / metrics.totalTestCases) * 100) : 0;
      const quality = total > 0 ? Math.round((passed / total) * 100) : 100;
      
      return {
        phase: phase.name.length > 10 ? phase.name.substring(0, 10) + '...' : phase.name,
        coverage: Math.min(100, coverage),
        quality: Math.min(100, quality),
      };
    }).filter(item => item.phase); // Remover fases vazias
  }, [project.phases, project.tasks, metrics.totalTestCases]);

  // Se não houver dados suficientes, usar dados de exemplo baseados nas métricas gerais
  const finalData = useMemo(() => {
    if (chartData.length === 0) {
      return [
        { phase: 'Unit', coverage: metrics.testCoverage, quality: metrics.testPassRate },
        { phase: 'Integration', coverage: Math.max(0, metrics.testCoverage - 10), quality: Math.max(0, metrics.testPassRate - 5) },
        { phase: 'System', coverage: Math.max(0, metrics.testCoverage - 15), quality: Math.max(0, metrics.testPassRate - 10) },
        { phase: 'UAT', coverage: Math.max(0, metrics.testCoverage - 20), quality: Math.max(0, metrics.testPassRate - 5) },
      ];
    }
    return chartData;
  }, [chartData, metrics]);

  // Cores mais distintas e com melhor contraste
  const coverageColor = 'hsl(var(--p))'; // Primary - azul/roxo
  const qualityColor = 'hsl(var(--a))'; // Accent - verde/amarelo

  return (
    <Card className={className} hoverable>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-base-content">Métricas de Qualidade por Fase</h3>
          <p className="text-sm text-base-content/70">Cobertura e qualidade por fase de teste</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={finalData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              barGap={8}
              barCategoryGap="20%"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--bc) / 0.1)" 
                opacity={0.3}
              />
              <XAxis
                dataKey="phase"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ 
                  fill: 'hsl(var(--bc) / 0.7)', 
                  fontSize: 11 
                }}
                stroke="hsl(var(--bc) / 0.3)"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ 
                  fill: 'hsl(var(--bc) / 0.7)', 
                  fontSize: 12 
                }}
                stroke="hsl(var(--bc) / 0.3)"
                label={{
                  value: 'Porcentagem (%)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { 
                    fill: 'hsl(var(--bc) / 0.7)', 
                    fontSize: 12 
                  },
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ 
                  fill: 'hsl(var(--bc) / 0.05)', 
                  opacity: 0.2 
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                }}
                iconType="rect"
                iconSize={14}
                formatter={(value) => (
                  <span style={{ 
                    color: 'hsl(var(--bc))', 
                    fontSize: '12px' 
                  }}>
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="coverage"
                name="Cobertura %"
                fill={coverageColor}
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
              <Bar
                dataKey="quality"
                name="Qualidade %"
                fill={qualityColor}
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
});

QualityMetricsChart.displayName = 'QualityMetricsChart';

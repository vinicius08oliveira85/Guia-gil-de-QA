import React from 'react';
import { Card } from '../common/Card';
import { ProgressIndicator } from '../common/ProgressIndicator';
import { Badge } from '../common/Badge';
import { CheckCircle2, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';

/**
 * Props do componente QualityKPIs
 */
interface QualityKPIsProps {
  /** Projeto para calcular KPIs */
  project: Project;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente que exibe KPIs de qualidade do projeto
 * 
 * @example
 * ```tsx
 * <QualityKPIs project={project} />
 * ```
 */
export const QualityKPIs = React.memo<QualityKPIsProps>(({ project, className }) => {
  const metrics = useProjectMetrics(project);

  // Calcular taxa de defeitos
  const defectRate = metrics.totalTestCases > 0
    ? Math.round((metrics.failedTestCases / metrics.totalTestCases) * 100 * 10) / 10
    : 0;

  // Calcular tempo médio de execução (simulado - em produção viria de dados reais)
  const avgExecutionTime = 12.4; // minutos

  // Calcular score geral de qualidade
  const overallQualityScore = React.useMemo(() => {
    const passRateWeight = 0.4;
    const coverageWeight = 0.3;
    const defectRateWeight = 0.2;
    const automationWeight = 0.1;

    const passRateScore = metrics.testPassRate;
    const coverageScore = metrics.testCoverage;
    const defectRateScore = Math.max(0, 100 - (defectRate * 10)); // Inverter: menos defeitos = melhor
    const automationScore = metrics.automationRatio;

    const score = Math.round(
      passRateScore * passRateWeight +
      coverageScore * coverageWeight +
      defectRateScore * defectRateWeight +
      automationScore * automationWeight
    );

    return Math.min(100, Math.max(0, score));
  }, [metrics, defectRate]);

  const getQualityBadge = (score: number): { text: string; variant: 'success' | 'warning' | 'error' | 'info' } => {
    if (score >= 90) return { text: 'Excelente', variant: 'success' };
    if (score >= 75) return { text: 'Bom', variant: 'info' };
    if (score >= 60) return { text: 'Regular', variant: 'warning' };
    return { text: 'Precisa Melhorar', variant: 'error' };
  };

  const qualityBadge = getQualityBadge(overallQualityScore);

  return (
    <Card className={className} hoverable>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-base-content">KPIs de Qualidade</h3>
          <p className="text-sm text-base-content/70">Indicadores-chave de performance</p>
        </div>
        <div className="space-y-6">
          {/* Pass Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                <span className="text-sm font-medium text-base-content">Taxa de Aprovação</span>
              </div>
              <span className="text-sm font-semibold text-base-content">{metrics.testPassRate}%</span>
            </div>
            <ProgressIndicator
              value={metrics.testPassRate}
              max={100}
              color="green"
              showPercentage={false}
              size="sm"
            />
          </div>

          {/* Defect Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-error" aria-hidden="true" />
                <span className="text-sm font-medium text-base-content">Taxa de Defeitos</span>
              </div>
              <span className="text-sm font-semibold text-base-content">{defectRate}%</span>
            </div>
            <ProgressIndicator
              value={defectRate}
              max={100}
              color="red"
              showPercentage={false}
              size="sm"
            />
          </div>

          {/* Coverage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium text-base-content">Cobertura</span>
              </div>
              <span className="text-sm font-semibold text-base-content">{metrics.testCoverage}%</span>
            </div>
            <ProgressIndicator
              value={metrics.testCoverage}
              max={100}
              color="blue"
              showPercentage={false}
              size="sm"
            />
          </div>

          {/* Avg Execution Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-base-content/60" aria-hidden="true" />
                <span className="text-sm font-medium text-base-content">Tempo Médio de Execução</span>
              </div>
              <span className="text-sm font-semibold text-base-content">{avgExecutionTime}m</span>
            </div>
            <ProgressIndicator
              value={65}
              max={100}
              color="blue"
              showPercentage={false}
              size="sm"
            />
          </div>

          {/* Overall Quality Score */}
          <div className="pt-4 border-t border-base-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-base-content/70">Score Geral de Qualidade</span>
              <Badge variant={qualityBadge.variant} size="sm">
                {qualityBadge.text}
              </Badge>
            </div>
            <div className="mt-2 text-2xl font-bold text-primary">{overallQualityScore}</div>
          </div>
        </div>
      </div>
    </Card>
  );
});

QualityKPIs.displayName = 'QualityKPIs';


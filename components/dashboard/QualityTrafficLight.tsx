import React from 'react';
import { Card } from '../common/Card';
import { useQualityMetrics } from '../../hooks/useQualityMetrics';
import { Project } from '../../types';
import { AlertTriangle } from 'lucide-react';

interface QualityTrafficLightProps {
  project: Project;
}

export const QualityTrafficLight: React.FC<QualityTrafficLightProps> = ({ project }) => {
  const metrics = useQualityMetrics(project);

  // Determinar status do semáforo
  const hasCriticalBugs = metrics.criticalBugsOpen > 0;
  const hasRegressionFail = metrics.regressionStatus === 'Fail';

  // Status: Go (verde), Warning (amarelo), No-Go (vermelho)
  type TrafficStatus = 'Go' | 'Warning' | 'No-Go';
  const status: TrafficStatus = hasCriticalBugs ? 'No-Go' : hasRegressionFail ? 'Warning' : 'Go';

  const statusColor =
    status === 'Go' ? 'text-success' : status === 'Warning' ? 'text-warning' : 'text-error';

  const statusBg =
    status === 'Go' ? 'bg-success/10' : status === 'Warning' ? 'bg-warning/10' : 'bg-error/10';

  const statusBorder =
    status === 'Go'
      ? 'border-success/30'
      : status === 'Warning'
        ? 'border-warning/30'
        : 'border-error/30';

  const statusGlow =
    status === 'Go'
      ? 'shadow-lg shadow-success/10'
      : status === 'Warning'
        ? 'shadow-lg shadow-warning/10'
        : 'shadow-lg shadow-error/10';

  return (
    <Card className={`relative overflow-hidden border border-base-300 p-6 sm:p-8 ${statusGlow}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${statusBg} to-transparent opacity-50`} />

      <div className="relative">
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Semáforo Visual */}
          <div className="relative">
            <div
              className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full ${statusColor} ${statusBg} border-2 ${statusBorder} flex items-center justify-center transition-all duration-300`}
            >
              {status === 'Go' && (
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {status === 'Warning' && (
                <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16" aria-hidden="true" />
              )}
              {status === 'No-Go' && (
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center">
            <h2 className={`text-3xl sm:text-4xl font-bold ${statusColor} mb-2`}>
              {status === 'Go' ? 'GO' : status === 'Warning' ? 'WARNING' : 'NO-GO'}
            </h2>
            <p className="text-base-content/70 text-sm sm:text-base">
              {status === 'Go'
                ? 'Produto pronto para produção'
                : status === 'Warning'
                  ? 'Atenção: há indicadores de risco antes de produção'
                  : 'Produto não está pronto para produção'}
            </p>
          </div>

          {/* Métricas Detalhadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
            <div
              className={`rounded-2xl border ${hasCriticalBugs ? 'border-error/30 bg-error/10' : 'border-success/30 bg-success/10'} p-4`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base-content/70 text-sm">Bugs Críticos em Aberto</span>
                <span
                  className={`text-2xl font-bold ${hasCriticalBugs ? 'text-error' : 'text-success'}`}
                >
                  {metrics.criticalBugsOpen}
                </span>
              </div>
              <p className="text-xs text-base-content/60 mt-1">Meta: 0</p>
            </div>

            <div
              className={`rounded-2xl border ${hasRegressionFail ? 'border-warning/30 bg-warning/10' : 'border-success/30 bg-success/10'} p-4`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base-content/70 text-sm">Regressão Automática</span>
                <span
                  className={`text-2xl font-bold ${hasRegressionFail ? 'text-warning' : 'text-success'}`}
                >
                  {metrics.regressionStatus === 'Pass' ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-xs text-base-content/60 mt-1">
                {hasRegressionFail ? 'Testes automatizados falhando' : 'Todos os testes passando'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

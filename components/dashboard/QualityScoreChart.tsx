import React from 'react';
import { cn } from '../../utils/cn';

const RADIUS = 110;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = 256;

export type QualityLevel = 'Excelente' | 'Bom' | 'Regular' | 'Ruim' | 'Crítico';

function getQualityLevel(score: number): QualityLevel {
  if (score >= 90) return 'Excelente';
  if (score >= 75) return 'Bom';
  if (score >= 60) return 'Regular';
  if (score >= 40) return 'Ruim';
  return 'Crítico';
}

interface QualityScoreChartProps {
  score: number;
  qualityLevel?: QualityLevel;
  className?: string;
}

/**
 * Card com Score Geral de Qualidade: gráfico circular SVG, número central e badge de nível.
 */
export const QualityScoreChart = React.memo<QualityScoreChartProps>(
  ({ score, qualityLevel, className }) => {
    const level = qualityLevel ?? getQualityLevel(score);
    const clampedScore = Math.min(100, Math.max(0, score));
    const dashOffset = CIRCUMFERENCE * (1 - clampedScore / 100);

    return (
      <div
        className={cn(
          'bg-base-100 rounded-2xl shadow-sm border border-base-300 p-8 flex flex-col items-center justify-center min-h-[400px]',
          className
        )}
      >
        <span className="text-xs font-semibold text-base-content/70 uppercase tracking-widest mb-6">
          Score Geral de Qualidade
        </span>
        <div className="relative flex items-center justify-center">
          <svg className="w-64 h-64 -rotate-90" width={SIZE} height={SIZE} aria-hidden>
            <circle
              className="text-base-300"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={STROKE}
            />
            <circle
              className="text-primary"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={STROKE}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-8xl font-black text-base-content">
              {Math.round(clampedScore)}
            </span>
            <span className="text-lg text-base-content/60 font-medium">/ 100</span>
          </div>
        </div>
        <div className="mt-8 flex items-center gap-3">
          <span className="px-4 py-1 rounded-full bg-primary/10 text-xs font-bold text-primary uppercase tracking-wide">
            {level}
          </span>
          <span className="text-base-content/70 text-sm">
            Status atual do projeto baseado em métricas de QA
          </span>
        </div>
      </div>
    );
  }
);

QualityScoreChart.displayName = 'QualityScoreChart';

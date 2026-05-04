import React from 'react';
import { Card } from '../common/Card';
import { Sparkles } from 'lucide-react';
import type { ShiftLeftRecommendation } from '../../types';
import { cn } from '../../utils/cn';

const PHASE_LABEL: Record<ShiftLeftRecommendation['phase'], string> = {
  Analysis: 'Análise',
  Design: 'Design',
  'Analysis and Code': 'Análise e código',
};

export interface DashboardShiftLeftInsightsProps {
  recommendations: ShiftLeftRecommendation[];
  className?: string;
}

/** Exibe até 3 recomendações mais recentes (ordem do array = retorno da IA). */
export const DashboardShiftLeftInsights: React.FC<DashboardShiftLeftInsightsProps> = ({
  recommendations,
  className,
}) => {
  const top = recommendations.slice(0, 3);

  if (top.length === 0) {
    return (
      <Card className={cn('!p-4 sm:!p-6 border-dashed border-base-300', className)}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary shrink-0" aria-hidden />
          <h4 className="text-base font-semibold text-base-content">Insights de IA (Shift Left)</h4>
        </div>
        <p className="text-sm text-base-content/65">
          Nenhuma recomendação salva ainda. Use &quot;Gerar estratégia com Gemini&quot; no dashboard
          para criar a análise Shift Left e preencher este painel.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('!p-4 sm:!p-6', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0" aria-hidden />
        <div>
          <h4 className="text-base font-semibold text-base-content">Insights de IA</h4>
          <p className="text-xs text-base-content/60">
            Três recomendações mais recentes (Shift Left)
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {top.map((rec, i) => (
          <li
            key={`${rec.phase}-${i}`}
            className="rounded-lg border border-base-300 bg-base-200/30 px-3 py-2.5 text-sm text-base-content/90"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
              {PHASE_LABEL[rec.phase] ?? rec.phase}
            </span>
            <p className="mt-1 leading-snug">{rec.recommendation}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
};

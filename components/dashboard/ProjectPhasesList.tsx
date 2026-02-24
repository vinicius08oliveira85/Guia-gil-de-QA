import React from 'react';
import { CheckCircle2, Play, Clock } from 'lucide-react';
import type { Phase, PhaseStatus } from '../../types';
import { cn } from '../../utils/cn';

interface ProjectPhasesListProps {
  phases: Phase[];
  /** Percentual de progresso da fase atual "Em Andamento" (0-100). Se não informado, usa heurística. */
  currentPhaseProgress?: number;
  className?: string;
}

function getProgressForPhase(
  status: PhaseStatus,
  index: number,
  total: number,
  override?: number
): number {
  if (status === 'Concluído') return 100;
  if (status === 'Em Andamento') {
    if (override != null) return Math.min(100, Math.max(0, override));
    const base = Math.round(((index + 0.5) / total) * 100);
    return Math.max(20, Math.min(80, base));
  }
  return 0;
}

/**
 * Lista "Fases do Projeto": círculo (check/play/schedule), nome, status e barra quando Em Andamento.
 */
export const ProjectPhasesList = React.memo<ProjectPhasesListProps>(
  ({ phases, currentPhaseProgress, className }) => {
    const total = phases.length;
    const activeIndex = phases.findIndex(p => p.status === 'Em Andamento');

    return (
      <section className={className}>
        <h4 className="text-sm font-bold text-base-content/60 uppercase tracking-widest mb-4">
          Fases do Projeto
        </h4>
        <div className="space-y-4">
          {phases.map((phase, index) => {
            const isCompleted = phase.status === 'Concluído';
            const isActive = phase.status === 'Em Andamento';
            const isPending = phase.status === 'Não Iniciado';
            const progress = getProgressForPhase(
              phase.status,
              index,
              total,
              isActive ? currentPhaseProgress : undefined
            );

            return (
              <div
                key={phase.name}
                className={cn('flex items-center gap-4', isPending && 'opacity-50')}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0',
                    isCompleted && 'border-success text-success',
                    isActive && 'border-primary text-primary',
                    isPending && 'border-base-300 text-base-content/50'
                  )}
                >
                  {isCompleted && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                  {isActive && <Play className="w-4 h-4" aria-hidden="true" />}
                  {isPending && <Clock className="w-4 h-4" aria-hidden="true" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <span className={cn('text-sm font-semibold truncate', isActive && 'font-bold')}>
                      {phase.name}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-success shrink-0">CONCLUÍDA</span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-bold text-primary shrink-0">
                        {progress}% EM CURSO
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <div className="w-full bg-base-300 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
);

ProjectPhasesList.displayName = 'ProjectPhasesList';

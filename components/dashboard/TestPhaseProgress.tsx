import React from 'react';
import { Badge } from '../common/Badge';
import { ProgressIndicator } from '../common/ProgressIndicator';
import { CheckCircle2, Clock, Play } from 'lucide-react';
import { Project, PhaseStatus } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';

/**
 * Props do componente TestPhaseProgress
 */
interface TestPhaseProgressProps {
  /** Projeto para calcular progresso das fases */
  project: Project;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente que exibe o progresso das fases de teste do projeto
 * 
 * @example
 * ```tsx
 * <TestPhaseProgress project={project} />
 * ```
 */
export const TestPhaseProgress = React.memo<TestPhaseProgressProps>(({ project, className }) => {
  const metrics = useProjectMetrics(project);
  const phases = metrics.newPhases || project.phases || [];

  const getPhaseStatus = (status: PhaseStatus): 'completed' | 'active' | 'pending' => {
    if (status === 'Concluído') return 'completed';
    if (status === 'Em Andamento') return 'active';
    return 'pending';
  };

  const getPhaseProgress = (status: PhaseStatus, index: number): number => {
    if (status === 'Concluído') return 100;
    if (status === 'Em Andamento') {
      // Calcular progresso baseado na posição e métricas gerais
      const totalPhases = phases.length;
      const baseProgress = Math.round((index / totalPhases) * 100);
      return Math.max(20, Math.min(80, baseProgress));
    }
    return 0;
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase.status);
          const progress = getPhaseProgress(phase.status, index);
          
          return (
            <div key={phase.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-base-300">
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                    ) : status === 'active' ? (
                      <Play className="h-3 w-3 text-primary" aria-hidden="true" />
                    ) : (
                      <Clock className="h-4 w-4 text-base-content/40" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-base-content">{phase.name}</p>
                    <p className="text-xs text-base-content/60">
                      {status === 'completed' ? 'Concluída' : status === 'active' ? 'Em andamento' : 'Não iniciada'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-base-content">{progress}%</span>
                  <Badge
                    variant={
                      status === 'completed' 
                        ? 'success' 
                        : status === 'active' 
                        ? 'info' 
                        : 'default'
                    }
                    size="sm"
                  >
                    {status === 'completed' 
                      ? 'Concluída' 
                      : status === 'active' 
                      ? 'Em Andamento' 
                      : 'Pendente'}
                  </Badge>
                </div>
              </div>
              <ProgressIndicator
                value={progress}
                max={100}
                color={status === 'completed' ? 'green' : status === 'active' ? 'blue' : 'orange'}
                showPercentage={false}
                size="sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

TestPhaseProgress.displayName = 'TestPhaseProgress';


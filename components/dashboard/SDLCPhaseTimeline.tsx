import React, { useMemo } from 'react';
import { Project, PhaseName } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useSDLCPhaseAnalysis } from '../../hooks/useSDLCPhaseAnalysis';
import { Card } from '../common/Card';
import { InfoIcon } from '../common/Icons';
import { phaseIcons, phaseDisplayNames } from '../../utils/sdlcPhaseIcons';
import { PHASE_NAMES } from '../../utils/constants';

interface SDLCPhaseTimelineProps {
  project: Project;
  onUpdateProject?: (project: Project) => void;
}

/**
 * Componente de timeline das fases SDLC com análise de IA
 */
export const SDLCPhaseTimeline: React.FC<SDLCPhaseTimelineProps> = React.memo(({ 
  project, 
  onUpdateProject 
}) => {
  const metrics = useProjectMetrics(project);
  const { phaseAnalysis, isGenerating, generatePhaseAnalysis } = useSDLCPhaseAnalysis(
    project,
    onUpdateProject,
    false
  );

  const currentPhase = (metrics.currentPhase === 'Concluído' ? 'Monitor' : metrics.currentPhase) as PhaseName;
  const phases = project.phases || [];

  const progressPercentage = phaseAnalysis?.progressPercentage || 0;

  // Contar fases concluídas
  const completedPhasesCount = useMemo(() => {
    return phases.filter(p => p.status === 'Concluído').length;
  }, [phases]);

  return (
    <div className="space-y-6" role="region" aria-label="Timeline de Fases SDLC" aria-live="polite">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-base-content mb-0.5">
              Fases do SDLC - Onde você está agora
            </h2>
            <p className="text-xs text-base-content/70">
              Acompanhe o progresso do projeto através do ciclo de vida do desenvolvimento
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-base-content/70">
              <span>
                {completedPhasesCount} de {PHASE_NAMES.length} fases concluídas
              </span>
              <span className="text-base-content/60">•</span>
              <span>
                {Math.round((completedPhasesCount / PHASE_NAMES.length) * 100)}% do ciclo completo
              </span>
            </div>
          </div>
        </div>

        {/* Card de Análise da Fase Atual */}
        {phaseAnalysis && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{phaseIcons[currentPhase as PhaseName]}</span>
              <h3 className="text-base font-semibold text-base-content">
                Fase Atual: {phaseDisplayNames[currentPhase as PhaseName]}
              </h3>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <div className="text-sm text-base-content">
                  Progresso: <span className="font-semibold text-base-content">{progressPercentage}%</span>
                </div>
                <div className="w-24 h-2 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Explicação */}
            <Card hoverable={false} variant="outlined" className="p-4 bg-info/10 border-info/30">
              <div className="flex items-start gap-3">
                <InfoIcon />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1.5">Por que estamos nesta fase?</h4>
                  <p className="text-sm leading-relaxed text-base-content/70">{phaseAnalysis.explanation}</p>
                </div>
              </div>
            </Card>

            {/* Próximos Passos */}
            {phaseAnalysis.nextSteps && phaseAnalysis.nextSteps.length > 0 && (
              <Card hoverable={false} variant="outlined" className="p-4 bg-success/10 border-success/30">
                <h4 className="font-semibold text-base-content mb-1.5 flex items-center gap-2">
                  <span>✅</span> Próximos Passos
                </h4>
                <div className="space-y-1.5">
                  {phaseAnalysis.nextSteps.map((step, index) => {
                    const priorityColors: Record<string, string> = {
                      'Crítica': 'badge badge-error badge-outline',
                      'Alta': 'badge badge-warning badge-outline',
                      'Média': 'badge badge-info badge-outline',
                      'Baixa': 'badge badge-success badge-outline',
                    };
                    
                    return (
                      <div
                        key={index}
                        className="p-3 bg-base-100 border border-base-300 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-base-content">{step.step}</span>
                          <span className={priorityColors[step.priority] || 'badge badge-base-content badge-outline'}>
                            {step.priority}
                          </span>
                        </div>
                        <p className="text-sm text-base-content/70">{step.description}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Bloqueios */}
            {phaseAnalysis.blockers && phaseAnalysis.blockers.length > 0 && (
              <Card hoverable={false} variant="outlined" className="p-4 bg-error/10 border-error/30">
                <h4 className="font-semibold text-base-content mb-1.5 flex items-center gap-2">
                  <span>⚠️</span> Bloqueios Identificados
                </h4>
                <div className="space-y-1.5">
                  {phaseAnalysis.blockers.map((blocker, index) => {
                    const impactColors: Record<string, string> = {
                      'Crítico': 'badge badge-error badge-outline',
                      'Alto': 'badge badge-warning badge-outline',
                      'Médio': 'badge badge-info badge-outline',
                      'Baixo': 'badge badge-success badge-outline',
                    };
                    
                    return (
                      <div
                        key={index}
                        className="p-3 bg-base-100 border border-base-300 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-base-content">{blocker.blocker}</span>
                          <span className={impactColors[blocker.impact] || 'badge badge-base-content badge-outline'}>
                            Impacto: {blocker.impact}
                          </span>
                        </div>
                        <p className="text-sm mb-2 text-base-content/70">{blocker.description}</p>
                        <p className="text-sm text-primary">
                          <span className="font-semibold">💡 Sugestão:</span> {blocker.suggestion}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Loading State */}
        {isGenerating && !phaseAnalysis && (
          <Card className="p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-base-content/70">Analisando fase atual...</span>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isGenerating && !phaseAnalysis && (
          <Card className="p-4 text-center">
            <p className="text-base-content/70 mb-4">
              Clique em "Gerar Análise" para obter insights sobre a fase atual do projeto.
            </p>
            <button
              type="button"
              onClick={generatePhaseAnalysis}
              className="btn btn-primary btn-sm rounded-full"
              aria-label="Gerar análise de fase SDLC"
            >
              🔄 Gerar Análise
            </button>
          </Card>
        )}
      </Card>
    </div>
  );
});

SDLCPhaseTimeline.displayName = 'SDLCPhaseTimeline';


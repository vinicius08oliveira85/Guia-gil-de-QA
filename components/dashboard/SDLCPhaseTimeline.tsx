import React, { useMemo } from 'react';
import { Circle, AlertCircle, Lightbulb } from 'lucide-react';
import { Project, PhaseName } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useSDLCPhaseAnalysis } from '../../hooks/useSDLCPhaseAnalysis';
import { Card } from '../common/Card';
import { InfoIcon } from '../common/Icons';
import { phaseIcons, phaseDisplayNames } from '../../utils/sdlcPhaseIcons';
import { PHASE_NAMES } from '../../utils/constants';
import { Badge } from '../common/Badge';

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
          <div className="mt-6 space-y-6">
            {/* Seção Fase Atual - Melhorada */}
            <Card hoverable={false} variant="outlined" className="p-5 border border-base-300 bg-base-100">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{phaseIcons[currentPhase as PhaseName]}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-base-content">
                        {phaseDisplayNames[currentPhase as PhaseName]}
                      </h3>
                      <p className="text-sm text-base-content/70 mt-0.5">Fase atual do projeto</p>
                    </div>
                  </div>
                  <Badge variant="info" size="sm">Em Progresso</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-base-content/80">
                      Progresso: <span className="font-semibold text-base-content">{progressPercentage}%</span>
                    </span>
                    <span className="text-base-content/60 font-mono text-xs">
                      {Math.round(progressPercentage)}% completo
                    </span>
                  </div>
                  <div className="h-2.5 bg-base-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Explicação - Melhorada */}
            <Card hoverable={false} variant="outlined" className="p-5 bg-info/10 border-info/30">
              <div className="flex items-start gap-3">
                <InfoIcon />
                <div className="flex-1">
                  <h4 className="font-semibold text-base-content mb-2">Por que estamos nesta fase?</h4>
                  <p className="text-sm leading-relaxed text-base-content/80">{phaseAnalysis.explanation}</p>
                </div>
              </div>
            </Card>

            {/* Próximos Passos - Melhorado */}
            {phaseAnalysis.nextSteps && phaseAnalysis.nextSteps.length > 0 && (
              <Card hoverable={false} variant="outlined" className="p-5 bg-success/10 border-success/30">
                <h4 className="font-semibold text-base-content mb-4 text-lg flex items-center gap-2">
                  <span>✅</span> Próximos Passos
                </h4>
                <div className="space-y-3">
                  {phaseAnalysis.nextSteps.map((step, index) => {
                    const getPriorityVariant = (priority: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
                      if (priority === 'Crítica') return 'error';
                      if (priority === 'Alta') return 'warning';
                      if (priority === 'Média') return 'info';
                      if (priority === 'Baixa') return 'success';
                      return 'default';
                    };
                    
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 transition-colors"
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <Circle className="h-5 w-5 text-base-content/40" aria-label="Pendente" />
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-medium text-base-content leading-relaxed">{step.step}</h4>
                            <Badge variant={getPriorityVariant(step.priority)} size="sm" className="shrink-0">
                              {step.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-base-content/70 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Bloqueios - Melhorado */}
            {phaseAnalysis.blockers && phaseAnalysis.blockers.length > 0 && (
              <Card hoverable={false} variant="outlined" className="p-5 bg-error/10 border-error/30">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-error" aria-label="Alerta" />
                  <h4 className="text-lg font-semibold text-base-content">Bloqueios Identificados</h4>
                </div>
                <div className="space-y-4">
                  {phaseAnalysis.blockers.map((blocker, index) => {
                    const getImpactVariant = (impact: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
                      if (impact === 'Crítico') return 'error';
                      if (impact === 'Alto') return 'warning';
                      if (impact === 'Médio') return 'info';
                      if (impact === 'Baixo') return 'success';
                      return 'default';
                    };
                    
                    return (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-base-100 border border-base-300 space-y-3 hover:bg-base-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-medium text-base-content leading-relaxed">{blocker.blocker}</h4>
                          <Badge variant={getImpactVariant(blocker.impact)} size="sm" className="shrink-0">
                            Impacto: {blocker.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-base-content/70 leading-relaxed">{blocker.description}</p>
                        <div className="space-y-2 pt-2 border-t border-base-300">
                          <div className="flex items-center gap-2 text-sm font-medium text-base-content">
                            <Lightbulb className="h-4 w-4 text-warning" aria-label="Sugestão" />
                            <span>Sugestão</span>
                          </div>
                          <p className="text-sm text-base-content/80 leading-relaxed pl-6">{blocker.suggestion}</p>
                        </div>
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


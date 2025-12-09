import React, { useMemo } from 'react';
import { Project, PhaseStatus, PhaseName } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useSDLCPhaseAnalysis } from '../../hooks/useSDLCPhaseAnalysis';
import { Card } from '../common/Card';
import { InfoIcon } from '../common/Icons';
import { ProcessPillars, Pillar } from '../common/ProcessPillars';
import { phaseIcons, phaseDescriptions, phaseDisplayNames } from '../../utils/sdlcPhaseIcons';
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

  const getStatusStyles = (status: PhaseStatus, isCurrent: boolean) => {
    const baseStyles = {
      'Concluído': {
        bg: 'bg-green-600',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-green-600',
        ring: 'ring-green-600/30',
        pulse: false,
        badgeBg: 'bg-green-600/20',
        badgeText: 'text-green-700 dark:text-green-300',
      },
      'Em Andamento': {
        bg: 'bg-yellow-500',
        text: 'text-yellow-900 dark:text-yellow-200',
        border: 'border-yellow-500',
        ring: 'ring-yellow-500/30',
        pulse: true,
        badgeBg: 'bg-yellow-500/20',
        badgeText: 'text-yellow-700 dark:text-yellow-300',
      },
      'Não Iniciado': {
        bg: 'bg-red-600',
        text: 'text-red-800 dark:text-red-300',
        border: 'border-red-600',
        ring: 'ring-red-600/30',
        pulse: false,
        badgeBg: 'bg-red-600/20',
        badgeText: 'text-red-700 dark:text-red-300',
      },
    };

    const styles = baseStyles[status];
    
    return {
      ...styles,
      ring: isCurrent ? `ring-2 ${styles.ring}` : '',
    };
  };

  const progressPercentage = phaseAnalysis?.progressPercentage || 0;

  // Mapear fases para pillars com alturas baseadas no status
  const pillars = useMemo<Pillar[]>(() => {
    return PHASE_NAMES.map((phaseName, index) => {
      const phase = phases.find(p => p.name === phaseName) || { 
        name: phaseName, 
        status: 'Não Iniciado' as PhaseStatus 
      };
      const isCurrent = phaseName === currentPhase;
      
      // Calcular altura baseada no status
      let height: string;
      if (phase.status === 'Concluído') {
        // Fases concluídas: altura máxima
        height = 'h-full';
      } else if (phase.status === 'Em Andamento' || isCurrent) {
        // Fase atual ou em andamento: altura alta
        const heights = ['h-16', 'h-24', 'h-32', 'h-40', 'h-48', 'h-56', 'h-64', 'h-72', 'h-80', 'h-96'];
        height = heights[Math.min(index, heights.length - 1)] || 'h-48';
      } else {
        // Não iniciado: altura baixa
        const heights = ['h-8', 'h-12', 'h-16', 'h-20', 'h-24'];
        height = heights[Math.min(index % 5, heights.length - 1)] || 'h-12';
      }
      
      return {
        label: phaseDisplayNames[phaseName as PhaseName],
        height,
        delay: index * 0.1,
        status: phase.status,
        isCurrent,
      };
    });
  }, [phases, currentPhase]);

  return (
    <div className="space-y-6" role="region" aria-label="Timeline de Fases SDLC">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-1">
              Fases do SDLC - Onde você está agora
            </h2>
            <p className="text-sm text-text-secondary">
              Acompanhe o progresso do projeto através do ciclo de vida do desenvolvimento
            </p>
          </div>
        </div>

        {/* Process Pillars */}
        <div className="relative mb-8 overflow-x-auto pb-4">
          <div className="flex justify-center min-w-max">
            <ProcessPillars pillars={pillars} />
          </div>
        </div>

        {/* Card de Análise da Fase Atual */}
        {phaseAnalysis && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{phaseIcons[currentPhase as PhaseName]}</span>
              <h3 className="text-lg font-semibold text-text-primary">
                Fase Atual: {phaseDisplayNames[currentPhase as PhaseName]}
              </h3>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <div className="text-sm text-text-secondary">
                  Progresso: <span className="font-semibold text-text-primary">{progressPercentage}%</span>
                </div>
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Explicação */}
            <Card className="p-4 bg-blue-500/10 border-blue-500/30">
              <div className="flex items-start gap-3">
                <InfoIcon />
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary mb-2">Por que estamos nesta fase?</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">{phaseAnalysis.explanation}</p>
                </div>
              </div>
            </Card>

            {/* Próximos Passos */}
            {phaseAnalysis.nextSteps && phaseAnalysis.nextSteps.length > 0 && (
              <Card className="p-4 bg-green-500/10 border-green-500/30">
                <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <span>✅</span> Próximos Passos
                </h4>
                <div className="space-y-2">
                  {phaseAnalysis.nextSteps.map((step, index) => {
                    const priorityColors = {
                      'Crítica': 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/50',
                      'Alta': 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/50',
                      'Média': 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/50',
                      'Baixa': 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50',
                    };
                    
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-black/20"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-text-primary">{step.step}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[step.priority]}`}>
                            {step.priority}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary">{step.description}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Bloqueios */}
            {phaseAnalysis.blockers && phaseAnalysis.blockers.length > 0 && (
              <Card className="p-4 bg-red-500/10 border-red-500/30">
                <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <span>⚠️</span> Bloqueios Identificados
                </h4>
                <div className="space-y-2">
                  {phaseAnalysis.blockers.map((blocker, index) => {
                    const impactColors = {
                      'Crítico': 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/50',
                      'Alto': 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/50',
                      'Médio': 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/50',
                      'Baixo': 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50',
                    };
                    
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-black/20"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-text-primary">{blocker.blocker}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${impactColors[blocker.impact]}`}>
                            Impacto: {blocker.impact}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">{blocker.description}</p>
                        <p className="text-sm text-accent">
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
          <Card className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <span className="ml-3 text-text-secondary">Analisando fase atual...</span>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isGenerating && !phaseAnalysis && (
          <Card className="p-6 text-center">
            <p className="text-text-secondary mb-4">
              Clique em "Gerar Análise" para obter insights sobre a fase atual do projeto.
            </p>
            <button
              onClick={generatePhaseAnalysis}
              className="btn btn-primary"
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


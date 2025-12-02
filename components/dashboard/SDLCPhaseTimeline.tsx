import React, { useState } from 'react';
import { Project, PhaseStatus, PhaseName } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useSDLCPhaseAnalysis } from '../../hooks/useSDLCPhaseAnalysis';
import { Card } from '../common/Card';
import { InfoIcon } from '../common/Icons';
import { phaseIcons, phaseDescriptions, phaseColors, phaseDisplayNames } from '../../utils/sdlcPhaseIcons';
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
  const [autoGenerate, setAutoGenerate] = useState(true);
  const metrics = useProjectMetrics(project);
  const { phaseAnalysis, isGenerating, generatePhaseAnalysis } = useSDLCPhaseAnalysis(
    project,
    onUpdateProject,
    autoGenerate
  );

  const currentPhase = (metrics.currentPhase === 'Concluído' ? 'Monitor' : metrics.currentPhase) as PhaseName;
  const phases = project.phases || [];

  const getStatusStyles = (status: PhaseStatus, isCurrent: boolean) => {
    const baseStyles = {
      'Concluído': {
        bg: 'bg-green-500',
        text: 'text-green-300',
        border: 'border-green-500',
        ring: 'ring-green-500/30',
        pulse: false,
      },
      'Em Andamento': {
        bg: 'bg-yellow-500',
        text: 'text-yellow-300',
        border: 'border-yellow-500',
        ring: 'ring-yellow-500/30',
        pulse: true,
      },
      'Não Iniciado': {
        bg: 'bg-slate-600',
        text: 'text-slate-400',
        border: 'border-slate-600',
        ring: 'ring-slate-600/30',
        pulse: false,
      },
    };

    const styles = baseStyles[status];
    
    return {
      ...styles,
      ring: isCurrent ? `ring-2 ${styles.ring}` : '',
    };
  };

  const getProgressBarColor = (phaseName: PhaseName, index: number, currentIndex: number) => {
    if (index < currentIndex) return 'bg-green-500';
    if (index === currentIndex) return 'bg-yellow-500';
    return 'bg-slate-600';
  };

  const currentPhaseIndex = PHASE_NAMES.indexOf(currentPhase);
  const progressPercentage = phaseAnalysis?.progressPercentage || 0;

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
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-text-secondary whitespace-nowrap">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="rounded flex-shrink-0"
                aria-label="Gerar análise automaticamente"
              />
              <span>Auto-gerar</span>
            </label>
            <button
              onClick={generatePhaseAnalysis}
              disabled={isGenerating}
              className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              aria-label="Gerar análise de fase SDLC"
            >
              {isGenerating ? 'Gerando...' : '🔄 Gerar Análise'}
            </button>
          </div>
        </div>

        {/* Timeline Horizontal */}
        <div className="relative mb-8">
          {/* Barra de progresso de fundo */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-slate-700 rounded-full" />
          
          {/* Timeline com fases */}
          <div className="relative flex items-center justify-between gap-2 overflow-x-auto pb-4">
            {PHASE_NAMES.map((phaseName, index) => {
              const phase = phases.find(p => p.name === phaseName) || { 
                name: phaseName, 
                status: 'Não Iniciado' as PhaseStatus 
              };
              const isCurrent = phaseName === currentPhase;
              const styles = getStatusStyles(phase.status, isCurrent);
              const phaseColor = phaseColors[phaseName as PhaseName];
              
              return (
                <div
                  key={phaseName}
                  className="flex flex-col items-center flex-1 min-w-[80px] max-w-[120px] relative group"
                >
                  {/* Barra de conexão */}
                  {index < PHASE_NAMES.length - 1 && (
                    <div
                      className={`absolute top-6 left-1/2 w-full h-1 ${getProgressBarColor(
                        phaseName as PhaseName,
                        index,
                        currentPhaseIndex
                      )} z-0`}
                      style={{ transform: 'translateX(50%)' }}
                    />
                  )}

                  {/* Ícone da fase */}
                  <div
                    className={`relative z-10 w-12 h-12 rounded-full ${styles.bg} ${styles.border} border-2 ${styles.ring} flex items-center justify-center text-2xl transition-all duration-300 ${
                      styles.pulse && isCurrent ? 'animate-pulse' : ''
                    } ${
                      isCurrent ? 'scale-110 shadow-lg' : 'hover:scale-105'
                    } cursor-pointer group-hover:shadow-lg`}
                    title={phaseDescriptions[phaseName as PhaseName]}
                    aria-label={`Fase ${phaseDisplayNames[phaseName as PhaseName]}: ${phase.status}`}
                  >
                    {phaseIcons[phaseName as PhaseName]}
                  </div>

                  {/* Nome da fase */}
                  <div className="mt-2 text-center">
                    <p className="text-xs font-semibold text-text-primary line-clamp-2">
                      {phaseDisplayNames[phaseName as PhaseName]}
                    </p>
                    <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${phaseColor.bg} ${phaseColor.text}`}>
                      {phase.status}
                    </span>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                    <div className="bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl max-w-xs border border-slate-700">
                      <p className="font-semibold mb-1">{phaseDisplayNames[phaseName as PhaseName]}</p>
                      <p className="text-slate-300">{phaseDescriptions[phaseName as PhaseName]}</p>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                        <div className="border-4 border-transparent border-t-slate-800" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                      'Crítica': 'bg-red-500/20 text-red-300 border-red-500/50',
                      'Alta': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
                      'Média': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
                      'Baixa': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
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
                      'Crítico': 'bg-red-500/20 text-red-300 border-red-500/50',
                      'Alto': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
                      'Médio': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
                      'Baixo': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
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


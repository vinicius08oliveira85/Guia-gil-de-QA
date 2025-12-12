import React, { useMemo } from 'react';
import { Project, PhaseName } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useSDLCPhaseAnalysis } from '../../hooks/useSDLCPhaseAnalysis';
import { Card } from '../common/Card';
import { InfoIcon } from '../common/Icons';
import { phaseIcons, phaseDisplayNames } from '../../utils/sdlcPhaseIcons';
import { PHASE_NAMES } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';
import { getInfoCardClasses, getSuccessCardClasses, getErrorCardClasses, getCardTextSecondaryClasses } from '../../utils/themeCardColors';

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
  const { theme } = useTheme();
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

  // Função para determinar o status de cada fase
  const getPhaseStatus = useMemo(() => {
    const phaseMap = new Map(phases.map(p => [p.name, p.status]));
    const currentPhaseIndex = PHASE_NAMES.findIndex(name => name === currentPhase);
    
    return (phaseName: PhaseName, index: number) => {
      const status = phaseMap.get(phaseName);
      const phaseIndex = PHASE_NAMES.indexOf(phaseName);
      
      if (status === 'Concluído') return 'completed';
      if (phaseIndex === currentPhaseIndex || (status === 'Em Andamento' && phaseIndex <= currentPhaseIndex)) return 'current';
      return 'upcoming';
    };
  }, [phases, currentPhase]);

  return (
    <div className="space-y-6" role="region" aria-label="Timeline de Fases SDLC" aria-live="polite">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-0.5">
              Fases do SDLC - Onde você está agora
            </h2>
            <p className="text-xs text-white">
              Acompanhe o progresso do projeto através do ciclo de vida do desenvolvimento
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-white">
              <span>
                {completedPhasesCount} de {PHASE_NAMES.length} fases concluídas
              </span>
              <span className="text-white">•</span>
              <span>
                {Math.round((completedPhasesCount / PHASE_NAMES.length) * 100)}% do ciclo completo
              </span>
            </div>
          </div>
        </div>

        {/* Timeline das Fases */}
        <div className="mt-6">
          <ul className="relative" style={{ minHeight: `${PHASE_NAMES.length * 80}px` }}>
            {/* Linha vertical central */}
            <div className="absolute left-1/2 top-0 w-0.5 bg-gray-700 -translate-x-1/2" style={{ height: `${PHASE_NAMES.length * 80}px` }} />
            
            {PHASE_NAMES.map((phaseName, index) => {
              const status = getPhaseStatus(phaseName as PhaseName, index);
              const isCompleted = status === 'completed';
              const isCurrent = status === 'current';
              const isLast = index === PHASE_NAMES.length - 1;
              const isEven = index % 2 === 0;
              
              // Cor primária para fases concluídas e atual
              const primaryColor = isCompleted || isCurrent ? 'text-accent' : 'text-gray-500';
              const hrColor = isCompleted || isCurrent ? 'bg-accent' : 'bg-gray-700';
              
              // Determinar se a linha deve ser colorida (até a fase atual)
              const currentPhaseIndex = PHASE_NAMES.indexOf(currentPhase);
              const shouldColorLine = index <= currentPhaseIndex;
              
              const topOffset = index * 80; // Espaçamento vertical entre itens
              
              return (
                <li key={phaseName} className="relative" style={{ minHeight: '80px' }}>
                  {/* Linha horizontal antes (exceto no primeiro item) */}
                  {index > 0 && (
                    <hr className={`absolute ${isEven ? 'left-0 right-1/2 mr-9' : 'left-1/2 right-0 ml-9'} h-0.5 ${shouldColorLine ? hrColor : 'bg-gray-700'}`} style={{ top: `${topOffset + 18}px` }} />
                  )}
                  
                  {/* Conteúdo da fase - lado esquerdo para pares, direito para ímpares */}
                  {isEven ? (
                    <>
                      <div className={`absolute left-0 right-1/2 pr-9`} style={{ top: `${topOffset}px` }}>
                        <div className={`bg-black/20 border border-surface-border rounded-lg p-3 ${isCurrent ? 'ring-2 ring-accent' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{phaseIcons[phaseName as PhaseName]}</span>
                            <div>
                              <div className="font-semibold text-white text-sm">
                                {phaseDisplayNames[phaseName as PhaseName]}
                              </div>
                              {isCurrent && (
                                <div className="text-xs text-accent mt-0.5">Fase Atual</div>
                              )}
                              {isCompleted && (
                                <div className="text-xs text-green-400 mt-0.5">Concluído</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ícone do meio */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: `${topOffset + 18}px` }}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isCompleted || isCurrent ? 'bg-accent/20' : 'bg-gray-500/20'}`}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`${primaryColor} h-5 w-5`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Ícone do meio */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: `${topOffset + 18}px` }}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isCompleted || isCurrent ? 'bg-accent/20' : 'bg-gray-500/20'}`}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`${primaryColor} h-5 w-5`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                      
                      <div className={`absolute left-1/2 right-0 pl-9`} style={{ top: `${topOffset}px` }}>
                        <div className={`bg-black/20 border border-surface-border rounded-lg p-3 ${isCurrent ? 'ring-2 ring-accent' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{phaseIcons[phaseName as PhaseName]}</span>
                            <div>
                              <div className="font-semibold text-white text-sm">
                                {phaseDisplayNames[phaseName as PhaseName]}
                              </div>
                              {isCurrent && (
                                <div className="text-xs text-accent mt-0.5">Fase Atual</div>
                              )}
                              {isCompleted && (
                                <div className="text-xs text-green-400 mt-0.5">Concluído</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Linha horizontal depois (exceto no último item) */}
                  {!isLast && (
                    <hr className={`absolute ${isEven ? 'left-1/2 right-0 ml-9' : 'left-0 right-1/2 mr-9'} h-0.5 ${shouldColorLine ? hrColor : 'bg-gray-700'}`} style={{ top: `${topOffset + 18}px` }} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Card de Análise da Fase Atual */}
        {phaseAnalysis && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{phaseIcons[currentPhase as PhaseName]}</span>
              <h3 className="text-base font-semibold text-white">
                Fase Atual: {phaseDisplayNames[currentPhase as PhaseName]}
              </h3>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <div className="text-sm text-white">
                  Progresso: <span className="font-semibold text-white">{progressPercentage}%</span>
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
            <Card className={`p-3 border-2 ${getInfoCardClasses(theme)}`}>
              <div className="flex items-start gap-3">
                <InfoIcon />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1.5">Por que estamos nesta fase?</h4>
                  <p className={`text-sm leading-relaxed ${getCardTextSecondaryClasses(theme)}`}>{phaseAnalysis.explanation}</p>
                </div>
              </div>
            </Card>

            {/* Próximos Passos */}
            {phaseAnalysis.nextSteps && phaseAnalysis.nextSteps.length > 0 && (
              <Card className={`p-3 border-2 ${getSuccessCardClasses(theme)}`}>
                <h4 className="font-semibold text-text-primary mb-1.5 flex items-center gap-2">
                  <span>✅</span> Próximos Passos
                </h4>
                <div className="space-y-1.5">
                  {phaseAnalysis.nextSteps.map((step, index) => {
                    const getPriorityColors = () => {
                      if (theme === 'leve-saude') {
                        return {
                          'Crítica': 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200 border-red-400 dark:border-red-600',
                          'Alta': 'bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200 border-orange-400 dark:border-orange-600',
                          'Média': 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-200 border-yellow-400 dark:border-yellow-600',
                          'Baixa': 'bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 border-blue-400 dark:border-blue-600',
                        };
                      }
                      return {
                        'Crítica': 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/50',
                        'Alta': 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/50',
                        'Média': 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/50',
                        'Baixa': 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50',
                      };
                    };
                    const priorityColors = getPriorityColors();
                    
                    return (
                      <div
                        key={index}
                        className={`p-2.5 rounded-lg border ${theme === 'leve-saude' ? 'bg-white/80 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700' : 'bg-black/20 border-surface-border'}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-text-primary">{step.step}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[step.priority]}`}>
                            {step.priority}
                          </span>
                        </div>
                        <p className={`text-sm ${getCardTextSecondaryClasses(theme)}`}>{step.description}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Bloqueios */}
            {phaseAnalysis.blockers && phaseAnalysis.blockers.length > 0 && (
              <Card className={`p-3 border-2 ${getErrorCardClasses(theme)}`}>
                <h4 className="font-semibold text-text-primary mb-1.5 flex items-center gap-2">
                  <span>⚠️</span> Bloqueios Identificados
                </h4>
                <div className="space-y-1.5">
                  {phaseAnalysis.blockers.map((blocker, index) => {
                    const getImpactColors = () => {
                      if (theme === 'leve-saude') {
                        return {
                          'Crítico': 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200 border-red-400 dark:border-red-600',
                          'Alto': 'bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200 border-orange-400 dark:border-orange-600',
                          'Médio': 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-200 border-yellow-400 dark:border-yellow-600',
                          'Baixo': 'bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 border-blue-400 dark:border-blue-600',
                        };
                      }
                      return {
                        'Crítico': 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/50',
                        'Alto': 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/50',
                        'Médio': 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/50',
                        'Baixo': 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50',
                      };
                    };
                    const impactColors = getImpactColors();
                    
                    return (
                      <div
                        key={index}
                        className={`p-2.5 rounded-lg border ${theme === 'leve-saude' ? 'bg-white/80 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700' : 'bg-black/20 border-surface-border'}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-text-primary">{blocker.blocker}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${impactColors[blocker.impact]}`}>
                            Impacto: {blocker.impact}
                          </span>
                        </div>
                        <p className={`text-sm mb-2 ${getCardTextSecondaryClasses(theme)}`}>{blocker.description}</p>
                        <p className={`text-sm ${theme === 'leve-saude' ? 'text-orange-700 dark:text-orange-300' : 'text-accent'}`}>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <span className="ml-3 text-text-secondary">Analisando fase atual...</span>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isGenerating && !phaseAnalysis && (
          <Card className="p-4 text-center">
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


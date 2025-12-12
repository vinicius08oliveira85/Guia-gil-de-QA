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

  return (
    <div className="space-y-6" role="region" aria-label="Timeline de Fases SDLC" aria-live="polite">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              Fases do SDLC - Onde você está agora
            </h2>
            <p className="text-sm text-white">
              Acompanhe o progresso do projeto através do ciclo de vida do desenvolvimento
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-white">
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
            <Card className={`p-4 border-2 ${getInfoCardClasses(theme)}`}>
              <div className="flex items-start gap-3">
                <InfoIcon />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Por que estamos nesta fase?</h4>
                  <p className={`text-sm leading-relaxed ${getCardTextSecondaryClasses(theme)}`}>{phaseAnalysis.explanation}</p>
                </div>
              </div>
            </Card>

            {/* Próximos Passos */}
            {phaseAnalysis.nextSteps && phaseAnalysis.nextSteps.length > 0 && (
              <Card className={`p-4 border-2 ${getSuccessCardClasses(theme)}`}>
                <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <span>✅</span> Próximos Passos
                </h4>
                <div className="space-y-2">
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
                        className={`p-3 rounded-lg border ${theme === 'leve-saude' ? 'bg-white/80 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700' : 'bg-black/20 border-surface-border'}`}
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
              <Card className={`p-4 border-2 ${getErrorCardClasses(theme)}`}>
                <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <span>⚠️</span> Bloqueios Identificados
                </h4>
                <div className="space-y-2">
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
                        className={`p-3 rounded-lg border ${theme === 'leve-saude' ? 'bg-white/80 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700' : 'bg-black/20 border-surface-border'}`}
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


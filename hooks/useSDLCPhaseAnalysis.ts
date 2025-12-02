import { useState, useCallback, useEffect } from 'react';
import { Project, SDLCPhaseAnalysis } from '../types';
import { 
    generateSDLCPhaseAnalysis, 
    markSDLCPhaseAnalysisAsOutdated 
} from '../services/ai/sdlcPhaseAnalysisService';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook para gerenciar análise de fase SDLC com IA
 */
export function useSDLCPhaseAnalysis(project: Project, onUpdateProject?: (project: Project) => void, autoGenerate: boolean = false) {
    const [isGenerating, setIsGenerating] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();

    // Marcar análise como desatualizada quando o projeto muda
    useEffect(() => {
        if (onUpdateProject && project.sdlcPhaseAnalysis) {
            const updatedProject = markSDLCPhaseAnalysisAsOutdated(project);
            const analysisChanged = updatedProject.sdlcPhaseAnalysis?.isOutdated !== project.sdlcPhaseAnalysis?.isOutdated;
            
            if (analysisChanged) {
                onUpdateProject(updatedProject);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        project.tasks.length,
        project.tasks.map(t => `${t.id}-${t.status}-${t.title}`).join(','),
        project.documents.length,
        project.phases.map(p => `${p.name}-${p.status}`).join(','),
    ]);

    // Gerar automaticamente se configurado e análise estiver desatualizada ou não existir
    useEffect(() => {
        if (autoGenerate && onUpdateProject) {
            const needsGeneration = !project.sdlcPhaseAnalysis || project.sdlcPhaseAnalysis.isOutdated;
            
            if (needsGeneration && !isGenerating) {
                // Delay para não bloquear renderização inicial
                const timer = setTimeout(() => {
                    generatePhaseAnalysis();
                }, 2000);

                return () => clearTimeout(timer);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoGenerate, project.id]);

    const generatePhaseAnalysis = useCallback(async () => {
        setIsGenerating(true);
        try {
            const analysis = await generateSDLCPhaseAnalysis(project);
            
            if (onUpdateProject) {
                onUpdateProject({
                    ...project,
                    sdlcPhaseAnalysis: analysis,
                });
            }
            
            handleSuccess('Análise de fase SDLC gerada com sucesso!');
            return analysis;
        } catch (error) {
            handleError(error, 'Erro ao gerar análise de fase SDLC');
            throw error;
        } finally {
            setIsGenerating(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    return {
        phaseAnalysis: project.sdlcPhaseAnalysis || null,
        isGenerating,
        generatePhaseAnalysis,
    };
}


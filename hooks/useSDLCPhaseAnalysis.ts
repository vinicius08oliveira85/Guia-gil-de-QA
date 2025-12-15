import { useState, useCallback, useEffect } from 'react';
import { Project } from '../types';
import { 
    generateSDLCPhaseAnalysis, 
    markSDLCPhaseAnalysisAsOutdated 
} from '../services/ai/sdlcPhaseAnalysisService';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook para gerenciar análise de fase SDLC com IA
 */
export function useSDLCPhaseAnalysis(project: Project, onUpdateProject?: (project: Project) => void, _autoGenerate: boolean = false) {
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

    // Geração automática removida - apenas manual através do botão

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


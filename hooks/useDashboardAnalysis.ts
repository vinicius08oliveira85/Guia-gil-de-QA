import { useState, useCallback, useEffect } from 'react';
import { Project } from '../types';
import { 
    generateDashboardOverviewAnalysis, 
    markDashboardAnalysesAsOutdated 
} from '../services/ai/dashboardAnalysisService';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook para gerenciar análises do dashboard
 */
export function useDashboardAnalysis(project: Project, onUpdateProject?: (project: Project) => void) {
    const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();

    // Marcar análises como desatualizadas quando o projeto muda
    useEffect(() => {
        if (onUpdateProject && project.dashboardOverviewAnalysis) {
            const updatedProject = markDashboardAnalysesAsOutdated(project);
            // Só atualizar se realmente mudou
            const overviewChanged = updatedProject.dashboardOverviewAnalysis?.isOutdated !== project.dashboardOverviewAnalysis?.isOutdated;
            
            if (overviewChanged) {
                onUpdateProject(updatedProject);
            }
        }
         
    }, [
        project.tasks.length,
        project.tasks.map(t => `${t.id}-${t.status}-${t.title}`).join(','), // Detectar mudanças em tarefas
        project.documents.length, // Detectar mudanças em documentos
        project.documents.map(d => `${d.name}-${d.content.length}`).join(','), // Detectar mudanças em conteúdo de documentos
        project.phases.map(p => `${p.name}-${p.status}`).join(','),
        project.description,
    ]);

    const generateOverviewAnalysis = useCallback(async () => {
        setIsGeneratingOverview(true);
        try {
            const analysis = await generateDashboardOverviewAnalysis(project);
            
            if (onUpdateProject) {
                onUpdateProject({
                    ...project,
                    dashboardOverviewAnalysis: analysis,
                });
            }
            
            handleSuccess('Análise de visão geral gerada com sucesso!');
            return analysis;
        } catch (error) {
            handleError(error, 'Erro ao gerar análise de visão geral');
            throw error;
        } finally {
            setIsGeneratingOverview(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    return {
        overviewAnalysis: project.dashboardOverviewAnalysis || null,
        isGeneratingOverview,
        generateOverviewAnalysis,
    };
}


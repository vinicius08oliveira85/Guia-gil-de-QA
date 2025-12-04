import { useState, useCallback, useEffect } from 'react';
import { Project, DashboardInsightsAnalysis } from '../types';
import { 
    generateDashboardInsightsAnalysis, 
    markDashboardInsightsAsOutdated 
} from '../services/ai/dashboardInsightsService';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook para gerenciar análise de insights do dashboard com IA
 */
export function useDashboardInsights(project: Project, onUpdateProject?: (project: Project) => void, autoGenerate: boolean = false) {
    const [isGenerating, setIsGenerating] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();

    // Marcar análise como desatualizada quando o projeto muda
    useEffect(() => {
        if (onUpdateProject && project.dashboardInsightsAnalysis) {
            const updatedProject = markDashboardInsightsAsOutdated(project);
            const insightsChanged = updatedProject.dashboardInsightsAnalysis?.isOutdated !== project.dashboardInsightsAnalysis?.isOutdated;
            
            if (insightsChanged) {
                onUpdateProject(updatedProject);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        project.tasks.length,
        project.tasks.map(t => `${t.id}-${t.status}-${t.title}`).join(','),
        project.metricsHistory?.length || 0,
    ]);

    // Geração automática removida - apenas manual através do botão

    const generateInsightsAnalysis = useCallback(async () => {
        setIsGenerating(true);
        try {
            const analysis = await generateDashboardInsightsAnalysis(project);
            
            if (onUpdateProject) {
                onUpdateProject({
                    ...project,
                    dashboardInsightsAnalysis: analysis,
                });
            }
            
            handleSuccess('Análise de insights gerada com sucesso!');
            return analysis;
        } catch (error) {
            handleError(error, 'Erro ao gerar análise de insights');
            throw error;
        } finally {
            setIsGenerating(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    return {
        insightsAnalysis: project.dashboardInsightsAnalysis || null,
        isGenerating,
        generateInsightsAnalysis,
    };
}


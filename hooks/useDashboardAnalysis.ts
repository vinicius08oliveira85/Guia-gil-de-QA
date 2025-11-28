import { useState, useCallback, useEffect } from 'react';
import { Project, DashboardOverviewAnalysis, DashboardRequirementsAnalysis } from '../types';
import { 
    generateDashboardOverviewAnalysis, 
    generateDashboardRequirementsAnalysis,
    markDashboardAnalysesAsOutdated 
} from '../services/ai/dashboardAnalysisService';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook para gerenciar análises do dashboard
 */
export function useDashboardAnalysis(project: Project, onUpdateProject?: (project: Project) => void) {
    const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);
    const [isGeneratingRequirements, setIsGeneratingRequirements] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();

    // Marcar análises como desatualizadas quando o projeto muda
    useEffect(() => {
        if (onUpdateProject && (project.dashboardOverviewAnalysis || project.dashboardRequirementsAnalysis)) {
            const updatedProject = markDashboardAnalysesAsOutdated(project);
            // Só atualizar se realmente mudou
            const overviewChanged = updatedProject.dashboardOverviewAnalysis?.isOutdated !== project.dashboardOverviewAnalysis?.isOutdated;
            const requirementsChanged = updatedProject.dashboardRequirementsAnalysis?.isOutdated !== project.dashboardRequirementsAnalysis?.isOutdated;
            
            if (overviewChanged || requirementsChanged) {
                onUpdateProject(updatedProject);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        project.tasks.length,
        project.tasks.map(t => `${t.id}-${t.status}-${t.title}`).join(','), // Detectar mudanças em tarefas
        project.documents.length, // Detectar mudanças em documentos
        project.documents.map(d => `${d.name}-${d.content.length}`).join(','), // Detectar mudanças em conteúdo de documentos
        project.requirements?.length,
        project.rtm?.length,
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

    const generateRequirementsAnalysis = useCallback(async () => {
        setIsGeneratingRequirements(true);
        try {
            const analysis = await generateDashboardRequirementsAnalysis(project);
            
            if (onUpdateProject) {
                onUpdateProject({
                    ...project,
                    dashboardRequirementsAnalysis: analysis,
                });
            }
            
            handleSuccess('Análise de requisitos gerada com sucesso!');
            return analysis;
        } catch (error) {
            handleError(error, 'Erro ao gerar análise de requisitos');
            throw error;
        } finally {
            setIsGeneratingRequirements(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    return {
        overviewAnalysis: project.dashboardOverviewAnalysis || null,
        requirementsAnalysis: project.dashboardRequirementsAnalysis || null,
        isGeneratingOverview,
        isGeneratingRequirements,
        generateOverviewAnalysis,
        generateRequirementsAnalysis,
    };
}


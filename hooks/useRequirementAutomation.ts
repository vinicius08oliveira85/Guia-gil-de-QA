import { useState, useCallback } from 'react';
import { Project, Requirement, JiraTask } from '../types';
import { 
    autoCreateRequirementsFromTask,
    autoLinkTestCasesToRequirements,
    analyzeRequirementWithAI,
    updateRTMEntry,
} from '../services/requirementService';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook para gerenciar automação de requisitos
 */
export function useRequirementAutomation(
    project: Project,
    onUpdateProject?: (project: Project) => void
) {
    const [isExtracting, setIsExtracting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();

    /**
     * Extrai requisitos de uma tarefa
     */
    const extractRequirementsFromTask = useCallback(async (task: JiraTask) => {
        if (!onUpdateProject) return [];
        
        setIsExtracting(true);
        try {
            const newRequirements = await autoCreateRequirementsFromTask(project, task);
            
            if (newRequirements.length > 0) {
                const updatedRequirements = [...(project.requirements || []), ...newRequirements];
                onUpdateProject({
                    ...project,
                    requirements: updatedRequirements,
                });
                
                handleSuccess(`${newRequirements.length} requisito(s) extraído(s) da tarefa "${task.title}"`);
            } else {
                handleSuccess('Nenhum requisito identificado na tarefa');
            }
            
            return newRequirements;
        } catch (error) {
            handleError(error, 'Erro ao extrair requisitos da tarefa');
            throw error;
        } finally {
            setIsExtracting(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    /**
     * Analisa qualidade de um requisito
     */
    const analyzeRequirement = useCallback(async (requirement: Requirement) => {
        if (!onUpdateProject) return null;
        
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeRequirementWithAI(project, requirement);
            
            if (analysis) {
                const updatedRequirements = (project.requirements || []).map(req =>
                    req.id === requirement.id
                        ? { ...req, aiAnalysis: analysis }
                        : req
                );
                
                onUpdateProject({
                    ...project,
                    requirements: updatedRequirements,
                });
                
                handleSuccess('Análise de qualidade do requisito gerada com sucesso!');
            }
            
            return analysis;
        } catch (error) {
            handleError(error, 'Erro ao analisar requisito');
            throw error;
        } finally {
            setIsAnalyzing(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    /**
     * Vincula casos de teste aos requisitos automaticamente
     */
    const autoLinkTestCases = useCallback(async () => {
        if (!onUpdateProject) return;
        
        setIsLinking(true);
        try {
            const matches = await autoLinkTestCasesToRequirements(project);
            
            if (matches.length > 0) {
                const updatedRequirements = (project.requirements || []).map(req => {
                    const match = matches.find(m => m.requirementId === req.id);
                    if (match) {
                        // Adicionar novos casos de teste sem duplicar
                        const existingTestCases = req.testCases || [];
                        const newTestCases = match.testCaseIds.filter(id => !existingTestCases.includes(id));
                        const updatedTestCases = [...existingTestCases, ...newTestCases];
                        
                        // Atualizar RTM
                        updateRTMEntry(project, req.id, updatedTestCases);
                        
                        return {
                            ...req,
                            testCases: updatedTestCases,
                        };
                    }
                    return req;
                });
                
                // Atualizar RTM
                const updatedRTM = (project.rtm || []).map(entry => {
                    const match = matches.find(m => m.requirementId === entry.requirementId);
                    if (match) {
                        return updateRTMEntry(project, entry.requirementId, match.testCaseIds);
                    }
                    return entry;
                });
                
                // Adicionar novos RTM entries
                matches.forEach(match => {
                    const existing = updatedRTM.find(e => e.requirementId === match.requirementId);
                    if (!existing) {
                        updatedRTM.push(updateRTMEntry(project, match.requirementId, match.testCaseIds));
                    }
                });
                
                onUpdateProject({
                    ...project,
                    requirements: updatedRequirements,
                    rtm: updatedRTM,
                });
                
                handleSuccess(`${matches.length} vínculo(s) criado(s) entre requisitos e casos de teste`);
            } else {
                handleSuccess('Nenhum vínculo identificado entre requisitos e casos de teste');
            }
        } catch (error) {
            handleError(error, 'Erro ao vincular casos de teste');
            throw error;
        } finally {
            setIsLinking(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    /**
     * Processa múltiplas tarefas em lote
     */
    const batchProcessTasks = useCallback(async (tasks: JiraTask[]) => {
        if (!onUpdateProject) return [];
        
        setIsExtracting(true);
        const allNewRequirements: Requirement[] = [];
        
        try {
            for (const task of tasks) {
                try {
                    const newRequirements = await autoCreateRequirementsFromTask(project, task);
                    allNewRequirements.push(...newRequirements);
                } catch (error) {
                    console.error(`Erro ao processar tarefa ${task.id}:`, error);
                    // Continuar com próxima tarefa
                }
            }
            
            if (allNewRequirements.length > 0) {
                const updatedRequirements = [...(project.requirements || []), ...allNewRequirements];
                onUpdateProject({
                    ...project,
                    requirements: updatedRequirements,
                });
                
                handleSuccess(`${allNewRequirements.length} requisito(s) extraído(s) de ${tasks.length} tarefa(s)`);
            }
            
            return allNewRequirements;
        } catch (error) {
            handleError(error, 'Erro ao processar tarefas em lote');
            throw error;
        } finally {
            setIsExtracting(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    return {
        isExtracting,
        isAnalyzing,
        isLinking,
        extractRequirementsFromTask,
        analyzeRequirement,
        autoLinkTestCases,
        batchProcessTasks,
    };
}


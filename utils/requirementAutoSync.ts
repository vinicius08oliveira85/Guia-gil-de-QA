import { Project, Requirement, JiraTask } from '../types';
import { autoCreateRequirementsFromTask, autoLinkTestCasesToRequirements } from '../services/requirementService';
import { logger } from './logger';

/**
 * Detecta novas tarefas que ainda não têm requisitos extraídos
 */
export function detectTasksWithoutRequirements(project: Project): JiraTask[] {
    const requirements = project.requirements || [];
    const tasksWithRequirements = new Set(
        requirements
            .filter(r => r.sourceTaskId)
            .map(r => r.sourceTaskId!)
    );
    
    return project.tasks.filter(
        task => task.type !== 'Bug' && !tasksWithRequirements.has(task.id)
    );
}

/**
 * Detecta requisitos que precisam de análise de IA
 */
export function detectRequirementsNeedingAnalysis(project: Project): Requirement[] {
    const requirements = project.requirements || [];
    return requirements.filter(r => !r.aiAnalysis);
}

/**
 * Detecta requisitos sem casos de teste vinculados
 */
export function detectRequirementsWithoutTestCases(project: Project): Requirement[] {
    const requirements = project.requirements || [];
    return requirements.filter(r => r.testCases.length === 0);
}

/**
 * Detecta casos de teste sem requisitos vinculados
 */
export function detectTestCasesWithoutRequirements(project: Project): Array<{ testCaseId: string; taskId: string }> {
    const requirements = project.requirements || [];
    const allRequirementTestCaseIds = new Set(
        requirements.flatMap(r => r.testCases)
    );
    
    const unlinkedTestCases: Array<{ testCaseId: string; taskId: string }> = [];
    
    project.tasks.forEach(task => {
        (task.testCases || []).forEach(testCase => {
            if (!allRequirementTestCaseIds.has(testCase.id)) {
                unlinkedTestCases.push({
                    testCaseId: testCase.id,
                    taskId: task.id,
                });
            }
        });
    });
    
    return unlinkedTestCases;
}

/**
 * Sincroniza requisitos quando tarefas mudam
 * Retorna informações sobre o que precisa ser sincronizado
 */
export function getRequirementSyncInfo(project: Project): {
    tasksWithoutRequirements: JiraTask[];
    requirementsNeedingAnalysis: Requirement[];
    requirementsWithoutTestCases: Requirement[];
    testCasesWithoutRequirements: Array<{ testCaseId: string; taskId: string }>;
} {
    return {
        tasksWithoutRequirements: detectTasksWithoutRequirements(project),
        requirementsNeedingAnalysis: detectRequirementsNeedingAnalysis(project),
        requirementsWithoutTestCases: detectRequirementsWithoutTestCases(project),
        testCasesWithoutRequirements: detectTestCasesWithoutRequirements(project),
    };
}

/**
 * Sugere ações de sincronização baseado no estado do projeto
 */
export function getSyncSuggestions(project: Project): string[] {
    const syncInfo = getRequirementSyncInfo(project);
    const suggestions: string[] = [];
    
    if (syncInfo.tasksWithoutRequirements.length > 0) {
        suggestions.push(
            `${syncInfo.tasksWithoutRequirements.length} tarefa(s) sem requisitos extraídos. Considere extrair requisitos automaticamente.`
        );
    }
    
    if (syncInfo.requirementsNeedingAnalysis.length > 0) {
        suggestions.push(
            `${syncInfo.requirementsNeedingAnalysis.length} requisito(s) sem análise de IA. Execute análise de qualidade.`
        );
    }
    
    if (syncInfo.requirementsWithoutTestCases.length > 0) {
        suggestions.push(
            `${syncInfo.requirementsWithoutTestCases.length} requisito(s) sem casos de teste vinculados. Considere vincular casos de teste automaticamente.`
        );
    }
    
    if (syncInfo.testCasesWithoutRequirements.length > 0) {
        suggestions.push(
            `${syncInfo.testCasesWithoutRequirements.length} caso(s) de teste sem requisitos vinculados. Considere fazer matching automático.`
        );
    }
    
    return suggestions;
}


import { Requirement, RTMEntry, Project, TestCase } from '../types';
import { logger } from '../utils/logger';

/**
 * Gera o próximo ID de requisito no formato R-001, R-002, etc.
 */
export function generateRequirementId(requirements: Requirement[]): string {
    const existingIds = requirements.map(r => r.id);
    let counter = 1;
    let newId = `R-${String(counter).padStart(3, '0')}`;
    
    while (existingIds.includes(newId)) {
        counter++;
        newId = `R-${String(counter).padStart(3, '0')}`;
    }
    
    return newId;
}

/**
 * Cria um novo requisito
 */
export function createRequirement(
    project: Project,
    requirementData: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>
): Requirement {
    const requirements = project.requirements || [];
    const newRequirement: Requirement = {
        ...requirementData,
        id: generateRequirementId(requirements),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    
    logger.info('Requirement created', { requirementId: newRequirement.id });
    return newRequirement;
}

/**
 * Atualiza um requisito existente
 */
export function updateRequirement(
    project: Project,
    requirementId: string,
    updates: Partial<Omit<Requirement, 'id' | 'createdAt'>>
): Requirement | null {
    const requirements = project.requirements || [];
    const index = requirements.findIndex(r => r.id === requirementId);
    
    if (index === -1) {
        logger.warn('Requirement not found', { requirementId });
        return null;
    }
    
    const updatedRequirement: Requirement = {
        ...requirements[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    
    logger.info('Requirement updated', { requirementId });
    return updatedRequirement;
}

/**
 * Deleta um requisito
 */
export function deleteRequirement(
    project: Project,
    requirementId: string
): boolean {
    const requirements = project.requirements || [];
    const index = requirements.findIndex(r => r.id === requirementId);
    
    if (index === -1) {
        logger.warn('Requirement not found for deletion', { requirementId });
        return false;
    }
    
    // Remover do RTM também
    const rtm = project.rtm || [];
    const updatedRTM = rtm.filter(entry => entry.requirementId !== requirementId);
    
    logger.info('Requirement deleted', { requirementId });
    return true;
}

/**
 * Calcula a cobertura de um requisito baseado nos casos de teste
 */
export function calculateRequirementCoverage(
    requirement: Requirement,
    allTestCases: TestCase[]
): number {
    if (requirement.testCases.length === 0) {
        return 0;
    }
    
    const relatedTestCases = allTestCases.filter(tc => 
        requirement.testCases.includes(tc.id)
    );
    
    if (relatedTestCases.length === 0) {
        return 0;
    }
    
    const executedTestCases = relatedTestCases.filter(tc => tc.status !== 'Not Run');
    const passedTestCases = relatedTestCases.filter(tc => tc.status === 'Passed');
    
    // Cobertura = (casos executados e aprovados / total de casos do requisito) * 100
    if (executedTestCases.length === 0) {
        return 0;
    }
    
    const coverage = (passedTestCases.length / requirement.testCases.length) * 100;
    return Math.round(coverage);
}

/**
 * Atualiza ou cria uma entrada RTM para um requisito
 */
export function updateRTMEntry(
    project: Project,
    requirementId: string,
    testCaseIds: string[]
): RTMEntry {
    const rtm = project.rtm || [];
    const existingIndex = rtm.findIndex(entry => entry.requirementId === requirementId);
    
    // Obter todos os casos de teste do projeto
    const allTestCases = project.tasks.flatMap(task => task.testCases || []);
    const relatedTestCases = allTestCases.filter(tc => testCaseIds.includes(tc.id));
    
    // Calcular cobertura
    const executedTestCases = relatedTestCases.filter(tc => tc.status !== 'Not Run');
    const passedTestCases = relatedTestCases.filter(tc => tc.status === 'Passed');
    const coverage = testCaseIds.length > 0 
        ? Math.round((passedTestCases.length / testCaseIds.length) * 100)
        : 0;
    
    const rtmEntry: RTMEntry = {
        requirementId,
        testCaseIds,
        coverage,
        lastValidated: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
        rtm[existingIndex] = rtmEntry;
    } else {
        rtm.push(rtmEntry);
    }
    
    logger.info('RTM entry updated', { requirementId, coverage });
    return rtmEntry;
}

/**
 * Obtém a entrada RTM de um requisito
 */
export function getRTMEntry(
    project: Project,
    requirementId: string
): RTMEntry | null {
    const rtm = project.rtm || [];
    return rtm.find(entry => entry.requirementId === requirementId) || null;
}

/**
 * Obtém todos os requisitos relacionados a uma tarefa
 */
export function getRequirementsByTask(
    project: Project,
    taskId: string
): Requirement[] {
    const requirements = project.requirements || [];
    return requirements.filter(req => req.relatedTasks.includes(taskId));
}

/**
 * Obtém todos os requisitos relacionados a um caso de teste
 */
export function getRequirementsByTestCase(
    project: Project,
    testCaseId: string
): Requirement[] {
    const requirements = project.requirements || [];
    return requirements.filter(req => req.testCases.includes(testCaseId));
}


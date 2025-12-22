import { TestCase } from '../types';
import { logger } from './logger';

/**
 * Mescla testCases salvos com novos testCases, preservando status dos salvos
 * 
 * Estratégia de mesclagem:
 * - Se um testCase existe tanto nos salvos quanto nos novos (mesmo ID), usar os dados dos salvos (preservar status)
 * - Se um testCase existe apenas nos novos, adicionar normalmente
 * - Se um testCase existe apenas nos salvos mas não nos novos, preservar (caso o teste tenha sido removido do Jira mas ainda existe localmente)
 * 
 * @param savedTestCases TestCases salvos no Supabase (com status preservados)
 * @param newTestCases Novos testCases vindos do Jira ou gerados
 * @returns Array mesclado de testCases
 */
export const mergeTestCases = (
    savedTestCases: TestCase[],
    newTestCases: TestCase[]
): TestCase[] => {
    // Se não há testCases salvos, retornar os novos
    if (!savedTestCases || savedTestCases.length === 0) {
        return newTestCases || [];
    }
    
    // Se não há novos testCases, retornar os salvos
    if (!newTestCases || newTestCases.length === 0) {
        return savedTestCases;
    }
    
    // Criar um Map dos testCases salvos por ID para busca rápida
    const savedMap = new Map<string, TestCase>();
    for (const testCase of savedTestCases) {
        if (testCase.id) {
            savedMap.set(testCase.id, testCase);
        }
    }
    
    // Criar um Set dos IDs dos novos testCases para verificar quais são novos
    const newIds = new Set(newTestCases.map(tc => tc.id).filter(Boolean));
    
    // Mesclar: começar com os novos testCases, mas preservar status dos salvos
    const merged: TestCase[] = newTestCases.map(newTestCase => {
        const saved = savedMap.get(newTestCase.id);
        
        if (saved) {
            // TestCase existe tanto nos salvos quanto nos novos
            // Preservar todos os dados do salvo (incluindo status, observedResult, etc.)
            // Mas atualizar com dados novos se necessário (description, steps, expectedResult podem ter mudado)
            return {
                ...saved, // Preservar status e outros dados salvos
                // Atualizar campos que podem ter mudado no Jira
                description: newTestCase.description || saved.description,
                steps: newTestCase.steps || saved.steps,
                expectedResult: newTestCase.expectedResult || saved.expectedResult,
                title: newTestCase.title || saved.title,
                // Preservar campos que não vêm do Jira
                status: saved.status, // Sempre preservar status salvo
                observedResult: saved.observedResult,
                isAutomated: saved.isAutomated,
                toolsUsed: saved.toolsUsed,
                preconditions: saved.preconditions,
                testSuite: saved.testSuite,
                testEnvironment: saved.testEnvironment,
                priority: saved.priority,
                strategies: saved.strategies,
                executedStrategy: saved.executedStrategy,
            };
        }
        
        // TestCase é novo, adicionar normalmente
        return newTestCase;
    });
    
    // Adicionar testCases que existem apenas nos salvos (foram removidos do Jira mas ainda existem localmente)
    for (const savedTestCase of savedTestCases) {
        if (savedTestCase.id && !newIds.has(savedTestCase.id)) {
            merged.push(savedTestCase);
            logger.debug(`Preservando testCase removido do Jira: ${savedTestCase.id}`, 'testCaseMerge');
        }
    }
    
    logger.debug(
        `Mesclados ${savedTestCases.length} testCases salvos com ${newTestCases.length} novos, resultado: ${merged.length} testCases`,
        'testCaseMerge'
    );
    
    return merged;
};


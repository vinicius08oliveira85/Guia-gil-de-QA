import { TestCase } from '../types';
import { logger } from './logger';

/**
 * Mescla testCases prioritários com testCases secundários
 * 
 * Estratégia de mesclagem:
 * - Se um testCase existe tanto nos prioritários quanto nos secundários (mesmo ID), usar os dados dos prioritários (preservar status)
 * - Se um testCase existe apenas nos prioritários, adicionar normalmente
 * - Se um testCase existe apenas nos secundários mas não nos prioritários, preservar (caso o teste tenha sido removido mas ainda existe nos secundários)
 * 
 * @param primaryTestCases TestCases prioritários (geralmente os existentes no projeto - mais recentes)
 * @param secondaryTestCases TestCases secundários (geralmente os salvos no Supabase)
 * @returns Array mesclado de testCases
 */
export const mergeTestCases = (
    primaryTestCases: TestCase[],
    secondaryTestCases: TestCase[]
): TestCase[] => {
    // Se não há testCases prioritários, retornar os secundários
    if (!primaryTestCases || primaryTestCases.length === 0) {
        return secondaryTestCases || [];
    }
    
    // Se não há testCases secundários, retornar os prioritários
    if (!secondaryTestCases || secondaryTestCases.length === 0) {
        return primaryTestCases;
    }
    
    // Criar um Map dos testCases secundários por ID para busca rápida
    const secondaryMap = new Map<string, TestCase>();
    for (const testCase of secondaryTestCases) {
        if (testCase.id) {
            secondaryMap.set(testCase.id, testCase);
        }
    }
    
    /**
     * Determina qual status usar na mesclagem
     * REGRA DE OURO: Se o primário tem status diferente de "Not Run", esse status NUNCA é alterado
     * A única exceção é se o primário tem "Not Run" e o secundário tem um status executado
     */
    const determineStatus = (primary: TestCase, secondary: TestCase): TestCase['status'] => {
        const primaryHasStatus = primary.status !== 'Not Run';
        const secondaryHasStatus = secondary.status !== 'Not Run';
        
        // REGRA DE OURO: Se o primário tem status executado, SEMPRE usar o primário (NUNCA sobrescrever)
        if (primaryHasStatus) {
            logger.debug(`REGRA DE OURO: Preservando status primário "${primary.status}" para testCase ${primary.id} (nunca sobrescrever)`, 'testCaseMerge');
            return primary.status;
        }
        
        // Se o primário é "Not Run" e o secundário tem status executado, usar o secundário
        if (!primaryHasStatus && secondaryHasStatus) {
            logger.debug(`Preservando status salvo "${secondary.status}" para testCase ${primary.id} (primário era "Not Run")`, 'testCaseMerge');
            return secondary.status;
        }
        
        // Se ambos são "Not Run", usar o primário
        logger.debug(`Ambos são "Not Run" para testCase ${primary.id}, usando primário`, 'testCaseMerge');
        return primary.status;
    };
    
    // Criar um Set dos IDs dos prioritários para verificar quais são novos
    const primaryIds = new Set(primaryTestCases.map(tc => tc.id).filter(Boolean));
    
    // Mesclar: começar com os prioritários, mas verificar se há dados nos secundários para preencher lacunas
    const merged: TestCase[] = primaryTestCases.map(primaryTestCase => {
        const secondary = secondaryMap.get(primaryTestCase.id);
        
        if (secondary) {
            // TestCase existe tanto nos prioritários quanto nos secundários
            // Priorizar dados dos prioritários (mais recentes), mas usar secundários para preencher campos vazios
            // IMPORTANTE: Status usa lógica especial para preservar status salvos quando existente é "Not Run"
            const finalStatus = determineStatus(primaryTestCase, secondary);
            
            return {
                ...primaryTestCase, // Priorizar dados prioritários (mais recentes)
                // Usar secundários apenas se campos prioritários estiverem vazios
                description: primaryTestCase.description || secondary.description,
                steps: primaryTestCase.steps?.length > 0 ? primaryTestCase.steps : secondary.steps,
                expectedResult: primaryTestCase.expectedResult || secondary.expectedResult,
                title: primaryTestCase.title || secondary.title,
                // Status: usar lógica especial para preservar status salvos
                status: finalStatus,
                // Outros campos: priorizar prioritários, usar secundários como fallback
                observedResult: primaryTestCase.observedResult || secondary.observedResult,
                isAutomated: primaryTestCase.isAutomated !== undefined ? primaryTestCase.isAutomated : secondary.isAutomated,
                toolsUsed: primaryTestCase.toolsUsed?.length > 0 ? primaryTestCase.toolsUsed : secondary.toolsUsed,
                preconditions: primaryTestCase.preconditions || secondary.preconditions,
                testSuite: primaryTestCase.testSuite || secondary.testSuite,
                testEnvironment: primaryTestCase.testEnvironment || secondary.testEnvironment,
                priority: primaryTestCase.priority || secondary.priority,
                strategies: primaryTestCase.strategies?.length > 0 ? primaryTestCase.strategies : secondary.strategies,
                executedStrategy: primaryTestCase.executedStrategy || secondary.executedStrategy,
            };
        }
        
        // TestCase existe apenas nos prioritários, adicionar normalmente
        return primaryTestCase;
    });
    
    // Adicionar testCases que existem apenas nos secundários (foram removidos mas ainda existem nos secundários)
    for (const secondaryTestCase of secondaryTestCases) {
        if (secondaryTestCase.id && !primaryIds.has(secondaryTestCase.id)) {
            merged.push(secondaryTestCase);
            logger.debug(`Preservando testCase dos secundários: ${secondaryTestCase.id}`, 'testCaseMerge');
        }
    }
    
    logger.debug(
        `Mesclados ${primaryTestCases.length} testCases prioritários com ${secondaryTestCases.length} secundários, resultado: ${merged.length} testCases`,
        'testCaseMerge'
    );
    
    return merged;
};


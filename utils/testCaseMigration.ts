import { TestCase } from '../types';

/**
 * Normaliza executedStrategy para sempre ser um array
 * Converte strings antigas (legado) para array
 */
export function normalizeExecutedStrategy(executedStrategy?: string | string[]): string[] {
  if (!executedStrategy) {
    return [];
  }
  
  if (Array.isArray(executedStrategy)) {
    return executedStrategy.filter(s => s && s.trim() !== '');
  }
  
  // Se for string (formato antigo), converte para array
  return executedStrategy.trim() !== '' ? [executedStrategy] : [];
}

/**
 * Migra um TestCase antigo para o novo formato
 * Converte executedStrategy de string para array se necessário
 */
export function migrateTestCase(testCase: TestCase): TestCase {
  if (typeof testCase.executedStrategy === 'string') {
    return {
      ...testCase,
      executedStrategy: normalizeExecutedStrategy(testCase.executedStrategy)
    };
  }
  return testCase;
}

/**
 * Migra um array de TestCases
 */
export function migrateTestCases(testCases: TestCase[]): TestCase[] {
  return testCases.map(migrateTestCase);
}


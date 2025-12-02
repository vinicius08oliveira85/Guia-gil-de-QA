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
 * Verifica se um TestCase precisa de migração
 */
export function needsMigration(testCase: TestCase): boolean {
  return typeof testCase.executedStrategy === 'string';
}

/**
 * Migra um TestCase antigo para o novo formato
 * Converte executedStrategy de string para array se necessário
 */
export function migrateTestCase(testCase: TestCase): TestCase {
  if (needsMigration(testCase)) {
    return {
      ...testCase,
      executedStrategy: normalizeExecutedStrategy(testCase.executedStrategy)
    };
  }
  return testCase;
}

/**
 * Migra um array de TestCases
 * Otimizado: apenas migra quando necessário
 */
export function migrateTestCases(testCases: TestCase[]): TestCase[] {
  // Verificar se há algum caso que precisa de migração
  const needsAnyMigration = testCases.some(needsMigration);
  if (!needsAnyMigration) {
    return testCases; // Retornar array original se não precisa migrar
  }
  return testCases.map(migrateTestCase);
}


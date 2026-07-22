import type { TestCase } from '../types';
import { mergeTestCases } from './testCaseMerge';
import { logger } from './logger';

interface MergeResult {
  testCases: TestCase[];
  existingWithStatus: number;
  savedWithStatus: number;
  addedFromSaved: number;
}

/**
 * Mescla testCases de uma issue Jira com os testCases existentes (do store)
 * e os salvos (do Supabase), usando a "REGRADA DE OURO":
 * Se existem testCases com status executado no store, eles NUNCA são sobrescritos.
 * Apenas adiciona testCases novos que não existem nos existentes.
 *
 * Esta lógica estava duplicada 3x em syncJiraProject.ts (~200 linhas cada).
 */
export function mergeTaskTestCases(
  existingTestCases: TestCase[],
  savedTestCases: TestCase[],
  taskId: string,
  context: string
): MergeResult {
  const existingWithStatus = existingTestCases.filter(tc => tc.status !== 'Not Run').length;
  const savedWithStatus = savedTestCases.filter(tc => tc.status !== 'Not Run').length;

  if (existingTestCases.length > 0 && existingWithStatus > 0) {
    const existingIds = new Set(existingTestCases.map(tc => tc.id).filter(Boolean));
    const merged = [...existingTestCases];
    let addedFromSaved = 0;

    for (const saved of savedTestCases) {
      if (saved.id && !existingIds.has(saved.id)) {
        merged.push(saved);
        addedFromSaved++;
      }
    }

    const finalWithStatus = merged.filter(tc => tc.status !== 'Not Run').length;

    logger.info(`PROTEÇÃO FINAL [${context}]: ${existingWithStatus} status executados para ${taskId}. Usando diretamente.`, 'jiraTestCaseMerge', {
      existentes: existingTestCases.length,
      existentesComStatus: existingWithStatus,
      salvos: savedTestCases.length,
      salvosComStatus: savedWithStatus,
      resultado: merged.length,
      resultadoComStatus: finalWithStatus,
      novosTestCasesAdicionados: addedFromSaved,
    });

    return { testCases: merged, existingWithStatus, savedWithStatus, addedFromSaved };
  }

  if (existingTestCases.length > 0) {
    const merged = mergeTestCases(existingTestCases, savedTestCases);
    const finalWithStatus = merged.filter(tc => tc.status !== 'Not Run').length;

    logger.debug(`Mesclando testCases [${context}] para ${taskId} (sem status executados nos existentes)`, 'jiraTestCaseMerge', {
      existentes: existingTestCases.length,
      salvos: savedTestCases.length,
      resultado: merged.length,
      resultadoComStatus: finalWithStatus,
    });

    return { testCases: merged, existingWithStatus, savedWithStatus, addedFromSaved: 0 };
  }

  if (savedTestCases.length > 0) {
    logger.debug(`Usando ${savedTestCases.length} testCases salvos [${context}] para ${taskId}`, 'jiraTestCaseMerge', {
      salvosComStatus: savedWithStatus,
    });
    return { testCases: savedTestCases, existingWithStatus, savedWithStatus, addedFromSaved: 0 };
  }

  logger.debug(`Nenhum testCase encontrado [${context}] para ${taskId}`, 'jiraTestCaseMerge');
  return { testCases: [], existingWithStatus, savedWithStatus, addedFromSaved: 0 };
}

export type { MergeResult };

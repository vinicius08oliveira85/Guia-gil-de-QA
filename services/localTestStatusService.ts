import type { TestCase } from '../types';
import { loadProjectsFromIndexedDB } from './dbService';
import { logger } from '../utils/logger';

const JIRA_KEY_RE = /^[A-Z]+-\d+$/;

/**
 * Busca status de testes salvos localmente (IndexedDB) por chave Jira.
 */
export async function loadTestStatusesByJiraKeys(
  jiraKeys: string[]
): Promise<Map<string, TestCase[]>> {
  const result = new Map<string, TestCase[]>();
  const validKeys = jiraKeys.filter(key => JIRA_KEY_RE.test(key));

  if (validKeys.length === 0) {
    logger.debug(
      'Nenhuma chave Jira válida fornecida para buscar status de testes',
      'localTestStatusService'
    );
    return result;
  }

  try {
    const projects = await loadProjectsFromIndexedDB();
    if (projects.length === 0) {
      return result;
    }

    const keysSet = new Set(validKeys);
    let totalTestCasesFound = 0;
    let totalTestCasesWithStatus = 0;

    for (const project of projects) {
      if (!project.tasks?.length) continue;

      for (const task of project.tasks) {
        if (!task.id || !JIRA_KEY_RE.test(task.id) || !keysSet.has(task.id)) continue;

        const testCases = task.testCases ?? [];
        if (testCases.length === 0) continue;

        const testCasesWithStatus = testCases.filter(tc => tc.status !== 'Not Run').length;
        totalTestCasesFound += testCases.length;
        totalTestCasesWithStatus += testCasesWithStatus;
        result.set(task.id, testCases);
      }
    }

    logger.info(
      `Status de testes carregados para ${result.size} chaves Jira de ${validKeys.length} solicitadas`,
      'localTestStatusService',
      {
        chavesEncontradas: result.size,
        totalTestCases: totalTestCasesFound,
        testCasesComStatus: totalTestCasesWithStatus,
      }
    );
  } catch (error) {
    logger.warn('Erro ao carregar status de testes do IndexedDB', 'localTestStatusService', error);
  }

  return result;
}

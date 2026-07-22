import { JiraConfig, getJiraConfig, getJiraIssues, JiraIssue } from './jiraService';
import { JiraTask } from '../types';
import { jiraIssueToTask } from './jira/issueToTask';
import { mergeTaskTestCases } from '../utils/jiraTestCaseMerge';
import { logger } from '../utils/logger';

/**
 * Busca bugs do Jira para um projeto específico
 */
export const fetchBugsFromJira = async (
  config: JiraConfig,
  projectKey: string,
  maxResults: number = 100
): Promise<JiraIssue[]> => {
  try {
    logger.debug(`Buscando bugs do projeto ${projectKey}`, 'JiraBugsService');

    const allIssues = await getJiraIssues(config, projectKey, maxResults * 2);

    const bugs = allIssues.filter(issue => {
      const typeName = issue.fields?.issuetype?.name?.toLowerCase() || '';
      const isBug = typeName.includes('bug') || typeName === 'erro' || typeName === 'defeito';
      const isUnresolved = !issue.fields?.resolutiondate;
      return isBug && isUnresolved;
    });

    logger.info(`Encontrados ${bugs.length} bugs no Jira`, 'JiraBugsService');
    return bugs.slice(0, maxResults);
  } catch (error) {
    logger.error('Erro ao buscar bugs do Jira', 'JiraBugsService', error);
    throw error;
  }
};

/**
 * Sincroniza bugs do Jira com o projeto
 * Atualiza bugs existentes e retorna novos bugs
 * Retorna objeto com bugs atualizados e novos bugs separadamente
 */
export const syncBugsFromJira = async (
  projectKey: string,
  existingTasks: JiraTask[]
): Promise<{ updatedBugs: JiraTask[]; newBugs: JiraTask[] }> => {
  const config = getJiraConfig();
  if (!config) {
    logger.warn('Configuração do Jira não encontrada', 'JiraBugsService');
    return { updatedBugs: [], newBugs: [] };
  }

  try {
    const jiraBugs = await fetchBugsFromJira(config, projectKey);

    const existingBugsMap = new Map<string, JiraTask>();
    existingTasks
      .filter(t => t.type === 'Bug')
      .forEach(t => {
        const normalizedId = t.id.match(/^[A-Z]+-\d+$/) ? t.id : t.id;
        existingBugsMap.set(normalizedId, t);
      });

    const updatedBugs: JiraTask[] = [];
    const newBugs: JiraTask[] = [];

    for (const issue of jiraBugs) {
      const existingBug = existingBugsMap.get(issue.key);

      // Usar jiraIssueToTask para conversão padronizada (elimina duplicação de mapeamento)
      const task = await jiraIssueToTask(config, issue, {
        jiraProjectKey: projectKey,
        existingTask: existingBug,
      });

      if (existingBug) {
        // Bugs não devem ter testCases ou bddScenarios
        const { testCases: _merged } = mergeTaskTestCases(
          existingBug.testCases || [],
          task.testCases || [],
          task.id,
          'syncBugs'
        );

        updatedBugs.push({
          ...task,
          testCases: [],
          bddScenarios: [],
        });
      } else {
        newBugs.push({
          ...task,
          testCases: [],
          bddScenarios: [],
        });
      }
    }

    logger.info(
      `Sincronizados ${updatedBugs.length} bugs atualizados e ${newBugs.length} novos bugs do Jira`,
      'JiraBugsService'
    );

    return { updatedBugs, newBugs };
  } catch (error) {
    logger.error('Erro ao sincronizar bugs do Jira', 'JiraBugsService', error);
    throw error;
  }
};

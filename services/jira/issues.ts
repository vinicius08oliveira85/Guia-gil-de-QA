import type { JiraConfig, JiraIssue } from './types';
import { jiraApiCall } from './api';
import { logger } from '../../utils/logger';
import { isValidJiraKey } from '../../utils/jiraFieldMapper';

export const getJiraIssues = async (
  config: JiraConfig,
  projectKey: string,
  maxResults?: number,
  onProgress?: (current: number, total?: number) => void
): Promise<JiraIssue[]> => {
  const jql = `project = ${projectKey} ORDER BY created DESC`;
  const pageSize = 100;
  const CONCURRENT_REQUESTS = 4;
  const allIssues: JiraIssue[] = [];
  let totalGoal = maxResults;

  const pushIssues = (issues: JiraIssue[], totalHint?: number) => {
    if (!issues.length) {
      return;
    }

    if (!totalGoal && (totalHint || maxResults)) {
      totalGoal = maxResults ?? totalHint;
    }

    let itemsToAdd = issues;
    if (maxResults !== undefined) {
      const remainingSlots = maxResults - allIssues.length;
      if (remainingSlots <= 0) {
        return;
      }
      itemsToAdd = issues.slice(0, remainingSlots);
    }

    allIssues.push(...itemsToAdd);
    onProgress?.(allIssues.length, totalGoal);
  };

  type JiraSearchResponse = {
    issues?: JiraIssue[];
    total?: number;
    startAt?: number;
    maxResults?: number;
    nextPageToken?: string;
    isLast?: boolean;
  };

  const buildSearchEndpoint = (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams();
    search.set('jql', jql);
    search.set('maxResults', String(pageSize));
    search.set('expand', 'renderedFields,comment,attachment');
    search.set('fields', '*all');
    if (typeof params.startAt === 'number') {
      search.set('startAt', String(params.startAt));
    }
    if (typeof params.nextPageToken === 'string') {
      search.set('nextPageToken', params.nextPageToken);
    }
    return `search/jql?${search.toString()}`;
  };

  const fetchPage = async (
    params: { startAt?: number; nextPageToken?: string },
    label?: string
  ) => {
    const endpoint = buildSearchEndpoint(params);
    const response = await jiraApiCall<JiraSearchResponse>(config, endpoint, { timeout: 60000 });
    if (label) {
      logger.debug(`${label}: Recebidas ${(response.issues || []).length} issues`, 'jiraService');
    }
    return response;
  };

  logger.info(`Buscando TODAS as issues do projeto ${projectKey}`, 'jiraService');
  const firstResponse = await fetchPage({ startAt: 0 }, 'Página 1');
  pushIssues(firstResponse.issues || [], firstResponse.total);

  if (maxResults !== undefined && allIssues.length >= maxResults) {
    return allIssues;
  }

  const supportsRandomAccess =
    typeof firstResponse.startAt === 'number' && typeof firstResponse.total === 'number';
  const hasTokens = typeof firstResponse.nextPageToken === 'string';

  const shouldContinue = () => maxResults === undefined || allIssues.length < maxResults;

  if (hasTokens) {
    let nextToken = firstResponse.nextPageToken;
    let pageIndex = 2;
    while (nextToken && shouldContinue()) {
      const response = await fetchPage({ nextPageToken: nextToken }, `Página ${pageIndex}`);
      const issues = response.issues || [];
      if (issues.length === 0) {
        logger.warn('Nenhuma issue retornada nesta página. Parando paginação', 'jiraService');
        break;
      }
      pushIssues(issues, response.total);
      nextToken = response.nextPageToken;
      pageIndex += 1;
    }
  } else if (supportsRandomAccess) {
    const totalAvailable = firstResponse.total || 0;
    const totalToFetch =
      maxResults !== undefined ? Math.min(maxResults, totalAvailable) : totalAvailable;
    const startIndices: number[] = [];
    for (
      let start = (firstResponse.startAt || 0) + (firstResponse.issues?.length || 0);
      start < totalToFetch;
      start += pageSize
    ) {
      startIndices.push(start);
    }

    outer: for (let i = 0; i < startIndices.length; i += CONCURRENT_REQUESTS) {
      const chunkStarts = startIndices.slice(i, i + CONCURRENT_REQUESTS);
      const responses = await Promise.all(
        chunkStarts.map(start => fetchPage({ startAt: start }, `Página ${start / pageSize + 1}`))
      );
      for (const response of responses) {
        const issues = response.issues || [];
        pushIssues(issues, response.total);
        if (!shouldContinue()) {
          break outer;
        }
      }
    }
  } else {
    let nextStartAt = (firstResponse.startAt || 0) + (firstResponse.issues?.length || 0);
    let pageIndex = 2;
    while (shouldContinue()) {
      const response = await fetchPage({ startAt: nextStartAt }, `Página ${pageIndex}`);
      const issues = response.issues || [];
      if (issues.length === 0) {
        logger.warn('Nenhuma issue retornada nesta página. Parando paginação', 'jiraService');
        break;
      }
      pushIssues(issues, response.total);
      nextStartAt += issues.length;
      pageIndex += 1;

      if (issues.length < pageSize) {
        break;
      }

      if (maxResults === undefined && allIssues.length >= 50000) {
        logger.warn(
          `Limite de segurança de 50000 issues atingido para o projeto ${projectKey}`,
          'jiraService'
        );
        break;
      }
    }
  }

  const epics = allIssues.filter(i => {
    const typeName = i.fields?.issuetype?.name?.toLowerCase() || '';
    return typeName.includes('epic') || typeName === 'épico' || typeName === 'epico';
  }).length;

  const stories = allIssues.filter(i => {
    const typeName = i.fields?.issuetype?.name?.toLowerCase() || '';
    return (
      typeName.includes('story') ||
      typeName.includes('história') ||
      typeName.includes('historia') ||
      typeName === 'user story'
    );
  }).length;

  const tasks = allIssues.filter(i => {
    const typeName = i.fields?.issuetype?.name?.toLowerCase() || '';
    return (
      typeName.includes('task') ||
      typeName.includes('tarefa') ||
      (typeName !== 'epic' && typeName !== 'bug' && typeName !== 'story' && typeName !== 'história')
    );
  }).length;

  const bugs = allIssues.filter(i => {
    const typeName = i.fields?.issuetype?.name?.toLowerCase() || '';
    return typeName.includes('bug') || typeName === 'erro' || typeName === 'defeito';
  }).length;

  const uniqueTypes = [...new Set(allIssues.map(i => i.fields?.issuetype?.name).filter(Boolean))];
  logger.debug(`Tipos encontrados no Jira: ${uniqueTypes.slice(0, 10).join(', ')}`, 'jiraService');

  logger.info(
    `Total de issues buscadas: ${allIssues.length} para o projeto ${projectKey}`,
    'jiraService'
  );
  logger.info(
    `Breakdown: ${epics} Epics, ${stories} Histórias, ${tasks} Tarefas, ${bugs} Bugs`,
    'jiraService'
  );

  return allIssues;
};

/**
 * Busca uma issue do Jira pela chave (ex: PROJ-123).
 */
export const getJiraIssueByKey = async (
  config: JiraConfig,
  issueKey: string
): Promise<JiraIssue> => {
  const key = issueKey.trim().toUpperCase();
  if (!isValidJiraKey(key)) {
    throw new Error(`ID inválido. Use o formato PROJ-123 (ex: ${key || 'PROJ-123'}).`);
  }
  const endpoint = `issue/${key}?expand=renderedFields,comment,attachment&fields=*all`;
  try {
    const response = await jiraApiCall<JiraIssue>(config, endpoint, { timeout: 30000 });
    if (!response?.key) {
      throw new Error(`Tarefa ${key} não encontrada no Jira.`);
    }
    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.toLowerCase().includes('not found')) {
        throw new Error(`Tarefa ${key} não encontrada no Jira.`);
      }
      throw error;
    }
    throw error;
  }
};

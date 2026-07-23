import type { JiraConfig, JiraIssue } from './types';
import { jiraApiCall } from './api';
import { logger } from '../../utils/logger';
import { isValidJiraKey } from '../../utils/jiraFieldMapper';

export type GetJiraIssuesOptions = {
  /** IDs do custom field Sprint (ex.: customfield_10020) para forçar retorno na busca JQL. */
  sprintFieldIds?: string[];
  /** JQL customizado (ex.: fila do Jira Service Management). */
  jql?: string;
  /**
   * Busca leve só para descobrir chaves de issues (id, key).
   * Use quando os campos completos virão de `getJiraIssuesByKeysBulk` em seguida.
   */
  discoveryOnly?: boolean;
  /**
   * Data ISO 8601 para filtro incremental: retorna apenas issues atualizadas após esta data.
   * Ex.: "2025-01-01T00:00:00.000Z"
   * Adiciona `AND updated >= {updatedAfter}` ao JQL automaticamente.
   */
  updatedAfter?: string;
  /**
   * Offset inicial para paginação incremental (cursor).
   * Permite retomar de onde parou na última sincronização,
   * em vez de buscar todas as páginas desde o início.
   */
  startAt?: number;
};

export const getJiraIssuesByJql = async (
  config: JiraConfig,
  jql: string,
  maxResults?: number,
  onProgress?: (current: number, total?: number) => void,
  options?: Omit<GetJiraIssuesOptions, 'jql'>
): Promise<JiraIssue[]> => {
  const trimmedJql = jql.trim();
  if (!trimmedJql) {
    throw new Error('JQL inválido para busca de issues.');
  }
  return getJiraIssues(config, '', maxResults, onProgress, { ...options, jql: trimmedJql });
};

export const getJiraIssues = async (
  config: JiraConfig,
  projectKey: string,
  maxResults?: number,
  onProgress?: (current: number, total?: number) => void,
  options?: GetJiraIssuesOptions
): Promise<JiraIssue[]> => {
  if (projectKey && !/^[A-Z][A-Z0-9]+$/i.test(projectKey.trim())) {
    throw new Error(`Chave de projeto inválida: "${projectKey}". Use apenas letras e números.`);
  }
  const cleanProjectKey = projectKey.trim();
  let baseJql =
    options?.jql?.trim() ||
    (cleanProjectKey ? `project = ${cleanProjectKey}` : '');
  if (!baseJql) {
    throw new Error('Informe o projeto ou um JQL para buscar issues.');
  }

  // Filtro incremental: buscar apenas issues atualizadas após uma data
  if (options?.updatedAfter) {
    const date = new Date(options.updatedAfter);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`updatedAfter inválido: "${options.updatedAfter}". Use formato ISO 8601 (ex.: "2025-01-01T00:00:00.000Z").`);
    }
    const escapedDate = date.toISOString();
    const updatedFilter = `updated >= "${escapedDate}"`;
    baseJql = baseJql.includes('ORDER BY')
      ? baseJql.replace(/(ORDER BY[\s\S]*)/i, `${updatedFilter} $1`)
      : `${baseJql} AND ${updatedFilter}`;
  }

  // Adicionar ordenação se não existir
  if (!baseJql.includes('ORDER BY')) {
    baseJql += ' ORDER BY created DESC';
  }

  const jql = baseJql;
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
    const discoveryOnly = options?.discoveryOnly ?? false;
    if (discoveryOnly) {
      search.set('fields', 'id,key');
    } else {
      search.set('expand', 'renderedFields,comment,attachment');
      const sprintIds = (options?.sprintFieldIds ?? []).filter(id => id.startsWith('customfield_'));
      const fieldsParam =
        sprintIds.length > 0 ? `*all,${[...new Set(sprintIds)].join(',')}` : '*all';
      search.set('fields', fieldsParam);
    }
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

  logger.info(
    projectKey
      ? `Buscando issues do projeto ${projectKey}`
      : `Buscando issues via JQL: ${jql.slice(0, 120)}`,
    'jiraService'
  );
  const initialStartAt = options?.startAt ?? 0;
  const firstResponse = await fetchPage({ startAt: initialStartAt }, `Página 1 (startAt=${initialStartAt})`);
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
      const settled = await Promise.allSettled(
        chunkStarts.map(start => fetchPage({ startAt: start }, `Página ${start / pageSize + 1}`))
      );
      for (const result of settled) {
        if (result.status === 'rejected') {
          logger.warn(`Falha ao buscar página ${i / CONCURRENT_REQUESTS + 1}, continuando...`, 'jiraService', result.reason);
          continue;
        }
        const response = result.value;
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
    projectKey
      ? `Total de issues buscadas: ${allIssues.length} para o projeto ${projectKey}`
      : `Total de issues buscadas via JQL: ${allIssues.length}`,
    'jiraService'
  );
  logger.info(
    `Breakdown: ${epics} Epics, ${stories} Histórias, ${tasks} Tarefas, ${bugs} Bugs`,
    'jiraService'
  );

  return allIssues;
};

const BULK_FETCH_CHUNK = 100;

/**
 * Busca issues por chave/ID via endpoint `issue/bulkfetch` (leitura forte).
 *
 * Ao contrário de `search/jql` (consistência eventual — pode não refletir
 * escritas recentes como troca de Responsável/status), o bulkfetch lê o estado
 * atual da issue, garantindo dados atualizados ao sincronizar filas.
 *
 * Respeita o limite de 100 issues por requisição (chunking automático).
 */
export const getJiraIssuesByKeysBulk = async (
  config: JiraConfig,
  issueKeysOrIds: string[],
  onProgress?: (current: number, total: number) => void
): Promise<JiraIssue[]> => {
  const unique = Array.from(
    new Set(issueKeysOrIds.map(key => key.trim()).filter(Boolean))
  );
  if (unique.length === 0) return [];

  const all: JiraIssue[] = [];
  for (let start = 0; start < unique.length; start += BULK_FETCH_CHUNK) {
    const chunk = unique.slice(start, start + BULK_FETCH_CHUNK);
    const response = await jiraApiCall<{ issues?: JiraIssue[]; issueErrors?: unknown[] }>(
      config,
      'issue/bulkfetch',
      {
        method: 'POST',
        timeout: 60000,
        body: {
          issueIdsOrKeys: chunk,
          fields: ['*all'],
          expand: ['renderedFields'],
          fieldsByKeys: false,
        },
      }
    );
    const issues = response.issues ?? [];
    all.push(...issues);
    if (response.issueErrors?.length) {
      logger.warn(
        `bulkfetch retornou ${response.issueErrors.length} erro(s) de issue`,
        'jiraService'
      );
    }
    onProgress?.(Math.min(start + chunk.length, unique.length), unique.length);
  }

  logger.info(`bulkfetch: ${all.length}/${unique.length} issue(s) atualizadas`, 'jiraService');
  return all;
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

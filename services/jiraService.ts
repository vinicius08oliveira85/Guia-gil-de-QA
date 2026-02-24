import { Project, JiraTask, Comment, TestCase } from '../types';
import { parseJiraDescription, parseJiraDescriptionHTML } from '../utils/jiraDescriptionParser';
import { getCache, setCache, clearCache } from '../utils/apiCache';
import { getJiraStatusColor } from '../utils/jiraStatusColors';
import { logger } from '../utils/logger';
import { loadTestStatusesByJiraKeys } from './supabaseService';
import { mergeTestCases } from '../utils/testCaseMerge';
import { useProjectsStore } from '../store/projectsStore';

export interface JiraConfig {
  url: string;
  email: string;
  apiToken: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    issuetype: {
      name: string;
    };
    status: {
      name: string;
      statusCategory?: {
        key: string;
        colorName: string;
      };
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    reporter?: {
      displayName: string;
      emailAddress?: string;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
    labels?: string[];
    parent?: {
      key: string;
    };
    subtasks?: Array<{ key: string }>;
    comment?: {
      comments: Array<{
        id: string;
        author: {
          displayName: string;
          emailAddress?: string;
        };
        body: string;
        created: string;
        updated?: string;
      }>;
    };
    // Campos adicionais padrão
    duedate?: string;
    timetracking?: {
      originalEstimate?: string;
      remainingEstimate?: string;
      timeSpent?: string;
    };
    components?: Array<{
      id: string;
      name: string;
    }>;
    fixVersions?: Array<{
      id: string;
      name: string;
    }>;
    environment?: string;
    watches?: {
      watchCount: number;
      isWatching: boolean;
    };
    issuelinks?: Array<{
      id: string;
      type: {
        name: string;
      };
      outwardIssue?: {
        key: string;
      };
      inwardIssue?: {
        key: string;
      };
    }>;
    attachment?: Array<{
      id: string;
      filename: string;
      size: number;
      created: string;
      author: {
        displayName: string;
      };
    }>;
    // Suporte a campos customizados
    [key: string]: any;
  };
  renderedFields?: {
    description?: string; // Descrição renderizada em HTML
    comment?: {
      comments: Array<{
        id: string;
        author: {
          displayName: string;
          emailAddress?: string;
        };
        body: string;
        created: string;
        updated?: string;
      }>;
    };
  };
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
}

const JIRA_CONFIG_KEY = 'jira_config';

export const saveJiraConfig = (config: JiraConfig): void => {
  localStorage.setItem(JIRA_CONFIG_KEY, JSON.stringify(config));
};

export const getJiraConfig = (): JiraConfig | null => {
  const stored = localStorage.getItem(JIRA_CONFIG_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const deleteJiraConfig = (): void => {
  localStorage.removeItem(JIRA_CONFIG_KEY);
};

const jiraApiCall = async <T>(
  config: JiraConfig,
  endpoint: string,
  options: { method?: string; body?: any; timeout?: number } = {}
): Promise<T> => {
  const timeout = options.timeout || 60000; // 60 segundos por padrão (aumentado para projetos grandes)

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const requestBody = {
      url: config.url,
      email: config.email,
      apiToken: config.apiToken,
      endpoint,
      method: options.method || 'GET',
      body: options.body
        ? typeof options.body === 'string'
          ? JSON.parse(options.body)
          : options.body
        : undefined,
    };

    logger.debug('Fazendo requisição ao proxy Jira', 'jiraService', {
      endpoint,
      method: requestBody.method,
    });

    const response = await fetch('/api/jira-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    logger.debug('Resposta do proxy', 'jiraService', { status: response.status, ok: response.ok });

    if (!response.ok) {
      let errorData: { error?: string };
      try {
        errorData = await response.json();
        logger.error('Erro do proxy', 'jiraService', errorData);
      } catch {
        const errorText = await response.text();
        logger.error('Erro do proxy (texto)', 'jiraService', errorText);
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `Jira API Error (${response.status})`);
    }

    const data = await response.json();
    logger.debug('Dados recebidos do proxy', 'jiraService', data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Timeout na requisição', 'jiraService', error);
      throw new Error(
        `Timeout: A requisição demorou mais de ${timeout / 1000} segundos. Verifique sua conexão ou tente novamente.`
      );
    }
    logger.error('Erro na requisição', 'jiraService', error);
    throw error;
  }
};

export const testJiraConnection = async (config: JiraConfig): Promise<boolean> => {
  try {
    // Usar endpoint /myself que ainda está disponível
    await jiraApiCall(config, 'myself');
    return true;
  } catch (error) {
    logger.error('Jira connection test failed', 'jiraService', error);
    return false;
  }
};

export const getJiraProjects = async (
  config: JiraConfig,
  useCache: boolean = true
): Promise<JiraProject[]> => {
  const cacheKey = `jira_projects_${config.url}`;

  // Tentar cache primeiro
  if (useCache) {
    const cached = getCache<JiraProject[]>(cacheKey);
    if (cached) {
      logger.debug('Usando projetos do cache', 'jiraService');
      return cached;
    }
  }
  logger.debug('Buscando projetos do Jira', 'jiraService', {
    url: config.url,
    endpoint: 'project?maxResults=100',
  });

  try {
    const response = await jiraApiCall<{ values?: JiraProject[] }>(
      config,
      'project?maxResults=100',
      { timeout: 20000 } // 20 segundos para listar projetos
    );

    logger.debug('Resposta do Jira', 'jiraService', response);

    if (!response) {
      logger.error('Resposta vazia do Jira', 'jiraService');
      throw new Error('Resposta vazia do servidor Jira');
    }

    let projects: JiraProject[] = [];

    if (Array.isArray(response.values)) {
      logger.info(`Encontrados ${response.values.length} projetos`, 'jiraService');
      projects = response.values;
    } else if (Array.isArray(response)) {
      logger.info(`Encontrados ${response.length} projetos (formato alternativo)`, 'jiraService');
      projects = response;
    } else {
      logger.warn('Formato de resposta inesperado', 'jiraService', response);
      projects = [];
    }

    // Salvar no cache (5 minutos)
    if (projects && projects.length > 0) {
      setCache(cacheKey, projects, 5 * 60 * 1000);
    }

    return projects;
  } catch (error) {
    logger.error('Erro em getJiraProjects', 'jiraService', error);
    // Limpar cache em caso de erro
    clearCache(cacheKey);
    throw error;
  }
};

export const getJiraStatuses = async (
  config: JiraConfig,
  projectKey: string
): Promise<Array<{ name: string; color: string }>> => {
  const cacheKey = `jira_statuses_${config.url}_${projectKey}`;

  // Tentar cache primeiro
  const cached = getCache<Array<{ name: string; color: string }>>(cacheKey);
  if (cached) {
    logger.debug('Usando status do Jira do cache', 'jiraService');
    return cached;
  }

  try {
    // Buscar status do projeto via API
    const response = await jiraApiCall<
      Array<{
        id: string;
        name: string;
        statuses: Array<{
          id: string;
          name: string;
          statusCategory?: {
            key: string;
            colorName: string;
          };
        }>;
      }>
    >(config, `project/${projectKey}/statuses`, { timeout: 20000 });

    // Extrair todos os status únicos com suas cores
    const statusMap = new Map<string, string>();
    if (Array.isArray(response)) {
      response.forEach(statusCategory => {
        if (statusCategory.statuses && Array.isArray(statusCategory.statuses)) {
          statusCategory.statuses.forEach(status => {
            if (status.name) {
              const color = getJiraStatusColor(status.name, status.statusCategory);
              statusMap.set(status.name, color);
            }
          });
        }
      });
    }

    const statuses = Array.from(statusMap.entries()).map(([name, color]) => ({ name, color }));

    // Se não conseguir via API de status, extrair dos issues
    if (statuses.length === 0) {
      logger.warn('Não foi possível buscar status via API, extraindo das issues', 'jiraService');
      const issues = await getJiraIssues(config, projectKey, 100); // Buscar apenas 100 para extrair status
      issues.forEach(issue => {
        if (issue.fields?.status?.name) {
          const statusName = issue.fields.status.name;
          if (!statusMap.has(statusName)) {
            const color = getJiraStatusColor(statusName, issue.fields.status.statusCategory);
            statusMap.set(statusName, color);
          }
        }
      });
      return Array.from(statusMap.entries()).map(([name, color]) => ({ name, color }));
    }

    // Salvar no cache (10 minutos)
    if (statuses.length > 0) {
      setCache(cacheKey, statuses, 10 * 60 * 1000);
    }

    return statuses;
  } catch (error) {
    logger.error('Erro ao buscar status do Jira', 'jiraService', error);
    // Fallback: extrair dos issues
    try {
      const issues = await getJiraIssues(config, projectKey, 100);
      const statusMap = new Map<string, string>();
      issues.forEach(issue => {
        if (issue.fields?.status?.name) {
          const statusName = issue.fields.status.name;
          if (!statusMap.has(statusName)) {
            const color = getJiraStatusColor(statusName, issue.fields.status.statusCategory);
            statusMap.set(statusName, color);
          }
        }
      });
      return Array.from(statusMap.entries()).map(([name, color]) => ({ name, color }));
    } catch (fallbackError) {
      logger.error('Erro no fallback de status', 'jiraService', fallbackError);
      return [];
    }
  }
};

/** Lista de prioridades do Jira (GET /rest/api/3/priority). */
export const getJiraPriorities = async (config: JiraConfig): Promise<Array<{ name: string }>> => {
  const cacheKey = `jira_priorities_${config.url}`;
  const cached = getCache<Array<{ name: string }>>(cacheKey);
  if (cached?.length) {
    logger.debug('Usando prioridades do Jira do cache', 'jiraService');
    return cached;
  }
  try {
    const response = await jiraApiCall<Array<{ id?: string; name?: string }>>(config, 'priority', {
      timeout: 10000,
    });
    if (!Array.isArray(response)) {
      logger.warn('Resposta de prioridades não é array', 'jiraService', response);
      return [];
    }
    const priorities = response
      .filter((p): p is { id?: string; name: string } => !!p?.name)
      .map(p => ({ name: p.name }));
    if (priorities.length > 0) {
      setCache(cacheKey, priorities, 10 * 60 * 1000);
    }
    return priorities;
  } catch (error) {
    logger.error('Erro ao buscar prioridades do Jira', 'jiraService', error);
    return [];
  }
};

export const getJiraIssues = async (
  config: JiraConfig,
  projectKey: string,
  maxResults?: number, // Opcional: se não especificado, busca TODAS as issues
  onProgress?: (current: number, total?: number) => void
): Promise<JiraIssue[]> => {
  const jql = `project = ${projectKey} ORDER BY created DESC`;
  const pageSize = 100; // Jira limita a 100 por página
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
    // Buscar todos os campos usando *all ou removendo o parâmetro fields
    // Usando *all para buscar todos os campos padrão e customizados
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

  // Contar por tipo (verificar o nome exato do tipo no Jira)
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

const mapJiraStatusToTaskStatus = (
  jiraStatus: string | undefined | null
): 'To Do' | 'In Progress' | 'Done' => {
  if (!jiraStatus) return 'To Do';
  const status = jiraStatus.toLowerCase();
  // Verificar status concluído (inglês e português)
  if (
    status.includes('done') ||
    status.includes('resolved') ||
    status.includes('closed') ||
    status.includes('concluído') ||
    status.includes('concluido') ||
    status.includes('finalizado') ||
    status.includes('resolvido') ||
    status.includes('fechado')
  ) {
    return 'Done';
  }
  // Verificar status em andamento (inglês e português)
  if (
    status.includes('progress') ||
    status.includes('in progress') ||
    status.includes('em andamento') ||
    status.includes('andamento') ||
    status.includes('em desenvolvimento') ||
    status.includes('desenvolvimento')
  ) {
    return 'In Progress';
  }
  return 'To Do';
};

const mapJiraTypeToTaskType = (
  jiraType: string | undefined | null
): 'Epic' | 'História' | 'Tarefa' | 'Bug' => {
  if (!jiraType) return 'Tarefa';
  const type = jiraType.toLowerCase();
  if (type.includes('epic')) return 'Epic';
  if (type.includes('story') || type.includes('história')) return 'História';
  if (type.includes('bug') || type.includes('defect')) return 'Bug';
  return 'Tarefa';
};

const mapJiraPriorityToTaskPriority = (
  jiraPriority?: string
): 'Baixa' | 'Média' | 'Alta' | 'Urgente' => {
  if (!jiraPriority) return 'Média';
  const priority = jiraPriority.toLowerCase();
  if (priority.includes('highest') || priority.includes('urgent')) return 'Urgente';
  if (priority.includes('high')) return 'Alta';
  if (priority.includes('low') || priority.includes('lowest')) return 'Baixa';
  return 'Média';
};

const mapJiraSeverity = (labels?: string[]): 'Crítico' | 'Alto' | 'Médio' | 'Baixo' => {
  if (!labels || !Array.isArray(labels)) return 'Médio';
  const severityLabels = labels.filter(
    l =>
      l &&
      typeof l === 'string' &&
      (l.toLowerCase().includes('severity') ||
        l.toLowerCase().includes('severidade') ||
        l.toLowerCase().includes('critical') ||
        l.toLowerCase().includes('high') ||
        l.toLowerCase().includes('medium') ||
        l.toLowerCase().includes('low'))
  );

  if (severityLabels.length === 0) return 'Médio';

  const severity = severityLabels[0]?.toLowerCase() || '';
  if (severity.includes('critical') || severity.includes('crítico')) return 'Crítico';
  if (severity.includes('high') || severity.includes('alto')) return 'Alto';
  if (severity.includes('low') || severity.includes('baixo')) return 'Baixo';
  return 'Médio';
};

/**
 * Extrai o Epic Link (key do Epic) dos campos customizados do Jira
 * O Epic Link pode estar em diferentes campos customizados dependendo da configuração do Jira
 */
const extractEpicLink = (fields: any): string | undefined => {
  if (!fields) return undefined;

  // Tentar campos comuns do Epic Link
  const epicLinkFields = [
    'customfield_10011', // Campo padrão mais comum
    'epicLink',
    'epic',
    'customfield_10014', // Epic Name (alternativo)
  ];

  // Procurar em campos conhecidos
  for (const fieldName of epicLinkFields) {
    if (fields[fieldName]) {
      // Pode ser string (key) ou objeto com key
      if (typeof fields[fieldName] === 'string') {
        return fields[fieldName];
      }
      if (fields[fieldName]?.key) {
        return fields[fieldName].key;
      }
    }
  }

  // Procurar em todos os campos customizados que contenham "epic" no nome
  for (const key in fields) {
    if (key.toLowerCase().includes('epic') && fields[key]) {
      if (typeof fields[key] === 'string') {
        return fields[key];
      }
      if (fields[key]?.key) {
        return fields[key].key;
      }
    }
  }

  return undefined;
};

/**
 * Busca comentários de uma issue específica do Jira
 * Fallback caso os comentários não venham no expand
 */
const getJiraIssueComments = async (
  config: JiraConfig,
  issueKey: string,
  jiraAttachments?: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }>
): Promise<Comment[]> => {
  try {
    const endpoint = `issue/${issueKey}/comment`;
    const response = await jiraApiCall<{
      comments?: Array<{
        id: string;
        author: {
          displayName: string;
          emailAddress?: string;
        };
        body: string | any; // Pode ser string, ADF ou HTML
        created: string;
        updated?: string;
      }>;
    }>(config, endpoint, { timeout: 30000 });

    if (!response.comments || response.comments.length === 0) {
      return [];
    }

    return response.comments.map(comment => ({
      id: comment.id,
      author: comment.author?.displayName || 'Desconhecido',
      // Usar parseJiraDescriptionHTML para processar imagens e formatação rica
      content: parseJiraDescriptionHTML(comment.body, config.url, jiraAttachments) || '',
      createdAt: comment.created,
      updatedAt: comment.updated,
      fromJira: true,
    }));
  } catch (error) {
    logger.warn(`Erro ao buscar comentários da issue ${issueKey}`, 'jiraService', error);
    return [];
  }
};

/**
 * Faz merge de comentários do Jira com comentários existentes
 * Evita duplicatas e atualiza comentários existentes
 */
const mergeComments = (existingComments: Comment[], jiraComments: Comment[]): Comment[] => {
  const commentsMap = new Map<string, Comment>();

  // Adicionar comentários existentes primeiro
  existingComments.forEach(comment => {
    commentsMap.set(comment.id, comment);
  });

  // Atualizar ou adicionar comentários do Jira
  jiraComments.forEach(jiraComment => {
    const existing = commentsMap.get(jiraComment.id);
    if (existing) {
      // Se o comentário foi atualizado no Jira (updatedAt diferente), atualizar
      if (
        jiraComment.updatedAt &&
        (!existing.updatedAt || jiraComment.updatedAt > existing.updatedAt)
      ) {
        commentsMap.set(jiraComment.id, jiraComment);
      }
    } else {
      // Novo comentário do Jira
      commentsMap.set(jiraComment.id, jiraComment);
    }
  });

  // Ordenar por data de criação (mais antigos primeiro)
  return Array.from(commentsMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

/**
 * Extrai comentários de uma issue do Jira, tentando múltiplas fontes
 */
const extractJiraComments = async (
  config: JiraConfig,
  issue: JiraIssue,
  jiraAttachments?: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }>
): Promise<Comment[]> => {
  let jiraComments: Comment[] = [];

  // Tentar primeiro pelos renderedFields (mais eficiente)
  if (issue.renderedFields?.comment?.comments && issue.renderedFields.comment.comments.length > 0) {
    jiraComments = issue.renderedFields.comment.comments.map(comment => ({
      id: comment.id,
      author: comment.author?.displayName || 'Desconhecido',
      // Usar parseJiraDescriptionHTML para processar imagens e formatação rica
      content: parseJiraDescriptionHTML(comment.body, config.url, jiraAttachments) || '',
      createdAt: comment.created,
      updatedAt: comment.updated,
      fromJira: true,
    }));
  } else if (issue.fields?.comment?.comments && issue.fields.comment.comments.length > 0) {
    // Tentar pelos fields diretos
    jiraComments = issue.fields.comment.comments.map((comment: any) => ({
      id: comment.id,
      author: comment.author?.displayName || 'Desconhecido',
      // Usar parseJiraDescriptionHTML para processar imagens e formatação rica
      content: parseJiraDescriptionHTML(comment.body, config.url, jiraAttachments) || '',
      createdAt: comment.created,
      updatedAt: comment.updated,
      fromJira: true,
    }));
  } else {
    // Fallback: buscar comentários separadamente
    jiraComments = await getJiraIssueComments(config, issue.key, jiraAttachments);
  }

  return jiraComments;
};

export const importJiraProject = async (
  config: JiraConfig,
  jiraProjectKey: string,
  onProgress?: (current: number, total?: number) => void
): Promise<Project> => {
  // Buscar projeto do Jira
  const jiraProjects = await getJiraProjects(config);
  const jiraProject = jiraProjects.find(p => p.key === jiraProjectKey);

  if (!jiraProject) {
    throw new Error(`Projeto ${jiraProjectKey} não encontrado no Jira`);
  }

  // Buscar status e prioridades do Jira
  const jiraStatuses = await getJiraStatuses(config, jiraProjectKey);
  const jiraPriorities = await getJiraPriorities(config);

  // Buscar TODAS as issues do projeto (sem limite)
  const jiraIssues = await getJiraIssues(config, jiraProjectKey, undefined, onProgress);

  // Buscar status dos testes salvos no Supabase para todas as chaves Jira
  const jiraKeys = jiraIssues.map(issue => issue.key).filter(Boolean) as string[];
  const savedTestStatuses = await loadTestStatusesByJiraKeys(jiraKeys);

  logger.info(`Buscando status de testes para ${jiraKeys.length} chaves Jira`, 'jiraService');

  // Mapear issues para tarefas
  const tasks: JiraTask[] = await Promise.all(
    jiraIssues.map(async (issue, index) => {
      const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
      const isBug = taskType === 'Bug';

      // Buscar anexos do Jira antes de processar descrição (para mapear imagens)
      let jiraAttachments: Array<{
        id: string;
        filename: string;
        size: number;
        created: string;
        author: string;
      }> = [];
      if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
        jiraAttachments = issue.fields.attachment.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          size: att.size,
          created: att.created,
          author: att.author?.displayName || 'Desconhecido',
        }));
      }

      // Converter descrição do formato ADF para HTML preservando formatação rica
      // Tentar também renderedFields.description se disponível (formato HTML renderizado)
      let description = '';
      if (issue.renderedFields?.description) {
        // Se temos descrição renderizada (HTML), preservar formatação rica
        description = parseJiraDescriptionHTML(
          issue.renderedFields.description,
          config.url,
          jiraAttachments
        );
      } else if (issue.fields?.description) {
        // Caso contrário, converter a descrição raw (ADF) para HTML
        description = parseJiraDescriptionHTML(
          issue.fields.description,
          config.url,
          jiraAttachments
        );
      }

      // Log para debug das primeiras tarefas
      if (index < 3) {
        logger.debug(`Tarefa ${issue.key}`, 'jiraService', {
          title: issue.fields?.summary,
          type: taskType,
          hasDescription: !!description,
          descriptionLength: description.length,
          descriptionPreview: description.substring(0, 100),
          attachmentsCount: jiraAttachments.length,
        });
      }

      // Buscar comentários do Jira
      const jiraComments = await extractJiraComments(config, issue, jiraAttachments);

      const jiraStatusName = issue.fields?.status?.name || '';
      const jiraKey = issue.key || `jira-${Date.now()}-${Math.random()}`;

      // Buscar testCases salvos para esta chave Jira
      const savedTestCases = savedTestStatuses.get(jiraKey) || [];

      const task: JiraTask = {
        id: jiraKey,
        title: issue.fields?.summary || 'Sem título',
        description: description || '',
        status: mapJiraStatusToTaskStatus(jiraStatusName),
        jiraStatus: jiraStatusName, // Armazenar status original do Jira
        type: taskType,
        priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
        jiraPriority: issue.fields?.priority?.name,
        createdAt: issue.fields?.created || new Date().toISOString(),
        completedAt: issue.fields?.resolutiondate,
        tags: issue.fields?.labels || [],
        testCases: savedTestCases, // Inicializar com testCases salvos (serão mesclados se houver novos)
        bddScenarios: [],
        comments: jiraComments,
      };

      if (savedTestCases.length > 0) {
        logger.debug(
          `Preservando ${savedTestCases.length} testCases salvos para ${jiraKey}`,
          'jiraService'
        );
      }

      if (isBug) {
        task.severity = mapJiraSeverity(issue.fields.labels);
      }

      if (issue.fields?.parent?.key) {
        task.parentId = issue.fields.parent.key;
      }

      // Capturar Epic Link (para Histórias vinculadas a Epics)
      const epicKey = extractEpicLink(issue.fields);
      if (epicKey) {
        task.epicKey = epicKey;
      }

      // Mapear assignee
      if (issue.fields?.assignee?.emailAddress) {
        const email = issue.fields.assignee.emailAddress.toLowerCase();
        if (email.includes('qa') || email.includes('test')) {
          task.assignee = 'QA';
        } else if (email.includes('dev') || email.includes('developer')) {
          task.assignee = 'Dev';
        } else {
          task.assignee = 'Product';
        }
      } else {
        task.assignee = 'Product';
      }

      // Mapear campos adicionais do Jira
      if (issue.fields?.duedate) {
        task.dueDate = issue.fields.duedate;
      }

      if (issue.fields?.timetracking) {
        task.timeTracking = {
          originalEstimate: issue.fields.timetracking.originalEstimate,
          remainingEstimate: issue.fields.timetracking.remainingEstimate,
          timeSpent: issue.fields.timetracking.timeSpent,
        };
      }

      if (issue.fields?.components && issue.fields.components.length > 0) {
        task.components = issue.fields.components.map((comp: any) => ({
          id: comp.id,
          name: comp.name,
        }));
      }

      if (issue.fields?.fixVersions && issue.fields.fixVersions.length > 0) {
        task.fixVersions = issue.fields.fixVersions.map((version: any) => ({
          id: version.id,
          name: version.name,
        }));
      }

      if (issue.fields?.environment) {
        task.environment = issue.fields.environment;
      }

      if (issue.fields?.reporter) {
        task.reporter = {
          displayName: issue.fields.reporter.displayName,
          emailAddress: issue.fields.reporter.emailAddress,
        };
      }

      if (issue.fields?.watches) {
        task.watchers = {
          watchCount: issue.fields.watches.watchCount || 0,
          isWatching: issue.fields.watches.isWatching || false,
        };
      }

      if (issue.fields?.issuelinks && issue.fields.issuelinks.length > 0) {
        task.issueLinks = issue.fields.issuelinks.map((link: any) => ({
          id: link.id,
          type: link.type?.name || '',
          relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
          direction: link.outwardIssue ? 'outward' : 'inward',
        }));
      }

      if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
        task.jiraAttachments = issue.fields.attachment.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          size: att.size,
          created: att.created,
          author: att.author?.displayName || 'Desconhecido',
        }));
      }

      // Mapear campos customizados (todos os campos que não são padrão)
      // Excluir campos de Epic Link da lista de customizados pois já foram processados
      const standardFields = [
        'summary',
        'description',
        'issuetype',
        'status',
        'priority',
        'assignee',
        'reporter',
        'created',
        'updated',
        'resolutiondate',
        'labels',
        'parent',
        'subtasks',
        'comment',
        'duedate',
        'timetracking',
        'components',
        'fixVersions',
        'environment',
        'watches',
        'issuelinks',
        'attachment',
      ];
      const customFields: { [key: string]: any } = {};
      Object.keys(issue.fields).forEach(key => {
        // Não incluir campos de Epic Link nos customizados (já processados)
        if (
          !standardFields.includes(key) &&
          !key.startsWith('_') &&
          !key.toLowerCase().includes('epic')
        ) {
          customFields[key] = issue.fields[key];
        }
      });
      if (Object.keys(customFields).length > 0) {
        task.jiraCustomFields = customFields;
      }

      // Mapear attachments (se disponíveis na API)
      // Nota: Attachments precisam ser buscados separadamente ou estar no expand
      // Por enquanto, deixamos vazio pois requer configuração adicional da API

      return task;
    })
  );

  // Organizar hierarquia (Epics, Histórias e subtarefas)
  // A hierarquia é:
  // - Epic (tipo Epic)
  //   - História (tipo História com epicKey apontando para Epic)
  //     - Tarefa (tipo Tarefa com parentId apontando para História)
  //   - Bug (tipo Bug com epicKey ou parentId)
  // Nota: A hierarquia é preservada através dos campos epicKey e parentId
  // Não precisamos reorganizar aqui, apenas garantir que os campos estão corretos

  // Criar projeto local
  const project: Project = {
    id: `jira-${jiraProject.id}-${Date.now()}`,
    name: jiraProject.name,
    description: jiraProject.description || `Projeto importado do Jira: ${jiraProjectKey}`,
    documents: [],
    tasks: tasks,
    phases: [],
    tags: [],
    settings: {
      jiraStatuses: jiraStatuses,
      jiraPriorities: jiraPriorities?.length ? jiraPriorities : undefined,
      jiraProjectKey: jiraProjectKey,
    },
  };

  return project;
};

export const syncJiraProject = async (
  config: JiraConfig,
  project: Project,
  jiraProjectKey: string
): Promise<Project> => {
  // Buscar TODAS as issues atualizadas desde a última sincronização (sem limite)
  const jiraIssues = await getJiraIssues(config, jiraProjectKey);

  logger.info(
    `Buscadas ${jiraIssues.length} issues do Jira para projeto ${jiraProjectKey}`,
    'jiraService'
  );
  logger.info(`Tarefas existentes no projeto: ${project.tasks.length}`, 'jiraService');

  // Buscar status dos testes salvos no Supabase para todas as chaves Jira
  const jiraKeys = jiraIssues.map(issue => issue.key).filter(Boolean) as string[];
  const savedTestStatuses = await loadTestStatusesByJiraKeys(jiraKeys);

  // Contar total de testCases com status salvos
  let totalSavedTestCases = 0;
  let totalSavedWithStatus = 0;
  savedTestStatuses.forEach((testCases, key) => {
    totalSavedTestCases += testCases.length;
    totalSavedWithStatus += testCases.filter(tc => tc.status !== 'Not Run').length;
  });

  logger.info(`Buscando status de testes para ${jiraKeys.length} chaves Jira`, 'jiraService', {
    chavesJira: jiraKeys.length,
    testCasesSalvos: totalSavedTestCases,
    testCasesComStatus: totalSavedWithStatus,
    chavesComTestCases: savedTestStatuses.size,
  });

  // REGRA DE OURO: SEMPRE usar o projeto do store quando disponível, IGNORANDO o projeto passado como parâmetro
  // O store sempre tem os status mais recentes porque é atualizado imediatamente quando o usuário muda um status
  let projectToUse = project;
  try {
    const { projects } = useProjectsStore.getState();
    const latestProjectFromStore = projects.find(p => p.id === project.id);
    if (latestProjectFromStore) {
      // SEMPRE usar o projeto do store se disponível - ele é a fonte de verdade
      projectToUse = latestProjectFromStore;
      const statusCountStore = latestProjectFromStore.tasks.flatMap(t =>
        (t.testCases || []).filter(tc => tc.status !== 'Not Run')
      ).length;
      const statusCountParam = project.tasks.flatMap(t =>
        (t.testCases || []).filter(tc => tc.status !== 'Not Run')
      ).length;

      logger.info(
        `USANDO PROJETO DO STORE (ignorando parâmetro) para ${project.id}`,
        'jiraService',
        {
          tasksStore: latestProjectFromStore.tasks.length,
          tasksStoreComStatus: statusCountStore,
          tasksParam: project.tasks.length,
          tasksParamComStatus: statusCountParam,
          diferencaStatus: statusCountStore - statusCountParam,
        }
      );
    } else {
      logger.warn(
        `Projeto ${project.id} não encontrado no store, usando projeto passado como parâmetro`,
        'jiraService'
      );
    }
  } catch (error) {
    // Se não conseguir acessar o store, usar o projeto passado como parâmetro
    logger.warn('Erro ao acessar store, usando projeto passado como parâmetro', 'jiraService', {
      error,
    });
  }

  // Atualizar tarefas existentes e adicionar novas
  const updatedTasks = [...projectToUse.tasks];
  let updatedCount = 0;
  let newCount = 0;

  // Criar Map do projeto original por ID para acesso rápido aos testCases originais
  // IMPORTANTE: Usar projectToUse (que pode ser do store) para garantir que sempre obtemos os status mais recentes
  const originalTasksMap = new Map<string, JiraTask>();
  projectToUse.tasks.forEach(task => {
    if (task.id) {
      originalTasksMap.set(task.id, task);
    }
  });

  const totalStatusExecutados = projectToUse.tasks.flatMap(t =>
    (t.testCases || []).filter(tc => tc.status !== 'Not Run')
  ).length;

  logger.info(
    `Map de tarefas originais criado com ${originalTasksMap.size} tarefas`,
    'jiraService',
    {
      totalTarefas: originalTasksMap.size,
      totalStatusExecutados: totalStatusExecutados,
      usandoStore: projectToUse !== project,
    }
  );

  for (const issue of jiraIssues) {
    // ATUALIZAÇÃO DINÂMICA: Atualizar originalTasksMap com dados mais recentes do store antes de processar cada tarefa
    // Isso garante que sempre usamos os status mais recentes, mesmo se o store foi atualizado durante a sincronização
    try {
      const { projects } = useProjectsStore.getState();
      const latestProjectFromStore = projects.find(p => p.id === project.id);
      if (latestProjectFromStore && issue.key) {
        const latestTask = latestProjectFromStore.tasks.find(t => t.id === issue.key);
        if (latestTask) {
          originalTasksMap.set(issue.key, latestTask);
          logger.debug(
            `Atualizado originalTasksMap para ${issue.key} com dados mais recentes do store`,
            'jiraService',
            {
              testCasesCount: latestTask.testCases?.length || 0,
              testCasesComStatus: (latestTask.testCases || []).filter(tc => tc.status !== 'Not Run')
                .length,
            }
          );
        }
      }
    } catch (error) {
      // Se não conseguir acessar store, continuar com Map existente
      logger.debug(
        `Erro ao atualizar originalTasksMap do store para ${issue.key}, usando Map existente`,
        'jiraService',
        { error }
      );
    }

    const existingIndex = updatedTasks.findIndex(t => t.id === issue.key);
    const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
    const isBug = taskType === 'Bug';

    // Buscar anexos do Jira antes de processar descrição (para mapear imagens)
    let jiraAttachments: Array<{
      id: string;
      filename: string;
      size: number;
      created: string;
      author: string;
    }> = [];
    if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
      jiraAttachments = issue.fields.attachment.map((att: any) => ({
        id: att.id,
        filename: att.filename,
        size: att.size,
        created: att.created,
        author: att.author?.displayName || 'Desconhecido',
      }));
    }

    // Converter descrição do formato ADF para HTML preservando formatação rica
    // Tentar também renderedFields.description se disponível (formato HTML renderizado)
    let description = '';
    if (issue.renderedFields?.description) {
      // Se temos descrição renderizada (HTML), preservar formatação rica
      description = parseJiraDescriptionHTML(
        issue.renderedFields.description,
        config.url,
        jiraAttachments
      );
    } else if (issue.fields?.description) {
      // Caso contrário, converter a descrição raw (ADF) para HTML
      description = parseJiraDescriptionHTML(issue.fields.description, config.url, jiraAttachments);
    }

    // Buscar comentários do Jira
    const jiraComments = await extractJiraComments(config, issue, jiraAttachments);

    // Fazer merge com comentários existentes
    const existingComments = existingIndex >= 0 ? updatedTasks[existingIndex].comments || [] : [];
    const mergedComments = mergeComments(existingComments, jiraComments);

    // IMPORTANTE: Sempre obter o nome exato do status do Jira
    // Se não houver status, usar string vazia (mas ainda assim definir jiraStatus para manter consistência)
    const jiraStatusName = issue.fields?.status?.name || '';
    const jiraKey = issue.key || `jira-${Date.now()}-${Math.random()}`;

    // Log para rastrear quando jiraStatusName está vazio (pode indicar problema)
    if (!jiraStatusName) {
      logger.warn(`Status do Jira vazio para issue ${jiraKey}`, 'jiraService', {
        issueKey: jiraKey,
        hasStatusField: !!issue.fields?.status,
        statusField: issue.fields?.status,
      });
    }

    // Buscar testCases existentes e salvos
    // IMPORTANTE: existingTestCases sempre vêm do projeto ORIGINAL (não de updatedTasks que pode estar desatualizado)
    // Usar originalTasksMap para garantir que temos os status mais recentes
    const originalTask = jiraKey ? originalTasksMap.get(jiraKey) : undefined;
    const existingTestCases = originalTask?.testCases || [];
    const savedTestCases = savedTestStatuses.get(jiraKey) || [];

    logger.debug(`Obtendo existingTestCases para ${jiraKey}`, 'jiraService', {
      temOriginalTask: !!originalTask,
      existingTestCasesCount: existingTestCases.length,
      existingTestCasesComStatus: existingTestCases.filter(tc => tc.status !== 'Not Run').length,
    });

    // Contar status não-padrão antes da mesclagem
    const existingWithStatus = existingTestCases.filter(tc => tc.status !== 'Not Run').length;
    const savedWithStatus = savedTestCases.filter(tc => tc.status !== 'Not Run').length;

    // Criar um Map dos status existentes para validação posterior
    const existingStatusMap = new Map<string, TestCase['status']>();
    existingTestCases.forEach(tc => {
      if (tc.id && tc.status !== 'Not Run') {
        existingStatusMap.set(tc.id, tc.status);
      }
    });

    // REGRA DE OURO: Se existingTestCases tem status diferentes de "Not Run", usar diretamente sem mesclar
    // Apenas adicionar testCases novos que não existem nos existentes
    let mergedTestCases: typeof existingTestCases;
    if (existingTestCases.length > 0 && existingWithStatus > 0) {
      // PROTEÇÃO FINAL: Se há status executados nos existentes, usar diretamente e apenas adicionar novos
      logger.info(
        `PROTEÇÃO FINAL: existingTestCases tem ${existingWithStatus} status executados para ${jiraKey}. Usando diretamente sem mesclar.`,
        'jiraService'
      );

      // Criar um Map dos IDs existentes para verificação rápida
      const existingIds = new Set(existingTestCases.map(tc => tc.id).filter(Boolean));

      // Começar com os existentes (que têm status preservados)
      mergedTestCases = [...existingTestCases];

      // Apenas adicionar testCases salvos que não existem nos existentes
      for (const savedTestCase of savedTestCases) {
        if (savedTestCase.id && !existingIds.has(savedTestCase.id)) {
          mergedTestCases.push(savedTestCase);
          logger.debug(
            `Adicionando testCase novo dos salvos para ${jiraKey}: ${savedTestCase.id}`,
            'jiraService'
          );
        }
      }

      const finalWithStatus = mergedTestCases.filter(tc => tc.status !== 'Not Run').length;

      logger.info(`PROTEÇÃO FINAL aplicada para ${jiraKey}`, 'jiraService', {
        existentes: existingTestCases.length,
        existentesComStatus: existingWithStatus,
        salvos: savedTestCases.length,
        salvosComStatus: savedWithStatus,
        resultado: mergedTestCases.length,
        resultadoComStatus: finalWithStatus,
        statusPreservados: finalWithStatus >= existingWithStatus,
        novosTestCasesAdicionados: mergedTestCases.length - existingTestCases.length,
      });
    } else if (existingTestCases.length > 0) {
      // Há existentes mas sem status executados - mesclar normalmente
      mergedTestCases = mergeTestCases(existingTestCases, savedTestCases);
      const finalWithStatus = mergedTestCases.filter(tc => tc.status !== 'Not Run').length;

      logger.debug(
        `Mesclando testCases para ${jiraKey} (sem status executados nos existentes)`,
        'jiraService',
        {
          existentes: existingTestCases.length,
          existentesComStatus: existingWithStatus,
          salvos: savedTestCases.length,
          salvosComStatus: savedWithStatus,
          resultado: mergedTestCases.length,
          resultadoComStatus: finalWithStatus,
        }
      );
    } else if (savedTestCases.length > 0) {
      // Não há existentes, usar os salvos
      mergedTestCases = savedTestCases;
      logger.debug(
        `Usando ${savedTestCases.length} testCases salvos (sem existentes) para ${jiraKey}`,
        'jiraService',
        {
          salvosComStatus: savedWithStatus,
        }
      );
    } else {
      // Não há nem existentes nem salvos
      mergedTestCases = [];
      logger.debug(`Nenhum testCase encontrado para ${jiraKey}`, 'jiraService');
    }

    const task: JiraTask = {
      id: jiraKey,
      title: issue.fields?.summary || 'Sem título',
      description: description || '',
      status: mapJiraStatusToTaskStatus(jiraStatusName),
      jiraStatus: jiraStatusName, // Sempre atualizar status original do Jira
      type: taskType,
      priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
      jiraPriority: issue.fields?.priority?.name,
      createdAt: issue.fields?.created || new Date().toISOString(),
      completedAt: issue.fields?.resolutiondate || undefined, // Atualizar exatamente como está no Jira
      tags: issue.fields?.labels || [],
      testCases: mergedTestCases, // Usar testCases mesclados (salvos + existentes)
      // NOTA: Este objeto task é usado apenas quando NÃO há tarefa existente (nova tarefa)
      // Quando há tarefa existente, criamos um novo objeto com finalTestCases ou mergedTestCasesNoChanges
      bddScenarios: existingIndex >= 0 ? updatedTasks[existingIndex].bddScenarios : [], // Preservar cenários BDD locais
      comments: mergedComments,
    };

    if (isBug) {
      task.severity = mapJiraSeverity(issue.fields.labels);
    }

    // Atualizar parentId exatamente como está no Jira
    if (issue.fields?.parent?.key) {
      task.parentId = issue.fields.parent.key;
    } else {
      // Se não há parent no Jira, remover se existia anteriormente
      task.parentId = undefined;
    }

    // Capturar Epic Link (para Histórias vinculadas a Epics) - sempre atualizar do Jira
    const epicKey = extractEpicLink(issue.fields);
    if (epicKey) {
      task.epicKey = epicKey;
    } else {
      // Se não há Epic Link no Jira, remover se existia anteriormente
      task.epicKey = undefined;
    }

    // Mapear assignee - sempre atualizar do Jira
    if (issue.fields?.assignee?.emailAddress) {
      const email = issue.fields.assignee.emailAddress.toLowerCase();
      if (email.includes('qa') || email.includes('test')) {
        task.assignee = 'QA';
      } else if (email.includes('dev') || email.includes('developer')) {
        task.assignee = 'Dev';
      } else {
        task.assignee = 'Product';
      }
    } else {
      task.assignee = existingIndex >= 0 ? updatedTasks[existingIndex].assignee : 'Product';
    }

    // Mapear campos adicionais do Jira - sempre atualizar exatamente como estão no Jira
    if (issue.fields?.duedate) {
      task.dueDate = issue.fields.duedate;
    } else {
      // Se não há dueDate no Jira, remover se existia anteriormente
      task.dueDate = undefined;
    }

    // Atualizar timeTracking exatamente como está no Jira
    if (issue.fields?.timetracking) {
      task.timeTracking = {
        originalEstimate: issue.fields.timetracking.originalEstimate,
        remainingEstimate: issue.fields.timetracking.remainingEstimate,
        timeSpent: issue.fields.timetracking.timeSpent,
      };
    } else {
      // Se não há timetracking no Jira, remover se existia anteriormente
      task.timeTracking = undefined;
    }

    // Atualizar components exatamente como estão no Jira
    if (issue.fields?.components && issue.fields.components.length > 0) {
      task.components = issue.fields.components.map((comp: any) => ({
        id: comp.id,
        name: comp.name,
      }));
    } else {
      // Se não há components no Jira, remover se existiam anteriormente
      task.components = undefined;
    }

    // Atualizar fixVersions exatamente como estão no Jira
    if (issue.fields?.fixVersions && issue.fields.fixVersions.length > 0) {
      task.fixVersions = issue.fields.fixVersions.map((version: any) => ({
        id: version.id,
        name: version.name,
      }));
    } else {
      // Se não há fixVersions no Jira, remover se existiam anteriormente
      task.fixVersions = undefined;
    }

    // Atualizar environment exatamente como está no Jira
    if (issue.fields?.environment) {
      task.environment = issue.fields.environment;
    } else {
      // Se não há environment no Jira, remover se existia anteriormente
      task.environment = undefined;
    }

    // Atualizar reporter exatamente como está no Jira
    if (issue.fields?.reporter) {
      task.reporter = {
        displayName: issue.fields.reporter.displayName,
        emailAddress: issue.fields.reporter.emailAddress,
      };
    } else {
      // Se não há reporter no Jira, remover se existia anteriormente
      task.reporter = undefined;
    }

    // Atualizar watchers exatamente como estão no Jira
    if (issue.fields?.watches) {
      task.watchers = {
        watchCount: issue.fields.watches.watchCount || 0,
        isWatching: issue.fields.watches.isWatching || false,
      };
    } else {
      // Se não há watches no Jira, remover se existiam anteriormente
      task.watchers = undefined;
    }

    // Atualizar issueLinks exatamente como estão no Jira
    if (issue.fields?.issuelinks && issue.fields.issuelinks.length > 0) {
      task.issueLinks = issue.fields.issuelinks.map((link: any) => ({
        id: link.id,
        type: link.type?.name || '',
        relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
        direction: link.outwardIssue ? 'outward' : 'inward',
      }));
    } else {
      // Se não há issueLinks no Jira, remover se existiam anteriormente
      task.issueLinks = undefined;
    }

    // Atualizar jiraAttachments exatamente como estão no Jira
    if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
      task.jiraAttachments = issue.fields.attachment.map((att: any) => ({
        id: att.id,
        filename: att.filename,
        size: att.size,
        created: att.created,
        author: att.author?.displayName || 'Desconhecido',
      }));
    } else {
      // Se não há attachments no Jira, remover se existiam anteriormente
      task.jiraAttachments = undefined;
    }

    // Mapear campos customizados - sempre atualizar exatamente como estão no Jira
    // Excluir campos de Epic Link da lista de customizados pois já foram processados
    const standardFields = [
      'summary',
      'description',
      'issuetype',
      'status',
      'priority',
      'assignee',
      'reporter',
      'created',
      'updated',
      'resolutiondate',
      'labels',
      'parent',
      'subtasks',
      'comment',
      'duedate',
      'timetracking',
      'components',
      'fixVersions',
      'environment',
      'watches',
      'issuelinks',
      'attachment',
    ];
    const customFields: { [key: string]: any } = {};
    Object.keys(issue.fields).forEach(key => {
      // Não incluir campos de Epic Link nos customizados (já processados)
      if (
        !standardFields.includes(key) &&
        !key.startsWith('_') &&
        !key.toLowerCase().includes('epic')
      ) {
        customFields[key] = issue.fields[key];
      }
    });
    if (Object.keys(customFields).length > 0) {
      task.jiraCustomFields = customFields;
    } else {
      // Se não há customFields no Jira, remover se existiam anteriormente
      task.jiraCustomFields = undefined;
    }

    if (existingIndex >= 0) {
      const oldTask = updatedTasks[existingIndex];

      // IMPORTANTE: Sempre verificar se o jiraStatus mudou (independente de outras mudanças)
      // O jiraStatus deve ser sempre atualizado do Jira, mesmo quando não há outras mudanças
      const jiraStatusChanged = oldTask.jiraStatus !== jiraStatusName;
      const statusMappedChanged = oldTask.status !== task.status;

      // Verificar se realmente houve mudanças nos campos do Jira antes de atualizar
      const hasChanges =
        oldTask.title !== task.title ||
        oldTask.description !== task.description ||
        statusMappedChanged ||
        jiraStatusChanged ||
        oldTask.priority !== task.priority ||
        JSON.stringify(oldTask.tags || []) !== JSON.stringify(task.tags || []) ||
        oldTask.severity !== task.severity ||
        oldTask.completedAt !== task.completedAt ||
        oldTask.dueDate !== task.dueDate ||
        oldTask.parentId !== task.parentId ||
        oldTask.epicKey !== task.epicKey ||
        oldTask.assignee !== task.assignee ||
        JSON.stringify(oldTask.timeTracking) !== JSON.stringify(task.timeTracking) ||
        JSON.stringify(oldTask.components || []) !== JSON.stringify(task.components || []) ||
        JSON.stringify(oldTask.fixVersions || []) !== JSON.stringify(task.fixVersions || []) ||
        oldTask.environment !== task.environment ||
        JSON.stringify(oldTask.reporter) !== JSON.stringify(task.reporter) ||
        JSON.stringify(oldTask.watchers) !== JSON.stringify(task.watchers) ||
        JSON.stringify(oldTask.issueLinks || []) !== JSON.stringify(task.issueLinks || []) ||
        JSON.stringify(oldTask.jiraAttachments || []) !==
          JSON.stringify(task.jiraAttachments || []) ||
        JSON.stringify(oldTask.jiraCustomFields || {}) !==
          JSON.stringify(task.jiraCustomFields || {});

      if (hasChanges) {
        logger.debug(`Atualizando tarefa ${task.id}`, 'jiraService', {
          titleChanged: oldTask.title !== task.title,
          statusChanged: statusMappedChanged || jiraStatusChanged,
          jiraStatusChanged: jiraStatusChanged,
          jiraStatusOld: oldTask.jiraStatus,
          jiraStatusNew: jiraStatusName,
          priorityChanged: oldTask.priority !== task.priority,
          descriptionChanged: oldTask.description !== task.description,
        });

        if (jiraStatusChanged) {
          logger.info(
            `jiraStatus atualizado (com outras mudanças) para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`,
            'jiraService'
          );
        }

        // Buscar testCases salvos no Supabase para esta chave
        const savedTestCasesForTask = savedTestStatuses.get(task.id) || [];
        // IMPORTANTE: Obter existingTestCasesForTask do projeto ORIGINAL, não de oldTask que pode estar desatualizado
        const originalTaskForChanges = task.id ? originalTasksMap.get(task.id) : undefined;
        const existingTestCasesForTask = originalTaskForChanges?.testCases || [];

        logger.debug(
          `Obtendo existingTestCasesForTask para ${task.id} (com mudanças)`,
          'jiraService',
          {
            temOriginalTask: !!originalTaskForChanges,
            existingTestCasesForTaskCount: existingTestCasesForTask.length,
            existingTestCasesForTaskComStatus: existingTestCasesForTask.filter(
              tc => tc.status !== 'Not Run'
            ).length,
          }
        );

        // Contar status não-padrão antes da mesclagem
        const existingWithStatus = existingTestCasesForTask.filter(
          tc => tc.status !== 'Not Run'
        ).length;
        const savedWithStatus = savedTestCasesForTask.filter(tc => tc.status !== 'Not Run').length;

        // Criar um Map dos status existentes para validação posterior
        const existingStatusMapForTask = new Map<string, TestCase['status']>();
        existingTestCasesForTask.forEach(tc => {
          if (tc.id && tc.status !== 'Not Run') {
            existingStatusMapForTask.set(tc.id, tc.status);
          }
        });

        // Log detalhado dos status antes da mesclagem
        const existingStatusDetails = existingTestCasesForTask
          .filter(tc => tc.status !== 'Not Run')
          .map(tc => ({ id: tc.id, status: tc.status }));
        const savedStatusDetails = savedTestCasesForTask
          .filter(tc => tc.status !== 'Not Run')
          .map(tc => ({ id: tc.id, status: tc.status }));

        logger.debug(`Preparando mesclagem de testCases para ${task.id}`, 'jiraService', {
          existentes: existingTestCasesForTask.length,
          existentesComStatus: existingWithStatus,
          existentesStatus: existingStatusDetails,
          salvos: savedTestCasesForTask.length,
          salvosComStatus: savedWithStatus,
          salvosStatus: savedStatusDetails,
        });

        // REGRA DE OURO: Se existingTestCasesForTask tem status diferentes de "Not Run", usar diretamente sem mesclar
        // Apenas adicionar testCases novos que não existem nos existentes
        let finalTestCases: typeof oldTask.testCases;
        if (existingTestCasesForTask.length > 0 && existingWithStatus > 0) {
          // PROTEÇÃO FINAL: Se há status executados nos existentes, usar diretamente e apenas adicionar novos
          logger.info(
            `PROTEÇÃO FINAL: existingTestCasesForTask tem ${existingWithStatus} status executados para ${task.id}. Usando diretamente sem mesclar.`,
            'jiraService'
          );

          // Criar um Map dos IDs existentes para verificação rápida
          const existingIdsForTask = new Set(
            existingTestCasesForTask.map(tc => tc.id).filter(Boolean)
          );

          // Começar com os existentes (que têm status preservados)
          finalTestCases = [...existingTestCasesForTask];

          // Apenas adicionar testCases salvos que não existem nos existentes
          for (const savedTestCase of savedTestCasesForTask) {
            if (savedTestCase.id && !existingIdsForTask.has(savedTestCase.id)) {
              finalTestCases.push(savedTestCase);
              logger.debug(
                `Adicionando testCase novo dos salvos para ${task.id}: ${savedTestCase.id}`,
                'jiraService'
              );
            }
          }

          const finalWithStatus = finalTestCases.filter(tc => tc.status !== 'Not Run').length;

          logger.info(`PROTEÇÃO FINAL aplicada para ${task.id}`, 'jiraService', {
            existentes: existingTestCasesForTask.length,
            existentesComStatus: existingWithStatus,
            salvos: savedTestCasesForTask.length,
            salvosComStatus: savedWithStatus,
            resultado: finalTestCases.length,
            resultadoComStatus: finalWithStatus,
            statusPreservados: finalWithStatus >= existingWithStatus,
            novosTestCasesAdicionados: finalTestCases.length - existingTestCasesForTask.length,
          });
        } else if (existingTestCasesForTask.length > 0) {
          // Há existentes mas sem status executados - mesclar normalmente
          finalTestCases = mergeTestCases(existingTestCasesForTask, savedTestCasesForTask);
          const finalWithStatus = finalTestCases.filter(tc => tc.status !== 'Not Run').length;

          logger.debug(
            `Mesclando testCases para ${task.id} (sem status executados nos existentes)`,
            'jiraService',
            {
              existentes: existingTestCasesForTask.length,
              existentesComStatus: existingWithStatus,
              salvos: savedTestCasesForTask.length,
              salvosComStatus: savedWithStatus,
              resultado: finalTestCases.length,
              resultadoComStatus: finalWithStatus,
            }
          );
        } else if (savedTestCasesForTask.length > 0) {
          // Não há existentes, usar os salvos
          finalTestCases = savedTestCasesForTask;
          logger.debug(
            `Usando ${savedTestCasesForTask.length} testCases salvos (sem existentes) para ${task.id}`,
            'jiraService',
            {
              salvosComStatus: savedWithStatus,
              salvosStatus: savedStatusDetails,
            }
          );
        } else {
          // Não há nem existentes nem salvos
          finalTestCases = [];
          logger.debug(`Nenhum testCase encontrado para ${task.id}`, 'jiraService');
        }

        // Fazer merge preservando dados locais e atualizando apenas campos do Jira
        // IMPORTANTE: Sempre definir jiraStatus com o nome exato do Jira (mesmo que seja string vazia)
        // CORREÇÃO CRÍTICA: SEMPRE usar testCases do originalTasksMap diretamente, sem fallback
        // Isso garante que os casos de teste NUNCA sejam alterados, mesmo quando o status da tarefa muda
        const originalTaskForFinal = task.id ? originalTasksMap.get(task.id) : undefined;

        // REGRA DE OURO: Se originalTasksMap tem testCases, usar diretamente (sempre preservar)
        // Apenas usar finalTestCases se originalTasksMap não existir ou não tiver testCases
        let finalTestCasesFromOriginal: typeof finalTestCases;
        if (originalTaskForFinal?.testCases && originalTaskForFinal.testCases.length > 0) {
          // SEMPRE usar testCases do originalTasksMap se existirem
          finalTestCasesFromOriginal = originalTaskForFinal.testCases;
          logger.debug(
            `Usando testCases diretamente do originalTasksMap para ${task.id}: ${finalTestCasesFromOriginal.length} casos`,
            'jiraService',
            {
              testCasesComStatus: finalTestCasesFromOriginal.filter(tc => tc.status !== 'Not Run')
                .length,
            }
          );
        } else {
          // Fallback apenas se originalTasksMap não tiver testCases
          finalTestCasesFromOriginal = finalTestCases;
          logger.debug(
            `Fallback: usando finalTestCases mesclados para ${task.id} (originalTasksMap não tem testCases)`,
            'jiraService'
          );
        }

        // Log para debug: comparar testCases do oldTask vs originalTasksMap
        if (
          originalTaskForFinal &&
          oldTask.testCases?.length !== originalTaskForFinal.testCases?.length
        ) {
          logger.debug(
            `Diferença detectada em testCases para ${task.id}: oldTask tem ${oldTask.testCases?.length || 0}, originalTasksMap tem ${originalTaskForFinal.testCases?.length || 0}`,
            'jiraService'
          );
        }

        updatedTasks[existingIndex] = {
          ...oldTask, // Preservar todos os dados locais primeiro
          // Atualizar apenas campos importados do Jira
          title: task.title,
          description: task.description,
          status: task.status,
          jiraStatus: jiraStatusName || task.jiraStatus, // Sempre usar jiraStatusName do Jira, ou manter existente se vazio
          priority: task.priority,
          tags: task.tags,
          severity: task.severity,
          completedAt: task.completedAt,
          dueDate: task.dueDate,
          parentId: task.parentId,
          epicKey: task.epicKey,
          assignee: task.assignee,
          timeTracking: task.timeTracking,
          components: task.components,
          fixVersions: task.fixVersions,
          environment: task.environment,
          reporter: task.reporter,
          watchers: task.watchers,
          issueLinks: task.issueLinks,
          jiraAttachments: task.jiraAttachments,
          jiraCustomFields: task.jiraCustomFields,
          comments: task.comments, // Já faz merge de comentários
          // Preservar dados locais que não vêm do Jira
          // CORREÇÃO: Usar finalTestCasesFromOriginal que vem do originalTasksMap (mais recente)
          testCases: finalTestCasesFromOriginal, // ✅ Preservar status dos testes (do originalTasksMap, mais recente)
          bddScenarios: oldTask.bddScenarios || [], // ✅ Preservar cenários BDD
          testStrategy: oldTask.testStrategy, // ✅ Preservar estratégia de teste
          toolsUsed: oldTask.toolsUsed, // ✅ Preservar ferramentas
          executedStrategies: oldTask.executedStrategies, // ✅ Preservar estratégias executadas
          strategyTools: oldTask.strategyTools, // ✅ Preservar ferramentas por estratégia
          // ✅ CRÍTICO: Preservar testStatus - NUNCA sobrescrever com dados do Jira
          // O testStatus é completamente independente do status do Jira
          testStatus: oldTask.testStatus, // ✅ Preservar status de teste independente do Jira
          // Preservar createdAt se já existe (não sobrescrever com data do Jira se já foi criado localmente)
          createdAt: oldTask.createdAt || task.createdAt,
        };
        updatedCount++;
      } else {
        // Preservar tarefa existente se não houve mudanças no Jira
        // Mas ainda assim mesclar testCases salvos se houver
        const savedTestCasesForTaskNoChanges = savedTestStatuses.get(task.id) || [];
        // IMPORTANTE: Obter existingTestCasesNoChanges do projeto ORIGINAL, não de oldTask que pode estar desatualizado
        const originalTaskNoChanges = task.id ? originalTasksMap.get(task.id) : undefined;
        const existingTestCasesNoChanges = originalTaskNoChanges?.testCases || [];

        logger.debug(
          `Obtendo existingTestCasesNoChanges para ${task.id} (sem mudanças)`,
          'jiraService',
          {
            temOriginalTask: !!originalTaskNoChanges,
            existingTestCasesNoChangesCount: existingTestCasesNoChanges.length,
            existingTestCasesNoChangesComStatus: existingTestCasesNoChanges.filter(
              tc => tc.status !== 'Not Run'
            ).length,
          }
        );

        // Contar status não-padrão antes da mesclagem
        const existingWithStatusNoChanges = existingTestCasesNoChanges.filter(
          tc => tc.status !== 'Not Run'
        ).length;
        const savedWithStatusNoChanges = savedTestCasesForTaskNoChanges.filter(
          tc => tc.status !== 'Not Run'
        ).length;

        // Criar um Map dos status existentes para validação posterior
        const existingStatusMapNoChanges = new Map<string, TestCase['status']>();
        existingTestCasesNoChanges.forEach(tc => {
          if (tc.id && tc.status !== 'Not Run') {
            existingStatusMapNoChanges.set(tc.id, tc.status);
          }
        });

        // REGRA DE OURO: Se existingTestCasesNoChanges tem status diferentes de "Not Run", usar diretamente sem mesclar
        if (existingTestCasesNoChanges.length > 0 && existingWithStatusNoChanges > 0) {
          // PROTEÇÃO FINAL: Se há status executados nos existentes, usar diretamente e apenas adicionar novos
          logger.info(
            `PROTEÇÃO FINAL (sem mudanças Jira): existingTestCasesNoChanges tem ${existingWithStatusNoChanges} status executados para ${task.id}. Usando diretamente sem mesclar.`,
            'jiraService'
          );

          // Criar um Map dos IDs existentes para verificação rápida
          const existingIdsNoChanges = new Set(
            existingTestCasesNoChanges.map(tc => tc.id).filter(Boolean)
          );

          // Começar com os existentes (que têm status preservados)
          const mergedTestCasesNoChanges = [...existingTestCasesNoChanges];

          // Apenas adicionar testCases salvos que não existem nos existentes
          for (const savedTestCase of savedTestCasesForTaskNoChanges) {
            if (savedTestCase.id && !existingIdsNoChanges.has(savedTestCase.id)) {
              mergedTestCasesNoChanges.push(savedTestCase);
              logger.debug(
                `Adicionando testCase novo dos salvos para ${task.id} (sem mudanças Jira): ${savedTestCase.id}`,
                'jiraService'
              );
            }
          }

          const finalWithStatusNoChanges = mergedTestCasesNoChanges.filter(
            tc => tc.status !== 'Not Run'
          ).length;

          // CORREÇÃO CRÍTICA: SEMPRE usar testCases do originalTasksMap diretamente, sem fallback
          // Isso garante que os casos de teste NUNCA sejam alterados, mesmo quando o status da tarefa muda
          const originalTaskNoChangesFinal = task.id ? originalTasksMap.get(task.id) : undefined;

          // REGRA DE OURO: Se originalTasksMap tem testCases, usar diretamente (sempre preservar)
          let finalTestCasesNoChangesFromOriginal: typeof mergedTestCasesNoChanges;
          if (
            originalTaskNoChangesFinal?.testCases &&
            originalTaskNoChangesFinal.testCases.length > 0
          ) {
            // SEMPRE usar testCases do originalTasksMap se existirem
            finalTestCasesNoChangesFromOriginal = originalTaskNoChangesFinal.testCases;
            logger.debug(
              `Usando testCases diretamente do originalTasksMap (sem mudanças) para ${task.id}: ${finalTestCasesNoChangesFromOriginal.length} casos`,
              'jiraService'
            );
          } else {
            // Fallback apenas se originalTasksMap não tiver testCases
            finalTestCasesNoChangesFromOriginal = mergedTestCasesNoChanges;
            logger.debug(
              `Fallback: usando mergedTestCasesNoChanges para ${task.id} (originalTasksMap não tem testCases)`,
              'jiraService'
            );
          }

          // IMPORTANTE: Sempre atualizar jiraStatus do Jira, mesmo quando não há outras mudanças
          updatedTasks[existingIndex] = {
            ...oldTask,
            jiraStatus: jiraStatusName, // Sempre atualizar do Jira
            status: jiraStatusChanged ? mapJiraStatusToTaskStatus(jiraStatusName) : oldTask.status, // Atualizar status mapeado se jiraStatus mudou
            // CORREÇÃO: Usar finalTestCasesNoChangesFromOriginal que vem do originalTasksMap (mais recente)
            testCases: finalTestCasesNoChangesFromOriginal,
            // ✅ CRÍTICO: Preservar testStatus - NUNCA sobrescrever com dados do Jira
            testStatus: oldTask.testStatus, // ✅ Preservar status de teste independente do Jira
          };

          if (jiraStatusChanged) {
            logger.info(
              `jiraStatus atualizado (sem outras mudanças) para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`,
              'jiraService'
            );
          }

          logger.info(
            `PROTEÇÃO FINAL aplicada (sem mudanças Jira) para ${task.id}`,
            'jiraService',
            {
              existentes: existingTestCasesNoChanges.length,
              existentesComStatus: existingWithStatusNoChanges,
              salvos: savedTestCasesForTaskNoChanges.length,
              salvosComStatus: savedWithStatusNoChanges,
              resultado: mergedTestCasesNoChanges.length,
              resultadoComStatus: finalWithStatusNoChanges,
              statusPreservados: finalWithStatusNoChanges >= existingWithStatusNoChanges,
              novosTestCasesAdicionados:
                mergedTestCasesNoChanges.length - existingTestCasesNoChanges.length,
            }
          );
        } else if (
          existingTestCasesNoChanges.length > 0 ||
          savedTestCasesForTaskNoChanges.length > 0
        ) {
          // Há existentes mas sem status executados - mesclar normalmente
          const mergedTestCasesNoChanges =
            existingTestCasesNoChanges.length > 0
              ? mergeTestCases(existingTestCasesNoChanges, savedTestCasesForTaskNoChanges)
              : savedTestCasesForTaskNoChanges;

          const finalWithStatusNoChanges = mergedTestCasesNoChanges.filter(
            tc => tc.status !== 'Not Run'
          ).length;

          // CORREÇÃO CRÍTICA: SEMPRE usar testCases do originalTasksMap diretamente, sem fallback
          // Isso garante que os casos de teste NUNCA sejam alterados, mesmo quando o status da tarefa muda
          const originalTaskNoChangesMerge = task.id ? originalTasksMap.get(task.id) : undefined;

          // REGRA DE OURO: Se originalTasksMap tem testCases, usar diretamente (sempre preservar)
          let finalTestCasesNoChangesFromOriginalMerge: typeof mergedTestCasesNoChanges;
          if (
            originalTaskNoChangesMerge?.testCases &&
            originalTaskNoChangesMerge.testCases.length > 0
          ) {
            // SEMPRE usar testCases do originalTasksMap se existirem
            finalTestCasesNoChangesFromOriginalMerge = originalTaskNoChangesMerge.testCases;
            logger.debug(
              `Usando testCases diretamente do originalTasksMap (merge sem mudanças) para ${task.id}: ${finalTestCasesNoChangesFromOriginalMerge.length} casos`,
              'jiraService'
            );
          } else {
            // Fallback apenas se originalTasksMap não tiver testCases
            finalTestCasesNoChangesFromOriginalMerge = mergedTestCasesNoChanges;
            logger.debug(
              `Fallback: usando mergedTestCasesNoChanges (merge) para ${task.id} (originalTasksMap não tem testCases)`,
              'jiraService'
            );
          }

          // IMPORTANTE: Sempre atualizar jiraStatus do Jira, mesmo quando não há outras mudanças
          updatedTasks[existingIndex] = {
            ...oldTask,
            jiraStatus: jiraStatusName, // Sempre atualizar do Jira
            status: jiraStatusChanged ? mapJiraStatusToTaskStatus(jiraStatusName) : oldTask.status, // Atualizar status mapeado se jiraStatus mudou
            // CORREÇÃO: Usar finalTestCasesNoChangesFromOriginalMerge que vem do originalTasksMap (mais recente)
            testCases: finalTestCasesNoChangesFromOriginalMerge,
            // ✅ CRÍTICO: Preservar testStatus - NUNCA sobrescrever com dados do Jira
            testStatus: oldTask.testStatus, // ✅ Preservar status de teste independente do Jira
          };

          if (jiraStatusChanged) {
            logger.info(
              `jiraStatus atualizado (sem outras mudanças) para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`,
              'jiraService'
            );
          }

          logger.debug(
            `Mesclando testCases (sem mudanças no Jira) para ${task.id}`,
            'jiraService',
            {
              existentes: existingTestCasesNoChanges.length,
              existentesComStatus: existingWithStatusNoChanges,
              salvos: savedTestCasesForTaskNoChanges.length,
              salvosComStatus: savedWithStatusNoChanges,
              resultado: mergedTestCasesNoChanges.length,
              resultadoComStatus: finalWithStatusNoChanges,
            }
          );
        } else {
          // IMPORTANTE: Mesmo sem testCases para mesclar, usar o projeto original do store
          // para garantir que temos os status mais recentes
          const originalTaskForNoChanges = task.id ? originalTasksMap.get(task.id) : undefined;
          if (originalTaskForNoChanges) {
            // IMPORTANTE: Sempre atualizar jiraStatus do Jira, mesmo quando não há outras mudanças
            updatedTasks[existingIndex] = {
              ...oldTask,
              jiraStatus: jiraStatusName, // Sempre atualizar do Jira
              status: jiraStatusChanged
                ? mapJiraStatusToTaskStatus(jiraStatusName)
                : oldTask.status, // Atualizar status mapeado se jiraStatus mudou
              testCases: originalTaskForNoChanges.testCases || [],
            };

            if (jiraStatusChanged) {
              logger.info(
                `jiraStatus atualizado (sem outras mudanças) para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`,
                'jiraService'
              );
            }

            logger.debug(
              `Preservando testCases do projeto original (sem mudanças no Jira) para ${task.id}`,
              'jiraService',
              {
                testCasesCount: (originalTaskForNoChanges.testCases || []).length,
                testCasesComStatus: (originalTaskForNoChanges.testCases || []).filter(
                  tc => tc.status !== 'Not Run'
                ).length,
              }
            );
          } else {
            // IMPORTANTE: Sempre atualizar jiraStatus do Jira, mesmo quando não há outras mudanças
            updatedTasks[existingIndex] = {
              ...oldTask,
              jiraStatus: jiraStatusName, // Sempre atualizar do Jira
              status: jiraStatusChanged
                ? mapJiraStatusToTaskStatus(jiraStatusName)
                : oldTask.status, // Atualizar status mapeado se jiraStatus mudou
            };

            if (jiraStatusChanged) {
              logger.info(
                `jiraStatus atualizado (sem outras mudanças) para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`,
                'jiraService'
              );
            }

            logger.debug(
              `Nenhum testCase para mesclar (sem mudanças no Jira) para ${task.id}`,
              'jiraService'
            );
          }
        }
      }
    } else {
      logger.info(`Nova tarefa encontrada: ${task.id} - ${task.title}`, 'jiraService');
      updatedTasks.push(task);
      newCount++;
    }
  }

  logger.info(
    `Resumo: ${updatedCount} atualizadas, ${newCount} novas, ${updatedTasks.length} total`,
    'jiraService'
  );

  // VALIDAÇÃO FINAL ROBUSTA: Garantir que os status dos testCases foram preservados
  // Usar originalTasksMap (que foi atualizado dinamicamente) em vez de projectToUse para garantir dados mais recentes
  const statusAntes = Array.from(originalTasksMap.values()).flatMap(t =>
    (t.testCases || [])
      .filter(tc => tc.status !== 'Not Run')
      .map(tc => ({ taskId: t.id, testCaseId: tc.id, status: tc.status }))
  );
  const statusDepois = updatedTasks.flatMap(t =>
    (t.testCases || [])
      .filter(tc => tc.status !== 'Not Run')
      .map(tc => ({ taskId: t.id, testCaseId: tc.id, status: tc.status }))
  );

  logger.info(`VALIDAÇÃO FINAL: Comparando status antes e depois da sincronização`, 'jiraService', {
    statusAntes: statusAntes.length,
    statusDepois: statusDepois.length,
    tarefasProcessadas: originalTasksMap.size,
  });

  // Criar Map dos status antes para validação
  const statusMapAntes = new Map<string, TestCase['status']>();
  statusAntes.forEach(s => {
    if (s.testCaseId) {
      statusMapAntes.set(`${s.taskId}-${s.testCaseId}`, s.status);
    }
  });

  // Verificar se algum status foi perdido e restaurar do originalTasksMap
  let statusPerdidos = 0;
  let statusRestaurados = 0;
  statusMapAntes.forEach((expectedStatus, key) => {
    const [taskId, testCaseId] = key.split('-');
    const statusDepoisEncontrado = statusDepois.find(
      s => s.testCaseId && `${s.taskId}-${s.testCaseId}` === key
    );

    if (!statusDepoisEncontrado || statusDepoisEncontrado.status !== expectedStatus) {
      statusPerdidos++;
      logger.error(
        `STATUS PERDIDO na validação final: taskId=${taskId}, testCaseId=${testCaseId}, esperado="${expectedStatus}", obtido="${statusDepoisEncontrado?.status || 'não encontrado'}"`,
        'jiraService'
      );

      // CORREÇÃO ROBUSTA: Restaurar status do originalTasksMap (que tem os dados mais recentes)
      const originalTask = originalTasksMap.get(taskId);
      if (originalTask) {
        const originalTestCase = originalTask.testCases?.find(tc => tc.id === testCaseId);
        if (originalTestCase && originalTestCase.status !== 'Not Run') {
          const updatedTaskIndex = updatedTasks.findIndex(t => t.id === taskId);
          if (updatedTaskIndex >= 0) {
            const updatedTask = updatedTasks[updatedTaskIndex];
            const restoredTestCases = (updatedTask.testCases || []).map(tc =>
              tc.id === testCaseId ? { ...tc, status: originalTestCase.status } : tc
            );
            updatedTasks[updatedTaskIndex] = {
              ...updatedTask,
              testCases: restoredTestCases,
            };
            statusRestaurados++;
            logger.info(
              `Status restaurado na validação final: taskId=${taskId}, testCaseId=${testCaseId}, status="${originalTestCase.status}"`,
              'jiraService'
            );
          }
        } else {
          // Tentar restaurar do store diretamente como último recurso
          try {
            const { projects } = useProjectsStore.getState();
            const latestProjectFromStore = projects.find(p => p.id === project.id);
            if (latestProjectFromStore) {
              const latestTask = latestProjectFromStore.tasks.find(t => t.id === taskId);
              if (latestTask) {
                const latestTestCase = latestTask.testCases?.find(tc => tc.id === testCaseId);
                if (latestTestCase && latestTestCase.status !== 'Not Run') {
                  const updatedTaskIndex = updatedTasks.findIndex(t => t.id === taskId);
                  if (updatedTaskIndex >= 0) {
                    const updatedTask = updatedTasks[updatedTaskIndex];
                    const restoredTestCases = (updatedTask.testCases || []).map(tc =>
                      tc.id === testCaseId ? { ...tc, status: latestTestCase.status } : tc
                    );
                    updatedTasks[updatedTaskIndex] = {
                      ...updatedTask,
                      testCases: restoredTestCases,
                    };
                    statusRestaurados++;
                    logger.info(
                      `Status restaurado do store (último recurso): taskId=${taskId}, testCaseId=${testCaseId}, status="${latestTestCase.status}"`,
                      'jiraService'
                    );
                  }
                }
              }
            }
          } catch (error) {
            logger.error(
              `Erro ao tentar restaurar status do store: taskId=${taskId}, testCaseId=${testCaseId}`,
              'jiraService',
              { error }
            );
          }
        }
      }
    }
  });

  if (statusPerdidos > 0) {
    logger.warn(
      `VALIDAÇÃO FINAL: ${statusPerdidos} status foram perdidos, ${statusRestaurados} restaurados antes de retornar`,
      'jiraService',
      {
        statusAntes: statusAntes.length,
        statusDepois: statusDepois.length,
        statusPerdidos: statusPerdidos,
        statusRestaurados: statusRestaurados,
        statusNaoRestaurados: statusPerdidos - statusRestaurados,
      }
    );
  } else {
    logger.info(
      `VALIDAÇÃO FINAL: Todos os ${statusAntes.length} status foram preservados`,
      'jiraService',
      {
        statusAntes: statusAntes.length,
        statusDepois: statusDepois.length,
        tarefasProcessadas: originalTasksMap.size,
      }
    );
  }

  // IMPORTANTE: Retornar projeto baseado em projectToUse (do store), não no project passado como parâmetro
  // Isso garante que todos os campos do projeto (não apenas tasks) venham do store com os dados mais recentes
  return {
    ...projectToUse,
    tasks: updatedTasks,
  };
};

export const addNewJiraTasks = async (
  config: JiraConfig,
  project: Project,
  jiraProjectKey: string,
  onProgress?: (current: number, total?: number) => void
): Promise<{ project: Project; newTasksCount: number; updatedStatusCount: number }> => {
  // Buscar status e prioridades do Jira se não estiverem no projeto
  let jiraStatuses = project.settings?.jiraStatuses;
  if (!jiraStatuses || jiraStatuses.length === 0) {
    jiraStatuses = await getJiraStatuses(config, jiraProjectKey);
  }
  let jiraPriorities = project.settings?.jiraPriorities;
  if (!jiraPriorities || jiraPriorities.length === 0) {
    jiraPriorities = await getJiraPriorities(config);
  }

  // Buscar TODAS as issues do Jira
  const jiraIssues = await getJiraIssues(config, jiraProjectKey, undefined, onProgress);

  // Criar um Map com as tarefas existentes para busca rápida
  const existingTasksMap = new Map(project.tasks.map(t => [t.id, t]));

  // Filtrar apenas tarefas novas (que não existem no projeto)
  const newIssues = jiraIssues.filter(issue => !existingTasksMap.has(issue.key));

  // Política: sincronização do Jira não altera status ou análises locais.
  // Apenas novas issues são adicionadas ao projeto.
  const updatedStatusCount = 0;

  if (newIssues.length === 0) {
    return { project, newTasksCount: 0, updatedStatusCount };
  }

  // Mapear apenas as novas issues para tarefas
  const newTasks: JiraTask[] = await Promise.all(
    newIssues.map(async issue => {
      const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
      const isBug = taskType === 'Bug';

      // Buscar anexos do Jira antes de processar descrição (para mapear imagens)
      let jiraAttachments: Array<{
        id: string;
        filename: string;
        size: number;
        created: string;
        author: string;
      }> = [];
      if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
        jiraAttachments = issue.fields.attachment.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          size: att.size,
          created: att.created,
          author: att.author?.displayName || 'Desconhecido',
        }));
      }

      // Converter descrição do formato ADF para HTML preservando formatação rica
      let description = '';
      if (issue.renderedFields?.description) {
        // Se temos descrição renderizada (HTML), preservar formatação rica
        description = parseJiraDescriptionHTML(
          issue.renderedFields.description,
          config.url,
          jiraAttachments
        );
      } else if (issue.fields?.description) {
        // Caso contrário, converter a descrição raw (ADF) para HTML
        description = parseJiraDescriptionHTML(
          issue.fields.description,
          config.url,
          jiraAttachments
        );
      }

      // Buscar comentários do Jira
      const jiraComments = await extractJiraComments(config, issue, jiraAttachments);

      const jiraStatusName = issue.fields?.status?.name || '';
      const task: JiraTask = {
        id: issue.key || `jira-${Date.now()}-${Math.random()}`,
        title: issue.fields?.summary || 'Sem título',
        description: description || '',
        status: mapJiraStatusToTaskStatus(jiraStatusName),
        jiraStatus: jiraStatusName, // Armazenar status original do Jira
        type: taskType,
        priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
        jiraPriority: issue.fields?.priority?.name,
        createdAt: issue.fields?.created || new Date().toISOString(),
        completedAt: issue.fields?.resolutiondate,
        tags: issue.fields?.labels || [],
        testCases: [], // Novas tarefas começam sem casos de teste
        bddScenarios: [], // Novas tarefas começam sem cenários BDD
        comments: jiraComments,
      };

      if (isBug) {
        task.severity = mapJiraSeverity(issue.fields.labels);
      }

      if (issue.fields?.parent?.key) {
        task.parentId = issue.fields.parent.key;
      }

      // Capturar Epic Link (para Histórias vinculadas a Epics)
      const epicKey = extractEpicLink(issue.fields);
      if (epicKey) {
        task.epicKey = epicKey;
      }

      // Mapear assignee
      if (issue.fields?.assignee?.emailAddress) {
        const email = issue.fields.assignee.emailAddress.toLowerCase();
        if (email.includes('qa') || email.includes('test')) {
          task.assignee = 'QA';
        } else if (email.includes('dev') || email.includes('developer')) {
          task.assignee = 'Dev';
        } else {
          task.assignee = 'Product';
        }
      } else {
        task.assignee = 'Product';
      }

      // Mapear campos adicionais do Jira (exatamente como estão no Jira)
      if (issue.fields?.duedate) {
        task.dueDate = issue.fields.duedate;
      }

      if (issue.fields?.timetracking) {
        task.timeTracking = {
          originalEstimate: issue.fields.timetracking.originalEstimate,
          remainingEstimate: issue.fields.timetracking.remainingEstimate,
          timeSpent: issue.fields.timetracking.timeSpent,
        };
      }

      if (issue.fields?.components && issue.fields.components.length > 0) {
        task.components = issue.fields.components.map((comp: any) => ({
          id: comp.id,
          name: comp.name,
        }));
      }

      if (issue.fields?.fixVersions && issue.fields.fixVersions.length > 0) {
        task.fixVersions = issue.fields.fixVersions.map((version: any) => ({
          id: version.id,
          name: version.name,
        }));
      }

      if (issue.fields?.environment) {
        task.environment = issue.fields.environment;
      }

      if (issue.fields?.reporter) {
        task.reporter = {
          displayName: issue.fields.reporter.displayName,
          emailAddress: issue.fields.reporter.emailAddress,
        };
      }

      if (issue.fields?.watches) {
        task.watchers = {
          watchCount: issue.fields.watches.watchCount || 0,
          isWatching: issue.fields.watches.isWatching || false,
        };
      }

      if (issue.fields?.issuelinks && issue.fields.issuelinks.length > 0) {
        task.issueLinks = issue.fields.issuelinks.map((link: any) => ({
          id: link.id,
          type: link.type?.name || '',
          relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
          direction: link.outwardIssue ? 'outward' : 'inward',
        }));
      }

      if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
        task.jiraAttachments = issue.fields.attachment.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          size: att.size,
          created: att.created,
          author: att.author?.displayName || 'Desconhecido',
        }));
      }

      // Mapear campos customizados (todos os campos que não são padrão)
      // Excluir campos de Epic Link da lista de customizados pois já foram processados
      const standardFields = [
        'summary',
        'description',
        'issuetype',
        'status',
        'priority',
        'assignee',
        'reporter',
        'created',
        'updated',
        'resolutiondate',
        'labels',
        'parent',
        'subtasks',
        'comment',
        'duedate',
        'timetracking',
        'components',
        'fixVersions',
        'environment',
        'watches',
        'issuelinks',
        'attachment',
      ];
      const customFields: { [key: string]: any } = {};
      Object.keys(issue.fields).forEach(key => {
        // Não incluir campos de Epic Link nos customizados (já processados)
        if (
          !standardFields.includes(key) &&
          !key.startsWith('_') &&
          !key.toLowerCase().includes('epic')
        ) {
          customFields[key] = issue.fields[key];
        }
      });
      if (Object.keys(customFields).length > 0) {
        task.jiraCustomFields = customFields;
      }

      return task;
    })
  );

  // Adicionar novas tarefas ao projeto, preservando todas as tarefas existentes e suas alterações
  const allTasks = [...project.tasks, ...newTasks];

  return {
    project: {
      ...project,
      tasks: allTasks,
      settings: {
        ...project.settings,
        jiraStatuses: jiraStatuses,
        jiraPriorities: jiraPriorities?.length ? jiraPriorities : project.settings?.jiraPriorities,
        jiraProjectKey: jiraProjectKey,
      },
    },
    newTasksCount: newTasks.length,
    updatedStatusCount,
  };
};

/**
 * Atualiza uma issue do Jira com os campos fornecidos
 */
export const updateJiraIssue = async (
  config: JiraConfig,
  issueKey: string,
  fieldsToUpdate: { [key: string]: any }
): Promise<void> => {
  const endpoint = `issue/${issueKey}`;

  const body = {
    fields: fieldsToUpdate,
  };

  await jiraApiCall<void>(config, endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

/**
 * Sincroniza uma tarefa local de volta para o Jira
 */
export const syncTaskToJira = async (config: JiraConfig, task: JiraTask): Promise<void> => {
  // Verificar se a tarefa tem uma chave do Jira (formato PROJ-123)
  const jiraKeyMatch = task.id.match(/^[A-Z]+-\d+$/);
  if (!jiraKeyMatch) {
    throw new Error(`Tarefa ${task.id} não é uma issue do Jira válida`);
  }

  const issueKey = task.id;
  const fieldsToUpdate: { [key: string]: any } = {};

  // Mapear campos de volta para o formato do Jira
  if (task.dueDate) {
    fieldsToUpdate.duedate = task.dueDate;
  }

  if (task.timeTracking) {
    fieldsToUpdate.timetracking = {};
    if (task.timeTracking.originalEstimate) {
      fieldsToUpdate.timetracking.originalEstimate = task.timeTracking.originalEstimate;
    }
    if (task.timeTracking.remainingEstimate) {
      fieldsToUpdate.timetracking.remainingEstimate = task.timeTracking.remainingEstimate;
    }
    if (task.timeTracking.timeSpent) {
      fieldsToUpdate.timetracking.timeSpent = task.timeTracking.timeSpent;
    }
  }

  if (task.environment !== undefined) {
    fieldsToUpdate.environment = task.environment;
  }

  // Componentes e Fix Versions precisam ser atualizados com IDs
  // Por enquanto, apenas atualizamos se já existirem IDs
  if (task.components && task.components.length > 0) {
    fieldsToUpdate.components = task.components.map(comp => ({ id: comp.id }));
  }

  if (task.fixVersions && task.fixVersions.length > 0) {
    fieldsToUpdate.fixVersions = task.fixVersions.map(version => ({ id: version.id }));
  }

  // Campos customizados
  // Filtrar campos que são apenas informativos e não podem ser atualizados
  const readOnlyFields = [
    'project', // Campo somente leitura
    'statusCategory', // Campo somente leitura
    'statuscategorychangedate', // Campo somente leitura
    'aggregatetimespent', // Campo calculado
    'progress', // Campo calculado - não pode ser definido
    'workratio', // Campo calculado - não pode ser definido
    'creator', // Campo somente leitura - definido na criação
    'votes', // Campo somente leitura - gerenciado pelo Jira
    'worklog', // Campo não suporta atualização direta
    'aggregateprogress', // Campo calculado - não pode ser definido
    'aggregatetimeestimate', // Campo calculado - não pode ser definido
    'timeoriginalestimate', // Campo somente leitura
    'timespent', // Campo somente leitura - gerenciado via worklog
    'timeestimate', // Campo somente leitura
    'resolution', // Campo somente leitura - gerenciado via transição
    'resolutiondate', // Campo somente leitura - gerenciado via transição
    'updated', // Campo somente leitura - timestamp automático
    'created', // Campo somente leitura - timestamp automático
  ];

  if (task.jiraCustomFields) {
    const filteredFields: string[] = [];
    Object.keys(task.jiraCustomFields).forEach(key => {
      // Pular campos somente leitura
      if (readOnlyFields.includes(key)) {
        filteredFields.push(key);
        logger.debug(`Campo somente leitura filtrado: ${key}`, 'jiraService');
        return;
      }

      const value = task.jiraCustomFields![key];

      // Não enviar valores null ou undefined
      if (value === null || value === undefined) {
        return;
      }

      // Para objetos complexos, tentar extrair apenas o ID se disponível
      // (campos customizados do Jira geralmente precisam de IDs)
      if (typeof value === 'object' && value !== null) {
        // Se o objeto tem um ID, usar apenas o ID
        if (value.id) {
          fieldsToUpdate[key] = { id: value.id };
        } else if (value.key) {
          // Para alguns campos, usar key
          fieldsToUpdate[key] = { key: value.key };
        } else {
          // Para outros objetos, tentar enviar como está (pode precisar de ajuste)
          fieldsToUpdate[key] = value;
        }
      } else {
        // Para valores primitivos, enviar diretamente
        fieldsToUpdate[key] = value;
      }
    });

    // Log resumido se algum campo foi filtrado
    if (filteredFields.length > 0) {
      logger.debug(
        `${filteredFields.length} campo(s) somente leitura filtrado(s) para ${issueKey}: ${filteredFields.join(', ')}`,
        'jiraService'
      );
    }
  }

  // Só atualizar se houver campos para atualizar
  if (Object.keys(fieldsToUpdate).length === 0) {
    throw new Error('Nenhum campo para atualizar');
  }

  await updateJiraIssue(config, issueKey, fieldsToUpdate);
};

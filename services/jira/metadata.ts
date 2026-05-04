import type {
  JiraConfig,
  JiraProject,
  JiraFieldInfo,
  JiraCustomFieldOption,
  GetJiraFieldsOptions,
} from './types';
import { jiraApiCall } from './api';
import { getJiraIssues } from './issues';
import { getCache, setCache, clearCache } from '../../utils/apiCache';
import { getJiraStatusColor } from '../../utils/jiraStatusColors';
import { logger } from '../../utils/logger';

interface JiraFieldContextPage {
  values?: Array<{ id: string }>;
  startAt?: number;
  maxResults?: number;
  total?: number;
  isLast?: boolean;
}

interface JiraFieldOptionPage {
  values?: Array<{ id: string; value: string; disabled?: boolean }>;
  startAt?: number;
  maxResults?: number;
  total?: number;
  isLast?: boolean;
}

export const getJiraProjects = async (
  config: JiraConfig,
  useCache: boolean = true
): Promise<JiraProject[]> => {
  const cacheKey = `jira_projects_${config.url}`;

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
      { timeout: 20000 }
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
      logger.info(
        `Encontrados ${(response as JiraProject[]).length} projetos (formato alternativo)`,
        'jiraService'
      );
      projects = response as JiraProject[];
    } else {
      logger.warn('Formato de resposta inesperado', 'jiraService', response);
      projects = [];
    }

    if (projects && projects.length > 0) {
      setCache(cacheKey, projects, 5 * 60 * 1000);
    }

    return projects;
  } catch (error) {
    logger.error('Erro em getJiraProjects', 'jiraService', error);
    clearCache(cacheKey);
    throw error;
  }
};

export const getJiraStatuses = async (
  config: JiraConfig,
  projectKey: string
): Promise<Array<{ name: string; color: string }>> => {
  const cacheKey = `jira_statuses_${config.url}_${projectKey}`;

  const cached = getCache<Array<{ name: string; color: string }>>(cacheKey);
  if (cached) {
    logger.debug('Usando status do Jira do cache', 'jiraService');
    return cached;
  }

  try {
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

    if (statuses.length === 0) {
      logger.warn('Não foi possível buscar status via API, extraindo das issues', 'jiraService');
      const issues = await getJiraIssues(config, projectKey, 100);
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

    if (statuses.length > 0) {
      setCache(cacheKey, statuses, 10 * 60 * 1000);
    }

    return statuses;
  } catch (error) {
    logger.error('Erro ao buscar status do Jira', 'jiraService', error);
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

export const getJiraFields = async (
  config: JiraConfig,
  options?: GetJiraFieldsOptions
): Promise<JiraFieldInfo[]> => {
  const skipCache = options?.skipCache === true;
  const cacheKey = `jira_fields_${config.url}`;
  if (!skipCache) {
    const cached = getCache<JiraFieldInfo[]>(cacheKey);
    if (cached?.length !== undefined) {
      logger.debug('Usando campos do Jira do cache', 'jiraService');
      return cached;
    }
  }
  try {
    const response = await jiraApiCall<
      | (JiraFieldInfo & { key?: string })[]
      | {
          values?: (JiraFieldInfo & { key?: string })[];
          startAt?: number;
          maxResults?: number;
          total?: number;
        }
    >(config, 'field', { timeout: 15000 });
    const list = Array.isArray(response)
      ? response
      : ((response as { values?: (JiraFieldInfo & { key?: string })[] }).values ?? []);
    const fields = list
      .filter((f): f is JiraFieldInfo & { key?: string } => !!(f?.id ?? f?.key) && !!f?.name)
      .map(f => ({ id: (f.id ?? f.key) as string, name: f.name, custom: f.custom }));
    if (fields.length > 0 && !skipCache) {
      setCache(cacheKey, fields, 15 * 60 * 1000);
    }
    return fields;
  } catch (error) {
    logger.error('Erro ao buscar campos do Jira', 'jiraService', error);
    return [];
  }
};

export const getJiraCustomFieldOptions = async (
  config: JiraConfig,
  fieldId: string
): Promise<JiraCustomFieldOption[]> => {
  const cacheKey = `jira_field_options_${config.url}_${fieldId}`;
  const cached = getCache<JiraCustomFieldOption[]>(cacheKey);
  if (cached?.length !== undefined) {
    logger.debug('Usando opções do custom field do cache', 'jiraService', { fieldId });
    return cached;
  }
  try {
    const contextEndpoint = `field/${fieldId}/context`;
    const contextResponse = await jiraApiCall<JiraFieldContextPage>(config, contextEndpoint, {
      timeout: 10000,
    });
    const contexts = contextResponse?.values ?? [];
    const contextId = contexts[0]?.id;
    if (!contextId) {
      logger.debug('Nenhum contexto encontrado para o campo', 'jiraService', { fieldId });
      return [];
    }
    const allOptions: JiraCustomFieldOption[] = [];
    let startAt = 0;
    const pageSize = 100;
    let isLast = false;
    while (!isLast) {
      const optionEndpoint = `field/${fieldId}/context/${contextId}/option?startAt=${startAt}&maxResults=${pageSize}`;
      const optionResponse = await jiraApiCall<JiraFieldOptionPage>(config, optionEndpoint, {
        timeout: 10000,
      });
      const values = optionResponse?.values ?? [];
      for (const v of values) {
        if (v?.id != null && v?.value != null) {
          allOptions.push({
            id: String(v.id),
            value: String(v.value),
            disabled: v.disabled,
          });
        }
      }
      isLast = optionResponse?.isLast ?? true;
      startAt += pageSize;
    }
    if (allOptions.length > 0) {
      setCache(cacheKey, allOptions, 10 * 60 * 1000);
    }
    return allOptions;
  } catch (error) {
    logger.warn(
      'Erro ao buscar opções do custom field (pode exigir Administer Jira)',
      'jiraService',
      {
        fieldId,
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return [];
  }
};

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

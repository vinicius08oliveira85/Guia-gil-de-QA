import type { JiraConfig, JiraQueue } from './types';
import { jiraServiceDeskApiCall } from './api';
import { getCache, setCache } from '../../utils/apiCache';
import { logger } from '../../utils/logger';

interface JiraServiceDesk {
  id: string;
  projectId: string;
  projectKey: string;
  projectName: string;
}

interface JiraServiceDeskListResponse {
  values?: JiraServiceDesk[];
}

interface JiraQueueApiItem {
  id: string | number;
  name: string;
  jql?: string;
}

interface JiraQueueListResponse {
  values?: JiraQueueApiItem[];
}

/**
 * Lista filas (queues) do Jira Service Management para um projeto.
 * Ex.: projeto "Sustentação" → fila "Solus".
 */
export async function getJiraQueuesForProject(
  config: JiraConfig,
  projectKey: string,
  useCache: boolean = true
): Promise<JiraQueue[]> {
  const normalizedKey = projectKey.trim().toUpperCase();
  if (!normalizedKey) return [];

  const cacheKey = `jira_queues_${config.url}_${normalizedKey}`;
  if (useCache) {
    const cached = getCache<JiraQueue[]>(cacheKey);
    if (cached) {
      logger.debug('Usando filas do Jira do cache', 'jiraService', { projectKey: normalizedKey });
      return cached;
    }
  }

  try {
    const desksResponse = await jiraServiceDeskApiCall<JiraServiceDeskListResponse>(
      config,
      'servicedesk',
      { timeout: 20000 }
    );
    const serviceDesk = (desksResponse.values ?? []).find(
      desk => desk.projectKey?.toUpperCase() === normalizedKey
    );
    if (!serviceDesk) {
      logger.warn('Nenhum Service Desk encontrado para o projeto', 'jiraService', {
        projectKey: normalizedKey,
      });
      return [];
    }

    const queuesResponse = await jiraServiceDeskApiCall<JiraQueueListResponse>(
      config,
      `servicedesk/${serviceDesk.id}/queue`,
      { timeout: 20000 }
    );

    const queues = (queuesResponse.values ?? [])
      .filter((queue): queue is JiraQueueApiItem & { jql: string } => !!queue?.name && !!queue.jql)
      .map(queue => ({
        id: String(queue.id),
        name: queue.name,
        jql: queue.jql,
        serviceDeskId: String(serviceDesk.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    if (queues.length > 0) {
      setCache(cacheKey, queues, 5 * 60 * 1000);
    }

    return queues;
  } catch (error) {
    logger.error('Erro ao buscar filas do Jira Service Management', 'jiraService', error);
    throw error;
  }
}

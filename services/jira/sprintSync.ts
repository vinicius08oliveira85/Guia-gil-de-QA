import type { JiraSprint } from '../../types';
import type { JiraConfig, JiraFieldInfo } from './types';
import { jiraAgileApiCall } from './api';
import { getJiraFields } from './metadata';
import { getCache, setCache } from '../../utils/apiCache';
import { parseSprintsFromIssueFields } from '../../utils/jiraSprintFields';
import { logger } from '../../utils/logger';

export interface JiraSprintSyncContext {
  sprintFieldIds: string[];
  sprintCatalog: ReadonlyMap<number, JiraSprint>;
}

const SPRINT_FIELD_NAME_RE = /^sprint$/i;

function mapAgileSprintState(raw: string | undefined): JiraSprint['state'] {
  const s = (raw ?? '').toLowerCase();
  if (s === 'active') return 'active';
  if (s === 'future') return 'future';
  return 'closed';
}

function agileSprintToJiraSprint(raw: {
  id: number;
  name: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
}): JiraSprint {
  return {
    id: raw.id,
    name: raw.name,
    state: mapAgileSprintState(raw.state),
    startDate: raw.startDate,
    endDate: raw.endDate,
    completeDate: raw.completeDate,
    goal: raw.goal,
  };
}

/** Descobre IDs do custom field Sprint na instância (ex.: customfield_10020). */
export async function getSprintFieldIds(config: JiraConfig): Promise<string[]> {
  const cacheKey = `jira_sprint_field_ids_${config.url}`;
  const cached = getCache<string[]>(cacheKey);
  if (cached?.length) return cached;

  try {
    const fields = await getJiraFields(config);
    const ids = fields
      .filter(f => SPRINT_FIELD_NAME_RE.test(f.name.trim()))
      .map(f => f.id)
      .filter((id): id is string => !!id);

    const unique = [...new Set([...ids, 'customfield_10020', 'customfield_10021'])];
    setCache(cacheKey, unique, 15 * 60 * 1000);
    logger.info(`Campos Sprint Jira: ${unique.join(', ') || 'nenhum (usando fallbacks)'}`, 'jiraService');
    return unique;
  } catch (error) {
    logger.warn('Não foi possível listar campos Sprint; usando fallbacks.', 'jiraService', error);
    return ['customfield_10020', 'customfield_10021'];
  }
}

/** Paginação genérica para Agile API (que retorna {values, startAt, maxResults, total}). */
async function paginateAgileApi<T>(
  config: JiraConfig,
  baseEndpoint: string,
  options?: { timeout?: number; quietHttpErrors?: boolean }
): Promise<T[]> {
  const all: T[] = [];
  let startAt = 0;
  const maxResults = 100;
  for (;;) {
    const sep = baseEndpoint.includes('?') ? '&' : '?';
    const response = await jiraAgileApiCall<{
      values?: T[];
      startAt?: number;
      maxResults?: number;
      total?: number;
    }>(config, `${baseEndpoint}${sep}startAt=${startAt}&maxResults=${maxResults}`, {
      timeout: options?.timeout ?? 30000,
      quietHttpErrors: options?.quietHttpErrors,
    });
    all.push(...(response.values ?? []));
    if (typeof response.total !== 'number' || typeof response.maxResults !== 'number') break;
    if (response.total === 0) break;
    const fetched = response.startAt ?? startAt;
    if (fetched + response.maxResults >= response.total) break;
    startAt = fetched + response.maxResults;
  }
  return all;
}

/** Catálogo id → sprint via API Agile (boards do projeto). */
export async function fetchProjectSprintCatalog(
  config: JiraConfig,
  projectKey: string
): Promise<Map<number, JiraSprint>> {
  const cacheKey = `jira_sprint_catalog_${config.url}_${projectKey}`;
  const cached = getCache<Record<string, JiraSprint>>(cacheKey);
  if (cached) {
    return new Map(Object.entries(cached).map(([k, v]) => [Number(k), v]));
  }

  const catalog = new Map<number, JiraSprint>();

  try {
    const boards = await paginateAgileApi<{ id: number }>(
      config,
      `board?projectKeyOrId=${encodeURIComponent(projectKey)}`,
      { timeout: 30000, quietHttpErrors: true }
    );
    if (!boards.length) {
      logger.warn(`Nenhum board Scrum/Kanban para ${projectKey}`, 'jiraService');
      return catalog;
    }

    for (const board of boards) {
      try {
        const sprints = await paginateAgileApi<{
          id: number;
          name: string;
          state?: string;
          startDate?: string;
          endDate?: string;
          completeDate?: string;
          goal?: string;
        }>(
          config,
          `board/${board.id}/sprint?state=active,future,closed`,
          { timeout: 30000, quietHttpErrors: true }
        );
        for (const s of sprints) {
          if (s?.id != null && s?.name) {
            catalog.set(s.id, agileSprintToJiraSprint(s));
          }
        }
      } catch (boardErr) {
        logger.warn(`Erro ao listar sprints do board ${board.id}`, 'jiraService', boardErr);
      }
    }

    if (catalog.size > 0) {
      const plain: Record<string, JiraSprint> = {};
      catalog.forEach((v, k) => {
        plain[String(k)] = v;
      });
      setCache(cacheKey, plain, 10 * 60 * 1000);
      logger.info(`${catalog.size} sprint(s) no catálogo de ${projectKey}`, 'jiraService');
    }
  } catch (error) {
    logger.warn('API Agile indisponível; sprints só via custom fields', 'jiraService', error);
  }

  return catalog;
}

export async function buildJiraSprintSyncContext(
  config: JiraConfig,
  projectKey: string
): Promise<JiraSprintSyncContext> {
  const [sprintFieldIds, sprintCatalog] = await Promise.all([
    getSprintFieldIds(config),
    fetchProjectSprintCatalog(config, projectKey),
  ]);
  return { sprintFieldIds, sprintCatalog };
}

/** Fallback: issue na API Agile costuma trazer o campo Sprint preenchido. */
export async function fetchIssueSprintsFromAgileApi(
  config: JiraConfig,
  issueKey: string,
  sprintFieldIds: string[],
  sprintCatalog: ReadonlyMap<number, JiraSprint>
): Promise<JiraSprint[]> {
  try {
    const issue = await jiraAgileApiCall<{ fields?: Record<string, unknown> }>(
      config,
      `issue/${encodeURIComponent(issueKey)}`,
      { timeout: 30000, quietHttpErrors: true }
    );
    return parseSprintsFromIssueFields(issue.fields, { sprintFieldIds, sprintCatalog });
  } catch {
    return [];
  }
}

export function isSprintFieldMeta(field: JiraFieldInfo): boolean {
  return SPRINT_FIELD_NAME_RE.test(field.name.trim());
}

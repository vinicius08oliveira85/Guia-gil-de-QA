import type { JiraSprint } from '../../types';
import type { JiraConfig, JiraFieldInfo } from './types';
import { jiraApiCall, jiraAgileApiCall } from './api';
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

  const fields = await getJiraFields(config);
  const ids = fields
    .filter(f => SPRINT_FIELD_NAME_RE.test(f.name.trim()))
    .map(f => f.id)
    .filter((id): id is string => !!id);

  const unique = [...new Set([...ids, 'customfield_10020', 'customfield_10021'])];
  setCache(cacheKey, unique, 15 * 60 * 1000);
  logger.info(`Campos Sprint Jira: ${unique.join(', ') || 'nenhum (usando fallbacks)'}`, 'jiraService');
  return unique;
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
    const boardsResponse = await jiraAgileApiCall<{ values?: Array<{ id: number }> }>(
      config,
      `board?projectKeyOrId=${encodeURIComponent(projectKey)}`,
      { timeout: 30000 }
    );
    const boards = boardsResponse.values ?? [];
    if (!boards.length) {
      logger.warn(`Nenhum board Scrum/Kanban para ${projectKey}`, 'jiraService');
      return catalog;
    }

    for (const board of boards) {
      try {
        const sprintResponse = await jiraAgileApiCall<{
          values?: Array<{
            id: number;
            name: string;
            state?: string;
            startDate?: string;
            endDate?: string;
            completeDate?: string;
            goal?: string;
          }>;
        }>(
          config,
          `board/${board.id}/sprint?state=active,future,closed&maxResults=100`,
          { timeout: 30000 }
        );
        for (const s of sprintResponse.values ?? []) {
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
      { timeout: 30000 }
    );
    return parseSprintsFromIssueFields(issue.fields, { sprintFieldIds, sprintCatalog });
  } catch {
    return [];
  }
}

export function isSprintFieldMeta(field: JiraFieldInfo): boolean {
  return SPRINT_FIELD_NAME_RE.test(field.name.trim());
}

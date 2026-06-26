import type { JiraTask, JiraTaskSla } from '../../types';
import { logger } from '../../utils/logger';
import type { JiraConfig } from './types';
import { jiraServiceDeskApiCall } from './api';

interface JiraSlaTimeField {
  iso8601?: string;
  epochMillis?: number;
  friendly?: string;
}

interface JiraSlaCycle {
  startTime?: JiraSlaTimeField;
  stopTime?: JiraSlaTimeField;
  breachTime?: JiraSlaTimeField;
  breached?: boolean;
  paused?: boolean;
  goalDuration?: { millis?: number; friendly?: string };
  remainingTime?: { millis?: number; friendly?: string };
}

interface JiraSlaApiItem {
  id?: number;
  name: string;
  completedCycles?: JiraSlaCycle[];
  ongoingCycle?: JiraSlaCycle;
}

interface JiraSlaListResponse {
  values?: JiraSlaApiItem[];
}

function parseDeadline(cycle: JiraSlaCycle): string | undefined {
  if (cycle.breachTime?.iso8601) return cycle.breachTime.iso8601;
  const start = cycle.startTime?.epochMillis;
  const goal = cycle.goalDuration?.millis;
  if (start !== undefined && goal !== undefined) {
    return new Date(start + goal).toISOString();
  }
  return undefined;
}

function formatGoalFriendly(friendly?: string): string | undefined {
  if (!friendly?.trim()) return undefined;
  return `em até ${friendly.trim()}`;
}

/**
 * Normaliza um item de SLA retornado pela API do Jira Service Management.
 */
export function normalizeJiraSlaApiItem(item: JiraSlaApiItem): JiraTaskSla {
  const ongoing = item.ongoingCycle;
  if (ongoing) {
    return {
      name: item.name,
      phase: ongoing.paused ? 'ongoing' : 'ongoing',
      breached: ongoing.breached === true,
      deadlineAt: parseDeadline(ongoing),
      goalFriendly: formatGoalFriendly(ongoing.goalDuration?.friendly),
    };
  }

  const cycles = item.completedCycles ?? [];
  const last = cycles[cycles.length - 1];
  if (last) {
    return {
      name: item.name,
      phase: 'completed',
      breached: last.breached === true,
      deadlineAt: last.breachTime?.iso8601,
      completedAt: last.stopTime?.iso8601,
      goalFriendly: formatGoalFriendly(last.goalDuration?.friendly),
    };
  }

  return {
    name: item.name,
    phase: 'none',
    breached: false,
  };
}

/**
 * Busca SLAs de uma issue via Jira Service Management (`/request/{key}/sla`).
 */
export async function getJiraIssueSlas(
  config: JiraConfig,
  issueKey: string
): Promise<JiraTaskSla[]> {
  const key = issueKey.trim().toUpperCase();
  if (!key) return [];

  try {
    const response = await jiraServiceDeskApiCall<JiraSlaListResponse>(
      config,
      `request/${encodeURIComponent(key)}/sla`,
      { timeout: 20000 }
    );
    return (response.values ?? []).map(normalizeJiraSlaApiItem);
  } catch (error) {
    logger.debug('SLA indisponível para a issue (pode não ser request JSM)', 'jiraSla', {
      issueKey: key,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
      completed += 1;
      onProgress?.(completed, items.length);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export interface EnrichTasksWithJiraSlasOptions {
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Anexa SLAs do Jira Service Management às tarefas importadas das filas.
 */
export async function enrichTasksWithJiraSlas(
  config: JiraConfig,
  tasks: JiraTask[],
  options: EnrichTasksWithJiraSlasOptions = {}
): Promise<JiraTask[]> {
  if (tasks.length === 0) return tasks;

  const concurrency = options.concurrency ?? 5;
  const enriched = await mapWithConcurrency(
    tasks,
    concurrency,
    async task => {
      const jiraSlas = await getJiraIssueSlas(config, task.id);
      return { ...task, jiraSlas };
    },
    options.onProgress
  );

  const withSlas = enriched.filter(t => t.jiraSlas && t.jiraSlas.length > 0).length;
  logger.info(`SLAs Jira carregados para ${withSlas}/${tasks.length} tarefa(s)`, 'jiraSla');

  return enriched;
}

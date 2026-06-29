import type { JiraTask } from '../../types';
import { resolveQueueIdsFromFilasSelection } from '../../utils/jiraQueueTree';
import { normalizeTasksParentIdsAcyclic } from '../../utils/taskParentCycle';
import { logger } from '../../utils/logger';
import {
  dispatchTaskTrackingRestored,
  readFilasImportSelection,
  readTaskTrackingSnapshot,
  writeTaskTrackingSnapshot,
} from '../taskTrackingStorage';
import { enrichTasksWithJiraSlas } from './sla';
import { enrichTasksWithJsmSummary } from './jsmRequest';
import { importFilasRelatedIssues } from './filasRelatedIssues';
import { jiraIssueToTask } from './issueToTask';
import { buildJiraSprintSyncContext } from './sprintSync';
import {
  getJiraConfig,
  getJiraIssuesByJql,
  getJiraIssuesByKeysBulk,
  getJiraQueuesForProject,
  type JiraConfig,
  type JiraQueue,
} from '../jiraService';

export interface FilasQueueSyncResult {
  tasks: JiraTask[];
  queueCount: number;
}

function mergeFilasTasks(existing: JiraTask[], imported: JiraTask[]): JiraTask[] {
  const map = new Map(existing.map(task => [task.id, task]));
  imported.forEach(task => map.set(task.id, task));
  return normalizeTasksParentIdsAcyclic(Array.from(map.values()));
}

async function enrichFilasTasks(
  config: JiraConfig,
  imported: JiraTask[],
  onProgress?: (current: number, total?: number) => void
): Promise<JiraTask[]> {
  const withSlas = await enrichTasksWithJiraSlas(config, imported, {
    onProgress: (done, total) => onProgress?.(done, total),
  });
  return enrichTasksWithJsmSummary(config, withSlas, {
    onProgress: (done, total) => onProgress?.(done, total),
  });
}

async function loadQueuesForProjects(
  config: JiraConfig,
  projectKeys: string[]
): Promise<JiraQueue[]> {
  const results = await Promise.all(
    projectKeys.map(projectKey => getJiraQueuesForProject(config, projectKey))
  );
  const uniqueById = new Map<string, JiraQueue>();
  for (const queue of results.flat()) {
    uniqueById.set(queue.id, queue);
  }
  return Array.from(uniqueById.values());
}

/**
 * Sincroniza as Filas (Jira) com base na seleção persistida (projeto, fila e status).
 * Atualiza o snapshot local e notifica a UI via `TASK_TRACKING_RESTORED_EVENT`.
 */
export async function syncFilasQueuesFromJira(
  onProgress?: (current: number, total?: number) => void
): Promise<FilasQueueSyncResult | null> {
  const config = getJiraConfig();
  if (!config) return null;

  const selection = readFilasImportSelection();
  const projectKeys = selection?.projectKeys ?? [];
  const queueCategories = selection?.queueCategories ?? [];
  const queueStatuses = selection?.queueStatuses ?? [];

  if (projectKeys.length === 0 || queueCategories.length === 0 || queueStatuses.length === 0) {
    return null;
  }

  const snapshot = readTaskTrackingSnapshot();
  const existingTasks = snapshot.tasks;

  const jiraQueues = await loadQueuesForProjects(config, projectKeys);
  const resolvedQueueIds = resolveQueueIdsFromFilasSelection(
    jiraQueues,
    queueCategories,
    queueStatuses
  );
  const selectedQueues = jiraQueues.filter(queue => resolvedQueueIds.includes(queue.id));

  if (selectedQueues.length === 0) {
    logger.debug('Auto-sync Filas: nenhuma fila resolvida para a seleção atual', 'filasQueueSync');
    return null;
  }

  const sprintCtxByProject = new Map<
    string,
    Awaited<ReturnType<typeof buildJiraSprintSyncContext>>
  >();
  for (const projectKey of projectKeys) {
    sprintCtxByProject.set(projectKey, await buildJiraSprintSyncContext(config, projectKey));
  }
  const primarySprintCtx = sprintCtxByProject.get(projectKeys[0]) ?? undefined;

  const issueByKey = new Map<string, Awaited<ReturnType<typeof getJiraIssuesByJql>>[number]>();
  let processedQueues = 0;

  for (const queue of selectedQueues) {
    const issues = await getJiraIssuesByJql(
      config,
      queue.jql,
      undefined,
      (current, total) => {
        const base = processedQueues;
        onProgress?.(base + current, selectedQueues.length * (total ?? (current || 1)));
      },
      { discoveryOnly: true }
    );
    for (const issue of issues) {
      if (issue.key) issueByKey.set(issue.key, issue);
    }
    processedQueues += 1;
    onProgress?.(processedQueues, selectedQueues.length);
  }

  // O endpoint `search/jql` tem consistência eventual e pode devolver campos
  // desatualizados (ex.: Responsável recém-alterado). Relê o estado atual das
  // issues descobertas via bulkfetch (leitura forte) para refletir as escritas.
  const discoveredKeys = Array.from(issueByKey.keys());
  const freshIssues = await getJiraIssuesByKeysBulk(config, discoveredKeys, (current, total) =>
    onProgress?.(current, total)
  );
  for (const issue of freshIssues) {
    if (issue.key) issueByKey.set(issue.key, issue);
  }

  const issues = Array.from(issueByKey.values());
  const converted = await Promise.all(
    issues.map(issue => {
      const issueProjectKey = issue.key?.split('-')[0] ?? projectKeys[0];
      return jiraIssueToTask(config, issue, {
        jiraProjectKey: issueProjectKey,
        existingTask: existingTasks.find(task => task.id === issue.key),
        sprintCtx: sprintCtxByProject.get(issueProjectKey),
      });
    })
  );

  const withRelated = await importFilasRelatedIssues(config, converted, {
    jiraProjectKey: projectKeys[0],
    sprintCtx: primarySprintCtx,
    existingTasks,
    onProgress: (done, total) => onProgress?.(done, total),
  });

  const enriched = await enrichFilasTasks(config, withRelated, onProgress);
  const mergedTasks = mergeFilasTasks(existingTasks, enriched);

  writeTaskTrackingSnapshot({
    ...snapshot,
    selectedProjectKey: projectKeys[0] ?? snapshot.selectedProjectKey,
    tasks: mergedTasks,
  });
  dispatchTaskTrackingRestored();

  return { tasks: mergedTasks, queueCount: selectedQueues.length };
}

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
import { resolveImportedProjectKeys } from '../../utils/taskTrackingProject';
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

/** Chave do projeto Jira a partir do ID da issue (ex.: SUS-12 → SUS). */
function jiraProjectKeyOf(taskId: string): string | null {
  const match = taskId.trim().toUpperCase().match(/^([A-Z][A-Z0-9]+)-\d+$/);
  return match?.[1] ?? null;
}

/**
 * IDs que devem permanecer na fila: os membros atuais (chaves descobertas via
 * JQL) e suas relacionadas/subtarefas alcançáveis pela cadeia de `parentId`.
 * Serve para podar itens que saíram da fila (ex.: concluídos) sem remover
 * relacionadas de tarefas que continuam ativas.
 */
function collectQueueReachableIds(tasks: JiraTask[], queueKeys: Set<string>): Set<string> {
  const byId = new Map(tasks.map(task => [task.id, task]));
  const reachable = new Set<string>();

  for (const task of tasks) {
    const path: string[] = [];
    const guard = new Set<string>();
    let current: JiraTask | undefined = task;

    while (current && !guard.has(current.id)) {
      guard.add(current.id);
      path.push(current.id);
      if (queueKeys.has(current.id) || reachable.has(current.id)) {
        path.forEach(id => reachable.add(id));
        break;
      }
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }

  return reachable;
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

  const existingByKey = new Map(existingTasks.map(task => [task.id, task]));
  const discoveredKeySet = new Set(discoveredKeys);

  const issues = Array.from(issueByKey.values());
  const converted = await Promise.all(
    issues.map(issue => {
      const issueProjectKey = issue.key?.split('-')[0] ?? projectKeys[0];
      return jiraIssueToTask(config, issue, {
        jiraProjectKey: issueProjectKey,
        existingTask: issue.key ? existingByKey.get(issue.key) : undefined,
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

  // Composição atual da fila: membros do JQL + relacionadas/subtarefas ligadas a
  // eles. Apenas estas são (re)enriquecidas com SLA/JSM.
  const scope = new Set(projectKeys);
  const reachableIds = collectQueueReachableIds(withRelated, discoveredKeySet);
  const syncedInScope = withRelated.filter(task => reachableIds.has(task.id));
  const enriched = await enrichFilasTasks(config, syncedInScope, onProgress);

  // Preserva tarefas de projetos fora do escopo sincronizado (ou tarefas locais)
  // e REMOVE as do escopo que não fazem mais parte da fila (ex.: concluídas que
  // saíram do filtro e não são relacionadas de tarefas ativas).
  const preservedOutOfScope = existingTasks.filter(task => {
    if (reachableIds.has(task.id)) return false;
    const projectKey = jiraProjectKeyOf(task.id);
    return projectKey === null || !scope.has(projectKey);
  });

  const mergedTasks = normalizeTasksParentIdsAcyclic([...preservedOutOfScope, ...enriched]);

  writeTaskTrackingSnapshot({
    ...snapshot,
    selectedProjectKey: projectKeys[0] ?? snapshot.selectedProjectKey,
    tasks: mergedTasks,
    importedProjectKeys: resolveImportedProjectKeys(mergedTasks, projectKeys),
  });
  dispatchTaskTrackingRestored();

  return { tasks: mergedTasks, queueCount: selectedQueues.length };
}

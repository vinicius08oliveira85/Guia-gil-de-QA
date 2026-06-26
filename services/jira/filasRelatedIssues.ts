import type { JiraTask } from '../../types';
import type { JiraConfig } from './types';
import { getJiraIssueByKey } from './issues';
import { jiraIssueToTask } from './issueToTask';
import type { JiraSprintSyncContext } from './sprintSync';
import { isValidJiraKey } from '../../utils/jiraFieldMapper';
import { parentLinkCreatesCycle } from '../../utils/taskParentCycle';
import { logger } from '../../utils/logger';

const DEFAULT_CONCURRENCY = 4;
const DEFAULT_MAX_DEPTH = 2;

export interface ImportFilasRelatedIssuesOptions {
  jiraProjectKey?: string;
  sprintCtx?: JiraSprintSyncContext;
  /** Tarefas já presentes na fila local (mescladas antes de resolver vínculos). */
  existingTasks?: JiraTask[];
  /** IDs importados diretamente (fila ou ID); não são re-parentados por issue link. */
  primaryTaskIds?: Set<string>;
  concurrency?: number;
  /** Profundidade de busca recursiva de relacionamentos (padrão: 2). */
  maxDepth?: number;
  onProgress?: (done: number, total: number) => void;
}

interface RelatedFetchTarget {
  relatedKey: string;
  parentTaskId: string;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void
): Promise<R[]> {
  if (items.length === 0) return [];
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

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

function collectRelatedFetchTargets(
  sourceTasks: JiraTask[],
  knownIds: Set<string>
): RelatedFetchTarget[] {
  const pending: RelatedFetchTarget[] = [];
  const seen = new Set<string>();

  for (const task of sourceTasks) {
    if (!task.issueLinks?.length) continue;
    for (const link of task.issueLinks) {
      const relatedKey = link.relatedKey?.trim().toUpperCase();
      if (!relatedKey || !isValidJiraKey(relatedKey)) continue;

      const dedupe = `${task.id}->${relatedKey}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);

      if (!knownIds.has(relatedKey)) {
        pending.push({ relatedKey, parentTaskId: task.id });
      }
    }
  }

  return pending;
}

function applyParentLinkFromIssueRelation(
  relatedTask: JiraTask,
  parentTaskId: string,
  taskById: Map<string, JiraTask>,
  primaryTaskIds: Set<string>
): JiraTask {
  if (primaryTaskIds.has(relatedTask.id)) return relatedTask;

  const jiraParentId = relatedTask.parentId?.trim();
  if (jiraParentId && taskById.has(jiraParentId)) {
    return relatedTask;
  }

  const flat = new Map(
    Array.from(taskById.values()).map(t => [t.id, { id: t.id, parentId: t.parentId }])
  );
  if (parentLinkCreatesCycle(flat, relatedTask.id, parentTaskId)) {
    return relatedTask;
  }

  return { ...relatedTask, parentId: parentTaskId };
}

function linkExistingRelatedTasks(
  sourceTasks: JiraTask[],
  taskById: Map<string, JiraTask>,
  primaryTaskIds: Set<string>
): void {
  for (const task of sourceTasks) {
    if (!task.issueLinks?.length) continue;
    for (const link of task.issueLinks) {
      const relatedKey = link.relatedKey?.trim().toUpperCase();
      if (!relatedKey || !taskById.has(relatedKey)) continue;

      const related = taskById.get(relatedKey)!;
      const linked = applyParentLinkFromIssueRelation(
        related,
        task.id,
        taskById,
        primaryTaskIds
      );
      if (linked.parentId !== related.parentId) {
        taskById.set(relatedKey, linked);
      }
    }
  }
}

/**
 * Importa issues relacionadas (issue links) ausentes na fila e vincula como filhas
 * da tarefa principal que referencia o relacionamento.
 */
export async function importFilasRelatedIssues(
  config: JiraConfig,
  importedTasks: JiraTask[],
  options: ImportFilasRelatedIssuesOptions = {}
): Promise<JiraTask[]> {
  if (importedTasks.length === 0) return importedTasks;

  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const primaryTaskIds =
    options.primaryTaskIds ?? new Set(importedTasks.map(task => task.id));

  const taskById = new Map<string, JiraTask>();
  for (const task of options.existingTasks ?? []) {
    taskById.set(task.id, task);
  }
  for (const task of importedTasks) {
    taskById.set(task.id, task);
  }

  linkExistingRelatedTasks(importedTasks, taskById, primaryTaskIds);

  let frontier = [...importedTasks];
  let depth = 0;

  while (depth < maxDepth && frontier.length > 0) {
    const knownIds = new Set(taskById.keys());
    const targets = collectRelatedFetchTargets(frontier, knownIds);
    if (targets.length === 0) break;

    const fetched = await mapWithConcurrency(
      targets,
      concurrency,
      async target => {
        try {
          const issue = await getJiraIssueByKey(config, target.relatedKey);
          const existing = taskById.get(target.relatedKey);
          const task = await jiraIssueToTask(config, issue, {
            jiraProjectKey: options.jiraProjectKey ?? target.relatedKey.split('-')[0],
            existingTask: existing,
            sprintCtx: options.sprintCtx,
          });
          return applyParentLinkFromIssueRelation(
            task,
            target.parentTaskId,
            taskById,
            primaryTaskIds
          );
        } catch (error) {
          logger.warn('Falha ao importar tarefa relacionada do Jira.', 'filasRelatedIssues', {
            relatedKey: target.relatedKey,
            parentTaskId: target.parentTaskId,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      },
      options.onProgress
    );

    const added: JiraTask[] = [];
    for (const task of fetched) {
      if (!task) continue;
      taskById.set(task.id, task);
      added.push(task);
    }

    if (added.length === 0) break;

    logger.info(
      `Importadas ${added.length} tarefa(s) relacionada(s) (nível ${depth + 1}).`,
      'filasRelatedIssues'
    );

    frontier = added;
    depth += 1;
  }

  const importedIds = new Set(importedTasks.map(task => task.id));
  const result = [...importedTasks];
  for (const task of taskById.values()) {
    if (!importedIds.has(task.id)) {
      result.push(task);
    }
  }

  return result.map(task => taskById.get(task.id) ?? task);
}

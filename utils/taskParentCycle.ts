import type { JiraTask, Project } from '../types';
import { logger } from './logger';

/** Nó mínimo só com id + parentId (grafo plano antes de montar children). */
export type TaskFlatNode = { id: string; parentId?: string | null };

/**
 * Indica se ligar `taskId` como filho direto de `proposedParentId` fecharia um ciclo
 * ao seguir `parentId` a partir do pai (inclui auto-pai e ciclos A↔B nos dados).
 */
export function parentLinkCreatesCycle(
  taskById: Map<string, TaskFlatNode>,
  taskId: string,
  proposedParentId: string
): boolean {
  const visited = new Set<string>();
  let cur: string | null | undefined = proposedParentId;
  while (cur && taskById.has(cur)) {
    if (cur === taskId) return true;
    if (visited.has(cur)) return true;
    visited.add(cur);
    const node: TaskFlatNode = taskById.get(cur)!;
    const next: string | undefined = node.parentId?.trim();
    cur = next ? next : null;
  }
  return false;
}

/**
 * Remove `parentId` quando, no conjunto completo, criaria ciclo na hierarquia.
 * Usar após import/sync Jira para persistir grafo acíclico e alinhar com a UI.
 */
export function normalizeTasksParentIdsAcyclic(
  tasks: JiraTask[],
  options?: { silent?: boolean }
): JiraTask[] {
  const flat: TaskFlatNode[] = tasks.map(t => ({ id: t.id, parentId: t.parentId }));
  const map = new Map(flat.map(n => [n.id, n]));
  let cleared = 0;
  const result = tasks.map(t => {
    const pid = t.parentId?.trim();
    if (!pid || !map.has(pid)) return t;
    if (parentLinkCreatesCycle(map, t.id, pid)) {
      cleared++;
      return { ...t, parentId: undefined };
    }
    return t;
  });
  if (cleared === 0) return tasks;
  if (!options?.silent) {
    logger.warn(
      'parentId removido em tarefa(s) por ciclo ou inconsistência na hierarquia (dados normalizados).',
      'taskParentCycle',
      { clearedCount: cleared, totalTasks: tasks.length }
    );
  }
  return result;
}

/** Garante `project.tasks` acíclico sem clonar o projeto quando já está ok. */
export function withAcyclicTaskParents(project: Project, options?: { silent?: boolean }): Project {
  if (!project.tasks?.length) return project;
  const normalized = normalizeTasksParentIdsAcyclic(project.tasks, options);
  if (normalized === project.tasks) return project;
  return { ...project, tasks: normalized };
}

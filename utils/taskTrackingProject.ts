import type { JiraTask } from '../types';
import type {
  JiraStatusPaletteEntry,
  TaskTrackingProjectFilter,
} from '../services/taskTrackingStorage';
import { getJiraProjectKeyFromTaskId } from './landingTaskFollowUp';

/** Valor do filtro que inclui todos os projetos importados. */
export const TASK_TRACKING_ALL_PROJECTS = 'all' as const;

export type { TaskTrackingProjectFilter };

export function isAllProjectsFilter(filter: TaskTrackingProjectFilter): boolean {
  return filter === TASK_TRACKING_ALL_PROJECTS;
}

/** Extrai a chave do projeto Jira a partir do ID da issue. */
export function getTaskProjectKey(task: JiraTask): string {
  return getJiraProjectKeyFromTaskId(task.id);
}

/** Filtra tarefas pelo projeto ativo (`all` retorna todas). */
export function filterTasksByProjectFilter(
  tasks: JiraTask[],
  filter: TaskTrackingProjectFilter
): JiraTask[] {
  if (isAllProjectsFilter(filter)) return tasks;
  return tasks.filter(task => getTaskProjectKey(task) === filter);
}

/** Agrupa tarefas por chave de projeto Jira. */
export function groupTasksByProject(tasks: JiraTask[]): Map<string, JiraTask[]> {
  const map = new Map<string, JiraTask[]>();
  for (const task of tasks) {
    const key = getTaskProjectKey(task);
    const list = map.get(key);
    if (list) list.push(task);
    else map.set(key, [task]);
  }
  return map;
}

/** Coleta chaves de projeto únicas a partir das tarefas, ordenadas pt-BR. */
export function collectProjectKeysFromTasks(tasks: JiraTask[]): string[] {
  const keys = new Set<string>();
  for (const task of tasks) {
    keys.add(getTaskProjectKey(task));
  }
  return Array.from(keys).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Mescla chaves de projetos importados: seleção de filas + tarefas persistidas.
 */
export function resolveImportedProjectKeys(
  tasks: JiraTask[],
  selectionProjectKeys: string[] = []
): string[] {
  const keys = new Set<string>();
  for (const key of selectionProjectKeys) {
    if (key.trim()) keys.add(key.trim());
  }
  for (const key of collectProjectKeysFromTasks(tasks)) {
    keys.add(key);
  }
  return Array.from(keys).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** Conta tarefas por projeto. */
export function countTasksByProject(tasks: JiraTask[], projectKey: string): number {
  return tasks.filter(task => getTaskProjectKey(task) === projectKey).length;
}

/** Paleta de status para um projeto específico. */
export function getJiraStatusesForProject(
  jiraStatusesByProject: Record<string, JiraStatusPaletteEntry[]>,
  projectKey: string,
  fallback: JiraStatusPaletteEntry[] = []
): JiraStatusPaletteEntry[] {
  return jiraStatusesByProject[projectKey] ?? fallback;
}

/** Mescla paletas de vários projetos (primeira ocorrência de cada nome prevalece). */
export function mergeJiraStatusPalettes(
  palettes: JiraStatusPaletteEntry[][]
): JiraStatusPaletteEntry[] {
  const seen = new Set<string>();
  const merged: JiraStatusPaletteEntry[] = [];
  for (const palette of palettes) {
    for (const entry of palette) {
      const normalized = entry.name.trim().toLowerCase();
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      merged.push(entry);
    }
  }
  return merged;
}

/** Resolve paleta aplicável ao filtro ativo. */
export function resolvePaletteForProjectFilter(
  jiraStatusesByProject: Record<string, JiraStatusPaletteEntry[]>,
  filter: TaskTrackingProjectFilter,
  legacyFlat: JiraStatusPaletteEntry[] = []
): JiraStatusPaletteEntry[] {
  if (!isAllProjectsFilter(filter)) {
    return getJiraStatusesForProject(jiraStatusesByProject, filter, legacyFlat);
  }
  const palettes = Object.values(jiraStatusesByProject);
  if (palettes.length === 0) return legacyFlat;
  return mergeJiraStatusPalettes(palettes);
}

/** Paleta de status para uma tarefa específica. */
export function resolvePaletteForTask(
  task: JiraTask,
  jiraStatusesByProject: Record<string, JiraStatusPaletteEntry[]>,
  legacyFlat: JiraStatusPaletteEntry[] = []
): JiraStatusPaletteEntry[] {
  const projectKey = getTaskProjectKey(task);
  return getJiraStatusesForProject(jiraStatusesByProject, projectKey, legacyFlat);
}

/** Valida filtro contra projetos disponíveis; retorna `all` se inválido. */
export function normalizeActiveProjectFilter(
  filter: TaskTrackingProjectFilter | undefined,
  availableKeys: string[]
): TaskTrackingProjectFilter {
  if (!filter || isAllProjectsFilter(filter)) return TASK_TRACKING_ALL_PROJECTS;
  if (availableKeys.includes(filter)) return filter;
  return TASK_TRACKING_ALL_PROJECTS;
}

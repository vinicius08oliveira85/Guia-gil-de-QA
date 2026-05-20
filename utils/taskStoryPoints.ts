import type { JiraTask } from '../types';

/** Chaves conhecidas de Story Points no Jira (nome legível ou customfield_*). */
export const STORY_POINTS_FIELD_KEYS = [
  'Story Points',
  'story points',
  'Story points',
  'customfield_10016',
  'customfield_10002',
] as const;

function parseStoryPointsValue(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  const n = parseFloat(String(value).replace(',', '.'));
  if (Number.isFinite(n) && n >= 0) return n;
  return null;
}

/** Lê Story Points apenas de `jiraCustomFields`. */
export function parseStoryPointsFromCustomFields(task: JiraTask): number | null {
  const cf = task.jiraCustomFields;
  if (!cf || typeof cf !== 'object') return null;
  for (const k of STORY_POINTS_FIELD_KEYS) {
    const parsed = parseStoryPointsValue((cf as Record<string, unknown>)[k]);
    if (parsed != null) return parsed;
  }
  return null;
}

/**
 * Story Points para análise de risco: `task.storyPoints` tem prioridade; senão custom fields Jira.
 */
export function resolveTaskStoryPoints(task: JiraTask): number {
  if (
    typeof task.storyPoints === 'number' &&
    Number.isFinite(task.storyPoints) &&
    task.storyPoints >= 0
  ) {
    return task.storyPoints;
  }
  return parseStoryPointsFromCustomFields(task) ?? 0;
}

/** Após montar `jiraCustomFields` na import/sync, espelha o valor em `task.storyPoints`. */
export function assignStoryPointsToTask(task: JiraTask): void {
  const fromCustom = parseStoryPointsFromCustomFields(task);
  if (fromCustom != null) {
    task.storyPoints = fromCustom;
  }
}

import type { JiraSprint, JiraTask } from '../types';

/** Chaves comuns do campo Sprint no Jira (Cloud/Server). */
export const SPRINT_FIELD_KEYS = [
  'Sprint',
  'sprint',
  'customfield_10020',
  'customfield_10021',
] as const;

function mapJiraSprintState(raw: string | undefined): JiraSprint['state'] {
  const s = (raw ?? '').toLowerCase().trim();
  if (s === 'active') return 'active';
  if (s === 'future' || s === 'planned') return 'future';
  return 'closed';
}

function optionalIsoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.trim();
}

function parseGreenHopperSprintString(raw: string): JiraSprint | null {
  const idMatch = /(?:^|[,\[])\s*id=(\d+)/i.exec(raw);
  const nameMatch = /(?:^|[,\[])\s*name=([^,\]]+)/i.exec(raw);
  if (!idMatch || !nameMatch) return null;

  const id = parseInt(idMatch[1], 10);
  if (!Number.isFinite(id)) return null;

  const name = decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')).trim();
  if (!name) return null;

  const stateMatch = /(?:^|[,\[])\s*state=([^,\]]+)/i.exec(raw);
  const startMatch = /(?:^|[,\[])\s*startDate=([^,\]]+)/i.exec(raw);
  const endMatch = /(?:^|[,\[])\s*endDate=([^,\]]+)/i.exec(raw);
  const completeMatch = /(?:^|[,\[])\s*completeDate=([^,\]]+)/i.exec(raw);
  const goalMatch = /(?:^|[,\[])\s*goal=([^,\]]+)/i.exec(raw);

  return {
    id,
    name,
    state: mapJiraSprintState(stateMatch?.[1]),
    startDate: startMatch?.[1] ? optionalIsoDate(startMatch[1]) : undefined,
    endDate: endMatch?.[1] ? optionalIsoDate(endMatch[1]) : undefined,
    completeDate: completeMatch?.[1] ? optionalIsoDate(completeMatch[1]) : undefined,
    goal: goalMatch?.[1] ? decodeURIComponent(goalMatch[1].replace(/\+/g, ' ')).trim() : undefined,
  };
}

function parseStructuredSprint(value: Record<string, unknown>): JiraSprint | null {
  const idRaw = value.id;
  const id =
    typeof idRaw === 'number'
      ? idRaw
      : typeof idRaw === 'string'
        ? parseInt(idRaw, 10)
        : NaN;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!Number.isFinite(id) || !name) return null;

  return {
    id,
    name,
    state: mapJiraSprintState(
      typeof value.state === 'string' ? value.state : String(value.state ?? '')
    ),
    startDate: optionalIsoDate(value.startDate),
    endDate: optionalIsoDate(value.endDate),
    completeDate: optionalIsoDate(value.completeDate),
    goal: typeof value.goal === 'string' ? value.goal.trim() : undefined,
  };
}

function parseSingleSprintValue(value: unknown): JiraSprint | null {
  if (value == null) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.includes('id=') || trimmed.includes('greenhopper')) {
      return parseGreenHopperSprintString(trimmed);
    }
    return null;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return parseStructuredSprint(value as Record<string, unknown>);
  }

  return null;
}

function parseSprintCollection(value: unknown): JiraSprint[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.flatMap(item => {
      const parsed = parseSingleSprintValue(item);
      return parsed ? [parsed] : [];
    });
  }
  const parsed = parseSingleSprintValue(value);
  return parsed ? [parsed] : [];
}

/** Lê sprints de `jiraCustomFields` (import/sync Jira). */
export function parseSprintsFromCustomFields(task: JiraTask): JiraSprint[] {
  const cf = task.jiraCustomFields;
  if (!cf || typeof cf !== 'object') return [];

  const seen = new Set<number>();
  const result: JiraSprint[] = [];

  const push = (sprint: JiraSprint) => {
    if (seen.has(sprint.id)) return;
    seen.add(sprint.id);
    result.push(sprint);
  };

  for (const key of SPRINT_FIELD_KEYS) {
    for (const sprint of parseSprintCollection((cf as Record<string, unknown>)[key])) {
      push(sprint);
    }
  }

  for (const [key, value] of Object.entries(cf)) {
    if ((SPRINT_FIELD_KEYS as readonly string[]).includes(key)) continue;
    if (!/sprint/i.test(key)) continue;
    for (const sprint of parseSprintCollection(value)) {
      push(sprint);
    }
  }

  return result;
}

/** Após montar `jiraCustomFields` na import/sync, espelha sprints em `task.sprints`. */
export function assignSprintsToTask(task: JiraTask): void {
  const sprints = parseSprintsFromCustomFields(task);
  task.sprints = sprints.length > 0 ? sprints : undefined;
}

function normalizeSprintsForCompare(sprints?: JiraSprint[]): JiraSprint[] {
  if (!sprints?.length) return [];
  return [...sprints]
    .map(s => ({
      id: s.id,
      name: s.name,
      state: s.state,
      startDate: s.startDate,
      endDate: s.endDate,
      completeDate: s.completeDate,
      goal: s.goal,
    }))
    .sort((a, b) => a.id - b.id);
}

/** Compara snapshots de sprint para detectar mudanças na sync Jira. */
export function sprintsSnapshotEqual(a?: JiraSprint[], b?: JiraSprint[]): boolean {
  return (
    JSON.stringify(normalizeSprintsForCompare(a)) === JSON.stringify(normalizeSprintsForCompare(b))
  );
}

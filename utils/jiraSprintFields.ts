import type { JiraSprint, JiraTask } from '../types';

/** Chaves comuns do campo Sprint no Jira (Cloud/Server). */
export const SPRINT_FIELD_KEYS = [
  'Sprint',
  'sprint',
  'customfield_10020',
  'customfield_10021',
] as const;

export interface ParseSprintsOptions {
  sprintFieldIds?: string[];
  sprintCatalog?: ReadonlyMap<number, JiraSprint>;
}

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

function sprintFromCatalog(
  id: number,
  catalog?: ReadonlyMap<number, JiraSprint>
): JiraSprint | null {
  if (!catalog?.has(id)) return null;
  return catalog.get(id)!;
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

function parseStructuredSprint(
  value: Record<string, unknown>,
  catalog?: ReadonlyMap<number, JiraSprint>
): JiraSprint | null {
  const idRaw = value.id;
  const id =
    typeof idRaw === 'number'
      ? idRaw
      : typeof idRaw === 'string'
        ? parseInt(idRaw, 10)
        : NaN;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!Number.isFinite(id)) return null;
  if (!name) {
    return sprintFromCatalog(id, catalog);
  }

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

function parseSingleSprintValue(
  value: unknown,
  catalog?: ReadonlyMap<number, JiraSprint>
): JiraSprint | null {
  if (value == null) return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return sprintFromCatalog(value, catalog);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      return sprintFromCatalog(parseInt(trimmed, 10), catalog);
    }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return parseSingleSprintValue(parsed, catalog);
      } catch {
        /* formato legado abaixo */
      }
    }
    if (trimmed.includes('id=') || trimmed.includes('greenhopper')) {
      return parseGreenHopperSprintString(trimmed);
    }
    return null;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ('value' in obj && obj.value != null) {
      return parseSingleSprintValue(obj.value, catalog);
    }
    const structured = parseStructuredSprint(obj, catalog);
    if (structured) return structured;
    if (typeof obj.id === 'number' || typeof obj.id === 'string') {
      const id = typeof obj.id === 'number' ? obj.id : parseInt(String(obj.id), 10);
      if (Number.isFinite(id)) {
        return sprintFromCatalog(id, catalog);
      }
    }
  }

  return null;
}

function parseSprintCollection(
  value: unknown,
  catalog?: ReadonlyMap<number, JiraSprint>
): JiraSprint[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.flatMap(item => {
      const parsed = parseSingleSprintValue(item, catalog);
      return parsed ? [parsed] : [];
    });
  }
  const parsed = parseSingleSprintValue(value, catalog);
  return parsed ? [parsed] : [];
}

function collectFieldKeys(
  fields: Record<string, unknown>,
  sprintFieldIds?: string[]
): string[] {
  const keys = new Set<string>([...SPRINT_FIELD_KEYS, ...(sprintFieldIds ?? [])]);
  for (const key of Object.keys(fields)) {
    if (/sprint/i.test(key)) keys.add(key);
  }
  return [...keys];
}

/** Lê sprints dos fields brutos da issue (search/import/sync). */
export function parseSprintsFromIssueFields(
  fields: Record<string, unknown> | null | undefined,
  options?: ParseSprintsOptions
): JiraSprint[] {
  if (!fields || typeof fields !== 'object') return [];

  const seen = new Set<number>();
  const result: JiraSprint[] = [];
  const catalog = options?.sprintCatalog;

  const push = (sprint: JiraSprint | null) => {
    if (!sprint || seen.has(sprint.id)) return;
    seen.add(sprint.id);
    result.push(sprint);
  };

  for (const key of collectFieldKeys(fields, options?.sprintFieldIds)) {
    for (const sprint of parseSprintCollection(fields[key], catalog)) {
      push(sprint);
    }
  }

  return result;
}

/** Lê sprints de `jiraCustomFields` (fallback). */
export function parseSprintsFromCustomFields(
  task: JiraTask,
  options?: ParseSprintsOptions
): JiraSprint[] {
  const cf = task.jiraCustomFields;
  if (!cf || typeof cf !== 'object') return [];
  return parseSprintsFromIssueFields(cf as Record<string, unknown>, options);
}

export interface AssignSprintsOptions extends ParseSprintsOptions {
  issueFields?: Record<string, unknown> | null;
  /** Quando fields vazios, tenta API Agile (sync de issue única). */
  agileFallback?: () => Promise<JiraSprint[]>;
}

/** Após montar fields na import/sync, espelha sprints em `task.sprints`. */
export async function assignSprintsToTask(
  task: JiraTask,
  options?: AssignSprintsOptions
): Promise<void> {
  let sprints = parseSprintsFromIssueFields(options?.issueFields, options);
  if (sprints.length === 0) {
    sprints = parseSprintsFromCustomFields(task, options);
  }
  if (sprints.length === 0 && options?.agileFallback) {
    sprints = await options.agileFallback();
  }
  task.sprints = sprints.length > 0 ? sprints : undefined;
}

/** Versão síncrona para fluxos que já têm dados completos nos fields. */
export function assignSprintsToTaskSync(
  task: JiraTask,
  options?: Omit<AssignSprintsOptions, 'agileFallback'>
): void {
  let sprints = parseSprintsFromIssueFields(options?.issueFields, options);
  if (sprints.length === 0) {
    sprints = parseSprintsFromCustomFields(task, options);
  }
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

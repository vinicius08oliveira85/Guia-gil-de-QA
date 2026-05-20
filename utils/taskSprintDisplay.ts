import type { JiraSprint, JiraTask } from '../types';

export const BACKLOG_UNASSIGNED_SPRINT_LABEL = 'Sem sprint';

const SPRINT_STATE_SORT_ORDER: Record<JiraSprint['state'], number> = {
  active: 0,
  future: 1,
  closed: 2,
};

/** Sprint principal para exibição: ativa → futura → primeira vinculada. */
export function resolveTaskDisplaySprint(task: JiraTask): JiraSprint | null {
  const sprints = task.sprints;
  if (!sprints?.length) return null;
  return (
    sprints.find(s => s.state === 'active') ??
    sprints.find(s => s.state === 'future') ??
    sprints[0] ??
    null
  );
}

export function isActiveSprint(sprint: JiraSprint | null | undefined): boolean {
  return sprint?.state === 'active';
}

/** Chave estável para agrupamento por sprint no backlog. */
export function getBacklogSprintGroupKey(task: JiraTask): string {
  const sprint = resolveTaskDisplaySprint(task);
  return sprint ? `sprint:${sprint.id}` : 'sprint:unassigned';
}

export interface BacklogSprintGroup {
  key: string;
  label: string;
  sprint: JiraSprint | null;
  isActive: boolean;
  tasks: JiraTask[];
}

export function compareBacklogSprintGroups(a: BacklogSprintGroup, b: BacklogSprintGroup): number {
  if (!a.sprint && !b.sprint) return 0;
  if (!a.sprint) return 1;
  if (!b.sprint) return -1;

  const orderA = SPRINT_STATE_SORT_ORDER[a.sprint.state];
  const orderB = SPRINT_STATE_SORT_ORDER[b.sprint.state];
  if (orderA !== orderB) return orderA - orderB;

  return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
}

/**
 * Agrupa tarefas do backlog por sprint de exibição e ordena grupos e itens.
 */
export function groupBacklogTasksBySprint(
  tasks: readonly JiraTask[],
  taskComparator: (a: JiraTask, b: JiraTask) => number
): BacklogSprintGroup[] {
  const map = new Map<string, BacklogSprintGroup>();

  for (const task of tasks) {
    const sprint = resolveTaskDisplaySprint(task);
    const key = getBacklogSprintGroupKey(task);
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: sprint?.name?.trim() || BACKLOG_UNASSIGNED_SPRINT_LABEL,
        sprint,
        isActive: isActiveSprint(sprint),
        tasks: [],
      });
    }
    map.get(key)!.tasks.push(task);
  }

  const groups = Array.from(map.values());
  for (const group of groups) {
    group.tasks.sort(taskComparator);
  }
  groups.sort(compareBacklogSprintGroups);
  return groups;
}

export const BACKLOG_SPRINT_FILTER_ALL = 'all';

export interface BacklogSprintFilterOption {
  value: string;
  label: string;
  isActive?: boolean;
}

/** Opções do filtro por sprint (todas + uma entrada por sprint no backlog). */
export function buildBacklogSprintFilterOptions(
  backlogTasks: readonly JiraTask[]
): BacklogSprintFilterOption[] {
  const groups = groupBacklogTasksBySprint(backlogTasks, () => 0);
  const options: BacklogSprintFilterOption[] = [
    { value: BACKLOG_SPRINT_FILTER_ALL, label: 'Todas as sprints' },
  ];
  for (const group of groups) {
    options.push({
      value: group.key,
      label: group.label,
      isActive: group.isActive,
    });
  }
  return options;
}

export function filterTasksByBacklogSprint(
  tasks: readonly JiraTask[],
  filterKey: string
): JiraTask[] {
  if (filterKey === BACKLOG_SPRINT_FILTER_ALL) return [...tasks];
  return tasks.filter(t => getBacklogSprintGroupKey(t) === filterKey);
}

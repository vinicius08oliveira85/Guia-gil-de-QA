import type { JiraTask, JiraTaskType, TaskPriority } from '../types';
import { resolveTaskStoryPoints } from './taskStoryPoints';

/** Modo de listagem na aba Tarefas & Testes. */
export type TasksListMode = 'all' | 'backlog';

/** Ordenação dedicada ao backlog. */
export type BacklogSortBy = 'priority' | 'storyPoints' | 'storyPointsAsc' | 'id';

/** Escopo de itens exibidos na subvisão Backlog. */
export type BacklogItemFilter = 'all' | 'queue' | 'completed';

export type BacklogTypeFilter = 'all' | JiraTaskType;

export type BacklogPriorityFilter = 'all' | TaskPriority;

export type BacklogStoryPointsFilter = 'all' | 'withSp' | 'withoutSp';

export interface BacklogSecondaryFilters {
  type: BacklogTypeFilter;
  priority: BacklogPriorityFilter;
  storyPoints: BacklogStoryPointsFilter;
}

export const BACKLOG_SECONDARY_FILTER_DEFAULTS: BacklogSecondaryFilters = {
  type: 'all',
  priority: 'all',
  storyPoints: 'all',
};

export function countActiveBacklogSecondaryFilters(filters: BacklogSecondaryFilters): number {
  let n = 0;
  if (filters.type !== 'all') n += 1;
  if (filters.priority !== 'all') n += 1;
  if (filters.storyPoints !== 'all') n += 1;
  return n;
}

const TASK_ID_REGEX = /^([A-Z]+)-(\d+)/i;

const BACKLOG_PRIORITY_ORDER: Record<string, number> = {
  Urgente: 0,
  Alta: 1,
  Média: 2,
  Baixa: 3,
};

function compareTasksById(a: JiraTask, b: JiraTask): number {
  const matchA = a.id.match(TASK_ID_REGEX);
  const matchB = b.id.match(TASK_ID_REGEX);
  if (!matchA || !matchB) return a.id.localeCompare(b.id);
  const parsedA = { prefix: matchA[1].toUpperCase(), number: parseInt(matchA[2], 10) };
  const parsedB = { prefix: matchB[1].toUpperCase(), number: parseInt(matchB[2], 10) };
  if (parsedA.prefix !== parsedB.prefix) return parsedA.prefix.localeCompare(parsedB.prefix);
  if (parsedA.number !== parsedB.number) return parsedA.number - parsedB.number;
  return (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' });
}

/**
 * Status Jira textual que indica item concluído / encerrado.
 */
export function isJiraCompletedLikeStatus(jiraStatus: string | undefined): boolean {
  if (!jiraStatus?.trim()) return false;
  const status = jiraStatus.toLowerCase().trim();
  return (
    status.includes('done') ||
    status.includes('resolved') ||
    status.includes('closed') ||
    status.includes('concluído') ||
    status.includes('concluido') ||
    status.includes('finalizado') ||
    status.includes('fechado') ||
    status.includes('encerrado') ||
    status.includes('resolvido')
  );
}

/**
 * Status Jira textual que indica item ainda no backlog / fila (não iniciado).
 */
export function isJiraBacklogLikeStatus(jiraStatus: string | undefined): boolean {
  if (!jiraStatus?.trim()) return false;
  const status = jiraStatus.toLowerCase().trim();

  if (
    status.includes('done') ||
    status.includes('resolved') ||
    status.includes('closed') ||
    status.includes('concluído') ||
    status.includes('concluido') ||
    status.includes('finalizado') ||
    status.includes('fechado') ||
    status.includes('encerrado')
  ) {
    return false;
  }

  if (
    status.includes('progress') ||
    status.includes('andamento') ||
    status.includes('em desenvolvimento') ||
    status.includes('development') ||
    status.includes('executando')
  ) {
    return false;
  }

  return (
    status.includes('backlog') ||
    status.includes('todo') ||
    status.includes('to do') ||
    status.includes('pendente') ||
    status.includes('pending') ||
    status.includes('a fazer') ||
    status.includes('para fazer') ||
    status.includes('aguardando') ||
    status.includes('waiting') ||
    status.includes('open') ||
    status.includes('aberto') ||
    status.includes('novo') ||
    status.includes('new')
  );
}

/**
 * Tarefa no backlog: não Epic e ainda na fila/não iniciada.
 *
 * Quando há `jiraStatus`, ele é a fonte de verdade (evita contar como backlog
 * itens já em validação/ajustes cujo `task.status` interno ficou defasado antes
 * de uma nova sincronização). Sem `jiraStatus`, usa o status interno.
 */
export function isBacklogTask(task: JiraTask): boolean {
  if (task.type === 'Epic') return false;
  if (task.jiraStatus?.trim()) return isJiraBacklogLikeStatus(task.jiraStatus);
  return task.status === 'To Do';
}

/**
 * Tarefa concluída na visão backlog: não Epic e (Done normalizado ou status Jira de conclusão).
 */
export function isBacklogCompletedTask(task: JiraTask): boolean {
  if (task.type === 'Epic') return false;
  if (task.status === 'Done') return true;
  return isJiraCompletedLikeStatus(task.jiraStatus);
}

/** Retorna cópia filtrada das tarefas que qualificam como backlog. */
export function filterBacklogTasks(tasks: readonly JiraTask[]): JiraTask[] {
  return tasks.filter(isBacklogTask);
}

export function filterBacklogCompletedTasks(tasks: readonly JiraTask[]): JiraTask[] {
  return tasks.filter(isBacklogCompletedTask);
}

export function countBacklogCompletedTasks(tasks: readonly JiraTask[]): number {
  return filterBacklogCompletedTasks(tasks).length;
}

/** Tarefa elegível na visão backlog (fila ou concluída), exceto Epic. */
export function isBacklogScopeTask(task: JiraTask): boolean {
  return isBacklogTask(task) || isBacklogCompletedTask(task);
}

/** Filtra tarefas do backlog conforme fila, concluídos ou ambos. */
export function filterBacklogTasksByItemFilter(
  tasks: readonly JiraTask[],
  itemFilter: BacklogItemFilter
): JiraTask[] {
  if (itemFilter === 'completed') return filterBacklogCompletedTasks(tasks);
  if (itemFilter === 'all') return tasks.filter(isBacklogScopeTask);
  return filterBacklogTasks(tasks);
}

/** Filtros adicionais do backlog (tipo, prioridade, story points). */
export function applyBacklogSecondaryFilters(
  tasks: readonly JiraTask[],
  filters: BacklogSecondaryFilters
): JiraTask[] {
  return tasks.filter(task => {
    if (filters.type !== 'all' && task.type !== filters.type) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.storyPoints !== 'all') {
      const sp = resolveTaskStoryPoints(task);
      if (filters.storyPoints === 'withSp' && sp <= 0) return false;
      if (filters.storyPoints === 'withoutSp' && sp > 0) return false;
    }
    return true;
  });
}

export function countBacklogTasks(tasks: readonly JiraTask[]): number {
  return filterBacklogTasks(tasks).length;
}

/** Percentual do backlog sobre o total de tarefas (0–100), ou null se total = 0. */
export function backlogSharePercent(backlogCount: number, totalTasks: number): number | null {
  if (totalTasks <= 0) return null;
  return Math.round((backlogCount / totalTasks) * 100);
}

/** Rótulo para o card do dashboard (ex.: "42% do total"). */
export function formatBacklogShareLabel(backlogCount: number, totalTasks: number): string | undefined {
  const pct = backlogSharePercent(backlogCount, totalTasks);
  if (pct == null) return undefined;
  return `${pct}% do total`;
}

/** Query canônica para deep link ao backlog dentro de Tarefas & Testes. */
export function buildProjectBacklogSearch(projectId: string): string {
  const params = new URLSearchParams();
  params.set('project', projectId);
  params.set('subview', 'backlog');
  return `?${params.toString()}`;
}

export function getBacklogTaskComparator(
  sortBy: BacklogSortBy
): (a: JiraTask, b: JiraTask) => number {
  return (a, b) => {
    switch (sortBy) {
      case 'priority': {
        const orderA = BACKLOG_PRIORITY_ORDER[a.priority ?? ''] ?? 99;
        const orderB = BACKLOG_PRIORITY_ORDER[b.priority ?? ''] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return compareTasksById(a, b);
      }
      case 'storyPoints': {
        const spA = resolveTaskStoryPoints(a);
        const spB = resolveTaskStoryPoints(b);
        const hasA = spA > 0;
        const hasB = spB > 0;
        if (hasA && hasB && spB !== spA) return spB - spA;
        if (hasA !== hasB) return hasA ? -1 : 1;
        return compareTasksById(a, b);
      }
      case 'storyPointsAsc': {
        const spA = resolveTaskStoryPoints(a);
        const spB = resolveTaskStoryPoints(b);
        const hasA = spA > 0;
        const hasB = spB > 0;
        if (hasA && hasB && spA !== spB) return spA - spB;
        if (hasA !== hasB) return hasA ? -1 : 1;
        return compareTasksById(a, b);
      }
      case 'id':
      default:
        return compareTasksById(a, b);
    }
  };
}

import type { JiraTask } from '../types';
import { resolveTaskStoryPoints } from './taskStoryPoints';

/** Modo de listagem na aba Tarefas & Testes. */
export type TasksListMode = 'all' | 'backlog';

/** Ordenação dedicada ao backlog. */
export type BacklogSortBy = 'priority' | 'storyPoints' | 'id';

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
 * Tarefa no backlog: não Epic e (To Do normalizado ou status Jira de fila/backlog).
 */
export function isBacklogTask(task: JiraTask): boolean {
  if (task.type === 'Epic') return false;
  if (task.status === 'To Do') return true;
  return isJiraBacklogLikeStatus(task.jiraStatus);
}

/** Retorna cópia filtrada das tarefas que qualificam como backlog. */
export function filterBacklogTasks(tasks: readonly JiraTask[]): JiraTask[] {
  return tasks.filter(isBacklogTask);
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
      case 'id':
      default:
        return compareTasksById(a, b);
    }
  };
}

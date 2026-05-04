import { endOfWeek, format, isValid, parseISO, startOfDay, startOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { JiraTask } from '../types';

export interface TaskCompletionStats {
  total: number;
  completed: number;
  /** 0–100; 0 quando não há tarefas. */
  completionPercent: number;
}

export interface NamedCount {
  name: string;
  value: number;
  fill?: string;
}

export interface DeliveryWeekPoint {
  weekKey: string;
  label: string;
  concludedCount: number;
}

export interface ProjectDashboardDeterministicMetrics {
  completion: TaskCompletionStats;
  overdueCount: number;
  countsByStatus: Record<JiraTask['status'], number>;
  statusDistribution: NamedCount[];
  deliveryEvolution: DeliveryWeekPoint[];
  /** true se pelo menos uma tarefa tem `completedAt` válido. */
  hasDeliveryData: boolean;
  priorityDistribution: NamedCount[];
  assigneeDistribution: NamedCount[];
}

const STATUS_ORDER: JiraTask['status'][] = ['To Do', 'In Progress', 'Blocked', 'Done'];

const STATUS_FILL: Record<JiraTask['status'], string> = {
  'To Do': 'oklch(var(--bc) / 0.35)',
  'In Progress': 'oklch(var(--p))',
  Blocked: 'oklch(var(--er))',
  Done: 'oklch(var(--su))',
};

function isTaskDone(task: JiraTask): boolean {
  return task.status === 'Done';
}

/** Início do dia local para comparação de vencimento (dueDate < hoje). */
export function isTaskOverdue(task: JiraTask, referenceDate: Date): boolean {
  if (isTaskDone(task)) return false;
  if (!task.dueDate) return false;
  const due = parseISO(task.dueDate);
  if (!isValid(due)) return false;
  return startOfDay(due).getTime() < startOfDay(referenceDate).getTime();
}

export function computeTaskCompletionStats(tasks: JiraTask[]): TaskCompletionStats {
  const total = tasks.length;
  const completed = tasks.filter(isTaskDone).length;
  const completionPercent = total === 0 ? 0 : Math.round((completed / total) * 1000) / 10;
  return { total, completed, completionPercent };
}

export function computeOverdueTaskCount(
  tasks: JiraTask[],
  referenceDate: Date = new Date()
): number {
  return tasks.reduce((n, t) => n + (isTaskOverdue(t, referenceDate) ? 1 : 0), 0);
}

function priorityLabel(task: JiraTask): string {
  return task.jiraPriority?.trim() || task.priority || 'Sem prioridade';
}

function assigneeLabel(task: JiraTask): string {
  const j = task.jiraAssignee?.displayName?.trim();
  if (j) return j;
  if (task.assignee === 'Product') return 'Product';
  if (task.assignee === 'QA') return 'QA';
  if (task.assignee === 'Dev') return 'Dev';
  return 'Sem responsável';
}

function topNWithOther(entries: Map<string, number>, n: number): NamedCount[] {
  const sorted = [...entries.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, n);
  const rest = sorted.slice(n).reduce((s, [, v]) => s + v, 0);
  const out: NamedCount[] = top.map(([name, value]) => ({ name, value }));
  if (rest > 0) out.push({ name: 'Outros', value: rest });
  return out;
}

const TOP_CATEGORIES = 8;

function buildPriorityDistribution(tasks: JiraTask[]): NamedCount[] {
  const map = new Map<string, number>();
  for (const t of tasks) {
    const k = priorityLabel(t);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return topNWithOther(map, TOP_CATEGORIES);
}

function buildAssigneeDistribution(tasks: JiraTask[]): NamedCount[] {
  const map = new Map<string, number>();
  for (const t of tasks) {
    const k = assigneeLabel(t);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return topNWithOther(map, TOP_CATEGORIES);
}

export function computeDeliveryEvolutionSeries(
  tasks: JiraTask[],
  numberOfWeeks = 8,
  now: Date = new Date()
): DeliveryWeekPoint[] {
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const points: DeliveryWeekPoint[] = [];

  for (let w = 0; w < numberOfWeeks; w++) {
    const ws = subWeeks(currentWeekStart, numberOfWeeks - 1 - w);
    const we = endOfWeek(ws, { weekStartsOn: 1 });
    const weekKey = format(ws, 'yyyy-MM-dd');
    const label = format(ws, 'd MMM', { locale: ptBR });
    let concludedCount = 0;
    for (const t of tasks) {
      if (!t.completedAt) continue;
      const c = parseISO(t.completedAt);
      if (!isValid(c)) continue;
      if (c.getTime() >= ws.getTime() && c.getTime() <= we.getTime()) {
        concludedCount++;
      }
    }
    points.push({ weekKey, label, concludedCount });
  }

  return points;
}

export function computeProjectDashboardDeterministicMetrics(
  tasks: JiraTask[] | undefined,
  options?: { now?: Date; deliveryWeeks?: number }
): ProjectDashboardDeterministicMetrics {
  const list = tasks ?? [];
  const now = options?.now ?? new Date();
  const weeks = options?.deliveryWeeks ?? 8;

  const completion = computeTaskCompletionStats(list);
  const overdueCount = computeOverdueTaskCount(list, now);

  const countsByStatus: Record<JiraTask['status'], number> = {
    'To Do': 0,
    'In Progress': 0,
    Blocked: 0,
    Done: 0,
  };
  for (const t of list) {
    countsByStatus[t.status] = (countsByStatus[t.status] ?? 0) + 1;
  }

  const statusDistribution: NamedCount[] = STATUS_ORDER.map(status => ({
    name: status,
    value: countsByStatus[status],
    fill: STATUS_FILL[status],
  }));

  const deliveryEvolution = computeDeliveryEvolutionSeries(list, weeks, now);
  const hasDeliveryData = list.some(t => {
    if (!t.completedAt) return false;
    return isValid(parseISO(t.completedAt));
  });

  return {
    completion,
    overdueCount,
    countsByStatus,
    statusDistribution,
    deliveryEvolution,
    hasDeliveryData,
    priorityDistribution: buildPriorityDistribution(list),
    assigneeDistribution: buildAssigneeDistribution(list),
  };
}

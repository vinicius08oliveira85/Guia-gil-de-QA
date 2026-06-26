import type { JiraTask } from '../types';
import { classifyTaskSlaFromJiraSlas, taskHasJiraSlas } from './jiraSla';

/** Janela (horas) para considerar uma tarefa "em risco" de estourar o SLA. */
export const DEFAULT_SLA_RISK_WINDOW_HOURS = 48;

export type JiraTaskStatus = JiraTask['status'];

export type SlaBucket = 'onTrack' | 'atRisk' | 'overdue' | 'noDueDate';

export type JiraFilasFilter =
  | { kind: 'all' }
  | { kind: 'status'; status: JiraTaskStatus }
  | { kind: 'sla'; bucket: SlaBucket };

export interface JiraFilasStatusCounts {
  'To Do': number;
  'In Progress': number;
  Done: number;
  Blocked: number;
}

export interface JiraFilasSlaCounts {
  onTrack: number;
  atRisk: number;
  overdue: number;
  noDueDate: number;
}

export interface JiraFilasMetrics {
  total: number;
  doneCount: number;
  donePercent: number;
  inProgressCount: number;
  openCount: number;
  statusCounts: JiraFilasStatusCounts;
  slaCounts: JiraFilasSlaCounts;
}

/**
 * Classifica uma tarefa em um balde de SLA.
 * Usa SLAs do Jira Service Management quando disponíveis; caso contrário, `dueDate`.
 * Tarefas concluídas não entram em risco/atraso (consideradas no prazo).
 */
export function classifyTaskSla(
  task: JiraTask,
  now: number = Date.now(),
  riskWindowHours: number = DEFAULT_SLA_RISK_WINDOW_HOURS
): SlaBucket {
  if (task.status === 'Done') return 'onTrack';

  if (taskHasJiraSlas(task)) {
    const fromJira = classifyTaskSlaFromJiraSlas(task.jiraSlas!, now, riskWindowHours);
    if (fromJira) return fromJira;
  }

  if (!task.dueDate) return 'noDueDate';

  const due = new Date(task.dueDate).getTime();
  if (Number.isNaN(due)) return 'noDueDate';

  if (due < now) return 'overdue';
  if (due <= now + riskWindowHours * 60 * 60 * 1000) return 'atRisk';
  return 'onTrack';
}

export function isJiraFilasFilterActive(filter: JiraFilasFilter): boolean {
  return filter.kind !== 'all';
}

export function getJiraFilasFilterLabel(filter: JiraFilasFilter): string {
  if (filter.kind === 'all') return 'Todas';
  if (filter.kind === 'status') {
    const labels: Record<JiraTaskStatus, string> = {
      'To Do': 'A fazer',
      'In Progress': 'Em andamento',
      Done: 'Concluídas',
      Blocked: 'Bloqueadas',
    };
    return labels[filter.status];
  }

  const labels: Record<SlaBucket, string> = {
    onTrack: 'No prazo',
    atRisk: 'Em risco',
    overdue: 'Atrasadas',
    noDueDate: 'Sem prazo',
  };
  return labels[filter.bucket];
}

export function matchesJiraFilasFilter(
  task: JiraTask,
  filter: JiraFilasFilter,
  now: number = Date.now(),
  riskWindowHours: number = DEFAULT_SLA_RISK_WINDOW_HOURS
): boolean {
  if (filter.kind === 'all') return true;
  if (filter.kind === 'status') return task.status === filter.status;
  return classifyTaskSla(task, now, riskWindowHours) === filter.bucket;
}

/**
 * Calcula indicadores de Status e SLA das tarefas importadas das Filas (Jira).
 */
export function computeJiraFilasMetrics(
  tasks: JiraTask[],
  now: number = Date.now(),
  riskWindowHours: number = DEFAULT_SLA_RISK_WINDOW_HOURS
): JiraFilasMetrics {
  const statusCounts: JiraFilasStatusCounts = {
    'To Do': 0,
    'In Progress': 0,
    Done: 0,
    Blocked: 0,
  };
  const slaCounts: JiraFilasSlaCounts = {
    onTrack: 0,
    atRisk: 0,
    overdue: 0,
    noDueDate: 0,
  };

  for (const task of tasks) {
    statusCounts[task.status] = (statusCounts[task.status] ?? 0) + 1;
    slaCounts[classifyTaskSla(task, now, riskWindowHours)] += 1;
  }

  const total = tasks.length;
  const doneCount = statusCounts.Done;
  const donePercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return {
    total,
    doneCount,
    donePercent,
    inProgressCount: statusCounts['In Progress'],
    openCount: total - doneCount,
    statusCounts,
    slaCounts,
  };
}

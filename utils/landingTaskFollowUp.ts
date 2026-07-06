import type { JiraTask } from '../types';
import { classifyTaskSla, DEFAULT_SLA_RISK_WINDOW_HOURS, type SlaBucket } from './jiraFilasMetrics';
import { getTaskAssigneeLabel } from './taskDisplayLabels';

export interface FollowUpTaskRef {
  task: JiraTask;
}

export interface FollowUpSummary {
  total: number;
  inProgress: number;
  atRisk: number;
  overdue: number;
}

const OPEN_STATUSES = new Set<JiraTask['status']>(['To Do', 'In Progress', 'Blocked']);

function taskActivityTimestamp(task: JiraTask): number {
  const iso = task.updatedAt || task.createdAt;
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

/** Tarefa em aberto (exclui Done). */
export function isOpenTask(task: JiraTask): boolean {
  return OPEN_STATUSES.has(task.status);
}

/** Chave do projeto Jira extraída do ID da issue (ex.: PROJ-123 → PROJ). */
export function getJiraProjectKeyFromTaskId(taskId: string): string {
  const match = taskId.trim().match(/^([A-Z][A-Z0-9]+)-\d+$/);
  return match?.[1] ?? 'Jira';
}

/** Agrega tarefas em aberto importadas das Filas Jira. */
export function collectOpenFilasTasks(filasTasks: JiraTask[]): FollowUpTaskRef[] {
  return (filasTasks ?? []).filter(isOpenTask).map(task => ({ task }));
}

/** Opções únicas de responsável, ordenadas pt-BR. */
export function collectAssigneeOptions(tasks: FollowUpTaskRef[]): string[] {
  const assignees = new Set<string>();
  for (const { task } of tasks) {
    assignees.add(getTaskAssigneeLabel(task));
  }
  return Array.from(assignees).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** Filtra por responsáveis selecionados; vazio retorna todas. */
export function filterTasksByAssignees(
  tasks: FollowUpTaskRef[],
  selectedAssignees: string[]
): FollowUpTaskRef[] {
  if (selectedAssignees.length === 0) return tasks;
  const selected = new Set(selectedAssignees);
  return tasks.filter(({ task }) => selected.has(getTaskAssigneeLabel(task)));
}

/** Ordena por última atualização (mais recente primeiro). */
export function sortTasksForFollowUp(tasks: FollowUpTaskRef[]): FollowUpTaskRef[] {
  return [...tasks].sort(
    (a, b) => taskActivityTimestamp(b.task) - taskActivityTimestamp(a.task)
  );
}

/** Conta tarefas por status de workflow e SLA. */
export function computeFollowUpSummary(
  tasks: FollowUpTaskRef[],
  now: number = Date.now(),
  riskWindowHours: number = DEFAULT_SLA_RISK_WINDOW_HOURS
): FollowUpSummary {
  let inProgress = 0;
  let atRisk = 0;
  let overdue = 0;

  for (const { task } of tasks) {
    if (task.status === 'In Progress') inProgress += 1;
    const bucket = classifyTaskSla(task, now, riskWindowHours);
    if (bucket === 'atRisk') atRisk += 1;
    if (bucket === 'overdue') overdue += 1;
  }

  return {
    total: tasks.length,
    inProgress,
    atRisk,
    overdue,
  };
}

/** Contagem de tarefas por responsável (para badges nos chips). */
export function countTasksByAssignee(tasks: FollowUpTaskRef[], assignee: string): number {
  return tasks.filter(({ task }) => getTaskAssigneeLabel(task) === assignee).length;
}

export const SLA_BUCKET_LABELS: Record<SlaBucket, string> = {
  onTrack: 'No prazo',
  atRisk: 'Em risco',
  overdue: 'Atrasada',
  noDueDate: 'Sem prazo',
};

/** Rótulo curto de atividade da tarefa. */
export function formatTaskActivityLabel(task: JiraTask): string {
  const iso = task.updatedAt || task.createdAt;
  if (!iso) return 'Sem data';

  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return 'Sem data';

  const diffMs = Date.now() - ms;
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return 'Atualizada agora';
  if (minutes < 60) return `Atualizada há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Atualizada há ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Atualizada ontem';
  if (days < 7) return `Atualizada há ${days} dias`;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(ms));
}

import type { JiraTask } from '../types';

/** Texto de status exibido no card (status real do Jira quando disponível). */
export function getTaskStatusLabel(task: JiraTask): string {
  return task.jiraStatus?.trim() || task.status;
}

/** Responsável exibido (Jira assignee ou fallback local). */
export function getTaskAssigneeLabel(task: JiraTask): string {
  return (task.jiraAssignee?.displayName ?? task.assignee ?? '').trim() || 'Sem responsável';
}

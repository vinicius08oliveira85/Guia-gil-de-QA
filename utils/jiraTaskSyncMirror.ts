import type { JiraTask } from '../types';
import { mapJiraStatusToTaskStatus } from './jiraStatusCategorizer';

/** Snapshot leve para detectar mudanças de status Jira nas tarefas. */
export function buildTaskJiraStatusSnapshot(tasks: JiraTask[]): string {
  return tasks.map(task => `${task.id}\0${task.jiraStatus ?? ''}\0${task.status ?? ''}`).join('\n');
}

/**
 * Alinha `task.status` com `task.jiraStatus` quando o nome Jira está disponível.
 * Retorna novo array apenas se houve alterações.
 */
export function alignTaskStatusesFromJira(tasks: JiraTask[]): {
  tasks: JiraTask[];
  correctedCount: number;
} {
  let correctedCount = 0;

  const aligned = tasks.map(task => {
    if (!task?.jiraStatus) return task;
    try {
      const expected = mapJiraStatusToTaskStatus(task.jiraStatus);
      if (task.status === expected) return task;
      correctedCount += 1;
      return { ...task, status: expected };
    } catch {
      return task;
    }
  });

  return { tasks: aligned, correctedCount };
}

/** Campos espelhados do Jira em projetos vinculados (mesma issue key). */
const JIRA_MIRROR_FIELDS = [
  'title',
  'description',
  'status',
  'jiraStatus',
  'type',
  'priority',
  'jiraPriority',
  'jiraAssignee',
  'tags',
  'severity',
  'completedAt',
  'dueDate',
  'parentId',
  'epicKey',
  'assignee',
  'timeTracking',
  'components',
  'fixVersions',
  'environment',
  'reporter',
  'watchers',
  'issueLinks',
  'jiraAttachments',
  'jiraCustomFields',
  'sprints',
  'storyPoints',
  'comments',
  'jiraSyncedAt',
  'jiraIssueTypeIconUrl',
] as const satisfies ReadonlyArray<keyof JiraTask>;

/** Mescla campos vindos do Jira preservando dados locais (guia Dev, testes, etc.). */
export function mergeJiraSyncedTaskFields(local: JiraTask, synced: JiraTask): JiraTask {
  const merged: JiraTask = { ...local };
  for (const field of JIRA_MIRROR_FIELDS) {
    if (field in synced) {
      (merged as Record<typeof field, JiraTask[typeof field]>)[field] = synced[field];
    }
  }
  return merged;
}

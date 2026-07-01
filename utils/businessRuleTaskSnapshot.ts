import type { JiraTask } from '../types';

const DESCRIPTION_SNIPPET_LENGTH = 500;

export interface BusinessRuleTaskSnapshotEntry {
  id: string;
  title: string;
  description: string;
  status: string;
  jiraStatus?: string;
  updatedAt?: string;
  type: string;
  issueLinksCount: number;
  commentsCount: number;
}

function truncateText(value: string | undefined, max: number): string {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function buildTaskSnapshotEntry(task: JiraTask): BusinessRuleTaskSnapshotEntry {
  return {
    id: task.id,
    title: task.title,
    description: truncateText(task.description, DESCRIPTION_SNIPPET_LENGTH),
    status: task.status,
    jiraStatus: task.jiraStatus,
    updatedAt: task.updatedAt,
    type: task.type,
    issueLinksCount: task.issueLinks?.length ?? 0,
    commentsCount: task.comments?.length ?? 0,
  };
}

/** Hash determinístico simples (djb2) para snapshot de tasks vinculadas. */
export function hashBusinessRuleTaskSnapshot(
  tasks: JiraTask[],
  linkedTaskIds: string[]
): string {
  const idSet = new Set(linkedTaskIds);
  const entries = tasks
    .filter(t => idSet.has(t.id))
    .map(buildTaskSnapshotEntry)
    .sort((a, b) => a.id.localeCompare(b.id));

  const payload = JSON.stringify(entries);
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return `br-${(hash >>> 0).toString(16)}`;
}

export function getChangedTaskIds(
  previousHash: string | undefined,
  tasks: JiraTask[],
  linkedTaskIds: string[]
): { hash: string; changed: boolean; changedTaskIds: string[] } {
  const hash = hashBusinessRuleTaskSnapshot(tasks, linkedTaskIds);
  if (!previousHash || previousHash !== hash) {
    return { hash, changed: true, changedTaskIds: [...linkedTaskIds] };
  }
  return { hash, changed: false, changedTaskIds: [] };
}

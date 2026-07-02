import type { JiraTask } from '../types';
import type { JiraFieldInfo } from '../services/jira/types';
import { formatJiraCustomFieldValue } from './jiraCustomFieldValue';

/** Padrões do campo "Formulários anexados" / "Attached forms" no Jira. */
export const ATTACHED_FORMS_FIELD_PATTERNS = [
  /formul[aá]rios?\s+anexados?/i,
  /attached\s+forms?/i,
];

const JIRA_ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/i;

function fieldMatches(name: string, patterns: RegExp[]): boolean {
  const normalized = name.trim();
  return patterns.some(pattern => pattern.test(normalized));
}

export function findAttachedFormsFieldId(
  jiraFields: JiraFieldInfo[] = []
): string | undefined {
  const match = jiraFields.find(f => fieldMatches(f.name, ATTACHED_FORMS_FIELD_PATTERNS));
  return match?.id;
}

/**
 * Indica se a tarefa provavelmente veio do Jira (chave de issue ou metadados Jira).
 */
export function isJiraIntegratedTask(task: JiraTask): boolean {
  if (JIRA_ISSUE_KEY_PATTERN.test(task.id.trim())) return true;
  return !!(
    task.jiraStatus ||
    task.jiraIssueTypeIconUrl ||
    task.jiraCustomFields ||
    task.jiraServiceName ||
    task.jiraSlas?.length
  );
}

/**
 * Lê o valor bruto do custom field "Formulários anexados", se existir na tarefa.
 */
export function readAttachedFormsCustomFieldValue(
  task: JiraTask,
  jiraFields: JiraFieldInfo[] = []
): unknown {
  const fieldId = findAttachedFormsFieldId(jiraFields);
  if (!fieldId || !task.jiraCustomFields) return undefined;
  return task.jiraCustomFields[fieldId];
}

/**
 * Texto legível do custom field "Formulários anexados" (fallback offline).
 */
export function formatAttachedFormsCustomFieldValue(
  task: JiraTask,
  jiraFields: JiraFieldInfo[] = []
): string | undefined {
  const raw = readAttachedFormsCustomFieldValue(task, jiraFields);
  return formatJiraCustomFieldValue(raw);
}

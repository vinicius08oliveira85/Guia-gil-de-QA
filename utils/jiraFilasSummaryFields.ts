import type { JiraTask } from '../types';
import type { JiraFieldInfo } from '../services/jira/types';
import { formatJiraCustomFieldValue } from './jiraCustomFieldValue';

export interface JiraFilasSummaryFields {
  service?: string;
  sector?: string;
  requestType?: string;
}

const SERVICE_FIELD_PATTERNS = [/servi[cç]o/i];
const SECTOR_FIELD_PATTERNS = [/setor/i, /diretoria/i];
const REQUEST_TYPE_FIELD_PATTERNS = [/tipo de solicita[cç][aã]o/i, /request type/i];

function fieldMatches(name: string, patterns: RegExp[]): boolean {
  const normalized = name.trim();
  return patterns.some(pattern => pattern.test(normalized));
}

function findFieldIdByPatterns(
  fields: JiraFieldInfo[],
  patterns: RegExp[]
): string | undefined {
  const match = fields.find(f => fieldMatches(f.name, patterns));
  return match?.id;
}

function readCustomField(task: JiraTask, fieldId: string | undefined): string | undefined {
  if (!fieldId || !task.jiraCustomFields) return undefined;
  return formatJiraCustomFieldValue(task.jiraCustomFields[fieldId]);
}

/**
 * Resolve Serviço, Setor/Diretoria e Tipo de solicitação a partir dos campos
 * enriquecidos da API JSM e/ou custom fields do Jira.
 */
export function resolveJiraFilasSummaryFields(
  task: JiraTask,
  jiraFields: JiraFieldInfo[] = []
): JiraFilasSummaryFields {
  const service =
    task.jiraServiceName?.trim() ||
    readCustomField(task, findFieldIdByPatterns(jiraFields, SERVICE_FIELD_PATTERNS));

  const sector =
    task.jiraSectorName?.trim() ||
    readCustomField(task, findFieldIdByPatterns(jiraFields, SECTOR_FIELD_PATTERNS));

  const requestType =
    task.jiraRequestTypeName?.trim() ||
    readCustomField(task, findFieldIdByPatterns(jiraFields, REQUEST_TYPE_FIELD_PATTERNS));

  return {
    service: service || undefined,
    sector: sector || undefined,
    requestType: requestType || undefined,
  };
}

export function hasJiraFilasSummaryFields(fields: JiraFilasSummaryFields): boolean {
  return !!(fields.service || fields.sector || fields.requestType);
}

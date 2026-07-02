import type { JiraConfig } from './types';
import { jiraApiCall, jiraProformaApiCall, jiraSitePathCall } from './api';
import { getJiraFields } from './metadata';
import { logger } from '../../utils/logger';
import {
  ATTACHED_FORMS_FIELD_PATTERNS,
  findAttachedFormsFieldId,
} from '../../utils/jiraAttachedFormsField';
import { formatJiraCustomFieldValue } from '../../utils/jiraCustomFieldValue';

export interface JiraFormAnswer {
  label?: string;
  answer?: string;
  fieldKey?: string;
  questionKey?: string;
  choice?: string | number;
}

export interface JiraAttachedForm {
  id: string;
  name: string;
  submitted: boolean;
  updated?: string;
  answers: JiraFormAnswer[];
}

interface JiraFormIndexEntry {
  id?: string;
  name?: string;
  submitted?: boolean;
  updated?: string;
  internal?: boolean;
  formTemplate?: { id?: string };
}

interface ProformaFormsProperty {
  forms?: Array<{
    id?: number | string;
    name?: string;
    submitted?: boolean;
    updated?: string;
  }>;
}

const cloudIdCache = new Map<string, string>();

async function getJiraCloudId(config: JiraConfig): Promise<string | undefined> {
  const cacheKey = config.url.trim().toLowerCase();
  const cached = cloudIdCache.get(cacheKey);
  if (cached) return cached;

  try {
    const info = await jiraSitePathCall<{ cloudId?: string }>(config, '_edge/tenant_info', {
      timeout: 15000,
    });
    const cloudId = info.cloudId?.trim();
    if (cloudId) {
      cloudIdCache.set(cacheKey, cloudId);
      return cloudId;
    }
  } catch (error) {
    logger.debug('cloudId indisponível via tenant_info', 'attachedForms', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return undefined;
}

function normalizeAnswers(raw: unknown): JiraFormAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is JiraFormAnswer => !!item && typeof item === 'object')
    .map(item => ({
      label: item.label?.trim() || undefined,
      answer: item.answer?.trim() || undefined,
      fieldKey: item.fieldKey?.trim() || undefined,
      questionKey: item.questionKey?.trim() || undefined,
      choice: item.choice,
    }))
    .filter(item => item.label || item.answer || item.choice != null);
}

async function fetchFormAnswersCloud(
  config: JiraConfig,
  cloudId: string,
  issueKey: string,
  formId: string
): Promise<JiraFormAnswer[]> {
  const answers = await jiraSitePathCall<JiraFormAnswer[]>(
    config,
    `jira/forms/cloud/${cloudId}/issue/${encodeURIComponent(issueKey)}/form/${encodeURIComponent(formId)}/format/answers`,
    { timeout: 20000 }
  );
  return normalizeAnswers(answers);
}

async function fetchFormsViaCloudApi(
  config: JiraConfig,
  issueKey: string
): Promise<JiraAttachedForm[]> {
  const cloudId = await getJiraCloudId(config);
  if (!cloudId) return [];

  const forms = await jiraSitePathCall<JiraFormIndexEntry[]>(
    config,
    `jira/forms/cloud/${cloudId}/issue/${encodeURIComponent(issueKey)}/form`,
    { timeout: 20000 }
  );

  if (!Array.isArray(forms) || forms.length === 0) return [];

  const results: JiraAttachedForm[] = [];
  for (const form of forms) {
    const formId = form.id?.trim();
    if (!formId) continue;

    let answers: JiraFormAnswer[] = [];
    try {
      answers = await fetchFormAnswersCloud(config, cloudId, issueKey, formId);
    } catch (error) {
      logger.debug('Respostas do formulário indisponíveis', 'attachedForms', {
        issueKey,
        formId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    results.push({
      id: formId,
      name: form.name?.trim() || 'Formulário',
      submitted: !!form.submitted,
      updated: form.updated,
      answers,
    });
  }

  return results;
}

async function fetchFormsViaProformaProperty(
  config: JiraConfig,
  issueKey: string
): Promise<JiraAttachedForm[]> {
  let property: { value?: ProformaFormsProperty };
  try {
    property = await jiraApiCall<{ value?: ProformaFormsProperty }>(
      config,
      `issue/${encodeURIComponent(issueKey)}/properties/proforma.forms`,
      { timeout: 15000 }
    );
  } catch {
    return [];
  }

  const forms = property.value?.forms ?? [];
  if (forms.length === 0) return [];

  const results: JiraAttachedForm[] = [];
  for (const form of forms) {
    const formId = form.id != null ? String(form.id) : '';
    if (!formId) continue;

    let answers: JiraFormAnswer[] = [];
    try {
      const raw = await jiraProformaApiCall<JiraFormAnswer[]>(
        config,
        `issue/${encodeURIComponent(issueKey)}/form/${encodeURIComponent(formId)}/answers`,
        { timeout: 20000 }
      );
      answers = normalizeAnswers(raw);
    } catch (error) {
      logger.debug('Respostas Proforma indisponíveis', 'attachedForms', {
        issueKey,
        formId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    results.push({
      id: formId,
      name: form.name?.trim() || 'Formulário',
      submitted: !!form.submitted,
      updated: form.updated,
      answers,
    });
  }

  return results;
}

async function fetchFormsViaCustomField(
  config: JiraConfig,
  issueKey: string
): Promise<JiraAttachedForm[]> {
  const jiraFields = await getJiraFields(config).catch(() => []);
  const fieldId = findAttachedFormsFieldId(jiraFields);
  if (!fieldId) return [];

  const issue = await jiraApiCall<{ fields?: Record<string, unknown> }>(
    config,
    `issue/${encodeURIComponent(issueKey)}?fields=${encodeURIComponent(fieldId)}`,
    { timeout: 20000 }
  );

  const raw = issue.fields?.[fieldId];
  const text = formatJiraCustomFieldValue(raw);
  if (!text) return [];

  return [
    {
      id: 'custom-field',
      name: jiraFields.find(f => f.id === fieldId)?.name?.trim() || 'Formulários anexados',
      submitted: true,
      answers: [{ label: 'Conteúdo', answer: text }],
    },
  ];
}

/**
 * Busca formulários anexados à issue no Jira (Forms/Proforma) com respostas.
 */
export async function fetchIssueAttachedForms(
  config: JiraConfig,
  issueKey: string
): Promise<JiraAttachedForm[]> {
  const key = issueKey.trim().toUpperCase();
  if (!key) return [];

  const strategies = [
    () => fetchFormsViaCloudApi(config, key),
    () => fetchFormsViaProformaProperty(config, key),
    () => fetchFormsViaCustomField(config, key),
  ];

  for (const strategy of strategies) {
    try {
      const forms = await strategy();
      if (forms.length > 0) return forms;
    } catch (error) {
      logger.debug('Estratégia de formulários anexados falhou', 'attachedForms', {
        issueKey: key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return [];
}

/** Formata resposta de um campo do formulário para exibição. */
export function formatJiraFormAnswerValue(answer: JiraFormAnswer): string {
  const text = answer.answer?.trim();
  if (text) return text;
  if (answer.choice != null && String(answer.choice).trim()) return String(answer.choice);
  return '—';
}

/** Verifica se há conteúdo exibível nos formulários. */
export function hasAttachedFormsContent(forms: JiraAttachedForm[]): boolean {
  return forms.some(
    form =>
      form.answers.length > 0 ||
      form.name.trim().length > 0
  );
}

/** Exporta padrões para testes. */
export const attachedFormsFieldPatterns = ATTACHED_FORMS_FIELD_PATTERNS;

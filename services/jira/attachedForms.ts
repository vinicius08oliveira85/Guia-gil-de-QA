import type { JiraConfig } from './types';
import { jiraApiCall, jiraFormsApiCall, jiraProformaApiCall, jiraSitePathCall } from './api';
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

interface ProformaFormEntry {
  id?: number | string;
  uuid?: string;
  name?: string;
  submitted?: boolean;
  updated?: string;
}

interface ProformaFormsProperty {
  forms?: ProformaFormEntry[];
}

interface JiraFormQuestion {
  label?: string;
  type?: string;
}

interface JiraFormDetail {
  id?: string;
  updated?: string;
  design?: {
    questions?: Record<string, JiraFormQuestion>;
    settings?: { name?: string };
  };
  state?: {
    answers?: Record<string, unknown>;
    status?: string;
  };
}

const cloudIdCache = new Map<string, string>();

function formsApiPath(cloudId: string, issueKey: string, suffix = ''): string {
  const base = `jira/forms/cloud/${cloudId}/issue/${encodeURIComponent(issueKey)}`;
  return suffix ? `${base}/${suffix.replace(/^\//, '')}` : `${base}/form`;
}

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

/** Extrai lista de formulários de respostas variadas da API. */
export function parseFormIndexResponse(raw: unknown): JiraFormIndexEntry[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is JiraFormIndexEntry => !!item && typeof item === 'object');
  }
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    for (const key of ['forms', 'values', 'data']) {
      const nested = record[key];
      if (Array.isArray(nested)) {
        return nested.filter((item): item is JiraFormIndexEntry => !!item && typeof item === 'object');
      }
    }
  }
  return [];
}

function resolveProformaFormId(form: ProformaFormEntry): string | undefined {
  const uuid = form.uuid?.trim();
  if (uuid) return uuid;
  if (form.id != null && String(form.id).trim()) return String(form.id).trim();
  return undefined;
}

function isFormSubmitted(indexEntry?: JiraFormIndexEntry, detail?: JiraFormDetail): boolean {
  if (indexEntry?.submitted === true) return true;
  const status = detail?.state?.status?.trim().toLowerCase();
  if (!status) return false;
  return status === 's' || status === 'l' || status === 'submitted' || status === 'locked';
}

/** Formata valores de resposta do formulário (string, objeto, lista). */
export function formatFormAnswerRawValue(value: unknown): string | undefined {
  if (value == null) return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map(item => formatFormAnswerRawValue(item))
      .filter((part): part is string => !!part);
    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string' && record.text.trim()) return record.text.trim();
    if (typeof record.label === 'string' && record.label.trim()) return record.label.trim();
    if (typeof record.value === 'string' && record.value.trim()) return record.value.trim();
    if (Array.isArray(record.choices)) {
      const parts = record.choices
        .map(item => formatFormAnswerRawValue(item))
        .filter((part): part is string => !!part);
      if (parts.length > 0) return parts.join(', ');
    }
    if (Array.isArray(record.values)) {
      const parts = record.values
        .map(item => formatFormAnswerRawValue(item))
        .filter((part): part is string => !!part);
      if (parts.length > 0) return parts.join(', ');
    }
    return formatJiraCustomFieldValue(value);
  }

  return undefined;
}

export function normalizeFormAnswers(raw: unknown): JiraFormAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is JiraFormAnswer => !!item && typeof item === 'object')
    .map(item => ({
      label: item.label?.trim() || undefined,
      answer: formatFormAnswerRawValue(item.answer),
      fieldKey: item.fieldKey?.trim() || undefined,
      questionKey: item.questionKey?.trim() || undefined,
      choice: item.choice,
    }))
    .filter(item => item.label || item.answer || item.choice != null);
}

/** Converte o JSON completo do formulário (`GET .../form/{id}`) em respostas legíveis. */
export function parseFormDetailAnswers(detail: JiraFormDetail): JiraFormAnswer[] {
  const questions = detail.design?.questions ?? {};
  const answers = detail.state?.answers ?? {};
  const results: JiraFormAnswer[] = [];

  for (const [questionId, rawValue] of Object.entries(answers)) {
    const label = questions[questionId]?.label?.trim() || questionId;
    const answer = formatFormAnswerRawValue(rawValue);
    if (!label && !answer) continue;
    results.push({
      label,
      answer,
      questionKey: questionId,
    });
  }

  return results;
}

async function fetchFormAnswersFromApi(
  config: JiraConfig,
  cloudId: string,
  issueKey: string,
  formId: string,
  indexEntry?: JiraFormIndexEntry
): Promise<{ answers: JiraFormAnswer[]; name?: string; submitted: boolean; updated?: string }> {
  try {
    const detail = await jiraFormsApiCall<JiraFormDetail>(
      config,
      formsApiPath(cloudId, issueKey, `form/${encodeURIComponent(formId)}`),
      { timeout: 20000 }
    );
    const answers = parseFormDetailAnswers(detail);
    if (answers.length > 0) {
      return {
        answers,
        name: indexEntry?.name?.trim() || detail.design?.settings?.name?.trim(),
        submitted: isFormSubmitted(indexEntry, detail),
        updated: detail.updated ?? indexEntry?.updated,
      };
    }
  } catch (error) {
    logger.debug('Detalhe do formulário indisponível, tentando format/answers', 'attachedForms', {
      issueKey,
      formId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const simplified = await jiraFormsApiCall<JiraFormAnswer[]>(
    config,
    formsApiPath(cloudId, issueKey, `form/${encodeURIComponent(formId)}/format/answers`),
    { timeout: 20000 }
  );

  return {
    answers: normalizeFormAnswers(simplified),
    name: indexEntry?.name?.trim(),
    submitted: isFormSubmitted(indexEntry),
    updated: indexEntry?.updated,
  };
}

async function fetchFormsViaAtlassianApi(
  config: JiraConfig,
  issueKey: string,
  seedForms: JiraFormIndexEntry[] = []
): Promise<JiraAttachedForm[]> {
  const cloudId = await getJiraCloudId(config);
  if (!cloudId) return [];

  let forms = seedForms;
  if (forms.length === 0) {
    const raw = await jiraFormsApiCall<unknown>(config, formsApiPath(cloudId, issueKey), {
      timeout: 20000,
    });
    forms = parseFormIndexResponse(raw);
  }

  if (forms.length === 0) return [];

  const results: JiraAttachedForm[] = [];
  for (const form of forms) {
    const formId = form.id?.trim();
    if (!formId) continue;

    try {
      const { answers, name, submitted, updated } = await fetchFormAnswersFromApi(
        config,
        cloudId,
        issueKey,
        formId,
        form
      );

      results.push({
        id: formId,
        name: name || form.name?.trim() || 'Formulário',
        submitted,
        updated: updated ?? form.updated,
        answers,
      });
    } catch (error) {
      logger.debug('Formulário sem respostas recuperáveis', 'attachedForms', {
        issueKey,
        formId,
        error: error instanceof Error ? error.message : String(error),
      });
      results.push({
        id: formId,
        name: form.name?.trim() || 'Formulário',
        submitted: isFormSubmitted(form),
        updated: form.updated,
        answers: [],
      });
    }
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

  const cloudId = await getJiraCloudId(config);
  if (cloudId) {
    const indexEntries: JiraFormIndexEntry[] = [];
    for (const form of forms) {
      const id = resolveProformaFormId(form);
      if (!id) continue;
      indexEntries.push({
        id,
        name: form.name,
        submitted: form.submitted,
        updated: form.updated,
      });
    }

    if (indexEntries.length > 0) {
      const fromCloud = await fetchFormsViaAtlassianApi(config, issueKey, indexEntries);
      if (fromCloud.length > 0) return fromCloud;
    }
  }

  const results: JiraAttachedForm[] = [];
  for (const form of forms) {
    const formId = resolveProformaFormId(form);
    if (!formId) continue;

    let answers: JiraFormAnswer[] = [];
    try {
      const raw = await jiraProformaApiCall<JiraFormAnswer[]>(
        config,
        `issue/${encodeURIComponent(issueKey)}/form/${encodeURIComponent(formId)}/answers`,
        { timeout: 20000 }
      );
      answers = normalizeFormAnswers(raw);
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
    () => fetchFormsViaAtlassianApi(config, key),
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
  return forms.some(form => form.answers.length > 0 || form.name.trim().length > 0);
}

/** Exporta padrões para testes. */
export const attachedFormsFieldPatterns = ATTACHED_FORMS_FIELD_PATTERNS;

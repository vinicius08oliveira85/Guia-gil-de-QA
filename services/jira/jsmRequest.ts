import type { JiraTask } from '../../types';
import { logger } from '../../utils/logger';
import { formatJiraCustomFieldValue } from '../../utils/jiraCustomFieldValue';
import type { JiraConfig } from './types';
import { jiraServiceDeskApiCall } from './api';
import { getJiraFields } from './metadata';

interface JiraRequestTypeDto {
  id?: string;
  name?: string;
}

interface JiraServiceDeskDto {
  id?: string;
  projectName?: string;
  projectKey?: string;
}

interface JiraRequestFieldValue {
  fieldId?: string;
  label?: string;
  value?: unknown;
}

interface JiraRequestDto {
  issueKey?: string;
  requestType?: JiraRequestTypeDto;
  serviceDesk?: JiraServiceDeskDto;
  requestFieldValues?: JiraRequestFieldValue[];
}

export interface JiraJsmRequestSummary {
  requestTypeName?: string;
  serviceName?: string;
  sectorName?: string;
}

function pickRequestFieldValue(
  request: JiraRequestDto,
  patterns: RegExp[]
): string | undefined {
  for (const field of request.requestFieldValues ?? []) {
    const label = field.label?.trim() ?? '';
    if (!label || !patterns.some(pattern => pattern.test(label))) continue;
    const formatted = formatJiraCustomFieldValue(field.value);
    if (formatted) return formatted;
  }
  return undefined;
}

/**
 * Busca metadados da solicitação JSM (tipo, serviço e campos do portal).
 */
export async function getJsmRequestSummary(
  config: JiraConfig,
  issueKey: string
): Promise<JiraJsmRequestSummary> {
  const key = issueKey.trim().toUpperCase();
  if (!key) return {};

  try {
    const response = await jiraServiceDeskApiCall<JiraRequestDto>(
      config,
      `request/${encodeURIComponent(key)}?expand=requestType,serviceDesk`,
      { timeout: 20000 }
    );

    const requestTypeName = response.requestType?.name?.trim();
    const serviceName =
      response.serviceDesk?.projectName?.trim() ||
      pickRequestFieldValue(response, [/servi[cç]o/i]);

    const sectorName = pickRequestFieldValue(response, [/setor/i, /diretoria/i]);

    return {
      requestTypeName: requestTypeName || undefined,
      serviceName: serviceName || undefined,
      sectorName: sectorName || undefined,
    };
  } catch (error) {
    logger.debug('Metadados JSM indisponíveis para a issue', 'jsmRequest', {
      issueKey: key,
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
      completed += 1;
      onProgress?.(completed, items.length);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export interface EnrichTasksWithJsmSummaryOptions {
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Anexa Serviço, Setor/Diretoria e Tipo de solicitação às tarefas das filas.
 */
export async function enrichTasksWithJsmSummary(
  config: JiraConfig,
  tasks: JiraTask[],
  options: EnrichTasksWithJsmSummaryOptions = {}
): Promise<JiraTask[]> {
  if (tasks.length === 0) return tasks;

  const jiraFields = await getJiraFields(config).catch(() => []);
  const concurrency = options.concurrency ?? 5;

  const enriched = await mapWithConcurrency(
    tasks,
    concurrency,
    async task => {
      const summary = await getJsmRequestSummary(config, task.id);

      const serviceFieldId = jiraFields.find(f => /servi[cç]o/i.test(f.name))?.id;
      const sectorFieldId = jiraFields.find(
        f => /setor/i.test(f.name) || /diretoria/i.test(f.name)
      )?.id;
      const requestTypeFieldId = jiraFields.find(
        f => /tipo de solicita[cç][aã]o/i.test(f.name) || /request type/i.test(f.name)
      )?.id;

      const serviceFromCustom = serviceFieldId
        ? formatJiraCustomFieldValue(task.jiraCustomFields?.[serviceFieldId])
        : undefined;
      const sectorFromCustom = sectorFieldId
        ? formatJiraCustomFieldValue(task.jiraCustomFields?.[sectorFieldId])
        : undefined;
      const requestTypeFromCustom = requestTypeFieldId
        ? formatJiraCustomFieldValue(task.jiraCustomFields?.[requestTypeFieldId])
        : undefined;

      return {
        ...task,
        jiraServiceName: summary.serviceName || serviceFromCustom || task.jiraServiceName,
        jiraSectorName: summary.sectorName || sectorFromCustom || task.jiraSectorName,
        jiraRequestTypeName:
          summary.requestTypeName || requestTypeFromCustom || task.jiraRequestTypeName,
      };
    },
    options.onProgress
  );

  const withSummary = enriched.filter(
    t => t.jiraServiceName || t.jiraSectorName || t.jiraRequestTypeName
  ).length;
  logger.info(
    `Resumo JSM carregado para ${withSummary}/${tasks.length} tarefa(s)`,
    'jsmRequest'
  );

  return enriched;
}

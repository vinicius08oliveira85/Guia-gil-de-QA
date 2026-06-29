import type { JiraTask } from '../../types';
import type { JiraConfig, JiraIssue } from './types';
import { EPIC_LINK_FIELD_KEYS } from './types';
import {
  mapJiraStatusToTaskStatus,
  mapJiraTypeToTaskType,
  mapJiraPriorityToTaskPriority,
  mapJiraSeverity,
  extractEpicLink,
  extractJiraComments,
  mergeComments,
} from './mappers';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { assignStoryPointsToTask } from '../../utils/taskStoryPoints';
import { assignSprintsToTask } from '../../utils/jiraSprintFields';
import {
  buildJiraSprintSyncContext,
  fetchIssueSprintsFromAgileApi,
  type JiraSprintSyncContext,
} from './sprintSync';
import { logger } from '../../utils/logger';

export type JiraIssueToTaskOptions = {
  jiraProjectKey?: string;
  existingTask?: JiraTask;
  /** Contexto de sprint pré-carregado (evita N chamadas em importação em lote). */
  sprintCtx?: JiraSprintSyncContext;
};

/**
 * Converte uma issue do Jira em {@link JiraTask} para exibição ou fila local.
 */
export async function jiraIssueToTask(
  config: JiraConfig,
  issue: JiraIssue,
  options: JiraIssueToTaskOptions = {}
): Promise<JiraTask> {
  const { jiraProjectKey, existingTask, sprintCtx: sprintCtxInput } = options;
  const key = (issue.key || existingTask?.id || '').trim().toUpperCase();

  const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
  const isBug = taskType === 'Bug';

  let jiraAttachments: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }> = [];
  if (issue.fields?.attachment?.length) {
    jiraAttachments = issue.fields.attachment.map((att: { id: string; filename: string; size: number; created: string; author?: { displayName?: string } }) => ({
      id: att.id,
      filename: att.filename,
      size: att.size,
      created: att.created,
      author: att.author?.displayName || 'Desconhecido',
    }));
  }

  let description = '';
  if (issue.renderedFields?.description) {
    description = parseJiraDescriptionHTML(
      issue.renderedFields.description,
      config.url,
      jiraAttachments
    );
  } else if (issue.fields?.description) {
    description = parseJiraDescriptionHTML(issue.fields.description, config.url, jiraAttachments);
  }

  const jiraComments = await extractJiraComments(config, issue, jiraAttachments);
  const mergedComments = mergeComments(existingTask?.comments || [], jiraComments);
  const jiraStatusName = issue.fields?.status?.name || '';

  let assignee: 'Product' | 'QA' | 'Dev' = 'Product';
  if (issue.fields?.assignee?.emailAddress) {
    const email = issue.fields.assignee.emailAddress.toLowerCase();
    if (email.includes('qa') || email.includes('test')) assignee = 'QA';
    else if (email.includes('dev') || email.includes('developer')) assignee = 'Dev';
  } else if (existingTask?.assignee) {
    assignee = existingTask.assignee;
  }

  const task: JiraTask = {
    id: key,
    title: issue.fields?.summary || 'Sem título',
    description,
    jiraIssueTypeIconUrl: issue.fields?.issuetype?.iconUrl,
    status: mapJiraStatusToTaskStatus(jiraStatusName),
    jiraStatus: jiraStatusName,
    type: taskType,
    priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
    jiraPriority: issue.fields?.priority?.name,
    createdAt: existingTask?.createdAt || issue.fields?.created || new Date().toISOString(),
    updatedAt: issue.fields?.updated || existingTask?.updatedAt,
    completedAt: issue.fields?.resolutiondate,
    tags: issue.fields?.labels || [],
    testCases: existingTask?.testCases ?? [],
    bddScenarios: existingTask?.bddScenarios ?? [],
    comments: mergedComments,
    parentId: issue.fields?.parent?.key,
    epicKey: extractEpicLink(issue.fields),
    assignee,
    dueDate: issue.fields?.duedate,
    timeTracking: issue.fields?.timetracking
      ? {
          originalEstimate: issue.fields.timetracking.originalEstimate,
          remainingEstimate: issue.fields.timetracking.remainingEstimate,
          timeSpent: issue.fields.timetracking.timeSpent,
        }
      : undefined,
    components: issue.fields?.components?.map((c: { id: string; name: string }) => ({
      id: c.id,
      name: c.name,
    })),
    fixVersions: issue.fields?.fixVersions?.map((v: { id: string; name: string }) => ({
      id: v.id,
      name: v.name,
    })),
    environment: issue.fields?.environment,
    reporter: issue.fields?.reporter
      ? {
          displayName: issue.fields.reporter.displayName,
          emailAddress: issue.fields.reporter.emailAddress,
        }
      : undefined,
    jiraAssignee: issue.fields?.assignee
      ? {
          displayName: issue.fields.assignee.displayName,
          emailAddress: issue.fields.assignee.emailAddress,
        }
      : undefined,
    watchers: issue.fields?.watches
      ? {
          watchCount: issue.fields.watches.watchCount || 0,
          isWatching: issue.fields.watches.isWatching || false,
        }
      : undefined,
    issueLinks: issue.fields?.issuelinks?.map((l: {
      id: string;
      type?: { name?: string };
      outwardIssue?: { key?: string };
      inwardIssue?: { key?: string };
    }) => ({
      id: l.id,
      type: l.type?.name || '',
      relatedKey: l.outwardIssue?.key || l.inwardIssue?.key || '',
      direction: l.outwardIssue ? ('outward' as const) : ('inward' as const),
    })),
    jiraAttachments: jiraAttachments.length ? jiraAttachments : undefined,
    testStrategy: existingTask?.testStrategy,
    toolsUsed: existingTask?.toolsUsed,
    executedStrategies: existingTask?.executedStrategies,
    strategyTools: existingTask?.strategyTools,
    testStatus: existingTask?.testStatus,
    isFavorite: existingTask?.isFavorite,
  };

  if (isBug) {
    task.severity = mapJiraSeverity(issue.fields?.labels);
  } else if (existingTask?.severity) {
    task.severity = existingTask.severity;
  }

  const standardFields = [
    'summary',
    'description',
    'issuetype',
    'status',
    'priority',
    'assignee',
    'reporter',
    'created',
    'updated',
    'resolutiondate',
    'labels',
    'parent',
    'subtasks',
    'comment',
    'duedate',
    'timetracking',
    'components',
    'fixVersions',
    'environment',
    'watches',
    'issuelinks',
    'attachment',
  ];
  const customFields: Record<string, unknown> = {};
  Object.keys(issue.fields || {}).forEach(k => {
    if (!standardFields.includes(k) && !k.startsWith('_') && !EPIC_LINK_FIELD_KEYS.includes(k)) {
      customFields[k] = issue.fields![k];
    }
  });
  if (Object.keys(customFields).length > 0) {
    task.jiraCustomFields = customFields;
    logger.debug('jiraCustomFields keys', 'jiraIssueToTask', {
      issueKey: key,
      keys: Object.keys(task.jiraCustomFields),
    });
  }

  assignStoryPointsToTask(task);

  const sprintOpts =
    sprintCtxInput ??
    (jiraProjectKey ? await buildJiraSprintSyncContext(config, jiraProjectKey) : null);

  if (sprintOpts) {
    await assignSprintsToTask(task, {
      issueFields: issue.fields as Record<string, unknown>,
      sprintFieldIds: sprintOpts.sprintFieldIds,
      sprintCatalog: sprintOpts.sprintCatalog,
      agileFallback: () =>
        fetchIssueSprintsFromAgileApi(config, key, sprintOpts.sprintFieldIds, sprintOpts.sprintCatalog),
    });
  }

  return task;
}

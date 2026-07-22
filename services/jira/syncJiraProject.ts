import type { Project, JiraTask } from '../../types';
import type { JiraConfig } from './types';
import { EPIC_LINK_FIELD_KEYS } from './types';
import { assignStoryPointsToTask } from '../../utils/taskStoryPoints';
import { assignSprintsToTaskSync, sprintsSnapshotEqual } from '../../utils/jiraSprintFields';
import { buildJiraSprintSyncContext } from './sprintSync';
import { getJiraIssues } from './issues';
import {
  mapJiraStatusToTaskStatus,
  mapJiraTypeToTaskType,
  mapJiraPriorityToTaskPriority,
  mapJiraSeverity,
  extractEpicLink,
  extractJiraComments,
  mergeComments,
} from './mappers';
import { loadTestStatusesByJiraKeys } from '../localTestStatusService';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { getJiraStatusColor } from '../../utils/jiraStatusColors';
import { logger } from '../../utils/logger';
import { normalizeTasksParentIdsAcyclic } from '../../utils/taskParentCycle';
import { mergeTaskTestCases } from '../../utils/jiraTestCaseMerge';
import { validateAndRestoreTestStatuses, hasTaskChanges } from './syncValidator';

export const syncJiraProject = async (
  config: JiraConfig,
  project: Project,
  jiraProjectKey: string,
  getLatestProject?: () => Project | undefined,
  updatedAfter?: string
): Promise<Project> => {
  const sprintCtx = await buildJiraSprintSyncContext(config, jiraProjectKey);
  const jiraIssues = await getJiraIssues(config, jiraProjectKey, undefined, undefined, {
    sprintFieldIds: sprintCtx.sprintFieldIds,
    updatedAfter,
  });

  logger.info(`Buscadas ${jiraIssues.length} issues do Jira para projeto ${jiraProjectKey}`, 'jiraService');

  const jiraKeys = jiraIssues.map(issue => issue.key).filter(Boolean) as string[];
  const savedTestStatuses = await loadTestStatusesByJiraKeys(jiraKeys);

  let projectToUse = project;
  const latestProjectFromStore = getLatestProject?.();
  if (latestProjectFromStore) {
    projectToUse = latestProjectFromStore;
    logger.info(`USANDO PROJETO DO STORE para ${project.id}`, 'jiraService', {
      tasksStore: latestProjectFromStore.tasks.length,
      tasksParam: project.tasks.length,
    });
  }

  const updatedTasks = [...projectToUse.tasks];
  let updatedCount = 0;
  let newCount = 0;

  const originalTasksMap = new Map<string, JiraTask>();
  projectToUse.tasks.forEach(task => {
    if (task.id) originalTasksMap.set(task.id, task);
  });

  for (const issue of jiraIssues) {
    const latestFromStore = getLatestProject?.();
    if (latestFromStore && issue.key) {
      const latestTask = latestFromStore.tasks.find(t => t.id === issue.key);
      if (latestTask) originalTasksMap.set(issue.key, latestTask);
    }

    const existingIndex = updatedTasks.findIndex(t => t.id === issue.key);
    const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
    const isBug = taskType === 'Bug';

    const jiraAttachments = (issue.fields?.attachment || []).map((att: any) => ({
      id: att.id,
      filename: att.filename,
      size: att.size,
      created: att.created,
      author: att.author?.displayName || 'Desconhecido',
    }));

    let description = '';
    if (issue.renderedFields?.description) {
      description = parseJiraDescriptionHTML(issue.renderedFields.description, config.url, jiraAttachments);
    } else if (issue.fields?.description) {
      description = parseJiraDescriptionHTML(issue.fields.description, config.url, jiraAttachments);
    }

    const jiraComments = await extractJiraComments(config, issue, jiraAttachments);
    const existingComments = existingIndex >= 0 ? updatedTasks[existingIndex].comments || [] : [];
    const mergedComments = mergeComments(existingComments, jiraComments);

    const jiraStatusName = issue.fields?.status?.name || '';
    const jiraKey = issue.key || `jira-${Date.now()}-${Math.random()}`;

    const originalTask = jiraKey ? originalTasksMap.get(jiraKey) : undefined;
    const existingTestCases = originalTask?.testCases || [];
    const savedTestCases = savedTestStatuses.get(jiraKey) || [];

    const { testCases: mergedTestCases } = mergeTaskTestCases(
      existingTestCases,
      savedTestCases,
      jiraKey,
      'syncJiraProject'
    );

    const task: JiraTask = {
      id: jiraKey,
      title: issue.fields?.summary || 'Sem título',
      description: description || '',
      jiraIssueTypeIconUrl: issue.fields?.issuetype?.iconUrl,
      status: mapJiraStatusToTaskStatus(jiraStatusName),
      jiraStatus: jiraStatusName,
      type: taskType,
      priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
      jiraPriority: issue.fields?.priority?.name,
      createdAt: issue.fields?.created || new Date().toISOString(),
      completedAt: issue.fields?.resolutiondate || undefined,
      tags: issue.fields?.labels || [],
      testCases: mergedTestCases,
      bddScenarios: existingIndex >= 0 ? updatedTasks[existingIndex].bddScenarios : [],
      comments: mergedComments,
    };

    if (isBug) task.severity = mapJiraSeverity(issue.fields?.labels);
    if (issue.fields?.parent?.key) {
      task.parentId = issue.fields.parent.key;
    } else {
      task.parentId = undefined;
    }
    const epicKey = extractEpicLink(issue.fields);
    if (epicKey) {
      task.epicKey = epicKey;
    } else {
      task.epicKey = undefined;
    }
    if (issue.fields?.assignee?.emailAddress) {
      const email = issue.fields.assignee.emailAddress.toLowerCase();
      if (email.includes('qa') || email.includes('test')) task.assignee = 'QA';
      else if (email.includes('dev') || email.includes('developer')) task.assignee = 'Dev';
      else task.assignee = 'Product';
    } else {
      task.assignee = existingIndex >= 0 ? updatedTasks[existingIndex].assignee : 'Product';
    }
    if (issue.fields?.assignee) {
      task.jiraAssignee = { displayName: issue.fields.assignee.displayName, emailAddress: issue.fields.assignee.emailAddress };
    } else {
      task.jiraAssignee = undefined;
    }
    if (issue.fields?.duedate) {
      task.dueDate = issue.fields.duedate;
    } else {
      task.dueDate = undefined;
    }
    if (issue.fields?.timetracking) {
      task.timeTracking = {
        originalEstimate: issue.fields.timetracking.originalEstimate,
        remainingEstimate: issue.fields.timetracking.remainingEstimate,
        timeSpent: issue.fields.timetracking.timeSpent,
      };
    } else {
      task.timeTracking = undefined;
    }
    if (issue.fields?.components?.length) {
      task.components = issue.fields.components.map((comp: any) => ({ id: comp.id, name: comp.name }));
    } else {
      task.components = undefined;
    }
    if (issue.fields?.fixVersions?.length) {
      task.fixVersions = issue.fields.fixVersions.map((version: any) => ({ id: version.id, name: version.name }));
    } else {
      task.fixVersions = undefined;
    }
    if (issue.fields?.environment) {
      task.environment = issue.fields.environment;
    } else {
      task.environment = undefined;
    }
    if (issue.fields?.reporter) {
      task.reporter = { displayName: issue.fields.reporter.displayName, emailAddress: issue.fields.reporter.emailAddress };
    } else {
      task.reporter = undefined;
    }
    if (issue.fields?.watches) {
      task.watchers = { watchCount: issue.fields.watches.watchCount || 0, isWatching: issue.fields.watches.isWatching || false };
    } else {
      task.watchers = undefined;
    }
    if (issue.fields?.issuelinks?.length) {
      task.issueLinks = issue.fields.issuelinks.map((link: any) => ({
        id: link.id,
        type: link.type?.name || '',
        relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
        direction: link.outwardIssue ? 'outward' : 'inward',
      }));
    } else {
      task.issueLinks = undefined;
    }
    if (issue.fields?.attachment?.length) {
      task.jiraAttachments = issue.fields.attachment.map((att: any) => ({
        id: att.id,
        filename: att.filename,
        size: att.size,
        created: att.created,
        author: att.author?.displayName || 'Desconhecido',
      }));
    } else {
      task.jiraAttachments = undefined;
    }

    const standardFields = [
      'summary', 'description', 'issuetype', 'status', 'priority', 'assignee',
      'reporter', 'created', 'updated', 'resolutiondate', 'labels', 'parent',
      'subtasks', 'comment', 'duedate', 'timetracking', 'components', 'fixVersions',
      'environment', 'watches', 'issuelinks', 'attachment',
    ];
    const customFields: { [key: string]: any } = {};
    Object.keys(issue.fields).forEach(key => {
      if (!standardFields.includes(key) && !key.startsWith('_') && !EPIC_LINK_FIELD_KEYS.includes(key)) {
        customFields[key] = issue.fields[key];
      }
    });
    if (Object.keys(customFields).length > 0) {
      task.jiraCustomFields = customFields;
    } else {
      task.jiraCustomFields = undefined;
    }
    assignStoryPointsToTask(task);
    assignSprintsToTaskSync(task, {
      issueFields: issue.fields as Record<string, unknown>,
      sprintFieldIds: sprintCtx.sprintFieldIds,
      sprintCatalog: sprintCtx.sprintCatalog,
    });

    if (existingIndex >= 0) {
      const oldTask = updatedTasks[existingIndex];
      const jiraStatusChanged = oldTask.jiraStatus !== jiraStatusName;

      if (hasTaskChanges(oldTask, task)) {
        const originalForFinal = task.id ? originalTasksMap.get(task.id) : undefined;
        const finalTestCases = originalForFinal?.testCases?.length
          ? originalForFinal.testCases
          : task.testCases;

        updatedTasks[existingIndex] = {
          ...oldTask,
          title: task.title,
          description: task.description,
          status: task.status,
          jiraStatus: jiraStatusName || task.jiraStatus,
          type: task.type,
          priority: task.priority,
          jiraPriority: task.jiraPriority,
          jiraAssignee: task.jiraAssignee,
          tags: task.tags,
          severity: task.severity,
          completedAt: task.completedAt,
          dueDate: task.dueDate,
          parentId: task.parentId,
          epicKey: task.epicKey,
          assignee: task.assignee,
          timeTracking: task.timeTracking,
          components: task.components,
          fixVersions: task.fixVersions,
          environment: task.environment,
          reporter: task.reporter,
          watchers: task.watchers,
          issueLinks: task.issueLinks,
          jiraAttachments: task.jiraAttachments,
          jiraCustomFields: task.jiraCustomFields,
          sprints: task.sprints,
          storyPoints: task.storyPoints,
          comments: task.comments,
          testCases: finalTestCases,
          bddScenarios: oldTask.bddScenarios || [],
          testStrategy: oldTask.testStrategy,
          toolsUsed: oldTask.toolsUsed,
          executedStrategies: oldTask.executedStrategies,
          strategyTools: oldTask.strategyTools,
          testStatus: oldTask.testStatus,
          linkedBusinessRuleIds: oldTask.linkedBusinessRuleIds,
          linkedBusinessRuleCategories: oldTask.linkedBusinessRuleCategories,
          createdAt: oldTask.createdAt || task.createdAt,
        };
        updatedCount++;
      } else {
        const originalNoChanges = task.id ? originalTasksMap.get(task.id) : undefined;
        const testCasesNoChanges = originalNoChanges?.testCases?.length
          ? originalNoChanges.testCases
          : (originalTask?.testCases || []);

        updatedTasks[existingIndex] = {
          ...oldTask,
          jiraStatus: jiraStatusName,
          status: mapJiraStatusToTaskStatus(jiraStatusName),
          testCases: testCasesNoChanges,
          testStatus: oldTask.testStatus,
        };

        if (jiraStatusChanged) {
          logger.info(`jiraStatus atualizado para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`, 'jiraService');
        }
      }
    } else {
      logger.info(`Nova tarefa encontrada: ${task.id} - ${task.title}`, 'jiraService');
      updatedTasks.push(task);
      newCount++;
    }
  }

  const finalTasks = validateAndRestoreTestStatuses(originalTasksMap, updatedTasks, getLatestProject);

  const existingStatusNames = new Set(
    (projectToUse.settings?.jiraStatuses || []).map(s => (typeof s === 'string' ? s : s.name))
  );
  const newStatuses: Array<{ name: string; color: string }> = [];
  finalTasks.forEach(task => {
    if (task.jiraStatus && !existingStatusNames.has(task.jiraStatus)) {
      existingStatusNames.add(task.jiraStatus);
      newStatuses.push({ name: task.jiraStatus, color: getJiraStatusColor(task.jiraStatus) });
    }
  });
  const mergedJiraStatuses = [...(projectToUse.settings?.jiraStatuses || []), ...newStatuses];

  const tasksNormalized = normalizeTasksParentIdsAcyclic(finalTasks);

  return {
    ...projectToUse,
    lastJiraSyncAt: new Date().toISOString(),
    tasks: tasksNormalized,
    settings: {
      ...projectToUse.settings,
      jiraStatuses: mergedJiraStatuses.length > 0 ? mergedJiraStatuses : projectToUse.settings?.jiraStatuses,
    },
  };
};

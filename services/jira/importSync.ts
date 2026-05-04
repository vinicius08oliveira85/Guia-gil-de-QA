import type { Project, JiraTask } from '../../types';
import type { JiraConfig } from './types';
import { EPIC_LINK_FIELD_KEYS } from './types';
import { getJiraProjects, getJiraStatuses, getJiraPriorities } from './metadata';
import { getJiraIssues } from './issues';
import {
  mapJiraStatusToTaskStatus,
  mapJiraTypeToTaskType,
  mapJiraPriorityToTaskPriority,
  mapJiraSeverity,
  extractEpicLink,
  extractJiraComments,
} from './mappers';
import { loadTestStatusesByJiraKeys } from '../supabaseService';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { logger } from '../../utils/logger';
import { normalizeTasksParentIdsAcyclic } from '../../utils/taskParentCycle';

export const importJiraProject = async (
  config: JiraConfig,
  jiraProjectKey: string,
  onProgress?: (current: number, total?: number) => void
): Promise<Project> => {
  const jiraProjects = await getJiraProjects(config);
  const jiraProject = jiraProjects.find(p => p.key === jiraProjectKey);

  if (!jiraProject) {
    throw new Error(`Projeto ${jiraProjectKey} não encontrado no Jira`);
  }

  const jiraStatuses = await getJiraStatuses(config, jiraProjectKey);
  const jiraPriorities = await getJiraPriorities(config);

  const jiraIssues = await getJiraIssues(config, jiraProjectKey, undefined, onProgress);

  const jiraKeys = jiraIssues.map(issue => issue.key).filter(Boolean) as string[];
  const savedTestStatuses = await loadTestStatusesByJiraKeys(jiraKeys);

  logger.info(`Buscando status de testes para ${jiraKeys.length} chaves Jira`, 'jiraService');

  const tasks: JiraTask[] = await Promise.all(
    jiraIssues.map(async (issue, index) => {
      const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
      const isBug = taskType === 'Bug';

      let jiraAttachments: Array<{
        id: string;
        filename: string;
        size: number;
        created: string;
        author: string;
      }> = [];
      if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
        jiraAttachments = issue.fields.attachment.map((att: any) => ({
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
        description = parseJiraDescriptionHTML(
          issue.fields.description,
          config.url,
          jiraAttachments
        );
      }

      if (index < 3) {
        logger.debug(`Tarefa ${issue.key}`, 'jiraService', {
          title: issue.fields?.summary,
          type: taskType,
          hasDescription: !!description,
          descriptionLength: description.length,
          descriptionPreview: description.substring(0, 100),
          attachmentsCount: jiraAttachments.length,
        });
      }

      const jiraComments = await extractJiraComments(config, issue, jiraAttachments);

      const jiraStatusName = issue.fields?.status?.name || '';
      const jiraKey = issue.key || `jira-${Date.now()}-${Math.random()}`;

      const savedTestCases = savedTestStatuses.get(jiraKey) || [];

      const task: JiraTask = {
        id: jiraKey,
        title: issue.fields?.summary || 'Sem título',
        description: description || '',
        status: mapJiraStatusToTaskStatus(jiraStatusName),
        jiraStatus: jiraStatusName,
        type: taskType,
        priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
        jiraPriority: issue.fields?.priority?.name,
        createdAt: issue.fields?.created || new Date().toISOString(),
        completedAt: issue.fields?.resolutiondate,
        tags: issue.fields?.labels || [],
        testCases: savedTestCases,
        bddScenarios: [],
        comments: jiraComments,
      };

      if (savedTestCases.length > 0) {
        logger.debug(
          `Preservando ${savedTestCases.length} testCases salvos para ${jiraKey}`,
          'jiraService'
        );
      }

      if (isBug) {
        task.severity = mapJiraSeverity(issue.fields?.labels);
      }

      if (issue.fields?.parent?.key) {
        task.parentId = issue.fields.parent.key;
      }

      const epicKey = extractEpicLink(issue.fields);
      if (epicKey) {
        task.epicKey = epicKey;
      }

      if (issue.fields?.assignee?.emailAddress) {
        const email = issue.fields.assignee.emailAddress.toLowerCase();
        if (email.includes('qa') || email.includes('test')) {
          task.assignee = 'QA';
        } else if (email.includes('dev') || email.includes('developer')) {
          task.assignee = 'Dev';
        } else {
          task.assignee = 'Product';
        }
      } else {
        task.assignee = 'Product';
      }
      if (issue.fields?.assignee) {
        task.jiraAssignee = {
          displayName: issue.fields.assignee.displayName,
          emailAddress: issue.fields.assignee.emailAddress,
        };
      } else {
        task.jiraAssignee = undefined;
      }

      if (issue.fields?.duedate) {
        task.dueDate = issue.fields.duedate;
      }

      if (issue.fields?.timetracking) {
        task.timeTracking = {
          originalEstimate: issue.fields.timetracking.originalEstimate,
          remainingEstimate: issue.fields.timetracking.remainingEstimate,
          timeSpent: issue.fields.timetracking.timeSpent,
        };
      }

      if (issue.fields?.components && issue.fields.components.length > 0) {
        task.components = issue.fields.components.map((comp: any) => ({
          id: comp.id,
          name: comp.name,
        }));
      }

      if (issue.fields?.fixVersions && issue.fields.fixVersions.length > 0) {
        task.fixVersions = issue.fields.fixVersions.map((version: any) => ({
          id: version.id,
          name: version.name,
        }));
      }

      if (issue.fields?.environment) {
        task.environment = issue.fields.environment;
      }

      if (issue.fields?.reporter) {
        task.reporter = {
          displayName: issue.fields.reporter.displayName,
          emailAddress: issue.fields.reporter.emailAddress,
        };
      }

      if (issue.fields?.watches) {
        task.watchers = {
          watchCount: issue.fields.watches.watchCount || 0,
          isWatching: issue.fields.watches.isWatching || false,
        };
      }

      if (issue.fields?.issuelinks && issue.fields.issuelinks.length > 0) {
        task.issueLinks = issue.fields.issuelinks.map((link: any) => ({
          id: link.id,
          type: link.type?.name || '',
          relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
          direction: link.outwardIssue ? 'outward' : 'inward',
        }));
      }

      if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
        task.jiraAttachments = issue.fields.attachment.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          size: att.size,
          created: att.created,
          author: att.author?.displayName || 'Desconhecido',
        }));
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
      const customFields: { [key: string]: any } = {};
      Object.keys(issue.fields).forEach(key => {
        if (
          !standardFields.includes(key) &&
          !key.startsWith('_') &&
          !EPIC_LINK_FIELD_KEYS.includes(key)
        ) {
          customFields[key] = issue.fields[key];
        }
      });
      if (Object.keys(customFields).length > 0) {
        task.jiraCustomFields = customFields;
      }

      return task;
    })
  );

  const tasksNormalized = normalizeTasksParentIdsAcyclic(tasks);

  const project: Project = {
    id: `jira-${jiraProject.id}-${Date.now()}`,
    name: jiraProject.name,
    description: jiraProject.description || `Projeto importado do Jira: ${jiraProjectKey}`,
    documents: [],
    businessRules: [],
    tasks: tasksNormalized,
    phases: [],
    tags: [],
    settings: {
      jiraStatuses: jiraStatuses,
      jiraPriorities: jiraPriorities?.length ? jiraPriorities : undefined,
      jiraProjectKey: jiraProjectKey,
    },
  };

  return project;
};

export const addNewJiraTasks = async (
  config: JiraConfig,
  project: Project,
  jiraProjectKey: string,
  onProgress?: (current: number, total?: number) => void
): Promise<{ project: Project; newTasksCount: number; updatedStatusCount: number }> => {
  let jiraStatuses = project.settings?.jiraStatuses;
  if (!jiraStatuses || jiraStatuses.length === 0) {
    jiraStatuses = await getJiraStatuses(config, jiraProjectKey);
  }
  let jiraPriorities = project.settings?.jiraPriorities;
  if (!jiraPriorities || jiraPriorities.length === 0) {
    jiraPriorities = await getJiraPriorities(config);
  }

  const jiraIssues = await getJiraIssues(config, jiraProjectKey, undefined, onProgress);

  const existingTasksMap = new Map(project.tasks.map(t => [t.id, t]));

  const newIssues = jiraIssues.filter(issue => !existingTasksMap.has(issue.key));

  const updatedStatusCount = 0;

  if (newIssues.length === 0) {
    return { project, newTasksCount: 0, updatedStatusCount };
  }

  const newTasks: JiraTask[] = await Promise.all(
    newIssues.map(async issue => {
      const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
      const isBug = taskType === 'Bug';

      let jiraAttachments: Array<{
        id: string;
        filename: string;
        size: number;
        created: string;
        author: string;
      }> = [];
      if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
        jiraAttachments = issue.fields.attachment.map((att: any) => ({
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
        description = parseJiraDescriptionHTML(
          issue.fields.description,
          config.url,
          jiraAttachments
        );
      }

      const jiraComments = await extractJiraComments(config, issue, jiraAttachments);

      const jiraStatusName = issue.fields?.status?.name || '';
      const task: JiraTask = {
        id: issue.key || `jira-${Date.now()}-${Math.random()}`,
        title: issue.fields?.summary || 'Sem título',
        description: description || '',
        status: mapJiraStatusToTaskStatus(jiraStatusName),
        jiraStatus: jiraStatusName,
        type: taskType,
        priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
        jiraPriority: issue.fields?.priority?.name,
        createdAt: issue.fields?.created || new Date().toISOString(),
        completedAt: issue.fields?.resolutiondate,
        tags: issue.fields?.labels || [],
        testCases: [],
        bddScenarios: [],
        comments: jiraComments,
      };

      if (isBug) {
        task.severity = mapJiraSeverity(issue.fields?.labels);
      }

      if (issue.fields?.parent?.key) {
        task.parentId = issue.fields.parent.key;
      }

      const epicKey = extractEpicLink(issue.fields);
      if (epicKey) {
        task.epicKey = epicKey;
      }

      if (issue.fields?.assignee?.emailAddress) {
        const email = issue.fields.assignee.emailAddress.toLowerCase();
        if (email.includes('qa') || email.includes('test')) {
          task.assignee = 'QA';
        } else if (email.includes('dev') || email.includes('developer')) {
          task.assignee = 'Dev';
        } else {
          task.assignee = 'Product';
        }
      } else {
        task.assignee = 'Product';
      }
      if (issue.fields?.assignee) {
        task.jiraAssignee = {
          displayName: issue.fields.assignee.displayName,
          emailAddress: issue.fields.assignee.emailAddress,
        };
      } else {
        task.jiraAssignee = undefined;
      }

      if (issue.fields?.duedate) {
        task.dueDate = issue.fields.duedate;
      }

      if (issue.fields?.timetracking) {
        task.timeTracking = {
          originalEstimate: issue.fields.timetracking.originalEstimate,
          remainingEstimate: issue.fields.timetracking.remainingEstimate,
          timeSpent: issue.fields.timetracking.timeSpent,
        };
      }

      if (issue.fields?.components && issue.fields.components.length > 0) {
        task.components = issue.fields.components.map((comp: any) => ({
          id: comp.id,
          name: comp.name,
        }));
      }

      if (issue.fields?.fixVersions && issue.fields.fixVersions.length > 0) {
        task.fixVersions = issue.fields.fixVersions.map((version: any) => ({
          id: version.id,
          name: version.name,
        }));
      }

      if (issue.fields?.environment) {
        task.environment = issue.fields.environment;
      }

      if (issue.fields?.reporter) {
        task.reporter = {
          displayName: issue.fields.reporter.displayName,
          emailAddress: issue.fields.reporter.emailAddress,
        };
      }

      if (issue.fields?.watches) {
        task.watchers = {
          watchCount: issue.fields.watches.watchCount || 0,
          isWatching: issue.fields.watches.isWatching || false,
        };
      }

      if (issue.fields?.issuelinks && issue.fields.issuelinks.length > 0) {
        task.issueLinks = issue.fields.issuelinks.map((link: any) => ({
          id: link.id,
          type: link.type?.name || '',
          relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
          direction: link.outwardIssue ? 'outward' : 'inward',
        }));
      }

      if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
        task.jiraAttachments = issue.fields.attachment.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          size: att.size,
          created: att.created,
          author: att.author?.displayName || 'Desconhecido',
        }));
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
      const customFields: { [key: string]: any } = {};
      Object.keys(issue.fields).forEach(key => {
        if (
          !standardFields.includes(key) &&
          !key.startsWith('_') &&
          !EPIC_LINK_FIELD_KEYS.includes(key)
        ) {
          customFields[key] = issue.fields[key];
        }
      });
      if (Object.keys(customFields).length > 0) {
        task.jiraCustomFields = customFields;
      }

      return task;
    })
  );

  const allTasks = normalizeTasksParentIdsAcyclic([...project.tasks, ...newTasks]);

  return {
    project: {
      ...project,
      tasks: allTasks,
      settings: {
        ...project.settings,
        jiraStatuses: jiraStatuses,
        jiraPriorities: jiraPriorities?.length ? jiraPriorities : project.settings?.jiraPriorities,
        jiraProjectKey: jiraProjectKey,
      },
    },
    newTasksCount: newTasks.length,
    updatedStatusCount,
  };
};

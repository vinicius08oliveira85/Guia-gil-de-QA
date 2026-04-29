import type { Project, JiraTask, TestCase } from '../../types';
import type { JiraConfig } from './types';
import { EPIC_LINK_FIELD_KEYS } from './types';
import { jiraApiCall } from './api';
import { getJiraIssueByKey } from './issues';
import {
    mapJiraStatusToTaskStatus,
    mapJiraTypeToTaskType,
    mapJiraPriorityToTaskPriority,
    mapJiraSeverity,
    extractEpicLink,
    extractJiraComments,
    mergeComments,
    jiraIssueToTaskFormData,
} from './mappers';
import { loadTestStatusesByJiraKeys } from '../supabaseService';
import { mergeTestCases } from '../../utils/testCaseMerge';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { isValidJiraKey } from '../../utils/jiraFieldMapper';
import { logger } from '../../utils/logger';
import { normalizeTasksParentIdsAcyclic } from '../../utils/taskParentCycle';

export const updateJiraIssue = async (
    config: JiraConfig,
    issueKey: string,
    fieldsToUpdate: { [key: string]: any }
): Promise<void> => {
    const endpoint = `issue/${issueKey}`;
    const body = {
        fields: fieldsToUpdate,
    };

    await jiraApiCall<void>(
        config,
        endpoint,
        {
            method: 'PUT',
            body: JSON.stringify(body),
        }
    );
};

export const syncTaskToJira = async (
    config: JiraConfig,
    task: JiraTask
): Promise<void> => {
    const jiraKeyMatch = task.id.match(/^[A-Z]+-\d+$/);
    if (!jiraKeyMatch) {
        throw new Error(`Tarefa ${task.id} não é uma issue do Jira válida`);
    }

    const issueKey = task.id;
    const fieldsToUpdate: { [key: string]: any } = {};

    if (task.dueDate) {
        fieldsToUpdate.duedate = task.dueDate;
    }

    if (task.timeTracking) {
        fieldsToUpdate.timetracking = {};
        if (task.timeTracking.originalEstimate) {
            fieldsToUpdate.timetracking.originalEstimate = task.timeTracking.originalEstimate;
        }
        if (task.timeTracking.remainingEstimate) {
            fieldsToUpdate.timetracking.remainingEstimate = task.timeTracking.remainingEstimate;
        }
        if (task.timeTracking.timeSpent) {
            fieldsToUpdate.timetracking.timeSpent = task.timeTracking.timeSpent;
        }
    }

    if (task.environment !== undefined) {
        fieldsToUpdate.environment = task.environment;
    }

    if (task.components && task.components.length > 0) {
        fieldsToUpdate.components = task.components.map(comp => ({ id: comp.id }));
    }

    if (task.fixVersions && task.fixVersions.length > 0) {
        fieldsToUpdate.fixVersions = task.fixVersions.map(version => ({ id: version.id }));
    }

    const readOnlyFields = [
        'project', 'statusCategory', 'statuscategorychangedate', 'aggregatetimespent',
        'progress', 'workratio', 'creator', 'votes', 'worklog', 'aggregateprogress',
        'aggregatetimeestimate', 'timeoriginalestimate', 'timespent', 'timeestimate',
        'resolution', 'resolutiondate', 'updated', 'created',
    ];

    if (task.jiraCustomFields) {
        const filteredFields: string[] = [];
        Object.keys(task.jiraCustomFields).forEach((key) => {
            if (readOnlyFields.includes(key)) {
                filteredFields.push(key);
                logger.debug(`Campo somente leitura filtrado: ${key}`, 'jiraService');
                return;
            }

            const value = task.jiraCustomFields![key];

            if (value === null || value === undefined) {
                return;
            }

            if (typeof value === 'object' && value !== null) {
                if (value.id) {
                    fieldsToUpdate[key] = { id: value.id };
                } else if (value.key) {
                    fieldsToUpdate[key] = { key: value.key };
                } else {
                    fieldsToUpdate[key] = value;
                }
            } else {
                fieldsToUpdate[key] = value;
            }
        });

        if (filteredFields.length > 0) {
            logger.debug(`${filteredFields.length} campo(s) somente leitura filtrado(s) para ${issueKey}: ${filteredFields.join(', ')}`, 'jiraService');
        }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        throw new Error('Nenhum campo para atualizar');
    }

    await updateJiraIssue(config, issueKey, fieldsToUpdate);
};

export const fetchJiraTaskFormDataByKey = async (
    config: JiraConfig,
    issueKey: string
) => {
    const issue = await getJiraIssueByKey(config, issueKey.trim());
    return jiraIssueToTaskFormData(issue, config);
};

/**
 * Atualiza uma única tarefa do projeto com os dados atuais do Jira (por ID).
 */
export const updateSingleTaskFromJira = async (
    config: JiraConfig,
    project: Project,
    issueKey: string
): Promise<Project> => {
    const key = issueKey.trim().toUpperCase();
    if (!isValidJiraKey(key)) {
        throw new Error(`ID inválido. Use o formato PROJ-123.`);
    }
    const issue = await getJiraIssueByKey(config, key);
    const existingTask = project.tasks.find(t => t.id === key);
    const savedTestStatuses = await loadTestStatusesByJiraKeys([key]);
    const savedTestCases = savedTestStatuses.get(key) || [];

    const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
    const isBug = taskType === 'Bug';
    let jiraAttachments: Array<{ id: string; filename: string; size: number; created: string; author: string }> = [];
    if (issue.fields?.attachment?.length) {
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
        description = parseJiraDescriptionHTML(issue.renderedFields.description, config.url, jiraAttachments);
    } else if (issue.fields?.description) {
        description = parseJiraDescriptionHTML(issue.fields.description, config.url, jiraAttachments);
    }
    const jiraComments = await extractJiraComments(config, issue, jiraAttachments);
    const existingComments = existingTask?.comments || [];
    const mergedComments = mergeComments(existingComments, jiraComments);
    const jiraStatusName = issue.fields?.status?.name || '';
    const existingTestCases = existingTask?.testCases || [];
    const existingWithStatus = existingTestCases.filter(tc => tc.status !== 'Not Run').length;
    let mergedTestCases: TestCase[];
    if (existingTestCases.length > 0 && existingWithStatus > 0) {
        const existingIds = new Set(existingTestCases.map(tc => tc.id).filter(Boolean));
        mergedTestCases = [...existingTestCases];
        for (const sc of savedTestCases) {
            if (sc.id && !existingIds.has(sc.id)) mergedTestCases.push(sc);
        }
    } else {
        mergedTestCases = existingTestCases.length > 0
            ? mergeTestCases(existingTestCases, savedTestCases)
            : savedTestCases;
    }
    let assignee: 'Product' | 'QA' | 'Dev' = 'Product';
    if (issue.fields?.assignee?.emailAddress) {
        const email = issue.fields.assignee.emailAddress.toLowerCase();
        if (email.includes('qa') || email.includes('test')) assignee = 'QA';
        else if (email.includes('dev') || email.includes('developer')) assignee = 'Dev';
    } else if (existingTask) {
        assignee = existingTask.assignee ?? 'Product';
    }
    const task: JiraTask = {
        id: key,
        title: issue.fields?.summary || 'Sem título',
        description,
        status: mapJiraStatusToTaskStatus(jiraStatusName),
        jiraStatus: jiraStatusName,
        type: taskType,
        priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
        jiraPriority: issue.fields?.priority?.name,
        createdAt: existingTask?.createdAt || issue.fields?.created || new Date().toISOString(),
        completedAt: issue.fields?.resolutiondate,
        tags: issue.fields?.labels || [],
        testCases: mergedTestCases,
        bddScenarios: existingTask?.bddScenarios ?? [],
        comments: mergedComments,
        parentId: issue.fields?.parent?.key,
        epicKey: extractEpicLink(issue.fields),
        assignee,
        dueDate: issue.fields?.duedate,
        timeTracking: issue.fields?.timetracking ? {
            originalEstimate: issue.fields.timetracking.originalEstimate,
            remainingEstimate: issue.fields.timetracking.remainingEstimate,
            timeSpent: issue.fields.timetracking.timeSpent,
        } : undefined,
        components: issue.fields?.components?.map((c: any) => ({ id: c.id, name: c.name })),
        fixVersions: issue.fields?.fixVersions?.map((v: any) => ({ id: v.id, name: v.name })),
        environment: issue.fields?.environment,
        reporter: issue.fields?.reporter ? { displayName: issue.fields.reporter.displayName, emailAddress: issue.fields.reporter.emailAddress } : undefined,
        jiraAssignee: issue.fields?.assignee ? { displayName: issue.fields.assignee.displayName, emailAddress: issue.fields.assignee.emailAddress } : undefined,
        watchers: issue.fields?.watches ? { watchCount: issue.fields.watches.watchCount || 0, isWatching: issue.fields.watches.isWatching || false } : undefined,
        issueLinks: issue.fields?.issuelinks?.map((l: any) => ({
            id: l.id,
            type: l.type?.name || '',
            relatedKey: l.outwardIssue?.key || l.inwardIssue?.key || '',
            direction: l.outwardIssue ? 'outward' : 'inward',
        })),
        jiraAttachments: jiraAttachments.length ? jiraAttachments : undefined,
    };
    if (isBug) task.severity = mapJiraSeverity(issue.fields?.labels);
    const standardFields = ['summary', 'description', 'issuetype', 'status', 'priority', 'assignee', 'reporter', 'created', 'updated', 'resolutiondate', 'labels', 'parent', 'subtasks', 'comment', 'duedate', 'timetracking', 'components', 'fixVersions', 'environment', 'watches', 'issuelinks', 'attachment'];
    const customFields: { [key: string]: any } = {};
    Object.keys(issue.fields || {}).forEach(k => {
        if (!standardFields.includes(k) && !k.startsWith('_') && !EPIC_LINK_FIELD_KEYS.includes(k)) customFields[k] = issue.fields![k];
    });
    if (Object.keys(customFields).length > 0) {
        task.jiraCustomFields = customFields;
        logger.debug('jiraCustomFields keys', 'jiraService', { issueKey: key, keys: Object.keys(task.jiraCustomFields) });
    }
    const finalTask: JiraTask = existingTask ? {
        ...existingTask,
        ...task,
        testCases: task.testCases,
        bddScenarios: existingTask.bddScenarios ?? task.bddScenarios,
        testStrategy: existingTask.testStrategy,
        toolsUsed: existingTask.toolsUsed,
        executedStrategies: existingTask.executedStrategies,
        strategyTools: existingTask.strategyTools,
        testStatus: existingTask.testStatus,
        linkedBusinessRuleIds: existingTask.linkedBusinessRuleIds,
        linkedBusinessRuleCategories: existingTask.linkedBusinessRuleCategories,
    } : task;
    const newTasks = project.tasks.some(t => t.id === key)
        ? project.tasks.map(t => t.id === key ? finalTask : t)
        : [...project.tasks, finalTask];
    return { ...project, tasks: normalizeTasksParentIdsAcyclic(newTasks) };
};

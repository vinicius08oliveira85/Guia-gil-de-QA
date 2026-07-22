import type { Project, JiraTask } from '../../types';
import type { JiraConfig } from './types';
import { getJiraProjects, getJiraStatuses, getJiraPriorities } from './metadata';
import { getJiraIssues } from './issues';
import { mapJiraStatusToTaskStatus } from './mappers';
import { loadTestStatusesByJiraKeys } from '../localTestStatusService';
import { logger } from '../../utils/logger';
import { normalizeTasksParentIdsAcyclic } from '../../utils/taskParentCycle';
import { buildJiraSprintSyncContext } from './sprintSync';
import { DEFAULT_PROJECT_WORKFLOW, normalizeProjectWorkflow } from '../../utils/projectWorkflow';
import { jiraIssueToTask } from './issueToTask';
import type { ProjectWorkflow } from '../../types';

export interface ImportJiraProjectOptions {
  workflow?: ProjectWorkflow;
  /** JQL customizado para filtrar as issues importadas. Ex.: "project = PROJ AND type in (Bug, Task)" */
  jql?: string;
}

export interface ImportPreview {
  total: number;
  epics: number;
  stories: number;
  tasks: number;
  bugs: number;
  others: number;
  types: string[];
}

/**
 * Retorna um preview da importação (breakdown por tipo) sem importar de fato.
 */
export const previewJiraImport = async (
  config: JiraConfig,
  jiraProjectKey: string,
  jql?: string
): Promise<ImportPreview> => {
  const sprintCtx = await buildJiraSprintSyncContext(config, jiraProjectKey);
  const issues = await getJiraIssues(config, jiraProjectKey, undefined, undefined, {
    sprintFieldIds: sprintCtx.sprintFieldIds,
    jql,
  });

  const uniqueTypes = [...new Set(issues.map(i => i.fields?.issuetype?.name).filter(Boolean))];
  const count = (predicate: (name: string) => boolean) =>
    issues.filter(i => predicate((i.fields?.issuetype?.name || '').toLowerCase())).length;

  const epics = count(n => n.includes('epic') || n === 'épico' || n === 'epico');
  const stories = count(n => n.includes('story') || n.includes('história') || n.includes('historia'));
  const bugs = count(n => n.includes('bug') || n === 'erro' || n === 'defeito');
  const tasks = count(
    n =>
      n.includes('task') ||
      n.includes('tarefa') ||
      (!n.includes('epic') && !n.includes('bug') && !n.includes('story') && n !== 'história')
  );

  return {
    total: issues.length,
    epics,
    stories,
    tasks,
    bugs,
    others: issues.length - epics - stories - tasks - bugs,
    types: uniqueTypes as string[],
  };
};

export const importJiraProject = async (
  config: JiraConfig,
  jiraProjectKey: string,
  onProgress?: (current: number, total?: number) => void,
  options?: ImportJiraProjectOptions
): Promise<Project> => {
  const jiraProjects = await getJiraProjects(config);
  const jiraProject = jiraProjects.find(p => p.key === jiraProjectKey);

  if (!jiraProject) {
    throw new Error(`Projeto ${jiraProjectKey} não encontrado no Jira`);
  }

  const jiraStatuses = await getJiraStatuses(config, jiraProjectKey);
  const jiraPriorities = await getJiraPriorities(config);

  const sprintCtx = await buildJiraSprintSyncContext(config, jiraProjectKey);
  const jiraIssues = await getJiraIssues(config, jiraProjectKey, undefined, onProgress, {
    sprintFieldIds: sprintCtx.sprintFieldIds,
    jql: options?.jql,
  });

  const jiraKeys = jiraIssues.map(issue => issue.key).filter(Boolean) as string[];
  const savedTestStatuses = await loadTestStatusesByJiraKeys(jiraKeys);

  logger.info(`Buscando status de testes para ${jiraKeys.length} chaves Jira`, 'jiraService');

  const tasks: JiraTask[] = await Promise.all(
    jiraIssues.map(async issue => {
      const savedTestCases = savedTestStatuses.get(issue.key) || [];
      const task = await jiraIssueToTask(config, issue, { jiraProjectKey, sprintCtx });
      return savedTestCases.length > 0 ? { ...task, testCases: savedTestCases } : task;
    })
  );

  const tasksNormalized = normalizeTasksParentIdsAcyclic(tasks);

  return {
    id: `jira-${jiraProject.id}-${Date.now()}`,
    name: jiraProject.name,
    description: jiraProject.description || `Projeto importado do Jira: ${jiraProjectKey}`,
    workflow: normalizeProjectWorkflow(options?.workflow ?? DEFAULT_PROJECT_WORKFLOW),
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
};

/**
 * Adiciona issues novas e atualiza as existentes via {@link jiraIssueToTask}
 * (preserva testCases/bddScenarios e artefatos locais).
 */
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

  const sprintCtx = await buildJiraSprintSyncContext(config, jiraProjectKey);
  const jiraIssues = await getJiraIssues(config, jiraProjectKey, undefined, onProgress, {
    sprintFieldIds: sprintCtx.sprintFieldIds,
  });

  const existingTasksMap = new Map(project.tasks.map(t => [t.id, t]));
  const newIssues = jiraIssues.filter(issue => issue.key && !existingTasksMap.has(issue.key));
  const existingIssues = jiraIssues.filter(issue => issue.key && existingTasksMap.has(issue.key));

  let updatedStatusCount = 0;
  for (const issue of existingIssues) {
    const existingTask = existingTasksMap.get(issue.key!);
    if (!existingTask) continue;
    const jiraStatusName = issue.fields?.status?.name || '';
    const mappedStatus = mapJiraStatusToTaskStatus(jiraStatusName);
    if (existingTask.status !== mappedStatus || existingTask.jiraStatus !== jiraStatusName) {
      updatedStatusCount++;
      logger.debug(
        `Status atualizado para ${issue.key}: "${existingTask.jiraStatus}" → "${jiraStatusName}"`,
        'importSync'
      );
    }
  }

  if (newIssues.length === 0 && existingIssues.length === 0) {
    return { project, newTasksCount: 0, updatedStatusCount: 0 };
  }

  const newTasks: JiraTask[] = await Promise.all(
    newIssues.map(issue => jiraIssueToTask(config, issue, { jiraProjectKey, sprintCtx }))
  );

  const existingByKey = new Map(existingIssues.map(i => [i.key!, i]));
  const updatedExistingTasks: JiraTask[] = await Promise.all(
    project.tasks.map(async task => {
      const issue = existingByKey.get(task.id);
      if (!issue) return task;
      return jiraIssueToTask(config, issue, {
        jiraProjectKey,
        existingTask: task,
        sprintCtx,
      });
    })
  );

  const allTasks = normalizeTasksParentIdsAcyclic([...updatedExistingTasks, ...newTasks]);

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

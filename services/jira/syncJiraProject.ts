import type { Project, JiraTask } from '../../types';
import type { JiraConfig } from './types';
import { buildJiraSprintSyncContext } from './sprintSync';
import { getJiraIssues } from './issues';
import { jiraIssueToTask } from './issueToTask';
import { mapJiraStatusToTaskStatus } from './mappers';
import { loadTestStatusesByJiraKeys } from '../localTestStatusService';
import { getJiraStatusColor } from '../../utils/jiraStatusColors';
import { logger } from '../../utils/logger';
import { normalizeTasksParentIdsAcyclic } from '../../utils/taskParentCycle';
import { mergeTaskTestCases } from '../../utils/jiraTestCaseMerge';
import { applyLocalPreservation } from '../../utils/jiraTaskSyncPreserve';
import { validateAndRestoreTestStatuses, hasTaskChanges } from './syncValidator';
import { successResult, addSyncError, type SyncResult } from '../../utils/syncErrorDetail';
import { loadSyncCursor, saveSyncCursor, clearSyncCursor } from '../../utils/syncCursorTracker';

export type SyncJiraProjectOptions = {
  updatedAfter?: string;
  /** Se true, ignora cursor salvo e faz sync completo. */
  fullSync?: boolean;
  /** Callback de progresso (current, total). */
  onProgress?: (current: number, total?: number) => void;
};

export type SyncJiraProjectResult = SyncResult<Project>;

export const syncJiraProject = async (
  config: JiraConfig,
  project: Project,
  jiraProjectKey: string,
  getLatestProject?: () => Project | undefined,
  options?: SyncJiraProjectOptions
): Promise<SyncJiraProjectResult> => {
  const cursor = !options?.fullSync && !options?.updatedAfter ? loadSyncCursor(jiraProjectKey) : null;
  const startAt = cursor ? cursor.startAt + 1 : 0;

  const sprintCtx = await buildJiraSprintSyncContext(config, jiraProjectKey);
  const jiraIssues = await getJiraIssues(config, jiraProjectKey, undefined, options?.onProgress, {
    sprintFieldIds: sprintCtx.sprintFieldIds,
    updatedAfter: options?.updatedAfter,
    startAt,
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

  const result = successResult<Project>(projectToUse, jiraIssues.length);

  for (const issue of jiraIssues) {
    const latestFromStore = getLatestProject?.();
    const issueKey = issue.key || '';
    if (latestFromStore && issueKey) {
      const latestTask = latestFromStore.tasks.find(t => t.id === issueKey);
      if (latestTask) originalTasksMap.set(issueKey, latestTask);
    }

    const existingIndex = updatedTasks.findIndex(t => t.id === issueKey);
    const existingTask = existingIndex >= 0 ? updatedTasks[existingIndex] : undefined;
    const jiraStatusName = issue.fields?.status?.name || '';

    try {
      const savedTestCases = savedTestStatuses.get(issueKey) || [];
      const existingTestCases = existingTask?.testCases || [];

      const { testCases: mergedTestCases } = mergeTaskTestCases(
        existingTestCases,
        savedTestCases,
        issueKey,
        'syncJiraProject'
      );

      const rawTask = await jiraIssueToTask(config, issue, {
        jiraProjectKey,
        existingTask: existingTask ? { ...existingTask, testCases: mergedTestCases } : undefined,
        sprintCtx,
      });

      const task = applyLocalPreservation(rawTask, existingTask);

      if (existingIndex >= 0) {
        const oldTask = updatedTasks[existingIndex];
        const jiraStatusChanged = oldTask.jiraStatus !== jiraStatusName;

        if (hasTaskChanges(oldTask, task)) {
          updatedTasks[existingIndex] = {
            ...oldTask,
            ...task,
            testCases: mergedTestCases,
            createdAt: oldTask.createdAt || task.createdAt,
          };
          updatedCount++;
        } else {
          const originalNoChanges = issueKey ? originalTasksMap.get(issueKey) : undefined;
          const testCasesNoChanges = originalNoChanges?.testCases?.length
            ? originalNoChanges.testCases
            : (existingTestCases || []);

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
    } catch (error) {
      addSyncError(result, issueKey || 'unknown', error, true);
      logger.warn(`Erro ao processar issue ${issueKey}, continuando sync...`, 'syncJiraProject', error);
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

  result.data = {
    ...projectToUse,
    lastJiraSyncAt: new Date().toISOString(),
    tasks: tasksNormalized,
    settings: {
      ...projectToUse.settings,
      jiraStatuses: mergedJiraStatuses.length > 0 ? mergedJiraStatuses : projectToUse.settings?.jiraStatuses,
    },
  };

  // Salvar cursor incremental
  const lastStartAt = startAt + jiraIssues.length;
  const totalProcessed = jiraIssues.length - result.totalErrors;
  if (totalProcessed > 0) {
    saveSyncCursor(jiraProjectKey, lastStartAt, totalProcessed);
  }

  return result;
};

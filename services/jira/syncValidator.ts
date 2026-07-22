import type { TestCase, JiraTask, Project } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Valida se os status dos testCases foram preservados após a sincronização
 * e restaura quaisquer status perdidos do originalTasksMap (fonte da verdade).
 */
export function validateAndRestoreTestStatuses(
  originalTasksMap: Map<string, JiraTask>,
  updatedTasks: JiraTask[],
  getLatestProject?: () => Project | undefined
): JiraTask[] {
  const statusAntes = Array.from(originalTasksMap.values()).flatMap(t =>
    (t.testCases || [])
      .filter(tc => tc.status !== 'Not Run')
      .map(tc => ({ taskId: t.id, testCaseId: tc.id, status: tc.status }))
  );
  const statusDepois = updatedTasks.flatMap(t =>
    (t.testCases || [])
      .filter(tc => tc.status !== 'Not Run')
      .map(tc => ({ taskId: t.id, testCaseId: tc.id, status: tc.status }))
  );

  logger.info(`VALIDAÇÃO FINAL: Comparando status antes e depois da sincronização`, 'syncValidator', {
    statusAntes: statusAntes.length,
    statusDepois: statusDepois.length,
    tarefasProcessadas: originalTasksMap.size,
  });

  const statusMapAntes = new Map<string, { taskId: string; testCaseId: string; expectedStatus: TestCase['status'] }>();
  statusAntes.forEach(s => {
    if (s.testCaseId) {
      statusMapAntes.set(`${s.taskId}||${s.testCaseId}`, {
        taskId: s.taskId,
        testCaseId: s.testCaseId,
        expectedStatus: s.status,
      });
    }
  });

  let statusPerdidos = 0;
  let statusRestaurados = 0;
  const result = [...updatedTasks];

  statusMapAntes.forEach(({ taskId, testCaseId, expectedStatus }) => {
    const statusDepoisEncontrado = statusDepois.find(
      s => s.testCaseId && s.taskId === taskId && s.testCaseId === testCaseId
    );

    if (!statusDepoisEncontrado || statusDepoisEncontrado.status !== expectedStatus) {
      statusPerdidos++;
      logger.error(
        `STATUS PERDIDO na validação final: taskId=${taskId}, testCaseId=${testCaseId}, esperado="${expectedStatus}", obtido="${statusDepoisEncontrado?.status || 'não encontrado'}"`,
        'syncValidator'
      );

      const restored = restoreStatus(taskId, testCaseId, expectedStatus, originalTasksMap, result, getLatestProject);
      if (restored) {
        statusRestaurados++;
      }
    }
  });

  if (statusPerdidos > 0) {
    logger.warn(
      `VALIDAÇÃO FINAL: ${statusPerdidos} status foram perdidos, ${statusRestaurados} restaurados`,
      'syncValidator',
      { statusAntes: statusAntes.length, statusDepois: statusDepois.length, statusPerdidos, statusRestaurados }
    );
  } else {
    logger.info(`VALIDAÇÃO FINAL: Todos os ${statusAntes.length} status foram preservados`, 'syncValidator', {
      statusAntes: statusAntes.length,
      statusDepois: statusDepois.length,
    });
  }

  return result;
}

function restoreStatus(
  taskId: string,
  testCaseId: string,
  expectedStatus: TestCase['status'],
  originalTasksMap: Map<string, JiraTask>,
  updatedTasks: JiraTask[],
  getLatestProject?: () => Project | undefined
): boolean {
  const originalTask = originalTasksMap.get(taskId);
  if (originalTask) {
    const originalTestCase = originalTask.testCases?.find(tc => tc.id === testCaseId);
    if (originalTestCase && originalTestCase.status !== 'Not Run') {
      return applyRestoration(updatedTasks, taskId, testCaseId, originalTestCase.status, 'originalTasksMap');
    }
  }

  const latestProjectFromStore = getLatestProject?.();
  if (latestProjectFromStore) {
    const latestTask = latestProjectFromStore.tasks.find(t => t.id === taskId);
    if (latestTask) {
      const latestTestCase = latestTask.testCases?.find(tc => tc.id === testCaseId);
      if (latestTestCase && latestTestCase.status !== 'Not Run') {
        return applyRestoration(updatedTasks, taskId, testCaseId, latestTestCase.status, 'store (último recurso)');
      }
    }
  }

  return false;
}

function applyRestoration(
  updatedTasks: JiraTask[],
  taskId: string,
  testCaseId: string,
  status: TestCase['status'],
  source: string
): boolean {
  const updatedTaskIndex = updatedTasks.findIndex(t => t.id === taskId);
  if (updatedTaskIndex >= 0) {
    const updatedTask = updatedTasks[updatedTaskIndex];
    const restoredTestCases = (updatedTask.testCases || []).map(tc =>
      tc.id === testCaseId ? { ...tc, status } : tc
    );
    updatedTasks[updatedTaskIndex] = { ...updatedTask, testCases: restoredTestCases };
    logger.info(`Status restaurado do ${source}: taskId=${taskId}, testCaseId=${testCaseId}, status="${status}"`, 'syncValidator');
    return true;
  }
  return false;
}

/**
 * Verifica se uma tarefa existente teve alterações nos campos do Jira.
 */
export function hasTaskChanges(oldTask: JiraTask, newTask: JiraTask): boolean {
  return (
    oldTask.title !== newTask.title ||
    oldTask.description !== newTask.description ||
    oldTask.status !== newTask.status ||
    oldTask.jiraStatus !== newTask.jiraStatus ||
    oldTask.type !== newTask.type ||
    oldTask.priority !== newTask.priority ||
    oldTask.jiraPriority !== newTask.jiraPriority ||
    JSON.stringify(oldTask.jiraAssignee || {}) !== JSON.stringify(newTask.jiraAssignee || {}) ||
    JSON.stringify(oldTask.tags || []) !== JSON.stringify(newTask.tags || []) ||
    oldTask.severity !== newTask.severity ||
    oldTask.completedAt !== newTask.completedAt ||
    oldTask.dueDate !== newTask.dueDate ||
    oldTask.parentId !== newTask.parentId ||
    oldTask.epicKey !== newTask.epicKey ||
    oldTask.assignee !== newTask.assignee ||
    JSON.stringify(oldTask.timeTracking) !== JSON.stringify(newTask.timeTracking) ||
    JSON.stringify(oldTask.components || []) !== JSON.stringify(newTask.components || []) ||
    JSON.stringify(oldTask.fixVersions || []) !== JSON.stringify(newTask.fixVersions || []) ||
    oldTask.environment !== newTask.environment ||
    JSON.stringify(oldTask.reporter) !== JSON.stringify(newTask.reporter) ||
    JSON.stringify(oldTask.watchers) !== JSON.stringify(newTask.watchers) ||
    JSON.stringify(oldTask.issueLinks || []) !== JSON.stringify(newTask.issueLinks || []) ||
    JSON.stringify(oldTask.jiraAttachments || []) !== JSON.stringify(newTask.jiraAttachments || []) ||
    JSON.stringify(oldTask.jiraCustomFields || {}) !== JSON.stringify(newTask.jiraCustomFields || {}) ||
    oldTask.storyPoints !== newTask.storyPoints ||
    JSON.stringify(oldTask.sprints) !== JSON.stringify(newTask.sprints)
  );
}

/**
 * Cria um snapshot dos status dos testCases para validação posterior.
 */
export function buildStatusSnapshot(tasks: JiraTask[]): Map<string, { taskId: string; testCaseId: string; status: TestCase['status'] }> {
  const map = new Map<string, { taskId: string; testCaseId: string; status: TestCase['status'] }>();
  tasks.forEach(task => {
    (task.testCases || []).forEach(tc => {
      if (tc.id && tc.status !== 'Not Run') {
        map.set(`${task.id}||${tc.id}`, { taskId: task.id, testCaseId: tc.id, status: tc.status });
      }
    });
  });
  return map;
}

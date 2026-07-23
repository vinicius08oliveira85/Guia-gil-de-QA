import type { JiraTask } from '../types';

/**
 * Preserva campos locais (não-Jira) ao substituir uma task por dados novos do Jira.
 * Usado por syncJiraProject e addNewJiraTasks.
 */
export function applyLocalPreservation(
  newTask: JiraTask,
  existingTask?: JiraTask
): JiraTask {
  if (!existingTask) return newTask;

  return {
    ...newTask,
    testStrategy: existingTask.testStrategy,
    toolsUsed: existingTask.toolsUsed,
    executedStrategies: existingTask.executedStrategies,
    strategyTools: existingTask.strategyTools,
    testStatus: existingTask.testStatus,
    linkedBusinessRuleIds: existingTask.linkedBusinessRuleIds,
    linkedBusinessRuleCategories: existingTask.linkedBusinessRuleCategories,
    bddScenarios: existingTask.bddScenarios || [],
    isFavorite: existingTask.isFavorite,
    devGuidance: existingTask.devGuidance,
    devGuidanceGeneratedAt: existingTask.devGuidanceGeneratedAt,
    devGuidanceSnapshotHash: existingTask.devGuidanceSnapshotHash,
    devImplementationRecord: existingTask.devImplementationRecord,
    testCasesGeneratedAt: existingTask.testCasesGeneratedAt,
    testCasesSnapshotHash: existingTask.testCasesSnapshotHash,
    iaAnalysis: existingTask.iaAnalysis,
    isTechnicalDebt: existingTask.isTechnicalDebt,
    isCriticalPath: existingTask.isCriticalPath,
    isEscapedDefect: existingTask.isEscapedDefect,
    jiraSyncedAt: existingTask.jiraSyncedAt,
    estimatedHours: existingTask.estimatedHours,
    actualHours: existingTask.actualHours,
    checklist: existingTask.checklist,
    attachments: existingTask.attachments,
    owner: existingTask.owner,
    dependencies: existingTask.dependencies,
  };
}

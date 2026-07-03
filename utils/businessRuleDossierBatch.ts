import type { JiraTask } from '../types';

/** Acima deste número de tasks, a IA processa em lotes (fichas + síntese). */
export const DOSSIER_AI_BATCH_THRESHOLD = 40;

/** Tasks por chamada de IA na geração de fichas técnicas. */
export const DOSSIER_AI_TASKS_PER_BATCH = 40;

/** Divide tasks em lotes para chamadas sequenciais à IA. */
export function chunkTasksForDossierAi(tasks: JiraTask[]): JiraTask[][] {
  if (tasks.length === 0) return [];
  const chunks: JiraTask[][] = [];
  for (let i = 0; i < tasks.length; i += DOSSIER_AI_TASKS_PER_BATCH) {
    chunks.push(tasks.slice(i, i + DOSSIER_AI_TASKS_PER_BATCH));
  }
  return chunks;
}

/** Indica se o dossiê deve usar pipeline em lotes. */
export function shouldBatchDossierAi(taskCount: number): boolean {
  return taskCount > DOSSIER_AI_BATCH_THRESHOLD;
}

/**
 * Tasks que precisam de novas fichas técnicas.
 * Em refresh incremental, só tasks novas; se não houver novas, reprocessa todas.
 */
export function resolveTasksNeedingSheets(
  tasks: JiraTask[],
  options: { usePrevious: boolean; newTaskIds: string[] }
): JiraTask[] {
  if (!options.usePrevious) return tasks;
  if (options.newTaskIds.length === 0) return tasks;
  const newSet = new Set(options.newTaskIds);
  return tasks.filter(t => newSet.has(t.id));
}

/** Indica se o pipeline em lotes é necessário para gerar/atualizar fichas. */
export function shouldUseDossierBatchPipeline(
  tasksNeedingSheets: JiraTask[],
  totalTaskCount: number
): boolean {
  return (
    shouldBatchDossierAi(totalTaskCount) ||
    shouldBatchDossierAi(tasksNeedingSheets.length)
  );
}

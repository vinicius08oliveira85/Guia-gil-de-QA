import { DOSSIER_AI_TASKS_PER_BATCH } from './businessRuleDossierBatch';

/** Progresso reportado durante geração/reanálise do dossiê com IA. */
export interface DossierAiProgress {
  step: number;
  totalSteps: number;
  label: string;
}

export function createDossierProgressReporter(
  onProgress: ((progress: DossierAiProgress) => void) | undefined,
  initialTotalSteps: number
): {
  report: (label: string) => void;
  extendTotalSteps: (extraSteps: number) => void;
  getTotalSteps: () => number;
} {
  let step = 0;
  let totalSteps = Math.max(1, initialTotalSteps);

  const report = (label: string) => {
    step += 1;
    onProgress?.({ step, totalSteps, label });
  };

  const extendTotalSteps = (extraSteps: number) => {
    if (extraSteps > 0) totalSteps += extraSteps;
  };

  return {
    report,
    extendTotalSteps,
    getTotalSteps: () => totalSteps,
  };
}

/** Estima passos do pipeline em lotes (fichas + síntese). */
export function estimateDossierBatchPipelineSteps(tasksNeedingSheetsCount: number): number {
  if (tasksNeedingSheetsCount <= 0) return 1;
  const batchCount = Math.ceil(tasksNeedingSheetsCount / DOSSIER_AI_TASKS_PER_BATCH);
  return batchCount + 1;
}

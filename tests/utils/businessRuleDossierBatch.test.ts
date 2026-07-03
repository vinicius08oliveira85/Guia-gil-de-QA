import { describe, expect, it } from 'vitest';
import {
  chunkTasksForDossierAi,
  DOSSIER_AI_BATCH_THRESHOLD,
  DOSSIER_AI_TASKS_PER_BATCH,
  resolveTasksNeedingSheets,
  shouldBatchDossierAi,
  shouldUseDossierBatchPipeline,
} from '../../utils/businessRuleDossierBatch';
import type { JiraTask } from '../../types';

const task = (id: string): JiraTask => ({
  id,
  title: `Task ${id}`,
  description: '',
  status: 'To Do',
  testCases: [],
  type: 'História',
});

describe('businessRuleDossierBatch', () => {
  it('shouldBatchDossierAi acima do limiar', () => {
    expect(shouldBatchDossierAi(DOSSIER_AI_BATCH_THRESHOLD)).toBe(false);
    expect(shouldBatchDossierAi(DOSSIER_AI_BATCH_THRESHOLD + 1)).toBe(true);
  });

  it('chunkTasksForDossierAi divide em lotes de 40', () => {
    const tasks = Array.from({ length: 95 }, (_, i) => task(`T-${i}`));
    const chunks = chunkTasksForDossierAi(tasks);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(DOSSIER_AI_TASKS_PER_BATCH);
    expect(chunks[1]).toHaveLength(DOSSIER_AI_TASKS_PER_BATCH);
    expect(chunks[2]).toHaveLength(15);
  });

  it('resolveTasksNeedingSheets retorna só tasks novas em refresh incremental', () => {
    const tasks = [task('A'), task('B'), task('C')];
    const needing = resolveTasksNeedingSheets(tasks, {
      usePrevious: true,
      newTaskIds: ['B'],
    });
    expect(needing.map(t => t.id)).toEqual(['B']);
  });

  it('resolveTasksNeedingSheets reprocessa todas quando não há tasks novas', () => {
    const tasks = [task('A'), task('B')];
    const needing = resolveTasksNeedingSheets(tasks, {
      usePrevious: true,
      newTaskIds: [],
    });
    expect(needing).toHaveLength(2);
  });

  it('shouldUseDossierBatchPipeline quando total ou lote de fichas excede limiar', () => {
    expect(shouldUseDossierBatchPipeline([task('A')], 50)).toBe(true);
    expect(shouldUseDossierBatchPipeline(Array.from({ length: 45 }, (_, i) => task(`T-${i}`)), 45)).toBe(
      true
    );
    expect(shouldUseDossierBatchPipeline([task('A')], 10)).toBe(false);
  });
});

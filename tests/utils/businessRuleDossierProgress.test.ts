import { describe, expect, it, vi } from 'vitest';
import {
  createDossierProgressReporter,
  estimateDossierBatchPipelineSteps,
} from '../../utils/businessRuleDossierProgress';

describe('businessRuleDossierProgress', () => {
  it('estimateDossierBatchPipelineSteps inclui síntese final', () => {
    expect(estimateDossierBatchPipelineSteps(0)).toBe(1);
    expect(estimateDossierBatchPipelineSteps(40)).toBe(2);
    expect(estimateDossierBatchPipelineSteps(85)).toBe(4);
  });

  it('createDossierProgressReporter emite passos incrementais', () => {
    const onProgress = vi.fn();
    const reporter = createDossierProgressReporter(onProgress, 3);

    reporter.report('Lote 1…');
    reporter.report('Lote 2…');
    reporter.extendTotalSteps(1);
    reporter.report('Síntese…');

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress.mock.calls[0][0]).toEqual({ step: 1, totalSteps: 3, label: 'Lote 1…' });
    expect(onProgress.mock.calls[2][0].totalSteps).toBe(4);
  });
});

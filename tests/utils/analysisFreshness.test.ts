import { describe, it, expect } from 'vitest';
import { isAnalysisOutdated } from '../../utils/analysisFreshness';

describe('isAnalysisOutdated', () => {
  it('retorna true quando a análise é nula/indefinida', () => {
    expect(isAnalysisOutdated(undefined, 'h1')).toBe(true);
    expect(isAnalysisOutdated(null, 'h1')).toBe(true);
  });

  it('compara por snapshotHash quando disponível (camada determinística)', () => {
    expect(isAnalysisOutdated({ snapshotHash: 'h1' }, 'h1')).toBe(false);
    expect(isAnalysisOutdated({ snapshotHash: 'h1' }, 'h2')).toBe(true);
  });

  it('snapshotHash tem prioridade sobre isOutdated quando ambos existem', () => {
    expect(isAnalysisOutdated({ snapshotHash: 'h1', isOutdated: true }, 'h1')).toBe(false);
    expect(isAnalysisOutdated({ snapshotHash: 'h2', isOutdated: false }, 'h1')).toBe(true);
  });

  it('recai em isOutdated quando snapshotHash está ausente (legado)', () => {
    expect(isAnalysisOutdated({ isOutdated: true }, 'h1')).toBe(true);
    expect(isAnalysisOutdated({ isOutdated: false }, 'h1')).toBe(false);
  });

  it('considera atualizada quando faltam ambas as informações', () => {
    expect(isAnalysisOutdated({}, 'h1')).toBe(false);
  });
});

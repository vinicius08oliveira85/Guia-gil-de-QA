import { describe, it, expect } from 'vitest';
import { coalesceParametersFromAiRow } from '../../../services/ai/mapAiTestCaseRows';

describe('coalesceParametersFromAiRow', () => {
  it('preserva espaços internos e só usa trim para detectar string vazia', () => {
    expect(coalesceParametersFromAiRow({ parameters: '  a \n b  ' })).toBe('  a \n b  ');
  });

  it('ignora parameters só com whitespace e usa steps legados', () => {
    expect(
      coalesceParametersFromAiRow({
        parameters: '   ',
        steps: ['um', 'dois'],
      })
    ).toBe('um\ndois');
  });

  it('retorna string vazia quando não há parameters nem steps', () => {
    expect(coalesceParametersFromAiRow({})).toBe('');
  });
});

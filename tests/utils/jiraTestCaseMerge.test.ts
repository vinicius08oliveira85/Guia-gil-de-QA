import { describe, it, expect } from 'vitest';
import { mergeTaskTestCases } from '../../utils/jiraTestCaseMerge';
import type { TestCase } from '../../types';

describe('mergeTaskTestCases', () => {
  it('preserva existingTestCases com status executado (REGRADA DE OURO)', () => {
    const existing: TestCase[] = [
      { id: 'tc-1', title: 'Teste 1', status: 'Pass', action: 'Ação 1', expectedResult: 'Resultado 1' },
    ];
    const saved: TestCase[] = [
      { id: 'tc-1', title: 'Teste 1', status: 'Fail', action: 'Ação 1', expectedResult: 'Resultado 1' },
    ];

    const result = mergeTaskTestCases(existing, saved, 'PROJ-1', 'test');
    expect(result.testCases).toHaveLength(1);
    expect(result.testCases[0].status).toBe('Pass');
    expect(result.existingWithStatus).toBe(1);
  });

  it('adiciona testCases novos dos salvos quando não existem nos existentes', () => {
    const existing: TestCase[] = [
      { id: 'tc-1', title: 'Teste 1', status: 'Pass', action: 'A', expectedResult: 'R' },
    ];
    const saved: TestCase[] = [
      { id: 'tc-2', title: 'Teste 2', status: 'Not Run', action: 'B', expectedResult: 'R2' },
    ];

    const result = mergeTaskTestCases(existing, saved, 'PROJ-1', 'test');
    expect(result.testCases).toHaveLength(2);
    expect(result.testCases[0].id).toBe('tc-1');
    expect(result.testCases[1].id).toBe('tc-2');
    expect(result.addedFromSaved).toBe(1);
  });

  it('usa mergeTestCases quando não há status executados nos existentes', () => {
    const existing: TestCase[] = [
      { id: 'tc-1', title: 'Teste 1', status: 'Not Run', action: '', expectedResult: 'R' },
    ];
    const saved: TestCase[] = [
      { id: 'tc-1', title: 'Teste 1', status: 'Pass', action: 'Ação', expectedResult: 'R' },
    ];

    const result = mergeTaskTestCases(existing, saved, 'PROJ-1', 'test');
    expect(result.testCases).toHaveLength(1);
    expect(result.testCases[0].status).toBe('Pass');
  });

  it('retorna testCases salvos quando não há existentes', () => {
    const result = mergeTaskTestCases([], [{ id: 'tc-1', title: 'T', status: 'Not Run', action: '', expectedResult: 'R' }], 'PROJ-1', 'test');
    expect(result.testCases).toHaveLength(1);
    expect(result.testCases[0].id).toBe('tc-1');
  });

  it('retorna lista vazia quando não há nem existentes nem salvos', () => {
    const result = mergeTaskTestCases([], [], 'PROJ-1', 'test');
    expect(result.testCases).toHaveLength(0);
    expect(result.existingWithStatus).toBe(0);
  });
});

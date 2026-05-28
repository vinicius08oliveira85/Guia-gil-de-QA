import { describe, it, expect } from 'vitest';
import type { JiraTask, TestCase } from '../../types';
import { getTaskQaRiskSnapshot } from '../../services/ai/generalAnalysisService';

function makeTask(overrides: Partial<JiraTask> = {}): JiraTask {
  return {
    id: 'task-1',
    title: 'Tarefa de teste',
    description: 'Descrição completa da tarefa.',
    status: 'To Do',
    type: 'Tarefa',
    testCases: [],
    bddScenarios: [{ id: 'bdd-1', title: 'Cenário', steps: [] }],
    testStrategy: [{ id: 'ts-1', title: 'Estratégia', description: 'Smoke' }],
    ...overrides,
  };
}

function makePassedTest(id: string): TestCase {
  return {
    id,
    description: `Caso ${id}`,
    steps: ['passo'],
    expectedResult: 'ok',
    status: 'Passed',
    priority: 'Média',
  };
}

function makeFailedTest(id: string): TestCase {
  return { ...makePassedTest(id), status: 'Failed' };
}

describe('getTaskQaRiskSnapshot — scoring heurístico', () => {
  it('tarefa bem documentada com testes passando retorna score base', () => {
    const task = makeTask({
      testCases: [makePassedTest('tc-1')],
    });

    expect(getTaskQaRiskSnapshot(task)).toEqual({
      riskScore: 20,
      riskLevel: 'Baixo',
      riskSignals: [],
    });
  });

  it('sem descrição e sem testes acumula penalidades principais', () => {
    const task = makeTask({
      description: '',
      testCases: [],
      bddScenarios: [],
      testStrategy: [],
    });

    const snapshot = getTaskQaRiskSnapshot(task);

    expect(snapshot.riskScore).toBe(81);
    expect(snapshot.riskLevel).toBe('Crítico');
    expect(snapshot.riskSignals).toEqual(
      expect.arrayContaining([
        'Sem descrição detalhada',
        'Sem casos de teste',
        'Sem cenários BDD',
        'Sem estratégia de testes',
      ])
    );
  });

  it('testes falhando incrementam score com multiplicador (cap 30)', () => {
    const task = makeTask({
      testCases: [makeFailedTest('f1'), makeFailedTest('f2'), makeFailedTest('f3')],
    });

    expect(getTaskQaRiskSnapshot(task).riskScore).toBe(20 + 15);
    expect(getTaskQaRiskSnapshot(task).riskSignals).toContain('3 teste(s) falhando');
  });

  it('story points altos sem BDD aplicam penalidade de tarefa complexa', () => {
    const task = makeTask({
      storyPoints: 9,
      bddScenarios: [],
      testCases: [makePassedTest('tc-1')],
    });

    const snapshot = getTaskQaRiskSnapshot(task);

    expect(snapshot.riskScore).toBe(20 + 15 + 10 + 8);
    expect(snapshot.riskSignals).toEqual(
      expect.arrayContaining(['Tarefa complexa sem BDD', 'Sem cenários BDD'])
    );
  });

  it('tarefa grande sem testes adiciona sinal específico', () => {
    const task = makeTask({
      storyPoints: 6,
      testCases: [],
      bddScenarios: [],
      testStrategy: [],
      description: '',
    });

    const snapshot = getTaskQaRiskSnapshot(task);

    expect(snapshot.riskSignals).toContain('Tarefa grande sem testes');
    expect(snapshot.riskScore).toBe(100);
    expect(snapshot.riskLevel).toBe('Crítico');
  });

  it('dependências abertas incrementam score', () => {
    const task = makeTask({
      dependencies: [{ id: 'dep-1', title: 'Bloqueio', status: 'open' }],
      testCases: [makePassedTest('tc-1')],
    });

    const snapshot = getTaskQaRiskSnapshot(task);

    expect(snapshot.riskScore).toBe(20 + 5);
    expect(snapshot.riskSignals).toContain('Possui dependências abertas');
  });

  it('cap de risco em 100', () => {
    const task = makeTask({
      storyPoints: 13,
      description: '',
      testCases: Array.from({ length: 10 }, (_, i) => makeFailedTest(`f-${i}`)),
      bddScenarios: [],
      testStrategy: [],
      dependencies: [{ id: 'd1', title: 'Dep', status: 'open' }],
    });

    expect(getTaskQaRiskSnapshot(task).riskScore).toBeLessThanOrEqual(100);
  });
});

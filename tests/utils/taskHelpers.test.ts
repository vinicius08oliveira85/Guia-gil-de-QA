import { describe, expect, it } from 'vitest';
import type { JiraTask, TestCase } from '../../types';

import { getTestPhaseStatus } from '../../utils/taskHelpers';

const buildTestCase = (overrides: Partial<TestCase> = {}): TestCase => ({
  id: 'tc-1',
  action: 'Executar',
  parameters: '—',
  expectedResult: 'OK',
  observedResult: '',
  status: 'Not Run',
  ...overrides,
});

const buildTask = (overrides: Partial<JiraTask> = {}): JiraTask => ({
  id: 'TASK-1',
  title: 'Tarefa',
  description: 'Descrição',
  status: 'To Do',
  type: 'Tarefa',
  testCases: [],
  ...overrides,
});

describe('taskHelpers.getTestPhaseStatus', () => {
  it('interrompe ciclos de parentId sem recursão infinita', () => {
    const epicA = buildTask({ id: 'EPIC-A', type: 'Epic', parentId: 'HIST-B' });
    const historyB = buildTask({ id: 'HIST-B', type: 'História', parentId: 'EPIC-A' });

    expect(() => getTestPhaseStatus(epicA, [epicA, historyB])).not.toThrow();
    expect(getTestPhaseStatus(epicA, [epicA, historyB])).toBe('Pendente');
  });

  it('interrompe árvores profundas antes de estourar a pilha', () => {
    const chain: JiraTask[] = [];

    for (let i = 0; i < 120; i++) {
      chain.push(
        buildTask({
          id: `NODE-${i}`,
          title: `Node ${i}`,
          type: i === 119 ? 'Tarefa' : 'Epic',
          parentId: i === 0 ? undefined : `NODE-${i - 1}`,
          testCases: i === 119 ? [buildTestCase({ status: 'Passed' })] : [],
        })
      );
    }

    expect(() => getTestPhaseStatus(chain[0], chain)).not.toThrow();
    expect(getTestPhaseStatus(chain[0], chain)).toBe('Pendente');
  });
});

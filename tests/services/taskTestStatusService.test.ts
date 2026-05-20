import { describe, expect, it, vi } from 'vitest';
import type { JiraTask, TestCase } from '../../types';

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { calculateTaskTestStatus } from '../../services/taskTestStatusService';

const buildTestCase = (overrides: Partial<TestCase> = {}): TestCase => ({
  id: 'tc-1',
  action: 'Executar passo',
  parameters: '—',
  expectedResult: 'Sucesso',
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

describe('taskTestStatusService.calculateTaskTestStatus', () => {
  it('interrompe ciclos de parentId sem recursão infinita', () => {
    const epicA = buildTask({
      id: 'EPIC-A',
      title: 'Epic A',
      type: 'Epic',
      parentId: 'HIST-B',
    });
    const historyB = buildTask({
      id: 'HIST-B',
      title: 'História B',
      type: 'História',
      parentId: 'EPIC-A',
    });

    expect(calculateTaskTestStatus(epicA, [epicA, historyB])).toBe('pendente');
  });

  it('para em profundidade excessiva de árvore antes de estourar a pilha', () => {
    const chain: JiraTask[] = [];

    for (let i = 0; i < 120; i++) {
      chain.push(
        buildTask({
          id: `NODE-${i}`,
          title: `Node ${i}`,
          type: i === 119 ? 'Tarefa' : 'Epic',
          parentId: i === 0 ? undefined : `NODE-${i - 1}`,
          testCases: i === 119 ? [buildTestCase({ id: 'tc-final', status: 'Passed' })] : [],
        })
      );
    }

    expect(() => calculateTaskTestStatus(chain[0], chain)).not.toThrow();
    expect(calculateTaskTestStatus(chain[0], chain)).toBe('pendente');
  });

  it('Epic sem subtarefas vinculadas inicia como testar', () => {
    const epic = buildTask({ id: 'EPIC-1', type: 'Epic' });
    expect(calculateTaskTestStatus(epic, [epic])).toBe('testar');
  });

  it('Epic sem subtarefas mantém teste_concluido quando marcado manualmente', () => {
    const epic = buildTask({
      id: 'EPIC-2',
      type: 'Epic',
      testStatus: 'teste_concluido',
    });
    expect(calculateTaskTestStatus(epic, [epic])).toBe('teste_concluido');
  });

  it('História sem subtarefas vinculadas inicia como testar', () => {
    const story = buildTask({ id: 'HIST-1', type: 'História' });
    expect(calculateTaskTestStatus(story, [story])).toBe('testar');
  });
});

import { describe, expect, it } from 'vitest';
import { hashBusinessRuleTaskSnapshot, getChangedTaskIds } from '../../utils/businessRuleTaskSnapshot';
import type { JiraTask } from '../../types';

const baseTask = (overrides: Partial<JiraTask> = {}): JiraTask => ({
  id: 'GDPI-1',
  title: 'Mapa',
  description: 'Desc',
  status: 'To Do',
  testCases: [],
  type: 'História',
  ...overrides,
});

describe('businessRuleTaskSnapshot', () => {
  it('hash é estável para mesmo conjunto de tasks', () => {
    const tasks = [baseTask()];
    const h1 = hashBusinessRuleTaskSnapshot(tasks, ['GDPI-1']);
    const h2 = hashBusinessRuleTaskSnapshot(tasks, ['GDPI-1']);
    expect(h1).toBe(h2);
  });

  it('detecta mudança quando descrição altera', () => {
    const tasksBefore = [baseTask({ description: 'A' })];
    const tasksAfter = [baseTask({ description: 'B' })];
    const hashBefore = hashBusinessRuleTaskSnapshot(tasksBefore, ['GDPI-1']);
    const result = getChangedTaskIds(hashBefore, tasksAfter, ['GDPI-1']);
    expect(result.changed).toBe(true);
    expect(result.hash).not.toBe(hashBefore);
  });
});

import { describe, it, expect } from 'vitest';
import { applyLocalPreservation } from '../../utils/jiraTaskSyncPreserve';
import type { JiraTask } from '../../types';

const makeTask = (overrides: Partial<JiraTask> = {}): JiraTask => ({
  id: 'TEST-1',
  title: 'Tarefa',
  description: 'Desc',
  status: 'To Do',
  jiraStatus: 'To Do',
  type: 'Tarefa',
  priority: 'Média',
  createdAt: '2025-01-01T00:00:00.000Z',
  tags: [],
  testCases: [],
  bddScenarios: [],
  ...overrides,
});

describe('applyLocalPreservation', () => {
  it('preserva testStrategy do existingTask', () => {
    const newTask = makeTask();
    const existingTask = makeTask({
      testStrategy: [{ testType: 'Unitário', description: 'Testes unitários', howToExecute: [], tools: 'Jest' }],
    });
    const result = applyLocalPreservation(newTask, existingTask);
    expect(result.testStrategy).toEqual(existingTask.testStrategy);
  });

  it('preserva bddScenarios do existingTask', () => {
    const newTask = makeTask({ bddScenarios: [] });
    const existingTask = makeTask({
      bddScenarios: [{ id: 'bdd-1', title: 'Cenário 1', gherkin: 'Given...' }],
    });
    const result = applyLocalPreservation(newTask, existingTask);
    expect(result.bddScenarios).toEqual([{ id: 'bdd-1', title: 'Cenário 1', gherkin: 'Given...' }]);
  });

  it('preserva isFavorite do existingTask', () => {
    const newTask = makeTask({ isFavorite: undefined });
    const existingTask = makeTask({ isFavorite: true });
    const result = applyLocalPreservation(newTask, existingTask);
    expect(result.isFavorite).toBe(true);
  });

  it('preserva toolsUsed do existingTask', () => {
    const newTask = makeTask({ toolsUsed: undefined });
    const existingTask = makeTask({ toolsUsed: ['Postman', 'Insomnia'] });
    const result = applyLocalPreservation(newTask, existingTask);
    expect(result.toolsUsed).toEqual(['Postman', 'Insomnia']);
  });

  it('retorna newTask se não há existingTask', () => {
    const newTask = makeTask({ testStrategy: undefined });
    const result = applyLocalPreservation(newTask, undefined);
    expect(result).toEqual(newTask);
  });

  it('preserva executedStrategies e strategyTools', () => {
    const newTask = makeTask();
    const existingTask = makeTask({ executedStrategies: [0, 1], strategyTools: { 0: ['Cypress'] } });
    const result = applyLocalPreservation(newTask, existingTask);
    expect(result.executedStrategies).toEqual([0, 1]);
    expect(result.strategyTools).toEqual({ 0: ['Cypress'] });
  });

  it('preserva linkedBusinessRuleIds e categories', () => {
    const newTask = makeTask();
    const existingTask = makeTask({
      linkedBusinessRuleIds: ['br-1', 'br-2'],
      linkedBusinessRuleCategories: ['LGPD'],
    });
    const result = applyLocalPreservation(newTask, existingTask);
    expect(result.linkedBusinessRuleIds).toEqual(['br-1', 'br-2']);
    expect(result.linkedBusinessRuleCategories).toEqual(['LGPD']);
  });
});

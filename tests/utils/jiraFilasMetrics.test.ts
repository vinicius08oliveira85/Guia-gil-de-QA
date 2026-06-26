import { describe, expect, it } from 'vitest';
import {
  classifyTaskSla,
  computeJiraFilasMetrics,
  getJiraFilasFilterLabel,
  matchesJiraFilasFilter,
} from '../../utils/jiraFilasMetrics';
import type { JiraTask } from '../../types';

const NOW = new Date('2026-06-26T12:00:00.000Z').getTime();

function makeTask(overrides: Partial<JiraTask>): JiraTask {
  return {
    id: overrides.id ?? 'PROJ-1',
    title: overrides.title ?? 'Tarefa',
    description: '',
    status: overrides.status ?? 'To Do',
    testCases: [],
    type: 'Tarefa',
    ...overrides,
  } as JiraTask;
}

describe('classifyTaskSla', () => {
  it('considera tarefa concluída como no prazo', () => {
    const task = makeTask({ status: 'Done', dueDate: '2026-06-01T00:00:00.000Z' });
    expect(classifyTaskSla(task, NOW)).toBe('onTrack');
  });

  it('classifica tarefa sem prazo', () => {
    expect(classifyTaskSla(makeTask({ status: 'To Do' }), NOW)).toBe('noDueDate');
  });

  it('classifica tarefa atrasada', () => {
    const task = makeTask({ status: 'In Progress', dueDate: '2026-06-25T00:00:00.000Z' });
    expect(classifyTaskSla(task, NOW)).toBe('overdue');
  });

  it('classifica tarefa em risco dentro de 48h', () => {
    const task = makeTask({ status: 'To Do', dueDate: '2026-06-27T00:00:00.000Z' });
    expect(classifyTaskSla(task, NOW)).toBe('atRisk');
  });

  it('respeita janela de risco configurável', () => {
    const task = makeTask({ status: 'To Do', dueDate: '2026-06-27T00:00:00.000Z' });
    expect(classifyTaskSla(task, NOW, 8)).toBe('onTrack');
  });

  it('classifica tarefa no prazo (fora da janela de risco)', () => {
    const task = makeTask({ status: 'To Do', dueDate: '2026-07-10T00:00:00.000Z' });
    expect(classifyTaskSla(task, NOW)).toBe('onTrack');
  });
});

describe('computeJiraFilasMetrics', () => {
  it('agrega status e SLA corretamente', () => {
    const tasks: JiraTask[] = [
      makeTask({ id: 'P-1', status: 'Done', dueDate: '2026-06-01T00:00:00.000Z' }),
      makeTask({ id: 'P-2', status: 'In Progress', dueDate: '2026-06-25T00:00:00.000Z' }),
      makeTask({ id: 'P-3', status: 'To Do', dueDate: '2026-06-27T00:00:00.000Z' }),
      makeTask({ id: 'P-4', status: 'Blocked' }),
    ];

    const metrics = computeJiraFilasMetrics(tasks, NOW);

    expect(metrics.total).toBe(4);
    expect(metrics.doneCount).toBe(1);
    expect(metrics.donePercent).toBe(25);
    expect(metrics.inProgressCount).toBe(1);
    expect(metrics.openCount).toBe(3);
    expect(metrics.statusCounts).toEqual({
      'To Do': 1,
      'In Progress': 1,
      Done: 1,
      Blocked: 1,
    });
    expect(metrics.slaCounts).toEqual({
      onTrack: 1,
      atRisk: 1,
      overdue: 1,
      noDueDate: 1,
    });
  });

  it('retorna zeros para lista vazia', () => {
    const metrics = computeJiraFilasMetrics([], NOW);
    expect(metrics.total).toBe(0);
    expect(metrics.donePercent).toBe(0);
  });
});

describe('matchesJiraFilasFilter', () => {
  it('filtra por status', () => {
    const task = makeTask({ status: 'Blocked' });
    expect(matchesJiraFilasFilter(task, { kind: 'status', status: 'Blocked' }, NOW)).toBe(true);
    expect(matchesJiraFilasFilter(task, { kind: 'status', status: 'Done' }, NOW)).toBe(false);
  });

  it('filtra por SLA usando janela configurável', () => {
    const task = makeTask({ status: 'To Do', dueDate: '2026-06-27T00:00:00.000Z' });
    expect(matchesJiraFilasFilter(task, { kind: 'sla', bucket: 'atRisk' }, NOW, 48)).toBe(true);
    expect(matchesJiraFilasFilter(task, { kind: 'sla', bucket: 'atRisk' }, NOW, 8)).toBe(false);
  });

  it('retorna rótulos legíveis', () => {
    expect(getJiraFilasFilterLabel({ kind: 'all' })).toBe('Todas');
    expect(getJiraFilasFilterLabel({ kind: 'status', status: 'In Progress' })).toBe(
      'Em andamento'
    );
    expect(getJiraFilasFilterLabel({ kind: 'sla', bucket: 'noDueDate' })).toBe('Sem prazo');
  });
});

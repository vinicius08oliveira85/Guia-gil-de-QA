import { describe, expect, it } from 'vitest';
import type { JiraTask } from '../../types';
import {
  collectAssigneeOptions,
  collectOpenFilasTasks,
  computeFollowUpSummary,
  filterTasksByAssignees,
  getJiraProjectKeyFromTaskId,
  isOpenTask,
  sortTasksForFollowUp,
} from '../../utils/landingTaskFollowUp';

function makeTask(overrides: Partial<JiraTask> & Pick<JiraTask, 'id'>): JiraTask {
  return {
    title: overrides.title ?? overrides.id,
    description: '',
    status: 'To Do',
    testCases: [],
    type: 'Task',
    ...overrides,
  };
}

describe('landingTaskFollowUp', () => {
  it('isOpenTask exclui Done', () => {
    expect(isOpenTask(makeTask({ id: 'A-1', status: 'To Do' }))).toBe(true);
    expect(isOpenTask(makeTask({ id: 'A-2', status: 'In Progress' }))).toBe(true);
    expect(isOpenTask(makeTask({ id: 'A-3', status: 'Blocked' }))).toBe(true);
    expect(isOpenTask(makeTask({ id: 'A-4', status: 'Done' }))).toBe(false);
  });

  it('getJiraProjectKeyFromTaskId extrai prefixo da issue', () => {
    expect(getJiraProjectKeyFromTaskId('PROJ-123')).toBe('PROJ');
    expect(getJiraProjectKeyFromTaskId('invalid')).toBe('Jira');
  });

  it('collectOpenFilasTasks agrega só tarefas em aberto', () => {
    const open = collectOpenFilasTasks([
      makeTask({ id: 'T-1', status: 'To Do' }),
      makeTask({ id: 'T-2', status: 'Done' }),
      makeTask({ id: 'T-3', status: 'In Progress', jiraAssignee: { displayName: 'Maria' } }),
    ]);

    expect(open).toHaveLength(2);
    expect(open.map(r => r.task.id).sort()).toEqual(['T-1', 'T-3']);
  });

  it('collectAssigneeOptions retorna labels únicos ordenados', () => {
    const tasks = collectOpenFilasTasks([
      makeTask({ id: 'T-1', jiraAssignee: { displayName: 'Zeca' } }),
      makeTask({ id: 'T-2', jiraAssignee: { displayName: 'Ana' } }),
      makeTask({ id: 'T-3', assignee: 'QA' }),
    ]);

    expect(collectAssigneeOptions(tasks)).toEqual(['Ana', 'QA', 'Zeca']);
  });

  it('filterTasksByAssignees com lista vazia retorna todas', () => {
    const tasks = collectOpenFilasTasks([
      makeTask({ id: 'T-1', jiraAssignee: { displayName: 'Ana' } }),
      makeTask({ id: 'T-2', jiraAssignee: { displayName: 'Bob' } }),
    ]);

    expect(filterTasksByAssignees(tasks, [])).toHaveLength(2);
    expect(filterTasksByAssignees(tasks, ['Ana'])).toHaveLength(1);
    expect(filterTasksByAssignees(tasks, ['Ana'])[0].task.id).toBe('T-1');
  });

  it('sortTasksForFollowUp ordena por updatedAt desc', () => {
    const tasks = collectOpenFilasTasks([
      makeTask({
        id: 'OLD',
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      makeTask({
        id: 'NEW',
        updatedAt: '2026-07-01T10:00:00.000Z',
      }),
    ]);

    const sorted = sortTasksForFollowUp(tasks);
    expect(sorted.map(r => r.task.id)).toEqual(['NEW', 'OLD']);
  });

  it('computeFollowUpSummary conta inProgress e SLA', () => {
    const now = Date.parse('2026-07-06T12:00:00.000Z');
    const tasks = collectOpenFilasTasks([
      makeTask({ id: 'T-1', status: 'In Progress' }),
      makeTask({
        id: 'T-2',
        status: 'To Do',
        dueDate: '2026-07-05',
      }),
      makeTask({
        id: 'T-3',
        status: 'To Do',
        dueDate: '2026-07-07',
      }),
    ]);

    const summary = computeFollowUpSummary(tasks, now);
    expect(summary.total).toBe(3);
    expect(summary.inProgress).toBe(1);
    expect(summary.overdue).toBe(1);
    expect(summary.atRisk).toBe(1);
  });
});

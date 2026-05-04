import { describe, expect, it } from 'vitest';
import type { JiraTask } from '../../types';
import {
  computeDeliveryEvolutionSeries,
  computeOverdueTaskCount,
  computeProjectDashboardDeterministicMetrics,
  computeTaskCompletionStats,
  isTaskOverdue,
} from '../../utils/projectDashboardDeterministicMetrics';

const baseTask = (overrides: Partial<JiraTask>): JiraTask => ({
  id: '1',
  title: 'T',
  description: '',
  status: 'To Do',
  testCases: [],
  type: 'Tarefa',
  ...overrides,
});

describe('projectDashboardDeterministicMetrics', () => {
  it('computes completion and percent', () => {
    const tasks = [baseTask({ id: 'a', status: 'Done' }), baseTask({ id: 'b', status: 'To Do' })];
    expect(computeTaskCompletionStats(tasks)).toEqual({
      total: 2,
      completed: 1,
      completionPercent: 50,
    });
  });

  it('returns zero percent when no tasks', () => {
    expect(computeTaskCompletionStats([])).toEqual({
      total: 0,
      completed: 0,
      completionPercent: 0,
    });
  });

  it('detects overdue when dueDate is before today', () => {
    const ref = new Date('2026-04-14T12:00:00');
    const t = baseTask({ status: 'In Progress', dueDate: '2026-04-13T00:00:00.000Z' });
    expect(isTaskOverdue(t, ref)).toBe(true);
    expect(computeOverdueTaskCount([t], ref)).toBe(1);
  });

  it('does not mark done tasks as overdue', () => {
    const ref = new Date('2026-04-14T12:00:00');
    const t = baseTask({ status: 'Done', dueDate: '2026-01-01T00:00:00.000Z' });
    expect(isTaskOverdue(t, ref)).toBe(false);
  });

  it('aggregates deterministic bundle for empty tasks', () => {
    const m = computeProjectDashboardDeterministicMetrics(undefined);
    expect(m.completion.total).toBe(0);
    expect(m.overdueCount).toBe(0);
    expect(m.statusDistribution.every(s => s.value === 0)).toBe(true);
    expect(m.hasDeliveryData).toBe(false);
    expect(m.priorityDistribution.length).toBe(0);
    expect(m.assigneeDistribution.length).toBe(0);
  });

  it('counts deliveries in the correct week', () => {
    const ws = new Date('2026-04-13T12:00:00');
    const t = baseTask({
      status: 'Done',
      completedAt: '2026-04-14T10:00:00.000Z',
    });
    const series = computeDeliveryEvolutionSeries([t], 8, ws);
    const total = series.reduce((s, p) => s + p.concludedCount, 0);
    expect(total).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import {
  closeTaskTabState,
  openTaskTabState,
  taskTabId,
  truncateTaskTabTitle,
} from '../../utils/workspaceTabs';

describe('workspaceTabs', () => {
  it('openTaskTabState foca aba existente', () => {
    const result = openTaskTabState(['A', 'B'], 'tasks', 'A');
    expect(result).toEqual({ openTaskTabIds: ['A', 'B'], activeTab: taskTabId('A') });
  });

  it('openTaskTabState adiciona nova aba', () => {
    const result = openTaskTabState(['A'], 'tasks', 'B');
    expect(result.activeTab).toBe(taskTabId('B'));
    expect(result.openTaskTabIds).toEqual(['A', 'B']);
  });

  it('closeTaskTabState volta para aba anterior', () => {
    const result = closeTaskTabState(['A', 'B', 'C'], taskTabId('B'), 'B');
    expect(result.openTaskTabIds).toEqual(['A', 'C']);
    expect(result.activeTab).toBe(taskTabId('A'));
  });

  it('closeTaskTabState cai em tasks quando fecha a última', () => {
    const result = closeTaskTabState(['A'], taskTabId('A'), 'A');
    expect(result.openTaskTabIds).toEqual([]);
    expect(result.activeTab).toBe('tasks');
  });

  it('truncateTaskTabTitle encurta títulos longos', () => {
    const long = 'A'.repeat(50);
    expect(truncateTaskTabTitle(long).length).toBeLessThanOrEqual(36);
    expect(truncateTaskTabTitle(long).endsWith('…')).toBe(true);
  });
});

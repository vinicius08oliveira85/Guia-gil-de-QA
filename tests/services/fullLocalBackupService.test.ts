import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../services/ai/testCaseGenerationCachePersistence', () => ({
  loadAllPersistedCacheEntries: vi.fn(async () => [
    { taskId: 'GDPI-1', hash: 'h1', expiresAt: Date.now() + 1000, artifacts: { testCases: [] } },
  ]),
  savePersistedCacheEntry: vi.fn(async () => undefined),
}));

import {
  collectFullAppStateBackup,
  restoreFullAppStateBackup,
} from '../../services/fullLocalBackupService';
import {
  loadAllPersistedCacheEntries,
  savePersistedCacheEntry,
} from '../../services/ai/testCaseGenerationCachePersistence';

describe('fullLocalBackupService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('coleta localStorage, sessionStorage e cache de IA', async () => {
    localStorage.setItem('qa_user_preferences', '{"export":{}}');
    localStorage.setItem('tasks_filters_proj-1', '{"sortBy":"id"}');
    localStorage.setItem('jira-solus-filas-tasks', '[]');
    sessionStorage.setItem('jira-solus-filas-project-key', 'SUS');

    const snapshot = await collectFullAppStateBackup();

    expect(snapshot.localStorage['qa_user_preferences']).toBe('{"export":{}}');
    expect(snapshot.localStorage['tasks_filters_proj-1']).toBe('{"sortBy":"id"}');
    expect(snapshot.localStorage['jira-solus-filas-tasks']).toBeUndefined();
    expect(snapshot.sessionStorage['jira-solus-filas-project-key']).toBe('SUS');
    expect(snapshot.testGenerationCache).toHaveLength(1);
    expect(loadAllPersistedCacheEntries).toHaveBeenCalled();
  });

  it('restaura chaves e cache de IA', async () => {
    await restoreFullAppStateBackup({
      localStorage: {
        'qa_user_preferences': '{"notifications":{}}',
        'tasks_filters_x': '{"groupBy":"none"}',
      },
      sessionStorage: {
        'jira-solus-filas-project-key': 'ME',
      },
      testGenerationCache: [
        { taskId: 'GDPI-9', hash: 'abc', expiresAt: 999, artifacts: { testCases: [] } },
      ],
    });

    expect(localStorage.getItem('qa_user_preferences')).toContain('notifications');
    expect(localStorage.getItem('tasks_filters_x')).toContain('groupBy');
    expect(sessionStorage.getItem('jira-solus-filas-project-key')).toBe('ME');
    expect(savePersistedCacheEntry).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 'GDPI-9' })
    );
  });
});

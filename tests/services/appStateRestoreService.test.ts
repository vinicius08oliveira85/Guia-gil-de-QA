import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../services/ai/geminiApiKeyManager', () => ({
  geminiApiKeyManager: {
    reloadKeys: vi.fn(),
  },
}));

vi.mock('../../services/ai/aiServiceFactory', () => ({
  invalidateAIServiceCache: vi.fn(),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { geminiApiKeyManager } from '../../services/ai/geminiApiKeyManager';
import { invalidateAIServiceCache } from '../../services/ai/aiServiceFactory';
import {
  APP_STATE_RESTORED_EVENT,
  applyRuntimeAfterAppStateRestore,
  formatAppStateRestoreMessage,
  summarizeAppStateBackup,
} from '../../services/appStateRestoreService';
import { APP_LOGS_UPDATED_EVENT } from '../../utils/appLogStore';
import { LOCAL_FOLDER_CONFIG_UPDATED_EVENT } from '../../services/localFolderBackupService';

describe('appStateRestoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resume appState com Jira e Gemini', () => {
    const summary = summarizeAppStateBackup({
      localStorage: {
        jira_config: '{"url":"https://jira.example.com","email":"a@b.com","apiToken":"secret"}',
        gemini_api_keys: JSON.stringify({
          version: 2,
          keys: [{ id: '1', name: 'A', apiKey: 'k', priority: 0, enabled: true, createdAt: '' }],
        }),
        qa_user_preferences: '{}',
      },
      sessionStorage: {},
      testGenerationCache: [{ taskId: 'T-1', hash: 'h', expiresAt: 1, artifacts: {} }],
    });

    expect(summary.jiraConfig).toBe(true);
    expect(summary.geminiKeysCount).toBe(1);
    expect(summary.preferences).toBe(true);
    expect(summary.cacheEntries).toBe(1);
  });

  it('conta chave legada gemini_api_key', () => {
    const summary = summarizeAppStateBackup({
      localStorage: { gemini_api_key: '{"apiKey":"abc1234567"}' },
      sessionStorage: {},
      testGenerationCache: [],
    });
    expect(summary.geminiKeysCount).toBe(1);
  });

  it('formata mensagem de restore para toast', () => {
    const msg = formatAppStateRestoreMessage({
      localStorageKeys: 3,
      sessionStorageKeys: 0,
      jiraConfig: true,
      geminiKeysCount: 2,
      preferences: true,
      cacheEntries: 0,
      hasLocalFolderPrefs: false,
      hasAppLogs: false,
    });
    expect(msg).toContain('credenciais Jira');
    expect(msg).toContain('2 chave(s) Gemini');
    expect(msg).toContain('preferências');
  });

  it('aplica runtime e dispara eventos após restore', async () => {
    const onRestored = vi.fn();
    window.addEventListener(APP_STATE_RESTORED_EVENT, onRestored);

    const summary = {
      localStorageKeys: 2,
      sessionStorageKeys: 0,
      jiraConfig: true,
      geminiKeysCount: 1,
      preferences: false,
      cacheEntries: 0,
      hasLocalFolderPrefs: true,
      hasAppLogs: true,
    };

    const logsListener = vi.fn();
    const folderListener = vi.fn();
    window.addEventListener(APP_LOGS_UPDATED_EVENT, logsListener);
    window.addEventListener(LOCAL_FOLDER_CONFIG_UPDATED_EVENT, folderListener);

    await applyRuntimeAfterAppStateRestore(summary);

    expect(geminiApiKeyManager.reloadKeys).toHaveBeenCalled();
    expect(invalidateAIServiceCache).toHaveBeenCalled();
    expect(onRestored).toHaveBeenCalled();
    expect(logsListener).toHaveBeenCalled();
    expect(folderListener).toHaveBeenCalled();

    window.removeEventListener(APP_STATE_RESTORED_EVENT, onRestored);
    window.removeEventListener(APP_LOGS_UPDATED_EVENT, logsListener);
    window.removeEventListener(LOCAL_FOLDER_CONFIG_UPDATED_EVENT, folderListener);
  });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../services/dbService', () => ({
  loadProjectsFromIndexedDB: vi.fn(async () => []),
  importProjectsFromBackup: vi.fn(async () => ({
    imported: 1,
    skipped: 0,
    supabaseSynced: 0,
    supabaseSyncFailed: 0,
    taskTrackingTasksRestored: 0,
    appStateRestored: true,
    appStateSummary: {
      localStorageKeys: 2,
      sessionStorageKeys: 0,
      jiraConfig: true,
      geminiKeysCount: 1,
      preferences: false,
      cacheEntries: 0,
      hasLocalFolderPrefs: false,
      hasAppLogs: false,
    },
  })),
}));

vi.mock('../../services/jira/config', () => ({
  getJiraConfig: vi.fn(() => null),
}));

vi.mock('../../services/geminiConfigService', () => ({
  hasGeminiConfig: vi.fn(() => false),
}));

vi.mock('../../services/localFolderBackupService', () => ({
  readBackupFromFolder: vi.fn(),
  getConfiguredFolderLabel: vi.fn(() => 'Dados Agile Guide'),
  LOCAL_FOLDER_CONFIG_UPDATED_EVENT: 'qa-local-folder-config-updated',
}));

import { loadProjectsFromIndexedDB, importProjectsFromBackup } from '../../services/dbService';
import { getJiraConfig } from '../../services/jira/config';
import { hasGeminiConfig } from '../../services/geminiConfigService';
import { readBackupFromFolder } from '../../services/localFolderBackupService';
import {
  FOLDER_RESTORE_PROMPT_DISMISSED_KEY,
  formatBackupSummaryForPrompt,
  formatRestoreResultMessage,
  isBackupMeaningful,
  isLocalDataEffectivelyEmpty,
  parseBackupFile,
  restoreFromConfiguredFolder,
  setFolderRestorePromptDismissed,
  shouldOfferFolderRestoreOnStartup,
} from '../../services/localFolderRestoreService';

function jsonFile(content: unknown): File {
  const body = JSON.stringify(content);
  const file = new File([body], 'backup.json', { type: 'application/json' });
  if (typeof file.text !== 'function') {
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(body),
    });
  }
  return file;
}

describe('localFolderRestoreService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.mocked(loadProjectsFromIndexedDB).mockResolvedValue([]);
    vi.mocked(getJiraConfig).mockReturnValue(null);
    vi.mocked(hasGeminiConfig).mockReturnValue(false);
  });

  it('isLocalDataEffectivelyEmpty retorna true sem projetos nem credenciais', async () => {
    await expect(isLocalDataEffectivelyEmpty()).resolves.toBe(true);
  });

  it('isLocalDataEffectivelyEmpty retorna false com projetos', async () => {
    vi.mocked(loadProjectsFromIndexedDB).mockResolvedValue([
      { id: 'p1', name: 'P', description: '', documents: [], businessRules: [], tasks: [], phases: [] },
    ]);
    await expect(isLocalDataEffectivelyEmpty()).resolves.toBe(false);
  });

  it('parseBackupFile resume envelope v3', async () => {
    const file = jsonFile({
      backupFormatVersion: 3,
      exportedAt: '2026-07-03T12:00:00.000Z',
      projects: [{ id: 'p1' }, { id: 'p2' }],
      appState: {
        localStorage: { jira_config: '{"url":"https://jira.test"}' },
        sessionStorage: {},
        testGenerationCache: [],
      },
    });

    const summary = await parseBackupFile(file);
    expect(summary?.projectCount).toBe(2);
    expect(summary?.hasAppState).toBe(true);
    expect(summary?.appStateSummary?.jiraConfig).toBe(true);
    expect(isBackupMeaningful(summary!)).toBe(true);
  });

  it('formatBackupSummaryForPrompt inclui projetos e credenciais', () => {
    const text = formatBackupSummaryForPrompt({
      projectCount: 2,
      taskTrackingTaskCount: 0,
      hasAppState: true,
      appStateSummary: {
        localStorageKeys: 1,
        sessionStorageKeys: 0,
        jiraConfig: true,
        geminiKeysCount: 2,
        preferences: true,
        cacheEntries: 0,
        hasLocalFolderPrefs: false,
        hasAppLogs: false,
      },
      exportedAt: null,
      backupFormatVersion: 3,
    });
    expect(text).toContain('2 projeto(s)');
    expect(text).toContain('credenciais Jira');
    expect(text).toContain('2 chave(s) Gemini');
  });

  it('shouldOfferFolderRestoreOnStartup oferece quando local vazio e backup válido', async () => {
    const file = jsonFile({
      projects: [{ id: 'p1', name: 'Teste' }],
      appState: { localStorage: {}, sessionStorage: {}, testGenerationCache: [] },
    });
    vi.mocked(readBackupFromFolder).mockResolvedValue(file);

    const result = await shouldOfferFolderRestoreOnStartup();
    expect(result.offer).toBe(true);
    if (result.offer) {
      expect(result.folderLabel).toBe('Dados Agile Guide');
      expect(result.summary.projectCount).toBe(1);
    }
  });

  it('shouldOfferFolderRestoreOnStartup não oferece se usuário recusou na sessão', async () => {
    sessionStorage.setItem(FOLDER_RESTORE_PROMPT_DISMISSED_KEY, 'true');
    const file = jsonFile({ projects: [{ id: 'p1' }] });
    vi.mocked(readBackupFromFolder).mockResolvedValue(file);

    const result = await shouldOfferFolderRestoreOnStartup();
    expect(result.offer).toBe(false);
    if (!result.offer) expect(result.reason).toBe('dismissed');
  });

  it('restoreFromConfiguredFolder importa e grava last restore', async () => {
    const file = jsonFile({
      projects: [{ id: 'p1', name: 'Restaurado' }],
      appState: {
        localStorage: { jira_config: '{"url":"https://jira.test"}' },
        sessionStorage: {},
        testGenerationCache: [],
      },
    });
    vi.mocked(readBackupFromFolder).mockResolvedValue(file);

    const outcome = await restoreFromConfiguredFolder();
    expect(outcome.status).toBe('success');
    expect(importProjectsFromBackup).toHaveBeenCalledWith(file);
    expect(localStorage.getItem('qa_local_folder_last_restore_at')).not.toBeNull();
  });

  it('formatRestoreResultMessage monta toast com projetos e configs', () => {
    const msg = formatRestoreResultMessage({
      imported: 2,
      skipped: 0,
      supabaseSynced: 0,
      supabaseSyncFailed: 0,
      taskTrackingTasksRestored: 0,
      appStateRestored: true,
      appStateSummary: {
        localStorageKeys: 1,
        sessionStorageKeys: 0,
        jiraConfig: true,
        geminiKeysCount: 0,
        preferences: false,
        cacheEntries: 0,
        hasLocalFolderPrefs: false,
        hasAppLogs: false,
      },
    });
    expect(msg).toContain('2 projeto(s)');
    expect(msg).toContain('credenciais Jira');
  });

  it('setFolderRestorePromptDismissed persiste flag na sessão', () => {
    setFolderRestorePromptDismissed();
    expect(sessionStorage.getItem(FOLDER_RESTORE_PROMPT_DISMISSED_KEY)).toBe('true');
  });
});

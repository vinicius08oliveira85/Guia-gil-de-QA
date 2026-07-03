import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../services/supabaseService', async importOriginal => {
  const actual = await importOriginal<typeof import('../../services/supabaseService')>();
  return {
    ...actual,
    isSupabaseAvailable: vi.fn(() => true),
    saveProjectToSupabase: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../services/backupService', () => ({
  autoBackupBeforeOperation: vi.fn(),
}));

import * as supabaseService from '../../services/supabaseService';
import { importProjectsFromBackup } from '../../services/dbService';

function jsonFile(content: unknown, name = 'backup.json'): File {
  const body = JSON.stringify(content);
  const file = new File([body], name, { type: 'application/json' });
  if (typeof file.text !== 'function') {
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(body),
    });
  }
  return file;
}

describe('importProjectsFromBackup', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.mocked(supabaseService.saveProjectToSupabase).mockClear();
    vi.mocked(supabaseService.saveProjectToSupabase).mockResolvedValue(undefined);
    vi.mocked(supabaseService.isSupabaseAvailable).mockReturnValue(true);
  });

  it('importa projeto mínimo e não chama Supabase sem syncToSupabase', async () => {
    const file = jsonFile([{ id: 'imp-1', name: 'Importado' }]);
    const result = await importProjectsFromBackup(file);

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.supabaseSynced).toBe(0);
    expect(result.supabaseSyncFailed).toBe(0);
    expect(result.taskTrackingTasksRestored).toBe(0);
    expect(result.appStateRestored).toBe(false);
    expect(supabaseService.saveProjectToSupabase).not.toHaveBeenCalled();
  });

  it('ignora syncToSupabase e importa apenas no IndexedDB', async () => {
    const file = jsonFile([{ id: 'imp-2', name: 'Com nuvem' }]);
    const result = await importProjectsFromBackup(file, { syncToSupabase: true });

    expect(result.imported).toBe(1);
    expect(result.supabaseSynced).toBe(0);
    expect(result.supabaseSyncFailed).toBe(0);
    expect(supabaseService.saveProjectToSupabase).not.toHaveBeenCalled();
  });

  it('não tenta Supabase mesmo se saveProjectToSupabase falharia', async () => {
    vi.mocked(supabaseService.saveProjectToSupabase).mockRejectedValueOnce(new Error('rede'));

    const file = jsonFile([{ id: 'imp-3', name: 'Falha remota' }]);
    const result = await importProjectsFromBackup(file, { syncToSupabase: true });

    expect(result.imported).toBe(1);
    expect(result.supabaseSynced).toBe(0);
    expect(result.supabaseSyncFailed).toBe(0);
    expect(supabaseService.saveProjectToSupabase).not.toHaveBeenCalled();
  });

  it('não tenta Supabase quando isSupabaseAvailable é false', async () => {
    vi.mocked(supabaseService.isSupabaseAvailable).mockReturnValue(false);

    const file = jsonFile([{ id: 'imp-4', name: 'Só local' }]);
    const result = await importProjectsFromBackup(file, { syncToSupabase: true });

    expect(result.imported).toBe(1);
    expect(result.supabaseSynced).toBe(0);
    expect(supabaseService.saveProjectToSupabase).not.toHaveBeenCalled();
  });

  it('restaura acompanhamento de tarefas quando presente no envelope', async () => {
    const file = jsonFile({
      projects: [{ id: 'imp-5', name: 'Com filas' }],
      taskTracking: {
        selectedProjectKey: 'SUS',
        queueSelection: { projectKey: 'SUS', queueId: '10' },
        tasks: [{ id: 'SUS-1', title: 'Fila', type: 'Tarefa', status: 'To Do' }],
        slaRiskWindowHours: 48,
      },
    });

    const result = await importProjectsFromBackup(file);

    expect(result.imported).toBe(1);
    expect(result.taskTrackingTasksRestored).toBe(1);
    expect(localStorage.getItem('jira-solus-filas-tasks')).toContain('SUS-1');
    expect(sessionStorage.getItem('jira-solus-filas-project-key')).toBe('SUS');
  });

  it('importa apenas acompanhamento de tarefas sem projetos no envelope', async () => {
    const file = jsonFile({
      taskTracking: {
        selectedProjectKey: 'ABC',
        tasks: [{ id: 'ABC-2', title: 'Só filas', type: 'Tarefa', status: 'In Progress' }],
        slaRiskWindowHours: 120,
      },
    });

    const result = await importProjectsFromBackup(file);

    expect(result.imported).toBe(0);
    expect(result.taskTrackingTasksRestored).toBe(1);
    expect(sessionStorage.getItem('jira-solus-filas-project-key')).toBe('ABC');
  });

  it('restaura appState completo (formato v3)', async () => {
    localStorage.clear();
    sessionStorage.clear();

    const file = jsonFile({
      projects: [{ id: 'imp-6', name: 'Com appState' }],
      appState: {
        localStorage: {
          'qa_user_preferences': '{"export":{"defaultFormat":"markdown"}}',
          'tasks_filters_imp-6': '{"sortBy":"title"}',
          jira_config: JSON.stringify({
            url: 'https://jira.example.com',
            email: 'qa@test.com',
            apiToken: 'token1234567',
          }),
          gemini_api_keys: JSON.stringify({
            version: 2,
            keys: [
              {
                id: 'k1',
                name: 'Principal',
                apiKey: 'gemini-key-1234567',
                priority: 0,
                enabled: true,
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            ],
          }),
        },
        sessionStorage: {
          'jira-solus-filas-project-key': 'GDPI',
        },
        testGenerationCache: [],
      },
    });

    const result = await importProjectsFromBackup(file);

    expect(result.imported).toBe(1);
    expect(result.appStateRestored).toBe(true);
    expect(result.appStateSummary?.jiraConfig).toBe(true);
    expect(result.appStateSummary?.geminiKeysCount).toBe(1);
    expect(localStorage.getItem('qa_user_preferences')).toContain('markdown');
    expect(localStorage.getItem('tasks_filters_imp-6')).toContain('title');
    expect(localStorage.getItem('jira_config')).toContain('jira.example.com');
    expect(sessionStorage.getItem('jira-solus-filas-project-key')).toBe('GDPI');
  });

  it('importa apenas appState (configs) sem projetos', async () => {
    const file = jsonFile({
      projects: [],
      appState: {
        localStorage: {
          jira_config: JSON.stringify({
            url: 'https://jira.example.com',
            email: 'qa@test.com',
            apiToken: 'token1234567',
          }),
          gemini_api_keys: JSON.stringify({
            version: 2,
            keys: [
              {
                id: 'k1',
                name: 'Principal',
                apiKey: 'gemini-key-1234567',
                priority: 0,
                enabled: true,
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            ],
          }),
        },
        sessionStorage: {},
        testGenerationCache: [],
      },
    });

    const result = await importProjectsFromBackup(file);

    expect(result.imported).toBe(0);
    expect(result.appStateRestored).toBe(true);
    expect(localStorage.getItem('jira_config')).toContain('qa@test.com');
  });
});

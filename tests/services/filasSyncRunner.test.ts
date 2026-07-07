import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runFilasSelectionSync } from '../../services/jira/filasSyncRunner';

vi.mock('../../services/jiraService', () => ({
  getJiraConfig: vi.fn(),
}));

vi.mock('../../services/jira/jiraAutoSync', () => ({
  isJiraAutoSyncRunning: vi.fn(),
}));

vi.mock('../../services/jira/filasQueueSync', () => ({
  syncFilasQueuesFromJira: vi.fn(),
}));

import { getJiraConfig } from '../../services/jiraService';
import { isJiraAutoSyncRunning } from '../../services/jira/jiraAutoSync';
import { syncFilasQueuesFromJira } from '../../services/jira/filasQueueSync';

const config = { url: 'https://jira.test', email: 'a@b.com', apiToken: 'token' };

const getJiraConfigMock = vi.mocked(getJiraConfig);
const isJiraAutoSyncRunningMock = vi.mocked(isJiraAutoSyncRunning);
const syncFilasQueuesFromJiraMock = vi.mocked(syncFilasQueuesFromJira);

describe('runFilasSelectionSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getJiraConfigMock.mockReturnValue(config as ReturnType<typeof getJiraConfig>);
    isJiraAutoSyncRunningMock.mockReturnValue(false);
  });

  it('retorna success com o resultado da sincronização', async () => {
    const result = { tasks: [{ id: 'SUS-1' }], queueCount: 2 };
    syncFilasQueuesFromJiraMock.mockResolvedValue(
      result as Awaited<ReturnType<typeof syncFilasQueuesFromJira>>
    );

    const outcome = await runFilasSelectionSync();

    expect(outcome).toEqual({ status: 'success', result });
    expect(syncFilasQueuesFromJiraMock).toHaveBeenCalledTimes(1);
  });

  it('encaminha o callback de progresso para a sincronização', async () => {
    syncFilasQueuesFromJiraMock.mockResolvedValue(
      { tasks: [], queueCount: 1 } as Awaited<ReturnType<typeof syncFilasQueuesFromJira>>
    );
    const onProgress = vi.fn();

    await runFilasSelectionSync(onProgress);

    expect(syncFilasQueuesFromJiraMock).toHaveBeenCalledWith(onProgress);
  });

  it('ignora com motivo "no-config" quando o Jira não está configurado', async () => {
    getJiraConfigMock.mockReturnValue(null as ReturnType<typeof getJiraConfig>);

    const outcome = await runFilasSelectionSync();

    expect(outcome).toEqual({ status: 'skipped', reason: 'no-config' });
    expect(syncFilasQueuesFromJiraMock).not.toHaveBeenCalled();
  });

  it('ignora com motivo "auto-sync-running" quando há sync automático em andamento', async () => {
    isJiraAutoSyncRunningMock.mockReturnValue(true);

    const outcome = await runFilasSelectionSync();

    expect(outcome).toEqual({ status: 'skipped', reason: 'auto-sync-running' });
    expect(syncFilasQueuesFromJiraMock).not.toHaveBeenCalled();
  });

  it('ignora com motivo "no-selection" quando a sincronização retorna null', async () => {
    syncFilasQueuesFromJiraMock.mockResolvedValue(null);

    const outcome = await runFilasSelectionSync();

    expect(outcome).toEqual({ status: 'skipped', reason: 'no-selection' });
  });

  it('encapsula exceções em outcome de erro sem lançar', async () => {
    const error = new Error('falha na rede');
    syncFilasQueuesFromJiraMock.mockRejectedValue(error);

    const outcome = await runFilasSelectionSync();

    expect(outcome).toEqual({ status: 'error', error });
  });
});

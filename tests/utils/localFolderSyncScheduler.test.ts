import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../services/localFolderBackupService', () => ({
  isLocalFolderAutoSyncEnabled: vi.fn(() => true),
  writeBackupToFolder: vi.fn().mockResolvedValue('saved'),
}));

import { isLocalFolderAutoSyncEnabled, writeBackupToFolder } from '../../services/localFolderBackupService';
import {
  LOCAL_FOLDER_SYNC_DEBOUNCE_MS,
  resetLocalFolderSyncSchedulerForTests,
  scheduleLocalFolderSync,
} from '../../utils/localFolderSyncScheduler';

describe('localFolderSyncScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetLocalFolderSyncSchedulerForTests();
    vi.mocked(isLocalFolderAutoSyncEnabled).mockReturnValue(true);
    vi.mocked(writeBackupToFolder).mockResolvedValue('saved');
  });

  afterEach(() => {
    resetLocalFolderSyncSchedulerForTests();
    vi.useRealTimers();
  });

  it('não grava imediatamente ao agendar', () => {
    scheduleLocalFolderSync();
    expect(writeBackupToFolder).not.toHaveBeenCalled();
  });

  it('grava após debounce quando auto-sync está ativo', async () => {
    scheduleLocalFolderSync();
    await vi.advanceTimersByTimeAsync(LOCAL_FOLDER_SYNC_DEBOUNCE_MS);
    expect(writeBackupToFolder).toHaveBeenCalledOnce();
  });

  it('não grava quando auto-sync está desligado', async () => {
    vi.mocked(isLocalFolderAutoSyncEnabled).mockReturnValue(false);
    scheduleLocalFolderSync();
    await vi.advanceTimersByTimeAsync(LOCAL_FOLDER_SYNC_DEBOUNCE_MS);
    expect(writeBackupToFolder).not.toHaveBeenCalled();
  });

  it('reinicia debounce em agendamentos consecutivos', async () => {
    scheduleLocalFolderSync();
    await vi.advanceTimersByTimeAsync(LOCAL_FOLDER_SYNC_DEBOUNCE_MS - 1000);
    scheduleLocalFolderSync();
    await vi.advanceTimersByTimeAsync(LOCAL_FOLDER_SYNC_DEBOUNCE_MS - 1000);
    expect(writeBackupToFolder).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(writeBackupToFolder).toHaveBeenCalledOnce();
  });
});

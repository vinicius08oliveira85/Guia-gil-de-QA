import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { LocalBackupEnvelope } from '../../services/dbService';
import type { Project } from '../../types';

const mockProject = {
  id: 'p1',
  name: 'Projeto A',
  description: '',
  documents: [],
  businessRules: [],
  tasks: [],
  phases: [],
} as Project;

const mockEnvelope: LocalBackupEnvelope = {
  backupFormatVersion: 2,
  dbVersion: 3,
  exportedAt: '2026-07-02T12:00:00.000Z',
  app: 'qa-agile-guide',
  projects: [mockProject],
};

const mockDirHandle = {
  name: 'MeusBackups',
  queryPermission: vi.fn().mockResolvedValue('granted'),
  requestPermission: vi.fn().mockResolvedValue('granted'),
  getFileHandle: vi.fn(),
};

vi.mock('../../services/dbService', () => ({
  buildLocalBackupData: vi.fn(),
  BACKUP_EXPORT_FORMAT_VERSION: 3,
  saveLocalFolderDirectoryHandle: vi.fn().mockResolvedValue(undefined),
  getLocalFolderDirectoryHandle: vi.fn(),
  clearLocalFolderDirectoryHandle: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/fileSystemBackupService', () => ({
  writeJsonStringToFileHandle: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  buildLocalBackupData,
  getLocalFolderDirectoryHandle,
  saveLocalFolderDirectoryHandle,
  clearLocalFolderDirectoryHandle,
} from '../../services/dbService';
import { writeJsonStringToFileHandle } from '../../services/fileSystemBackupService';
import {
  clearConfiguredFolder,
  getConfiguredFolderLabel,
  getLocalFolderLastSyncAt,
  getLocalFolderLastSyncError,
  isLocalFolderAutoSyncEnabled,
  isLocalFolderBackupSupported,
  LOCAL_FOLDER_BACKUP_FILENAME,
  pickBackupFolder,
  setLocalFolderAutoSyncEnabled,
  writeBackupToFolder,
} from '../../services/localFolderBackupService';

describe('localFolderBackupService', () => {
  beforeEach(() => {
    vi.mocked(buildLocalBackupData).mockResolvedValue(mockEnvelope);
    vi.mocked(getLocalFolderDirectoryHandle).mockResolvedValue(null);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  describe('isLocalFolderBackupSupported', () => {
    it('retorna false sem showDirectoryPicker', () => {
      expect(isLocalFolderBackupSupported()).toBe(false);
    });

    it('retorna true com showDirectoryPicker', () => {
      vi.stubGlobal('showDirectoryPicker', vi.fn());
      expect(isLocalFolderBackupSupported()).toBe(true);
    });
  });

  describe('pickBackupFolder', () => {
    it('retorna unsupported sem API', async () => {
      await expect(pickBackupFolder()).resolves.toEqual({ status: 'unsupported' });
    });

    it('retorna cancelled em AbortError', async () => {
      const abort = new DOMException('cancelled', 'AbortError');
      vi.stubGlobal('showDirectoryPicker', vi.fn().mockRejectedValue(abort));
      await expect(pickBackupFolder()).resolves.toEqual({ status: 'cancelled' });
    });

    it('persiste handle e label ao escolher pasta', async () => {
      vi.stubGlobal('showDirectoryPicker', vi.fn().mockResolvedValue(mockDirHandle));
      await expect(pickBackupFolder()).resolves.toEqual({
        status: 'picked',
        folderLabel: 'MeusBackups',
      });
      expect(saveLocalFolderDirectoryHandle).toHaveBeenCalledWith(mockDirHandle);
      expect(getConfiguredFolderLabel()).toBe('MeusBackups');
    });
  });

  describe('writeBackupToFolder', () => {
    beforeEach(() => {
      vi.stubGlobal('showDirectoryPicker', vi.fn());
    });

    it('retorna no_folder sem handle configurado', async () => {
      await expect(writeBackupToFolder()).resolves.toBe('no_folder');
      expect(buildLocalBackupData).not.toHaveBeenCalled();
    });

    it('retorna permission_denied quando permissão é negada', async () => {
      const deniedHandle = {
        ...mockDirHandle,
        queryPermission: vi.fn().mockResolvedValue('denied'),
        requestPermission: vi.fn().mockResolvedValue('denied'),
      };
      vi.mocked(getLocalFolderDirectoryHandle).mockResolvedValue(
        deniedHandle as unknown as FileSystemDirectoryHandle
      );

      await expect(writeBackupToFolder()).resolves.toBe('permission_denied');
      expect(getLocalFolderLastSyncError()).toContain('Permissão');
    });

    it('grava JSON no arquivo canônico da pasta', async () => {
      const fileHandle = { name: LOCAL_FOLDER_BACKUP_FILENAME };
      const dir = {
        ...mockDirHandle,
        getFileHandle: vi.fn().mockResolvedValue(fileHandle),
      };
      vi.mocked(getLocalFolderDirectoryHandle).mockResolvedValue(
        dir as unknown as FileSystemDirectoryHandle
      );

      await expect(writeBackupToFolder()).resolves.toBe('saved');

      expect(dir.getFileHandle).toHaveBeenCalledWith(LOCAL_FOLDER_BACKUP_FILENAME, { create: true });
      expect(buildLocalBackupData).toHaveBeenCalledOnce();
      expect(writeJsonStringToFileHandle).toHaveBeenCalledOnce();
      const jsonWritten = vi.mocked(writeJsonStringToFileHandle).mock.calls[0][1];
      expect(jsonWritten).toContain('"p1"');
      expect(getLocalFolderLastSyncAt()).not.toBeNull();
      expect(getLocalFolderLastSyncError()).toBeNull();
    });
  });

  describe('clearConfiguredFolder', () => {
    it('limpa handle e preferências', async () => {
      localStorage.setItem('qa_local_folder_label', 'Test');
      localStorage.setItem('qa_local_folder_last_sync_at', '2026-01-01');
      localStorage.setItem('qa_local_folder_last_sync_error', 'erro');

      await clearConfiguredFolder();

      expect(clearLocalFolderDirectoryHandle).toHaveBeenCalledOnce();
      expect(getConfiguredFolderLabel()).toBeNull();
      expect(getLocalFolderLastSyncAt()).toBeNull();
      expect(getLocalFolderLastSyncError()).toBeNull();
    });
  });

  describe('auto sync prefs', () => {
    it('auto-sync habilitado por padrão', () => {
      expect(isLocalFolderAutoSyncEnabled()).toBe(true);
    });

    it('persiste toggle de auto-sync', () => {
      setLocalFolderAutoSyncEnabled(false);
      expect(isLocalFolderAutoSyncEnabled()).toBe(false);
      setLocalFolderAutoSyncEnabled(true);
      expect(isLocalFolderAutoSyncEnabled()).toBe(true);
    });
  });
});

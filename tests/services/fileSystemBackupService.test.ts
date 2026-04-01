import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { LocalBackupEnvelope } from '../../services/dbService';
import type { Project } from '../../types';
import {
  exportLocalBackupViaFileSystemAccess,
  isFileSystemAccessBackupSupported,
  pickBackupJsonFileViaFileSystemAccess,
} from '../../services/fileSystemBackupService';

const mockProject = { id: 'p1', name: 'Projeto A' } as Project;

const mockEnvelope: LocalBackupEnvelope = {
  backupFormatVersion: 1,
  dbVersion: 1,
  exportedAt: '2026-04-01T12:00:00.000Z',
  app: 'qa-agile-guide',
  projects: [mockProject],
};

vi.mock('../../services/dbService', () => ({
  buildLocalBackupData: vi.fn(),
  BACKUP_EXPORT_FORMAT_VERSION: 1,
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { buildLocalBackupData } from '../../services/dbService';

describe('fileSystemBackupService', () => {
  beforeEach(() => {
    vi.mocked(buildLocalBackupData).mockResolvedValue(mockEnvelope);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isFileSystemAccessBackupSupported', () => {
    it('retorna false quando showSaveFilePicker/showOpenFilePicker não existem', () => {
      expect(isFileSystemAccessBackupSupported()).toBe(false);
    });

    it('retorna true quando ambas as APIs existem', () => {
      vi.stubGlobal('showSaveFilePicker', vi.fn());
      vi.stubGlobal('showOpenFilePicker', vi.fn());
      expect(isFileSystemAccessBackupSupported()).toBe(true);
    });
  });

  describe('exportLocalBackupViaFileSystemAccess', () => {
    it('retorna unsupported sem as APIs', async () => {
      await expect(exportLocalBackupViaFileSystemAccess()).resolves.toBe('unsupported');
      expect(buildLocalBackupData).not.toHaveBeenCalled();
    });

    it('retorna cancelled quando o usuário aborta o diálogo de salvar (sem ler IndexedDB)', async () => {
      vi.stubGlobal('showOpenFilePicker', vi.fn());
      const abort = new DOMException('User cancelled', 'AbortError');
      vi.stubGlobal('showSaveFilePicker', vi.fn().mockRejectedValue(abort));

      await expect(exportLocalBackupViaFileSystemAccess()).resolves.toBe('cancelled');
      expect(buildLocalBackupData).not.toHaveBeenCalled();
    });

    it('grava JSON e retorna saved quando o fluxo completa', async () => {
      const write = vi.fn().mockResolvedValue(undefined);
      const close = vi.fn().mockResolvedValue(undefined);
      const createWritable = vi.fn().mockResolvedValue({ write, close });
      const handle = { createWritable };
      vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(handle));
      vi.stubGlobal('showOpenFilePicker', vi.fn());

      await expect(exportLocalBackupViaFileSystemAccess()).resolves.toBe('saved');

      expect(buildLocalBackupData).toHaveBeenCalledOnce();
      expect(write).toHaveBeenCalledTimes(1);
      const written = write.mock.calls[0][0] as string;
      expect(written).toContain('"p1"');
      expect(written).toContain('Projeto A');
      expect(close).toHaveBeenCalledOnce();
    });

    it('propaga erro se a escrita falhar após abrir o arquivo', async () => {
      const write = vi.fn().mockRejectedValue(new Error('disk full'));
      const close = vi.fn().mockResolvedValue(undefined);
      const handle = { createWritable: vi.fn().mockResolvedValue({ write, close }) };
      vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(handle));
      vi.stubGlobal('showOpenFilePicker', vi.fn());

      await expect(exportLocalBackupViaFileSystemAccess()).rejects.toThrow('disk full');
      expect(close).toHaveBeenCalled();
    });
  });

  describe('pickBackupJsonFileViaFileSystemAccess', () => {
    it('retorna unsupported sem as APIs', async () => {
      await expect(pickBackupJsonFileViaFileSystemAccess()).resolves.toEqual({ status: 'unsupported' });
    });

    it('retorna cancelled em AbortError', async () => {
      vi.stubGlobal('showSaveFilePicker', vi.fn());
      const abort = new DOMException('aborted', 'AbortError');
      vi.stubGlobal('showOpenFilePicker', vi.fn().mockRejectedValue(abort));

      await expect(pickBackupJsonFileViaFileSystemAccess()).resolves.toEqual({ status: 'cancelled' });
    });

    it('retorna file com File lido do handle', async () => {
      vi.stubGlobal('showSaveFilePicker', vi.fn());
      const file = new File(['{"projects":[]}'], 'backup.json', { type: 'application/json' });
      const getFile = vi.fn().mockResolvedValue(file);
      vi.stubGlobal(
        'showOpenFilePicker',
        vi.fn().mockResolvedValue([{ getFile }])
      );

      await expect(pickBackupJsonFileViaFileSystemAccess()).resolves.toEqual({
        status: 'file',
        file,
      });
      expect(getFile).toHaveBeenCalledOnce();
    });

    it('retorna cancelled quando o array de handles vem vazio', async () => {
      vi.stubGlobal('showSaveFilePicker', vi.fn());
      vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([]));

      await expect(pickBackupJsonFileViaFileSystemAccess()).resolves.toEqual({ status: 'cancelled' });
    });
  });
});

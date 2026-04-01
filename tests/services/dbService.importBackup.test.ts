import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../services/supabaseService', async (importOriginal) => {
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
    expect(supabaseService.saveProjectToSupabase).not.toHaveBeenCalled();
  });

  it('com syncToSupabase chama saveProjectToSupabase após gravar localmente', async () => {
    const file = jsonFile([{ id: 'imp-2', name: 'Com nuvem' }]);
    const result = await importProjectsFromBackup(file, { syncToSupabase: true });

    expect(result.imported).toBe(1);
    expect(result.supabaseSynced).toBe(1);
    expect(result.supabaseSyncFailed).toBe(0);
    expect(supabaseService.saveProjectToSupabase).toHaveBeenCalledOnce();
    expect(vi.mocked(supabaseService.saveProjectToSupabase).mock.calls[0][0]).toMatchObject({
      id: 'imp-2',
      name: 'Com nuvem',
    });
  });

  it('conta falha no Supabase sem impedir import local', async () => {
    vi.mocked(supabaseService.saveProjectToSupabase).mockRejectedValueOnce(new Error('rede'));

    const file = jsonFile([{ id: 'imp-3', name: 'Falha remota' }]);
    const result = await importProjectsFromBackup(file, { syncToSupabase: true });

    expect(result.imported).toBe(1);
    expect(result.supabaseSynced).toBe(0);
    expect(result.supabaseSyncFailed).toBe(1);
  });

  it('não tenta Supabase quando isSupabaseAvailable é false', async () => {
    vi.mocked(supabaseService.isSupabaseAvailable).mockReturnValue(false);

    const file = jsonFile([{ id: 'imp-4', name: 'Só local' }]);
    const result = await importProjectsFromBackup(file, { syncToSupabase: true });

    expect(result.imported).toBe(1);
    expect(result.supabaseSynced).toBe(0);
    expect(supabaseService.saveProjectToSupabase).not.toHaveBeenCalled();
  });
});

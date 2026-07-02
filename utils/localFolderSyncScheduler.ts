import {
  isLocalFolderAutoSyncEnabled,
  writeBackupToFolder,
  type WriteBackupToFolderResult,
} from '../services/localFolderBackupService';
import { logger } from './logger';

const DEBOUNCE_MS = 60_000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let syncInProgress = false;
let pendingResync = false;

function clearDebounceTimer(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

async function executeSync(options?: { force?: boolean }): Promise<WriteBackupToFolderResult | 'skipped'> {
  const force = options?.force === true;
  if (!force && !isLocalFolderAutoSyncEnabled()) {
    return 'skipped';
  }

  if (syncInProgress) {
    pendingResync = true;
    return 'skipped';
  }

  syncInProgress = true;
  try {
    const result = await writeBackupToFolder();
    if (result !== 'saved' && result !== 'no_folder' && result !== 'unsupported') {
      logger.warn(`Sync automático na pasta: ${result}`, 'localFolderSyncScheduler');
    }
    return result;
  } catch (error) {
    logger.error('Erro no sync automático na pasta', 'localFolderSyncScheduler', error);
    throw error;
  } finally {
    syncInProgress = false;
    if (pendingResync) {
      pendingResync = false;
      scheduleLocalFolderSync();
    }
  }
}

/**
 * Agenda gravação debounced do backup na pasta fixa (se auto-sync estiver ativo).
 */
export function scheduleLocalFolderSync(): void {
  if (!isLocalFolderAutoSyncEnabled()) return;

  clearDebounceTimer();
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void executeSync();
  }, DEBOUNCE_MS);
}

/**
 * Grava imediatamente na pasta fixa (ignora debounce).
 * Com `force: true`, grava mesmo se auto-sync estiver desligado.
 */
export async function flushLocalFolderSync(options?: { force?: boolean }): Promise<
  WriteBackupToFolderResult | 'skipped'
> {
  clearDebounceTimer();
  return executeSync(options);
}

/** Expõe intervalo de debounce para testes. */
export const LOCAL_FOLDER_SYNC_DEBOUNCE_MS = DEBOUNCE_MS;

/** Limpa timers pendentes (útil em testes). */
export function resetLocalFolderSyncSchedulerForTests(): void {
  clearDebounceTimer();
  syncInProgress = false;
  pendingResync = false;
}

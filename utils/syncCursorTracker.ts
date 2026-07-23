import { logger } from './logger';

const CURSOR_STORAGE_KEY_PREFIX = 'jira-sync-cursor-';

/**
 * Rastreia a posição do cursor de sincronização incremental.
 * Permite que syncs subsequentes retomem de onde pararam,
 * reduzindo o volume de dados buscados a cada ciclo.
 */
export interface SyncCursor {
  /** Offset (startAt) da última sync bem-sucedida. */
  startAt: number;
  /** Timestamp ISO de quando o cursor foi salvo. */
  savedAt: string;
  /** Quantas issues foram processadas até este cursor. */
  totalProcessed: number;
}

/**
 * Carrega o cursor salvo para um projeto.
 */
export function loadSyncCursor(jiraProjectKey: string): SyncCursor | null {
  try {
    const raw = localStorage.getItem(`${CURSOR_STORAGE_KEY_PREFIX}${jiraProjectKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncCursor;
    if (typeof parsed.startAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Salva o cursor após uma sync bem-sucedida.
 */
export function saveSyncCursor(
  jiraProjectKey: string,
  startAt: number,
  totalProcessed: number
): void {
  const cursor: SyncCursor = {
    startAt,
    savedAt: new Date().toISOString(),
    totalProcessed,
  };
  try {
    localStorage.setItem(
      `${CURSOR_STORAGE_KEY_PREFIX}${jiraProjectKey}`,
      JSON.stringify(cursor)
    );
    logger.debug(
      `Cursor salvo para ${jiraProjectKey}: startAt=${startAt}, processadas=${totalProcessed}`,
      'syncCursorTracker'
    );
  } catch {
    /* localStorage indisponível */
  }
}

/**
 * Remove o cursor salvo (usado quando o projeto é deletado ou uma sync full é solicitada).
 */
export function clearSyncCursor(jiraProjectKey: string): void {
  try {
    localStorage.removeItem(`${CURSOR_STORAGE_KEY_PREFIX}${jiraProjectKey}`);
  } catch {
    /* ignore */
  }
}

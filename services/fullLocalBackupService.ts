import type { PersistedCacheEntry } from './ai/testCaseGenerationCachePersistence';
import {
  loadAllPersistedCacheEntries,
  savePersistedCacheEntry,
} from './ai/testCaseGenerationCachePersistence';
import {
  FILAS_PROJECT_STORAGE_KEY,
  FILAS_QUEUE_STORAGE_KEY,
} from './taskTrackingStorage';
import { logger } from '../utils/logger';

/** Prefixos de chaves do localStorage incluídos no backup completo (v3+). */
export const BACKED_UP_LOCAL_STORAGE_PREFIXES = [
  'qa-workspace-session:',
  'tasks_filters_',
  'saved_filters_',
  'qa-notepad-dock:',
  'filters_',
  'qa_user_preferences',
  'qa_audit_logs',
  'qa_attachments',
  'qa_notifications',
  'jira_config',
  'jira_last_url',
  'gemini_api_key',
  'qa_local_folder_',
  'theme',
  'jira-solus-filas-local-filters',
  'jira-filas-',
  'api_cache_',
  'jira_projects_',
] as const;

/** Chaves exatas do sessionStorage incluídas no backup (filas / UI). */
export const BACKED_UP_SESSION_STORAGE_KEYS = [
  FILAS_PROJECT_STORAGE_KEY,
  FILAS_QUEUE_STORAGE_KEY,
  'taskIdToFocus',
] as const;

/** Estado complementar do app (fora dos projetos e do taskTracking). */
export interface FullAppStateBackup {
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  testGenerationCache: PersistedCacheEntry[];
}

function shouldBackupLocalStorageKey(key: string): boolean {
  if (key.startsWith('jira-solus-filas-tasks')) return false;
  if (key.startsWith('jira-solus-filas-sla-risk')) return false;
  return BACKED_UP_LOCAL_STORAGE_PREFIXES.some(prefix => key.startsWith(prefix));
}

function readBrowserStorageMap(
  storage: Storage,
  includeKey: (key: string) => boolean
): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof window === 'undefined') return result;

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !includeKey(key)) continue;
    const value = storage.getItem(key);
    if (value !== null) result[key] = value;
  }
  return result;
}

/**
 * Coleta preferências, sessões de workspace, filtros, credenciais e cache de IA.
 */
export async function collectFullAppStateBackup(): Promise<FullAppStateBackup> {
  const localStorageSnapshot =
    typeof window !== 'undefined'
      ? readBrowserStorageMap(window.localStorage, shouldBackupLocalStorageKey)
      : {};

  const sessionStorageSnapshot =
    typeof window !== 'undefined'
      ? readBrowserStorageMap(window.sessionStorage, key =>
          (BACKED_UP_SESSION_STORAGE_KEYS as readonly string[]).includes(key)
        )
      : {};

  const testGenerationCache = await loadAllPersistedCacheEntries();

  return {
    localStorage: localStorageSnapshot,
    sessionStorage: sessionStorageSnapshot,
    testGenerationCache,
  };
}

/**
 * Restaura o estado complementar do app a partir do backup.
 */
export async function restoreFullAppStateBackup(
  appState: FullAppStateBackup | undefined
): Promise<void> {
  if (!appState || typeof window === 'undefined') return;

  for (const [key, value] of Object.entries(appState.localStorage ?? {})) {
    if (!shouldBackupLocalStorageKey(key)) continue;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      logger.warn(`Falha ao restaurar localStorage: ${key}`, 'fullLocalBackupService', error);
    }
  }

  for (const [key, value] of Object.entries(appState.sessionStorage ?? {})) {
    if (!(BACKED_UP_SESSION_STORAGE_KEYS as readonly string[]).includes(key)) continue;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      logger.warn(`Falha ao restaurar sessionStorage: ${key}`, 'fullLocalBackupService', error);
    }
  }

  const entries = Array.isArray(appState.testGenerationCache) ? appState.testGenerationCache : [];
  if (entries.length === 0) return;

  for (const entry of entries) {
    if (!entry?.taskId) continue;
    await savePersistedCacheEntry(entry);
  }

  logger.info(
    `Estado do app restaurado: ${Object.keys(appState.localStorage ?? {}).length} chave(s) localStorage, ${entries.length} cache(s) de IA`,
    'fullLocalBackupService'
  );
}

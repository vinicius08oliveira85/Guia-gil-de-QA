import type { FullAppStateBackup } from './fullLocalBackupService';
import { shouldBackupLocalStorageKey } from './fullLocalBackupService';
import { JIRA_CONFIG_KEY } from './jira/types';
import { geminiApiKeyManager } from './ai/geminiApiKeyManager';
import { APP_LOGS_UPDATED_EVENT } from '../utils/appLogStore';
import { LOCAL_FOLDER_CONFIG_UPDATED_EVENT } from './localFolderBackupService';
import { logger } from '../utils/logger';

/** Disparado após restauração de backup v3 para recarregar abas de Configurações. */
export const APP_STATE_RESTORED_EVENT = 'qa-app-state-restored';

export interface AppStateRestoreSummary {
  localStorageKeys: number;
  sessionStorageKeys: number;
  jiraConfig: boolean;
  geminiKeysCount: number;
  preferences: boolean;
  cacheEntries: number;
  hasLocalFolderPrefs: boolean;
  hasAppLogs: boolean;
}

export function summarizeAppStateBackup(appState: FullAppStateBackup): AppStateRestoreSummary {
  const localStorage = appState.localStorage ?? {};
  const sessionStorage = appState.sessionStorage ?? {};

  const localStorageKeys = Object.keys(localStorage).filter(shouldBackupLocalStorageKey).length;
  const sessionStorageKeys = Object.keys(sessionStorage).length;

  let geminiKeysCount = 0;
  const keysJson = localStorage.gemini_api_keys;
  if (keysJson) {
    try {
      const parsed: unknown = JSON.parse(keysJson);
      if (Array.isArray(parsed)) {
        geminiKeysCount = parsed.length;
      } else if (
        parsed &&
        typeof parsed === 'object' &&
        'keys' in parsed &&
        Array.isArray((parsed as { keys: unknown }).keys)
      ) {
        geminiKeysCount = (parsed as { keys: unknown[] }).keys.length;
      }
    } catch {
      /* ignore */
    }
  } else if (localStorage.gemini_api_key?.trim()) {
    geminiKeysCount = 1;
  }

  const hasLocalFolderPrefs = Object.keys(localStorage).some(k => k.startsWith('qa_local_folder_'));

  return {
    localStorageKeys,
    sessionStorageKeys,
    jiraConfig: JIRA_CONFIG_KEY in localStorage,
    geminiKeysCount,
    preferences: 'qa_user_preferences' in localStorage,
    cacheEntries: Array.isArray(appState.testGenerationCache)
      ? appState.testGenerationCache.length
      : 0,
    hasLocalFolderPrefs,
    hasAppLogs: 'qa_app_logs' in localStorage,
  };
}

/**
 * Recarrega chaves Gemini em memória e invalida cache do factory de IA.
 */
export async function reloadGeminiRuntime(): Promise<void> {
  geminiApiKeyManager.reloadKeys();
  try {
    const { invalidateAIServiceCache } = await import('./ai/aiServiceFactory');
    invalidateAIServiceCache();
  } catch (error) {
    logger.warn('Falha ao invalidar cache de IA', 'appStateRestoreService', error);
  }
}

/**
 * Recarrega runtime de IA e notifica componentes após restore de appState.
 */
export async function applyRuntimeAfterAppStateRestore(
  summary: AppStateRestoreSummary
): Promise<void> {
  if (typeof window === 'undefined') return;

  await reloadGeminiRuntime();

  if (summary.hasAppLogs) {
    window.dispatchEvent(new CustomEvent(APP_LOGS_UPDATED_EVENT));
  }
  if (summary.hasLocalFolderPrefs) {
    window.dispatchEvent(new CustomEvent(LOCAL_FOLDER_CONFIG_UPDATED_EVENT));
  }

  window.dispatchEvent(
    new CustomEvent<AppStateRestoreSummary>(APP_STATE_RESTORED_EVENT, { detail: summary })
  );

  logger.info(
    `Runtime atualizado após restore: Jira=${summary.jiraConfig}, Gemini=${summary.geminiKeysCount} chave(s)`,
    'appStateRestoreService'
  );
}

/** Mensagem curta para toast após importação com appState. */
export function formatAppStateRestoreMessage(summary: AppStateRestoreSummary): string {
  const parts: string[] = [];
  if (summary.jiraConfig) parts.push('credenciais Jira');
  if (summary.geminiKeysCount > 0) {
    parts.push(
      `${summary.geminiKeysCount} chave(s) Gemini`
    );
  }
  if (summary.preferences) parts.push('preferências');
  if (summary.cacheEntries > 0) {
    parts.push(`${summary.cacheEntries} cache(s) de IA`);
  }
  if (parts.length === 0 && summary.localStorageKeys > 0) {
    parts.push(`${summary.localStorageKeys} configuração(ões)`);
  }
  if (parts.length === 0) return '';
  return `Configurações restauradas: ${parts.join(', ')}.`;
}

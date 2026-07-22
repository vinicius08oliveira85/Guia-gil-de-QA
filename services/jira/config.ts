import type { JiraConfig } from './types';
import { JIRA_CONFIG_KEY, JIRA_LAST_URL_KEY } from './types';
import { jiraApiCall } from './api';
import { logger } from '../../utils/logger';
import { flushLocalFolderSync } from '../../utils/localFolderSyncScheduler';
import {
  saveEncryptedConfig,
  loadDecryptedConfig,
  removeEncryptedConfig,
  hasEncryptedConfig,
} from '../../utils/jiraConfigCrypto';

function syncFolderBackupAfterConfigChange(): void {
  void flushLocalFolderSync({ force: true }).catch(() => {
    /* pasta não configurada ou permissão negada */
  });
}

export const saveJiraConfig = (config: JiraConfig): void => {
  saveEncryptedConfig(config);
  if (config.url?.trim()) {
    localStorage.setItem(JIRA_LAST_URL_KEY, config.url.trim());
  }
  syncFolderBackupAfterConfigChange();
};

export const getJiraConfig = (): JiraConfig | null => {
  const stored = localStorage.getItem(JIRA_CONFIG_KEY);
  if (stored) {
    // Fallback: migrar configuração antiga (plain text) para o novo formato criptografado
    try {
      const plain = JSON.parse(stored) as JiraConfig;
      if (plain.apiToken && !hasEncryptedConfig()) {
        saveEncryptedConfig(plain);
        localStorage.removeItem(JIRA_CONFIG_KEY);
      }
      return plain;
    } catch {
      // ignorar formato inválido antigo
    }
  }
  return loadDecryptedConfig();
};

export const getJiraLastUrl = (): string => {
  return localStorage.getItem(JIRA_LAST_URL_KEY) ?? '';
};

export const setJiraLastUrl = (url: string): void => {
  const trimmed = url?.trim() ?? '';
  if (trimmed) {
    localStorage.setItem(JIRA_LAST_URL_KEY, trimmed);
  }
};

export const deleteJiraConfig = (): void => {
  localStorage.removeItem(JIRA_CONFIG_KEY);
  removeEncryptedConfig();
  syncFolderBackupAfterConfigChange();
};

export const testJiraConnection = async (config: JiraConfig): Promise<boolean> => {
  try {
    await jiraApiCall(config, 'myself');
    return true;
  } catch (error) {
    logger.error('Jira connection test failed', 'jiraService', error);
    return false;
  }
};

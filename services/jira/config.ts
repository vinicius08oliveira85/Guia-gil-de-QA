import type { JiraConfig } from './types';
import { JIRA_CONFIG_KEY, JIRA_LAST_URL_KEY } from './types';
import { jiraApiCall } from './api';
import { logger } from '../../utils/logger';
import { flushLocalFolderSync } from '../../utils/localFolderSyncScheduler';
import {
  saveEncryptedConfig,
  getCachedConfig,
  removeEncryptedConfig,
  hasEncryptedConfig,
} from '../../utils/jiraConfigCrypto';

function syncFolderBackupAfterConfigChange(): void {
  void flushLocalFolderSync({ force: true }).catch(() => {
    /* pasta não configurada ou permissão negada */
  });
}

export const saveJiraConfig = (config: JiraConfig): void => {
  saveEncryptedConfig(config).catch(err => {
    logger.error('Falha ao criptografar config Jira. Token NÃO foi salvo.', 'jiraConfig', err);
  });
  if (config.url?.trim()) {
    localStorage.setItem(JIRA_LAST_URL_KEY, config.url.trim());
  }
  syncFolderBackupAfterConfigChange();
};

export const getJiraConfig = (): JiraConfig | null => {
  // Tentar cache em memória primeiro (rápido, síncrono)
  const cached = getCachedConfig();
  if (cached) return cached;

  const stored = localStorage.getItem(JIRA_CONFIG_KEY);
  if (stored) {
    try {
      const plain = JSON.parse(stored) as JiraConfig;
      if (plain.apiToken) {
        saveEncryptedConfig(plain).then(() => {
          localStorage.removeItem(JIRA_CONFIG_KEY);
        }).catch(() => {
          logger.warn('Falha ao migrar config legada, mantendo texto plano', 'jiraConfig');
        });
      }
      return plain;
    } catch {
      logger.debug('Config legada inválida ignorada', 'jiraConfig');
    }
  }

  // Se não tem cache e não tem legado, carregar async e retornar null por enquanto
  loadDecryptedConfigAsync().catch(err => {
    logger.warn('Falha ao carregar config criptografada', 'jiraConfig', err);
  });
  return null;
};

/** Carrega config criptografada do storage e popula o cache. */
async function loadDecryptedConfigAsync(): Promise<JiraConfig | null> {
  const { loadDecryptedConfig } = await import('../../utils/jiraConfigCrypto');
  return loadDecryptedConfig();
}

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

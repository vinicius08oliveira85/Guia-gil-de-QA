import type { JiraConfig } from './types';
import { JIRA_CONFIG_KEY, JIRA_LAST_URL_KEY } from './types';
import { jiraApiCall } from './api';
import { logger } from '../../utils/logger';
import { flushLocalFolderSync } from '../../utils/localFolderSyncScheduler';
import {
  saveEncryptedConfig,
  getCachedConfig,
  removeEncryptedConfig,
} from '../../utils/jiraConfigCrypto';

function syncFolderBackupAfterConfigChange(): void {
  void flushLocalFolderSync({ force: true }).catch(() => {
    /* pasta não configurada ou permissão negada */
  });
}

export const saveJiraConfig = async (config: JiraConfig): Promise<void> => {
  try {
    await saveEncryptedConfig(config);
  } catch (err) {
    logger.error('Falha ao criptografar config Jira. Token NÃO foi salvo.', 'jiraConfig', err);
    throw new Error('Falha ao criptografar configuração Jira. Verifique se VITE_CRYPTO_PASSPHRASE está configurado.');
  }
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

/** Promise pendente para evitar disparos duplicados enquanto a descriptografia roda. */
let pendingDecryptPromise: Promise<JiraConfig | null> | null = null;

/** Carrega config criptografada do storage e popula o cache. */
async function loadDecryptedConfigAsync(): Promise<JiraConfig | null> {
  if (pendingDecryptPromise) return pendingDecryptPromise;
  pendingDecryptPromise = (async () => {
    const { loadDecryptedConfig } = await import('../../utils/jiraConfigCrypto');
    return loadDecryptedConfig();
  })();
  try {
    return await pendingDecryptPromise;
  } finally {
    pendingDecryptPromise = null;
  }
}

/**
 * Aguarda a carga async da config e retorna.
 * Deve ser chamado no bootstrap da aplicação para garantir que a config
 * esteja disponível antes de operações que dependem dela (auto-sync, etc.).
 */
let bootstrapPromise: Promise<JiraConfig | null> | null = null;
export function waitForJiraConfig(): Promise<JiraConfig | null> {
  if (!bootstrapPromise) {
    const cached = getCachedConfig();
    if (cached) {
      bootstrapPromise = Promise.resolve(cached);
    } else {
      bootstrapPromise = loadDecryptedConfigAsync();
    }
  }
  return bootstrapPromise;
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
  bootstrapPromise = null;
  syncFolderBackupAfterConfigChange();
};

export const testJiraConnection = async (config: JiraConfig): Promise<boolean> => {
  try {
    await jiraApiCall(config, 'myself');
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('FUNCTION_INVOCATION_FAILED') || msg.includes('FUNCTION_INVOCATION_TIMEOUT')) {
      throw new Error(
        'O proxy do Jira na Vercel falhou ao executar (/api/jira-proxy). Abra o deployment → Runtime Logs da function e confira o erro. Em geral não é credencial Jira (401/403); costuma ser crash ou timeout da serverless.'
      );
    }
    if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
      throw new Error('Credenciais inválidas (HTTP 401). Verifique o e-mail e o API Token do Jira.');
    }
    if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
      throw new Error(
        'Acesso negado (HTTP 403). Seu token não tem permissão para esta operação no Jira. ' +
          'Confira Browse Projects, Browse Issues e, para Filas, licença de agente do Service Management.'
      );
    }
    if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
      throw new Error('URL do Jira não encontrada (HTTP 404). Verifique a URL do servidor.');
    }
    if (msg.includes('proxy') || msg.includes('Proxy')) {
      throw new Error(`Erro no proxy: ${msg}`);
    }
    throw new Error(`Falha ao conectar ao Jira: ${msg}`);
  }
};

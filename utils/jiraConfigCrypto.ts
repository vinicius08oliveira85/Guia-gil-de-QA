import type { JiraConfig } from '../services/jira/types';

const ENC_PREFIX = 'enc:';
const STORAGE_KEY = 'jira-config-encrypted';

/**
 * Ofuscação simples do token (não é criptografia real — é uma camada
 * para evitar exposição acidental em inspecionar elemento / backups.
 *
 * Para segurança real, use um proxy server-side que nunca exponha o
 * token ao client.
 */
function obfuscate(text: string): string {
  return btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x2A)).join(''));
}

function deobfuscate(encoded: string): string {
  try {
    return atob(encoded).split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x2A)).join('');
  } catch {
    return '';
  }
}

export function encryptConfig(config: JiraConfig): JiraConfig {
  return {
    ...config,
    apiToken: `${ENC_PREFIX}${obfuscate(config.apiToken)}`,
  };
}

export function decryptConfig(stored: JiraConfig): JiraConfig {
  if (stored.apiToken?.startsWith(ENC_PREFIX)) {
    return {
      ...stored,
      apiToken: deobfuscate(stored.apiToken.slice(ENC_PREFIX.length)),
    };
  }
  return stored;
}

export function saveEncryptedConfig(config: JiraConfig): void {
  const encrypted = encryptConfig(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
}

export function loadDecryptedConfig(): JiraConfig | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as JiraConfig;
    return decryptConfig(parsed);
  } catch {
    return null;
  }
}

export function removeEncryptedConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasEncryptedConfig(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

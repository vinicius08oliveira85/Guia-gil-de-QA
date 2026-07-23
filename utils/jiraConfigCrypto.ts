import type { JiraConfig } from '../services/jira/types';

const ENC_PREFIX = 'aes:';
const STORAGE_KEY = 'jira-config-encrypted';
const LEGACY_PREFIX = 'enc:';
const APP_PASSPHRASE = 'qa-agile-guide-v1';

let cachedConfig: JiraConfig | null = null;

/**
 * Deriva uma chave AES-GCM a partir de uma senha e salt usando PBKDF2.
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(APP_PASSPHRASE),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function aesEncrypt(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt);
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  const toBase64 = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)));

  return `${ENC_PREFIX}${toBase64(salt)}:${toBase64(iv)}:${toBase64(ciphertext)}`;
}

async function aesDecrypt(encoded: string): Promise<string> {
  const parts = encoded.slice(ENC_PREFIX.length).split(':');
  if (parts.length !== 3) return '';

  const fromBase64 = (str: string) => {
    const binaryStr = atob(str);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    return bytes;
  };

  try {
    const salt = fromBase64(parts[0]);
    const iv = fromBase64(parts[1]);
    const ciphertext = fromBase64(parts[2]);
    const key = await deriveKey(salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return '';
  }
}

/**
 * Obfuscação XOR legada (mantida para compatibilidade com dados existentes).
 */
function legacyObfuscate(text: string): string {
  return btoa(
    text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x2a)).join('')
  );
}

function legacyDeobfuscate(encoded: string): string {
  try {
    return atob(encoded)
      .split('')
      .map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x2a))
      .join('');
  } catch {
    return '';
  }
}

export async function encryptConfig(config: JiraConfig): Promise<JiraConfig> {
  const encryptedToken = await aesEncrypt(config.apiToken);
  return { ...config, apiToken: encryptedToken };
}

export async function decryptConfig(
  stored: JiraConfig
): Promise<JiraConfig> {
  if (stored.apiToken?.startsWith(ENC_PREFIX)) {
    const decrypted = await aesDecrypt(stored.apiToken);
    if (!decrypted) return { ...stored, apiToken: '' };
    return { ...stored, apiToken: decrypted };
  }
  if (stored.apiToken?.startsWith(LEGACY_PREFIX)) {
    return {
      ...stored,
      apiToken: legacyDeobfuscate(stored.apiToken.slice(LEGACY_PREFIX.length)),
    };
  }
  return stored;
}

/**
 * Salva config criptografada (async). Atualiza o cache em memória.
 */
export async function saveEncryptedConfig(config: JiraConfig): Promise<void> {
  const encrypted = await encryptConfig(config);
  cachedConfig = config;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
}

/**
 * Carrega e descriptografa a config (async). Atualiza o cache em memória.
 */
export async function loadDecryptedConfig(): Promise<JiraConfig | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as JiraConfig;
    const decrypted = await decryptConfig(parsed);
    cachedConfig = decrypted;
    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Retorna a config do cache em memória (sync).
 * Para leitura síncrona após a primeira carga async.
 */
export function getCachedConfig(): JiraConfig | null {
  return cachedConfig;
}

/**
 * Invalida o cache e remove do storage (sync).
 */
export function removeEncryptedConfig(): void {
  cachedConfig = null;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasEncryptedConfig(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null || cachedConfig !== null;
}

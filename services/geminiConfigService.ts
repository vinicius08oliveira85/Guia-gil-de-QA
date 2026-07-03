/**
 * Serviço para gerenciar múltiplas API Keys do Gemini (nome + chave + prioridade).
 */

import { scheduleLocalFolderSync } from '../utils/localFolderSyncScheduler';

const LEGACY_STORAGE_KEY = 'gemini_api_key';
const KEYS_STORAGE_KEY = 'gemini_api_keys';

/** @deprecated formato legado — use GeminiApiKeyEntry */
export interface GeminiConfig {
  apiKey: string;
}

export interface GeminiApiKeyEntry {
  id: string;
  name: string;
  apiKey: string;
  /** Ordem de fallback (0 = primeira tentativa). */
  priority: number;
  enabled: boolean;
  createdAt: string;
}

export interface GeminiKeysConfig {
  version: 2;
  keys: GeminiApiKeyEntry[];
}

function assertLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('localStorage não está disponível');
  }
}

function generateKeyId(): string {
  return `gemini-key-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sortKeys(keys: GeminiApiKeyEntry[]): GeminiApiKeyEntry[] {
  return [...keys].sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt));
}

/** Atribui priority pela ordem do array (fallback), sem reordenar. */
function assignPrioritiesInOrder(keys: GeminiApiKeyEntry[]): GeminiApiKeyEntry[] {
  return keys.map((entry, index) => ({ ...entry, priority: index }));
}

function migrateLegacyConfig(): GeminiKeysConfig | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return null;
    const legacy = JSON.parse(stored) as GeminiConfig;
    const apiKey = legacy?.apiKey?.trim();
    if (!apiKey) return null;

    const migrated: GeminiKeysConfig = {
      version: 2,
      keys: [
        {
          id: generateKeyId(),
          name: 'Principal',
          apiKey,
          priority: 0,
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(migrated));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migrated;
  } catch {
    return null;
  }
}

/**
 * Recupera todas as chaves configuradas (com migração automática do formato legado).
 */
export const getGeminiKeysConfig = (): GeminiKeysConfig => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { version: 2, keys: [] };
  }

  try {
    const stored = localStorage.getItem(KEYS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as GeminiKeysConfig;
      if (parsed?.version === 2 && Array.isArray(parsed.keys)) {
        return { version: 2, keys: sortKeys(parsed.keys) };
      }
    }
  } catch {
    /* fallthrough to migration */
  }

  const migrated = migrateLegacyConfig();
  return migrated ?? { version: 2, keys: [] };
};

/**
 * Salva a configuração completa de chaves (ordem do array = ordem de fallback).
 */
export const saveGeminiKeysConfig = (config: GeminiKeysConfig): void => {
  assertLocalStorage();
  localStorage.setItem(
    KEYS_STORAGE_KEY,
    JSON.stringify({ version: 2, keys: assignPrioritiesInOrder(config.keys) })
  );
  scheduleLocalFolderSync();
};

/**
 * Compatibilidade: retorna a primeira chave habilitada ou null.
 */
export const getGeminiConfig = (): GeminiConfig | null => {
  const first = getGeminiKeysConfig().keys.find(k => k.enabled && k.apiKey.trim());
  return first ? { apiKey: first.apiKey.trim() } : null;
};

/**
 * Compatibilidade: upsert de uma única chave como "Principal".
 */
export const saveGeminiConfig = (config: GeminiConfig): void => {
  const apiKey = config.apiKey.trim();
  const current = getGeminiKeysConfig();
  const existing = current.keys[0];

  if (existing) {
    saveGeminiKeysConfig({
      version: 2,
      keys: assignPrioritiesInOrder([
        { ...existing, apiKey, name: existing.name || 'Principal', enabled: true },
        ...current.keys.slice(1),
      ]),
    });
    return;
  }

  saveGeminiKeysConfig({
    version: 2,
    keys: [
      {
        id: generateKeyId(),
        name: 'Principal',
        apiKey,
        priority: 0,
        enabled: true,
        createdAt: new Date().toISOString(),
      },
    ],
  });
};

export const deleteGeminiConfig = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.removeItem(KEYS_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
};

export const hasGeminiConfig = (): boolean => {
  return getGeminiKeysConfig().keys.some(k => k.enabled && k.apiKey.trim().length > 0);
};

export interface UpsertGeminiKeyInput {
  name: string;
  apiKey: string;
  enabled?: boolean;
}

/**
 * Adiciona nova chave ao final da fila de fallback.
 */
export const addGeminiKey = (input: UpsertGeminiKeyInput): GeminiApiKeyEntry => {
  const current = getGeminiKeysConfig();
  const entry: GeminiApiKeyEntry = {
    id: generateKeyId(),
    name: input.name.trim() || `Chave ${current.keys.length + 1}`,
    apiKey: input.apiKey.trim(),
    priority: current.keys.length,
    enabled: input.enabled ?? true,
    createdAt: new Date().toISOString(),
  };
  saveGeminiKeysConfig({ version: 2, keys: [...current.keys, entry] });
  return entry;
};

/**
 * Atualiza chave existente por id.
 */
export const updateGeminiKey = (
  id: string,
  patch: Partial<Pick<GeminiApiKeyEntry, 'name' | 'apiKey' | 'enabled' | 'priority'>>
): GeminiApiKeyEntry | null => {
  const current = getGeminiKeysConfig();
  const index = current.keys.findIndex(k => k.id === id);
  if (index < 0) return null;

  const updated: GeminiApiKeyEntry = {
    ...current.keys[index],
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() || current.keys[index].name : current.keys[index].name,
    apiKey: patch.apiKey !== undefined ? patch.apiKey.trim() : current.keys[index].apiKey,
  };

  const keys = [...current.keys];
  keys[index] = updated;
  saveGeminiKeysConfig({ version: 2, keys });
  return updated;
};

export const removeGeminiKey = (id: string): boolean => {
  const current = getGeminiKeysConfig();
  const next = current.keys.filter(k => k.id !== id);
  if (next.length === current.keys.length) return false;
  saveGeminiKeysConfig({ version: 2, keys: next });
  return true;
};

/**
 * Reordena chaves (ids na ordem desejada de fallback).
 */
export const reorderGeminiKeys = (orderedIds: string[]): void => {
  const current = getGeminiKeysConfig();
  const byId = new Map(current.keys.map(k => [k.id, k]));
  const reordered: GeminiApiKeyEntry[] = [];

  for (const id of orderedIds) {
    const entry = byId.get(id);
    if (entry) {
      reordered.push(entry);
      byId.delete(id);
    }
  }

  for (const entry of byId.values()) {
    reordered.push(entry);
  }

  saveGeminiKeysConfig({ version: 2, keys: reordered });
};

export const maskGeminiApiKey = (apiKey: string): string => {
  const k = apiKey.trim();
  if (k.length <= 12) return '••••••••';
  return `${k.slice(0, 8)}…${k.slice(-4)}`;
};

/** Id fixo da chave carregada via variável de ambiente no manager. */
export const GEMINI_ENV_KEY_ID = 'env-gemini-key';

export interface GeminiEnvKeyInfo {
  configured: boolean;
  /** Verdadeiro quando o manager usa a chave do .env (sem chaves habilitadas na UI). */
  activeAsFallback: boolean;
  id: typeof GEMINI_ENV_KEY_ID;
  name: string;
}

/**
 * Indica se há chave Gemini definida em VITE_GEMINI_API_KEY / GEMINI_API_KEY.
 */
export function getGeminiEnvKeyInfo(): GeminiEnvKeyInfo | null {
  const envKey = (
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    ''
  ).trim();
  if (!envKey) return null;

  const hasUiKeys = getGeminiKeysConfig().keys.some(k => k.enabled && k.apiKey.trim().length > 0);

  return {
    configured: true,
    activeAsFallback: !hasUiKeys,
    id: GEMINI_ENV_KEY_ID,
    name: 'Ambiente (VITE_GEMINI_API_KEY)',
  };
}

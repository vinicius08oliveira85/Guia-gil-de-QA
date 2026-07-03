/**
 * Rastreamento local de uso por chave Gemini (métricas do app, não quota oficial Google).
 */

export interface GeminiKeyUsageStats {
  keyId: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  rateLimitCount: number;
  estimatedTokens: number;
  lastUsedAt?: string;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
}

export const GEMINI_USAGE_STORAGE_KEY = 'gemini_api_key_usage';
export const GEMINI_USAGE_UPDATED_EVENT = 'gemini-api-usage-updated';

interface UsageStore {
  version: 1;
  byKeyId: Record<string, GeminiKeyUsageStats>;
}

function emptyStats(keyId: string): GeminiKeyUsageStats {
  return {
    keyId,
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    rateLimitCount: 0,
    estimatedTokens: 0,
  };
}

function readStore(): UsageStore {
  if (typeof window === 'undefined') {
    return { version: 1, byKeyId: {} };
  }
  try {
    const raw = localStorage.getItem(GEMINI_USAGE_STORAGE_KEY);
    if (!raw) return { version: 1, byKeyId: {} };
    const parsed = JSON.parse(raw) as UsageStore;
    if (parsed?.version === 1 && parsed.byKeyId && typeof parsed.byKeyId === 'object') {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return { version: 1, byKeyId: {} };
}

function writeStore(store: UsageStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GEMINI_USAGE_STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(GEMINI_USAGE_UPDATED_EVENT));
  } catch {
    /* ignore quota */
  }
}

export function getGeminiKeyUsage(keyId: string): GeminiKeyUsageStats {
  const store = readStore();
  return store.byKeyId[keyId] ?? emptyStats(keyId);
}

export function getAllGeminiKeyUsage(): GeminiKeyUsageStats[] {
  return Object.values(readStore().byKeyId);
}

export interface RecordGeminiKeyUsageInput {
  success?: boolean;
  rateLimited?: boolean;
  errorMessage?: string;
  tokens?: number;
}

/**
 * Registra uma tentativa de uso de chave.
 */
export function recordGeminiKeyUsage(keyId: string, input: RecordGeminiKeyUsageInput): void {
  if (!keyId) return;
  const store = readStore();
  const current = store.byKeyId[keyId] ?? emptyStats(keyId);
  const now = new Date().toISOString();

  const next: GeminiKeyUsageStats = {
    ...current,
    requestCount: current.requestCount + 1,
    lastUsedAt: now,
  };

  if (input.success) {
    next.successCount += 1;
    next.lastSuccessAt = now;
    if (input.tokens && input.tokens > 0) {
      next.estimatedTokens += input.tokens;
    }
  } else {
    next.errorCount += 1;
    next.lastErrorAt = now;
    next.lastErrorMessage = input.errorMessage?.slice(0, 500);
  }

  if (input.rateLimited) {
    next.rateLimitCount += 1;
  }

  store.byKeyId[keyId] = next;
  writeStore(store);
}

export function resetGeminiKeyUsage(keyId?: string): void {
  if (keyId) {
    const store = readStore();
    delete store.byKeyId[keyId];
    writeStore(store);
    return;
  }
  writeStore({ version: 1, byKeyId: {} });
}

export function removeGeminiKeyUsage(keyId: string): void {
  resetGeminiKeyUsage(keyId);
}

/** Extrai contagem de tokens de usageMetadata do SDK Gemini, quando disponível. */
export function extractTokenCountFromResponse(response: unknown): number {
  if (!response || typeof response !== 'object') return 0;
  const r = response as Record<string, unknown>;
  const usage = r.usageMetadata ?? r.usage_metadata;
  if (!usage || typeof usage !== 'object') return 0;
  const u = usage as Record<string, unknown>;
  const total = u.totalTokenCount ?? u.total_token_count;
  if (typeof total === 'number' && total > 0) return total;
  const prompt = (u.promptTokenCount ?? u.prompt_token_count) as number | undefined;
  const candidates = (u.candidatesTokenCount ?? u.candidates_token_count) as number | undefined;
  return (prompt ?? 0) + (candidates ?? 0);
}

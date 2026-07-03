/**
 * Gerenciador de API Keys do Gemini com fallback automático
 * Gerencia múltiplas API keys e troca automaticamente quando uma excede a quota
 */

import { logger } from '../../utils/logger';
import { getGeminiKeysConfig, GEMINI_ENV_KEY_ID } from '../geminiConfigService';

export interface ManagedApiKey {
  id: string;
  name: string;
  key: string;
  exhausted: boolean;
  exhaustedAt?: number;
}

/**
 * Classe para gerenciar múltiplas API keys do Gemini com fallback automático
 */
export class GeminiApiKeyManager {
  private keys: ManagedApiKey[] = [];
  private currentKeyIndex: number = 0;
  private readonly resetIntervalMs: number = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    this.initializeKeys();
    if (typeof window !== 'undefined') {
      setInterval(() => this.resetExhaustedKeys(), this.resetIntervalMs);
    }
  }

  /**
   * Inicializa as API keys a partir de localStorage e variáveis de ambiente.
   * Prioridade: localStorage (múltiplas) > variáveis de ambiente (uma).
   */
  private initializeKeys(): void {
    try {
      const config = getGeminiKeysConfig();
      const enabledKeys = config.keys.filter(k => k.enabled && k.apiKey.trim().length > 0);

      if (enabledKeys.length > 0) {
        this.keys = enabledKeys.map(entry => ({
          id: entry.id,
          name: entry.name,
          key: entry.apiKey.trim(),
          exhausted: false,
        }));
        logger.info(
          `${this.keys.length} API key(s) do Gemini carregada(s) via localStorage`,
          'GeminiApiKeyManager'
        );
        return;
      }
    } catch (error) {
      logger.warn('Erro ao acessar localStorage, usando fallback', 'GeminiApiKeyManager', error);
    }

    const primaryKey = (
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.GEMINI_API_KEY ||
      ''
    ).trim();

    if (primaryKey) {
      this.keys = [
        {
          id: GEMINI_ENV_KEY_ID,
          name: 'Ambiente (VITE_GEMINI_API_KEY)',
          key: primaryKey,
          exhausted: false,
        },
      ];
      logger.info('API key do Gemini carregada via ambiente', 'GeminiApiKeyManager');
      return;
    }

    this.keys = [];
    logger.warn('Nenhuma API key do Gemini configurada', 'GeminiApiKeyManager');
  }

  reloadKeys(): void {
    const previousKeyCount = this.keys.length;
    this.initializeKeys();
    this.currentKeyIndex = 0;

    if (this.keys.length !== previousKeyCount) {
      logger.info(
        `API keys recarregadas: ${previousKeyCount} -> ${this.keys.length}`,
        'GeminiApiKeyManager'
      );
    }
  }

  hasConfiguredKeySource(): boolean {
    try {
      const config = getGeminiKeysConfig();
      if (config.keys.some(k => k.enabled && k.apiKey.trim().length > 0)) {
        return true;
      }
    } catch {
      /* ignore */
    }
    const envKey = (
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.GEMINI_API_KEY ||
      ''
    ).trim();
    return envKey.length > 0;
  }

  getEnabledKeyCount(): number {
    if (this.keys.length === 0) this.reloadKeys();
    return this.keys.filter(k => !k.exhausted).length;
  }

  getTotalKeyCount(): number {
    if (this.keys.length === 0) this.reloadKeys();
    return this.keys.length;
  }

  getManagedKeys(): ReadonlyArray<ManagedApiKey> {
    if (this.keys.length === 0) this.reloadKeys();
    return this.keys;
  }

  getCurrentKeyEntry(): ManagedApiKey | null {
    if (this.keys.length === 0) this.reloadKeys();
    const available = this.keys.find(k => !k.exhausted);
    if (!available) return null;
    this.currentKeyIndex = this.keys.indexOf(available);
    return available;
  }

  getCurrentKey(): string | null {
    return this.getCurrentKeyEntry()?.key ?? null;
  }

  getCurrentKeyId(): string | null {
    return this.getCurrentKeyEntry()?.id ?? null;
  }

  markCurrentKeyAsExhausted(): void {
    if (this.keys.length === 0) return;

    const currentKey = this.keys[this.currentKeyIndex];
    if (currentKey && !currentKey.exhausted) {
      currentKey.exhausted = true;
      currentKey.exhaustedAt = Date.now();

      logger.warn('API key do Gemini marcada como esgotada', 'GeminiApiKeyManager', {
        keyId: currentKey.id,
        keyName: currentKey.name,
        keyIndex: this.currentKeyIndex,
      });
    }
  }

  private resetExhaustedKeys(): void {
    const now = Date.now();
    let resetCount = 0;

    for (const keyStatus of this.keys) {
      if (keyStatus.exhausted && keyStatus.exhaustedAt) {
        const timeSinceExhausted = now - keyStatus.exhaustedAt;
        if (timeSinceExhausted >= this.resetIntervalMs) {
          keyStatus.exhausted = false;
          keyStatus.exhaustedAt = undefined;
          resetCount++;
        }
      }
    }

    if (resetCount > 0) {
      logger.info(
        `${resetCount} API key(s) resetada(s) após período de 24h`,
        'GeminiApiKeyManager'
      );
    }
  }

  getStats(): {
    totalKeys: number;
    availableKeys: number;
    exhaustedKeys: number;
    currentKeyIndex: number;
    currentKeyId?: string;
    currentKeyName?: string;
    nextResetInMs?: number;
  } {
    const available = this.keys.filter(k => !k.exhausted).length;
    const exhausted = this.keys.filter(k => k.exhausted).length;
    const current = this.keys[this.currentKeyIndex];

    let nextResetInMs: number | undefined;
    const now = Date.now();
    for (const keyStatus of this.keys) {
      if (keyStatus.exhausted && keyStatus.exhaustedAt) {
        const timeUntilReset = this.resetIntervalMs - (now - keyStatus.exhaustedAt);
        if (timeUntilReset > 0 && (!nextResetInMs || timeUntilReset < nextResetInMs)) {
          nextResetInMs = timeUntilReset;
        }
      }
    }

    return {
      totalKeys: this.keys.length,
      availableKeys: available,
      exhaustedKeys: exhausted,
      currentKeyIndex: this.currentKeyIndex,
      currentKeyId: current?.id,
      currentKeyName: current?.name,
      nextResetInMs,
    };
  }

  getExhaustedKeysInfo(): Array<{
    keyId: string;
    keyName: string;
    keyIndex: number;
    exhaustedAt: number;
    canBeReusedAt: number;
    timeUntilReuseMs: number;
  }> {
    const now = Date.now();
    const info: Array<{
      keyId: string;
      keyName: string;
      keyIndex: number;
      exhaustedAt: number;
      canBeReusedAt: number;
      timeUntilReuseMs: number;
    }> = [];

    this.keys.forEach((keyStatus, index) => {
      if (keyStatus.exhausted && keyStatus.exhaustedAt) {
        const canBeReusedAt = keyStatus.exhaustedAt + this.resetIntervalMs;
        info.push({
          keyId: keyStatus.id,
          keyName: keyStatus.name,
          keyIndex: index,
          exhaustedAt: keyStatus.exhaustedAt,
          canBeReusedAt,
          timeUntilReuseMs: Math.max(0, canBeReusedAt - now),
        });
      }
    });

    return info;
  }

  /**
   * Reativa manualmente uma chave marcada como esgotada (sem esperar 24h).
   */
  reactivateKey(keyId: string): boolean {
    const key = this.keys.find(k => k.id === keyId);
    if (!key || !key.exhausted) {
      return false;
    }

    key.exhausted = false;
    key.exhaustedAt = undefined;

    logger.info('API key do Gemini reativada manualmente', 'GeminiApiKeyManager', {
      keyId: key.id,
      keyName: key.name,
    });

    return true;
  }

  reset(): void {
    this.keys.forEach(k => {
      k.exhausted = false;
      k.exhaustedAt = undefined;
    });
    this.currentKeyIndex = 0;
  }
}

export const geminiApiKeyManager = new GeminiApiKeyManager();

/**
 * Gerenciador de API Keys do Gemini com fallback automático
 * Gerencia múltiplas API keys e troca automaticamente quando uma excede a quota
 */

import { logger } from '../../utils/logger';
import { getGeminiConfig } from '../geminiConfigService';

interface ApiKeyStatus {
  key: string;
  exhausted: boolean;
  exhaustedAt?: number;
}

/**
 * Classe para gerenciar múltiplas API keys do Gemini com fallback automático
 */
export class GeminiApiKeyManager {
  private keys: ApiKeyStatus[] = [];
  private currentKeyIndex: number = 0;
  private readonly resetIntervalMs: number = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    this.initializeKeys();
    // Resetar keys esgotadas periodicamente
    setInterval(() => this.resetExhaustedKeys(), this.resetIntervalMs);
  }

  /**
   * Inicializa as API keys a partir de localStorage, variáveis de ambiente e fallback hardcoded
   * Prioridade: localStorage > variáveis de ambiente
   */
  private initializeKeys(): void {
    // 1. Tentar ler do localStorage primeiro (prioridade)
    const savedConfig = getGeminiConfig();
    if (savedConfig?.apiKey) {
      this.keys = [{ key: savedConfig.apiKey, exhausted: false }];
      logger.info('API key do Gemini carregada via localStorage', 'GeminiApiKeyManager');
      return;
    }

    // 2. Fallback para variáveis de ambiente
    const primaryKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

    if (primaryKey) {
      this.keys = [{ key: primaryKey, exhausted: false }];
      logger.info('API key do Gemini carregada via ambiente', 'GeminiApiKeyManager');
      return;
    }

    logger.warn('Nenhuma API key do Gemini configurada', 'GeminiApiKeyManager');
  }

  /**
   * Recarrega as API keys (útil quando configuração muda)
   */
  reloadKeys(): void {
    const previousKeyCount = this.keys.length;
    this.initializeKeys();
    
    if (this.keys.length !== previousKeyCount) {
      logger.info(
        `API keys recarregadas: ${previousKeyCount} -> ${this.keys.length}`,
        'GeminiApiKeyManager'
      );
    }
  }

  /**
   * Obtém a API key atual (não esgotada)
   * @returns API key atual ou null se todas estiverem esgotadas
   */
  getCurrentKey(): string | null {
    // Encontrar primeira key não esgotada
    const availableKey = this.keys.find(k => !k.exhausted);

    if (availableKey) {
      this.currentKeyIndex = this.keys.indexOf(availableKey);
      return availableKey.key;
    }

    // Se todas estiverem esgotadas, tentar resetar e reavaliar
    logger.warn('Todas as API keys estão esgotadas', 'GeminiApiKeyManager');
    this.resetExhaustedKeys();

    const refreshedKey = this.keys.find(k => !k.exhausted);
    if (refreshedKey) {
      this.currentKeyIndex = this.keys.indexOf(refreshedKey);
      return refreshedKey.key;
    }

    return null;
  }

  /**
   * Marca a API key atual como esgotada (quota excedida)
   */
  markCurrentKeyAsExhausted(): void {
    if (this.keys.length === 0) {
      return;
    }

    const currentKey = this.keys[this.currentKeyIndex];
    if (currentKey && !currentKey.exhausted) {
      currentKey.exhausted = true;
      currentKey.exhaustedAt = Date.now();

      logger.warn(
        'API key do Gemini marcada como esgotada',
        'GeminiApiKeyManager',
        { keyIndex: this.currentKeyIndex }
      );
    }
  }

  /**
   * Reseta o estado de keys esgotadas (chamado periodicamente)
   */
  private resetExhaustedKeys(): void {
    const now = Date.now();
    let resetCount = 0;

    for (const keyStatus of this.keys) {
      if (keyStatus.exhausted && keyStatus.exhaustedAt) {
        const timeSinceExhausted = now - keyStatus.exhaustedAt;
        
        // Resetar se passou mais de 24 horas
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

  /**
   * Obtém estatísticas do gerenciador
   */
  getStats(): {
    totalKeys: number;
    availableKeys: number;
    exhaustedKeys: number;
    currentKeyIndex: number;
    nextResetInMs?: number;
  } {
    const available = this.keys.filter(k => !k.exhausted).length;
    const exhausted = this.keys.filter(k => k.exhausted).length;

    // Calcular tempo até próximo reset (24h após a key mais antiga esgotada)
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
      nextResetInMs,
    };
  }

  /**
   * Obtém informações sobre keys esgotadas e quando podem ser reutilizadas
   */
  getExhaustedKeysInfo(): Array<{
    keyIndex: number;
    exhaustedAt: number;
    canBeReusedAt: number;
    timeUntilReuseMs: number;
  }> {
    const now = Date.now();
    const info: Array<{
      keyIndex: number;
      exhaustedAt: number;
      canBeReusedAt: number;
      timeUntilReuseMs: number;
    }> = [];

    this.keys.forEach((keyStatus, index) => {
      if (keyStatus.exhausted && keyStatus.exhaustedAt) {
        const canBeReusedAt = keyStatus.exhaustedAt + this.resetIntervalMs;
        const timeUntilReuseMs = Math.max(0, canBeReusedAt - now);

        info.push({
          keyIndex: index,
          exhaustedAt: keyStatus.exhaustedAt,
          canBeReusedAt,
          timeUntilReuseMs,
        });
      }
    });

    return info;
  }

  /**
   * Reseta o gerenciador (útil para testes)
   */
  reset(): void {
    this.keys.forEach(k => {
      k.exhausted = false;
      k.exhaustedAt = undefined;
    });
    this.currentKeyIndex = 0;
  }
}

/**
 * Instância global do gerenciador de API keys
 */
export const geminiApiKeyManager = new GeminiApiKeyManager();


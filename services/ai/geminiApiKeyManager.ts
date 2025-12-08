/**
 * Gerenciador de API Keys do Gemini com fallback automático
 * Gerencia múltiplas API keys e troca automaticamente quando uma excede a quota
 */

import { logger } from '../../utils/logger';

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
   * Inicializa as API keys a partir de variáveis de ambiente e fallback hardcoded
   */
  private initializeKeys(): void {
    const primaryKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
    const fallbackKey = import.meta.env.VITE_GEMINI_API_KEY_FALLBACK;
    const hardcodedFallback = 'AIzaSyCCzdyA6LQMERCxXjQZdj5hJ5aVd_r_7W8';

    // Adicionar keys na ordem de prioridade
    if (primaryKey) {
      this.keys.push({ key: primaryKey, exhausted: false });
      logger.info('API key principal do Gemini carregada', 'GeminiApiKeyManager');
    }

    if (fallbackKey) {
      this.keys.push({ key: fallbackKey, exhausted: false });
      logger.info('API key de fallback do Gemini carregada (env)', 'GeminiApiKeyManager');
    }

    // Adicionar fallback hardcoded como última opção
    this.keys.push({ key: hardcodedFallback, exhausted: false });
    logger.info('API key de fallback hardcoded do Gemini carregada', 'GeminiApiKeyManager');

    if (this.keys.length === 0) {
      logger.warn('Nenhuma API key do Gemini configurada', 'GeminiApiKeyManager');
    } else {
      logger.info(
        `Total de ${this.keys.length} API key(s) disponível(is)`,
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
      // Atualizar índice atual
      this.currentKeyIndex = this.keys.indexOf(availableKey);
      return availableKey.key;
    }

    // Se todas estiverem esgotadas, resetar e tentar novamente
    logger.warn(
      'Todas as API keys estão esgotadas, resetando estado',
      'GeminiApiKeyManager'
    );
    this.resetExhaustedKeys();
    
    const firstKey = this.keys[0];
    if (firstKey) {
      this.currentKeyIndex = 0;
      return firstKey.key;
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
        `API key ${this.currentKeyIndex + 1}/${this.keys.length} marcada como esgotada`,
        'GeminiApiKeyManager',
        { keyIndex: this.currentKeyIndex }
      );

      // Tentar obter próxima key disponível
      const nextKey = this.getCurrentKey();
      if (nextKey) {
        logger.info(
          `Trocando para API key ${this.currentKeyIndex + 1}/${this.keys.length}`,
          'GeminiApiKeyManager',
          { keyIndex: this.currentKeyIndex }
        );
      } else {
        logger.error(
          'Nenhuma API key disponível após marcar atual como esgotada',
          'GeminiApiKeyManager'
        );
      }
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
  } {
    const available = this.keys.filter(k => !k.exhausted).length;
    const exhausted = this.keys.filter(k => k.exhausted).length;

    return {
      totalKeys: this.keys.length,
      availableKeys: available,
      exhaustedKeys: exhausted,
      currentKeyIndex: this.currentKeyIndex,
    };
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


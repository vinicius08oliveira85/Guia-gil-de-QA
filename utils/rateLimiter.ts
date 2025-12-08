/**
 * Utilitário de rate limiting
 * Controla a taxa de requisições para evitar exceder limites da API
 */

import { logger } from './logger';

export interface RateLimiterOptions {
  /** Número máximo de requisições por janela de tempo (padrão: 10) */
  maxRequests?: number;
  /** Janela de tempo em milissegundos (padrão: 60000ms = 1 minuto) */
  windowMs?: number;
}

interface RequestRecord {
  timestamp: number;
}

/**
 * Classe para controlar rate limiting de requisições
 */
export class RateLimiter {
  private requests: RequestRecord[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private queue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];
  private processingQueue = false;

  constructor(options: RateLimiterOptions = {}) {
    this.maxRequests = options.maxRequests ?? 10;
    this.windowMs = options.windowMs ?? 60000; // 1 minuto por padrão
  }

  /**
   * Remove requisições antigas que estão fora da janela de tempo
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.requests = this.requests.filter(req => req.timestamp > cutoff);
  }

  /**
   * Verifica se uma nova requisição pode ser feita imediatamente
   */
  private canProceed(): boolean {
    this.cleanup();
    return this.requests.length < this.maxRequests;
  }

  /**
   * Calcula quanto tempo falta até a próxima requisição poder ser feita
   */
  private getTimeUntilNextSlot(): number {
    if (this.requests.length === 0) {
      return 0;
    }

    this.cleanup();
    
    if (this.requests.length < this.maxRequests) {
      return 0;
    }

    // Encontrar a requisição mais antiga na janela
    const oldestRequest = this.requests[0];
    const now = Date.now();
    const oldestTimestamp = oldestRequest.timestamp;
    const timeSinceOldest = now - oldestTimestamp;
    const timeUntilOldestExpires = this.windowMs - timeSinceOldest;

    return Math.max(0, timeUntilOldestExpires);
  }

  /**
   * Processa a fila de requisições aguardando
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.queue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.queue.length > 0) {
      const timeUntilNext = this.getTimeUntilNextSlot();
      
      if (timeUntilNext > 0) {
        logger.debug(
          `Rate limit atingido, aguardando ${timeUntilNext}ms`,
          'RateLimiter',
          { queueLength: this.queue.length }
        );
        await new Promise(resolve => setTimeout(resolve, timeUntilNext));
      }

      // Verificar novamente se pode prosseguir
      if (this.canProceed()) {
        const next = this.queue.shift();
        if (next) {
          this.requests.push({ timestamp: Date.now() });
          next.resolve();
        }
      } else {
        // Se ainda não pode prosseguir, aguardar um pouco mais
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.processingQueue = false;
  }

  /**
   * Aguarda até que uma requisição possa ser feita
   * Registra a requisição quando permitida
   * 
   * @returns Promise que resolve quando a requisição pode ser feita
   */
  async acquire(): Promise<void> {
    // Limpar requisições antigas
    this.cleanup();

    // Se pode prosseguir imediatamente, registrar e retornar
    if (this.canProceed()) {
      this.requests.push({ timestamp: Date.now() });
      return;
    }

    // Caso contrário, adicionar à fila
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject });
      this.processQueue().catch(reject);
    });
  }

  /**
   * Obtém estatísticas do rate limiter
   */
  getStats(): {
    currentRequests: number;
    maxRequests: number;
    windowMs: number;
    queueLength: number;
    timeUntilNextSlot: number;
  } {
    this.cleanup();
    return {
      currentRequests: this.requests.length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      queueLength: this.queue.length,
      timeUntilNextSlot: this.getTimeUntilNextSlot(),
    };
  }

  /**
   * Reseta o rate limiter (útil para testes)
   */
  reset(): void {
    this.requests = [];
    this.queue = [];
    this.processingQueue = false;
  }
}

/**
 * Instância global de rate limiter para API Gemini
 * Configurado para 10 requisições por minuto (padrão da API)
 */
export const geminiRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minuto
});


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
  /** Delay mínimo entre requisições em milissegundos (padrão: 0ms) */
  minDelayMs?: number;
  /** Número máximo de requisições simultâneas em execução (padrão: 1) */
  maxConcurrent?: number;
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
  private readonly minDelayMs: number;
  private readonly maxConcurrent: number;
  private lastRequestTime: number = 0;
  private currentConcurrent: number = 0;
  private queue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];
  private processingQueue = false;

  constructor(options: RateLimiterOptions = {}) {
    this.maxRequests = options.maxRequests ?? 10;
    this.windowMs = options.windowMs ?? 60000; // 1 minuto por padrão
    this.minDelayMs = options.minDelayMs ?? 0; // Delay mínimo entre requisições
    this.maxConcurrent = options.maxConcurrent ?? 1; // Máximo de requisições simultâneas
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
    // Verificar tanto o limite de requisições na janela quanto requisições simultâneas
    return this.requests.length < this.maxRequests && this.currentConcurrent < this.maxConcurrent;
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
        logger.debug(`Rate limit atingido, aguardando ${timeUntilNext}ms`, 'RateLimiter', {
          queueLength: this.queue.length,
        });
        await new Promise(resolve => setTimeout(resolve, timeUntilNext));
      }

      // Verificar novamente se pode prosseguir
      if (this.canProceed()) {
        // Verificar delay mínimo
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minDelayMs) {
          const delayNeeded = this.minDelayMs - timeSinceLastRequest;
          await new Promise(resolve => setTimeout(resolve, delayNeeded));
        }

        const next = this.queue.shift();
        if (next) {
          const currentTime = Date.now();
          this.requests.push({ timestamp: currentTime });
          this.lastRequestTime = currentTime;
          this.currentConcurrent++;
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
   * IMPORTANTE: Após usar acquire(), deve-se chamar release() quando a requisição terminar
   *
   * @returns Promise que resolve quando a requisição pode ser feita
   */
  async acquire(): Promise<void> {
    // Limpar requisições antigas
    this.cleanup();

    // Verificar delay mínimo desde a última requisição
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minDelayMs) {
      const delayNeeded = this.minDelayMs - timeSinceLastRequest;
      logger.debug(`Aplicando delay mínimo de ${delayNeeded}ms entre requisições`, 'RateLimiter', {
        delayNeeded,
        minDelayMs: this.minDelayMs,
      });
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }

    // Verificar se pode prosseguir (dentro do limite de requisições e requisições simultâneas)
    if (this.canProceed()) {
      const currentTime = Date.now();
      this.requests.push({ timestamp: currentTime });
      this.lastRequestTime = currentTime;
      this.currentConcurrent++;
      return;
    }

    // Caso contrário, adicionar à fila
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject });
      this.processQueue().catch(reject);
    });
  }

  /**
   * Libera uma requisição simultânea (deve ser chamado após a requisição terminar)
   */
  release(): void {
    if (this.currentConcurrent > 0) {
      this.currentConcurrent--;
      // Processar fila se houver espaço para mais requisições
      if (this.queue.length > 0 && this.canProceed()) {
        this.processQueue();
      }
    }
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
    currentConcurrent: number;
    maxConcurrent: number;
  } {
    this.cleanup();
    return {
      currentRequests: this.requests.length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      queueLength: this.queue.length,
      timeUntilNextSlot: this.getTimeUntilNextSlot(),
      currentConcurrent: this.currentConcurrent,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * Reseta o rate limiter (útil para testes)
   */
  reset(): void {
    this.requests = [];
    this.queue = [];
    this.processingQueue = false;
    this.lastRequestTime = 0;
    this.currentConcurrent = 0;
  }
}

/**
 * Instância global de rate limiter para API Gemini
 * Configurado para 6 requisições por minuto com delay mínimo de 2s entre requisições
 * (mais conservador para evitar erros 429)
 */
export const geminiRateLimiter = new RateLimiter({
  maxRequests: 6,
  windowMs: 60000, // 1 minuto
  minDelayMs: 2000, // 2 segundos de delay mínimo entre requisições
});

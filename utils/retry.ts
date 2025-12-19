/**
 * Utilitário de retry com backoff exponencial
 * Implementa retry automático para requisições que falham com erros recuperáveis
 */

import { logger } from './logger';

export interface RetryOptions {
  /** Número máximo de tentativas (padrão: 3) */
  maxRetries?: number;
  /** Delay inicial em milissegundos (padrão: 1000ms) */
  initialDelay?: number;
  /** Multiplicador para backoff exponencial (padrão: 2) */
  backoffMultiplier?: number;
  /** Delay máximo em milissegundos (padrão: 30000ms) */
  maxDelay?: number;
  /** Timeout máximo total em milissegundos (padrão: 300000ms = 5 minutos). Se excedido, lança erro */
  maxTotalTimeout?: number;
  /** Se deve adicionar jitter aleatório ao delay (padrão: true) */
  useJitter?: boolean;
  /** Função para determinar se um erro é recuperável */
  isRetryable?: (error: unknown) => boolean;
  /** Função chamada antes de cada retry */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

/**
 * Verifica se um erro é do tipo 429 (Too Many Requests) ou outro erro recuperável
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Verificar se é erro 429
    if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
      return true;
    }
    
    // Verificar se é erro de rede temporário
    if (error.message.includes('ECONNRESET') || 
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND')) {
      return true;
    }
  }

  // Verificar se é um objeto de erro com status 429
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (err.status === 429 || err.statusCode === 429) {
      return true;
    }
  }

  return false;
}

/**
 * Extrai o valor do header Retry-After de um erro (se disponível)
 */
function getRetryAfterDelay(error: unknown): number | null {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    const retryAfter = err.retryAfter || err['retry-after'];
    
    if (typeof retryAfter === 'number') {
      return retryAfter * 1000; // Converter segundos para milissegundos
    }
    
    if (typeof retryAfter === 'string') {
      const parsed = parseInt(retryAfter, 10);
      if (!isNaN(parsed)) {
        return parsed * 1000;
      }
    }
  }
  
  return null;
}

/**
 * Calcula o delay para a próxima tentativa com backoff exponencial e jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  backoffMultiplier: number,
  maxDelay: number,
  useJitter: boolean
): number {
  // Backoff exponencial: initialDelay * (backoffMultiplier ^ attempt)
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  
  // Limitar ao máximo
  delay = Math.min(delay, maxDelay);
  
  // Adicionar jitter aleatório (0-30% do delay) para evitar thundering herd
  if (useJitter) {
    const jitter = delay * 0.3 * Math.random();
    delay = delay + jitter;
  }
  
  return Math.floor(delay);
}

/**
 * Aguarda um período de tempo
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executa uma função com retry automático e backoff exponencial
 * 
 * @param fn Função assíncrona a ser executada
 * @param options Opções de retry
 * @returns Resultado da função
 * @throws Erro original se todas as tentativas falharem
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    maxDelay = 30000,
    maxTotalTimeout = 300000, // 5 minutos padrão
    useJitter = true,
    isRetryable = isRetryableError,
    onRetry,
  } = options;

  let lastError: unknown;
  const startTime = Date.now();
  let totalElapsedTime = 0;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Se não é um erro recuperável, não tenta novamente
      if (!isRetryable(error)) {
        logger.warn(
          'Erro não recuperável, não será feito retry',
          'retryWithBackoff',
          { error, attempt }
        );
        throw error;
      }
      
      // Se é a última tentativa, não espera e lança o erro
      if (attempt === maxRetries) {
        logger.error(
          `Todas as tentativas falharam (${maxRetries})`,
          'retryWithBackoff',
          { error, attempt: maxRetries, totalElapsedTime }
        );
        throw error;
      }
      
      // Verificar se há header Retry-After
      const retryAfterDelay = getRetryAfterDelay(error);
      
      // Detectar se é erro 503 e usar delay maior
      let effectiveInitialDelay = initialDelay;
      let effectiveMaxDelay = maxDelay;
      const errorStatus = (error as { status?: number })?.status;
      
      if (errorStatus === 503) {
        // Para erros 503, usar delay inicial de 5 segundos e max de 60 segundos
        effectiveInitialDelay = 5000;
        effectiveMaxDelay = 60000;
        logger.debug(
          'Erro 503 detectado, usando delay aumentado',
          'retryWithBackoff',
          { attempt, initialDelay: effectiveInitialDelay, maxDelay: effectiveMaxDelay }
        );
      }
      
      const delay = retryAfterDelay 
        ? Math.min(retryAfterDelay, effectiveMaxDelay)
        : calculateDelay(attempt, effectiveInitialDelay, backoffMultiplier, effectiveMaxDelay, useJitter);
      
      // Verificar timeout máximo total
      totalElapsedTime = Date.now() - startTime;
      if (totalElapsedTime + delay > maxTotalTimeout) {
        const timeoutError = new Error(
          `Timeout máximo total de ${maxTotalTimeout / 1000}s excedido após ${attempt} tentativa(s). Total decorrido: ${Math.round(totalElapsedTime / 1000)}s`
        ) as Error & { status?: number };
        if (errorStatus) {
          timeoutError.status = errorStatus;
        }
        logger.error(
          'Timeout máximo total excedido durante retry',
          'retryWithBackoff',
          { attempt, totalElapsedTime, maxTotalTimeout, errorStatus }
        );
        throw timeoutError;
      }
      
      logger.warn(
        `Tentativa ${attempt}/${maxRetries} falhou, retentando em ${delay}ms`,
        'retryWithBackoff',
        { error, attempt, delay, totalElapsedTime: Math.round(totalElapsedTime / 1000) + 's' }
      );
      
      // Chamar callback de retry se fornecido
      if (onRetry) {
        onRetry(attempt, error, delay);
      }
      
      // Aguardar antes da próxima tentativa
      await sleep(delay);
    }
  }
  
  // Este ponto não deveria ser alcançado, mas TypeScript exige
  throw lastError;
}


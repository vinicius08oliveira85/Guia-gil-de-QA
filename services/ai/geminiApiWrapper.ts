/**
 * Wrapper para chamadas à API Gemini com retry e rate limiting
 * Gerencia automaticamente rate limiting e retry com backoff exponencial
 */

import { GoogleGenAI } from '@google/genai';
import { retryWithBackoff } from '../../utils/retry';
import { geminiRateLimiter } from '../../utils/rateLimiter';
import { logger } from '../../utils/logger';

export interface GeminiGenerateContentParams {
  model: string;
  contents: string;
  config?: {
    responseMimeType?: string;
    responseSchema?: unknown;
  };
}

export interface GeminiResponse {
  text: string;
}

/**
 * Verifica se um erro é do tipo 429 (Too Many Requests) ou outro erro recuperável
 */
function isRetryableGeminiError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Erro 429 (Too Many Requests)
    if (message.includes('429') || message.includes('too many requests')) {
      return true;
    }
    
    // Erros de rede temporários
    if (message.includes('econnreset') || 
        message.includes('etimedout') ||
        message.includes('enotfound') ||
        message.includes('network') ||
        message.includes('timeout')) {
      return true;
    }
    
    // Erros de servidor (5xx)
    if (message.includes('500') || 
        message.includes('502') || 
        message.includes('503') || 
        message.includes('504')) {
      return true;
    }
  }

  // Verificar se é um objeto de erro com status
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    const status = err.status || err.statusCode;
    
    if (typeof status === 'number') {
      // 429 ou erros 5xx são recuperáveis
      if (status === 429 || (status >= 500 && status < 600)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extrai informações de retry de um erro (se disponível)
 */
function extractRetryInfo(error: unknown): { retryAfter?: number } {
  const info: { retryAfter?: number } = {};
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    
    // Tentar extrair Retry-After
    const retryAfter = err.retryAfter || err['retry-after'] || err.retry_after;
    
    if (typeof retryAfter === 'number') {
      info.retryAfter = retryAfter * 1000; // Converter segundos para ms
    } else if (typeof retryAfter === 'string') {
      const parsed = parseInt(retryAfter, 10);
      if (!isNaN(parsed)) {
        info.retryAfter = parsed * 1000;
      }
    }
  }
  
  return info;
}

/**
 * Chama a API Gemini com rate limiting e retry automático
 * 
 * @param ai Instância do GoogleGenAI
 * @param params Parâmetros para generateContent
 * @returns Resposta da API
 * @throws Erro se todas as tentativas falharem
 */
export async function callGeminiWithRetry(
  ai: GoogleGenAI,
  params: GeminiGenerateContentParams
): Promise<GeminiResponse> {
  // Aplicar rate limiting antes de fazer a requisição
  await geminiRateLimiter.acquire();
  
  logger.debug(
    'Chamando API Gemini',
    'callGeminiWithRetry',
    { model: params.model }
  );

  // Executar com retry automático
  return retryWithBackoff(
    async () => {
      try {
        const response = await ai.models.generateContent({
          model: params.model,
          contents: params.contents,
          config: params.config,
        });

        logger.debug(
          'Resposta recebida da API Gemini',
          'callGeminiWithRetry',
          { model: params.model, textLength: response.text?.length || 0 }
        );

        return response;
      } catch (error) {
        // Enriquecer erro com informações de retry se disponíveis
        const retryInfo = extractRetryInfo(error);
        if (retryInfo.retryAfter) {
          const enrichedError = error instanceof Error 
            ? error 
            : new Error(String(error));
          
          // Adicionar retryAfter ao erro para ser usado pelo retryWithBackoff
          (enrichedError as unknown as { retryAfter?: number }).retryAfter = retryInfo.retryAfter;
          
          throw enrichedError;
        }
        
        throw error;
      }
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 30000,
      useJitter: true,
      isRetryable: isRetryableGeminiError,
      onRetry: (attempt, error, delay) => {
        logger.warn(
          `Retry ${attempt}/3 para API Gemini após ${delay}ms`,
          'callGeminiWithRetry',
          { error, attempt, delay }
        );
      },
    }
  );
}


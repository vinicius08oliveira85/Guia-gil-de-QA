/**
 * Wrapper para chamadas à API Gemini com retry e rate limiting
 * Gerencia automaticamente rate limiting e retry com backoff exponencial
 */

import { GoogleGenAI } from '@google/genai';
import { retryWithBackoff } from '../../utils/retry';
import { geminiRateLimiter } from '../../utils/rateLimiter';
import { logger } from '../../utils/logger';
import { geminiApiKeyManager } from './geminiApiKeyManager';

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
 * Verifica se um erro é de quota excedida (não deve fazer retry, deve trocar API key)
 */
function isQuotaExceededError(error: unknown): boolean {
  const errorMessage = getErrorMessage(error).toLowerCase();
  
  // Palavras-chave que indicam quota excedida
  const quotaKeywords = ['quota', 'exceeded', 'limit exceeded', 'quota exceeded'];
  
  return quotaKeywords.some(keyword => errorMessage.includes(keyword));
}

/**
 * Extrai mensagem de erro de diferentes formatos
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    
    // Tentar extrair mensagem de diferentes formatos
    if (typeof err.message === 'string') {
      return err.message;
    }
    
    if (typeof err.error === 'object' && err.error !== null) {
      const innerError = err.error as Record<string, unknown>;
      if (typeof innerError.message === 'string') {
        return innerError.message;
      }
    }
    
    // Tentar stringify se for objeto
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  
  return String(error);
}

/**
 * Verifica se um erro é do tipo 429 (Too Many Requests) ou outro erro recuperável
 * NOTA: Erros de quota excedida NÃO são retryable aqui (devem trocar API key)
 */
function isRetryableGeminiError(error: unknown): boolean {
  // Se for erro de quota, não é retryable (deve trocar API key)
  if (isQuotaExceededError(error)) {
    return false;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Erro 429 (Too Many Requests) - mas não quota
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
      // 429 ou erros 5xx são recuperáveis (mas não se for quota)
      if (status === 429 || (status >= 500 && status < 600)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extrai status HTTP de um erro do SDK Gemini
 */
function extractHttpStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    
    // Tentar extrair status de diferentes formatos
    const status = err.status || err.statusCode || err.code;
    
    if (typeof status === 'number') {
      return status;
    }
    
    // Tentar extrair de mensagem de erro
    const errorMessage = getErrorMessage(error);
    const statusMatch = errorMessage.match(/\b(50[0-9]|429|503)\b/);
    if (statusMatch) {
      return parseInt(statusMatch[1], 10);
    }
  }
  
  return null;
}

/**
 * Extrai informações de retry de um erro (se disponível)
 */
function extractRetryInfo(error: unknown): { retryAfter?: number; status?: number } {
  const info: { retryAfter?: number; status?: number } = {};
  
  // Extrair status HTTP
  const status = extractHttpStatus(error);
  if (status) {
    info.status = status;
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    // Tentar extrair Retry-After de diferentes formatos
    let retryAfter: unknown =
      err.retryAfter ?? err['retry-after'] ?? err.retry_after;

    if (retryAfter === undefined && typeof err.response === 'object' && err.response !== null) {
      const headers = (err.response as Record<string, unknown>).headers;
      if (typeof headers === 'object' && headers !== null) {
        const headerRecord = headers as Record<string, unknown>;
        retryAfter = headerRecord['retry-after'] ?? headerRecord['Retry-After'];
      }
    }

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
 * Chama a API Gemini com rate limiting, retry automático e fallback de API keys
 * 
 * @param params Parâmetros para generateContent
 * @returns Resposta da API
 * @throws Erro se todas as tentativas falharem
 */
export async function callGeminiWithRetry(
  params: GeminiGenerateContentParams
): Promise<GeminiResponse> {
  const maxKeyRetries = 3; // Máximo de tentativas com diferentes keys
  let lastError: unknown;

  for (let keyAttempt = 0; keyAttempt < maxKeyRetries; keyAttempt++) {
    const apiKey = geminiApiKeyManager.getCurrentKey();
    
    if (!apiKey) {
      throw new Error('Nenhuma API key do Gemini disponível. Configure VITE_GEMINI_API_KEY.');
    }

    // Criar nova instância com a key atual
    const ai = new GoogleGenAI({ apiKey });

    try {
      // Executar com retry automático
      return await retryWithBackoff(
        async () => {
          // Aplicar rate limiting antes de cada tentativa (incluindo retries)
          await geminiRateLimiter.acquire();
          
          logger.debug(
            'Chamando API Gemini',
            'callGeminiWithRetry',
            { model: params.model, keyAttempt: keyAttempt + 1 }
          );

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

            const text = response.text ?? '';
            return { text };
          } catch (error) {
            // Verificar se é erro de quota
            if (isQuotaExceededError(error)) {
              logger.warn(
                'Erro de quota detectado, marcando API key como esgotada',
                'callGeminiWithRetry',
                { error, keyAttempt: keyAttempt + 1 }
              );
              geminiApiKeyManager.markCurrentKeyAsExhausted();
              // Re-throw para tentar com próxima key
              throw error;
            }

            // Enriquecer erro com informações de retry se disponíveis
            const retryInfo = extractRetryInfo(error);
            const enrichedError = error instanceof Error 
              ? error 
              : new Error(String(error));
            
            // Adicionar status HTTP se disponível
            if (retryInfo.status) {
              (enrichedError as unknown as { status?: number }).status = retryInfo.status;
            }
            
            // Adicionar retryAfter ao erro para ser usado pelo retryWithBackoff
            if (retryInfo.retryAfter) {
              (enrichedError as unknown as { retryAfter?: number }).retryAfter = retryInfo.retryAfter;
            }
            
            throw enrichedError;
          } finally {
            // Sempre liberar a requisição simultânea quando terminar (sucesso ou erro)
            geminiRateLimiter.release();
          }
        },
        {
          maxRetries: 5, // Aumentado para 5 tentativas para melhor recuperação de erros 503
          initialDelay: 1000,
          backoffMultiplier: 2,
          maxDelay: 60000, // Aumentado para 60s para erros 503
          useJitter: true,
          isRetryable: isRetryableGeminiError,
          onRetry: (attempt, error, delay) => {
            const retryInfo = extractRetryInfo(error);
            const statusInfo = retryInfo.status ? ` (HTTP ${retryInfo.status})` : '';
            logger.warn(
              `Retry ${attempt}/5 para API Gemini após ${delay}ms${statusInfo}`,
              'callGeminiWithRetry',
              { error, attempt, delay, keyAttempt: keyAttempt + 1, status: retryInfo.status }
            );
          },
        }
      );
    } catch (error) {
      lastError = error;
      
      // Se for erro de quota, tentar próxima key
      if (isQuotaExceededError(error)) {
        logger.warn(
          `Tentando com próxima API key após erro de quota (tentativa ${keyAttempt + 1}/${maxKeyRetries})`,
          'callGeminiWithRetry',
          { error, keyAttempt: keyAttempt + 1 }
        );
        
        // Se ainda há keys disponíveis, continuar loop
        const nextKey = geminiApiKeyManager.getCurrentKey();
        if (nextKey && keyAttempt < maxKeyRetries - 1) {
          continue;
        }
      }
      
      // Se não for quota ou não há mais keys, lançar erro
      throw error;
    }
  }

  // Se chegou aqui, todas as keys foram tentadas
  throw lastError || new Error('Falha ao chamar API Gemini após todas as tentativas');
}


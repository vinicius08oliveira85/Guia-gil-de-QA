/**
 * Wrapper para chamadas à API Gemini com retry e rate limiting
 * Gerencia automaticamente rate limiting e retry com backoff exponencial
 */

import { GoogleGenAI } from '@google/genai';
import { retryWithBackoff } from '../../utils/retry';
import { geminiRateLimiter } from '../../utils/rateLimiter';
import { logger } from '../../utils/logger';
import { geminiApiKeyManager } from './geminiApiKeyManager';

export type GeminiAppError = Error & { code?: string; status?: number; retryAfter?: number };

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
  const status = extractHttpStatus(error);
  
  // Status 429 (Too Many Requests) geralmente indica quota
  if (status === 429) {
    return true;
  }
  
  // Palavras-chave que indicam quota excedida
  const quotaKeywords = ['quota', 'exceeded', 'limit exceeded', 'quota exceeded', 'rate limit'];
  
  return quotaKeywords.some(keyword => errorMessage.includes(keyword));
}

/**
 * Verifica se um erro indica que a API key é inválida ou sem permissões (deve trocar API key)
 */
function isInvalidApiKeyError(error: unknown): boolean {
  const status = extractHttpStatus(error);
  
  // Status 403 (Forbidden) pode indicar API key inválida ou sem permissões
  if (status === 403) {
    return true;
  }
  
  const errorMessage = getErrorMessage(error).toLowerCase();
  
  // Palavras-chave que indicam API key inválida
  const invalidKeyKeywords = ['forbidden', 'invalid api key', 'unauthorized', 'permission denied', 'api key not valid'];
  
  return invalidKeyKeywords.some(keyword => errorMessage.includes(keyword));
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
    
    // Tentar extrair de response.status se disponível
    if (typeof err.response === 'object' && err.response !== null) {
      const response = err.response as Record<string, unknown>;
      const responseStatus = response.status || response.statusCode;
      if (typeof responseStatus === 'number') {
        return responseStatus;
      }
    }
  }
  
  // Tentar extrair de mensagem de erro (incluindo 403, 429, 5xx)
  const errorMessage = getErrorMessage(error);
  const statusMatch = errorMessage.match(/\b(40[0-9]|429|50[0-9]|503)\b/);
  if (statusMatch) {
    return parseInt(statusMatch[1], 10);
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
  const maxKeyRetries = 1; // Apenas uma API key (sem fallbacks)
  let lastError: unknown;

  const buildGeminiError = (
    message: string,
    code: string,
    status?: number,
    retryAfter?: number
  ): GeminiAppError => {
    const error = new Error(message) as GeminiAppError;
    error.code = code;
    if (status) {
      error.status = status;
    }
    if (retryAfter) {
      error.retryAfter = retryAfter;
    }
    return error;
  };

  for (let keyAttempt = 0; keyAttempt < maxKeyRetries; keyAttempt++) {
    const apiKey = geminiApiKeyManager.getCurrentKey();
    
    if (!apiKey) {
      throw buildGeminiError(
        'Nenhuma API key do Gemini disponível. Configure em Configurações > API Keys.',
        'GEMINI_NO_KEY',
        401
      );
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
            const status = extractHttpStatus(error);
            const retryInfo = extractRetryInfo(error);

            // Verificar se é erro de quota (429)
            if (isQuotaExceededError(error)) {
              logger.warn(
                'Erro de quota detectado, marcando API key como esgotada',
                'callGeminiWithRetry',
                { keyAttempt: keyAttempt + 1, status }
              );
              geminiApiKeyManager.markCurrentKeyAsExhausted();
              throw buildGeminiError(
                'Limite de uso da API Gemini atingido. Aguarde e tente novamente mais tarde ou configure uma nova API key.',
                'GEMINI_QUOTA_EXCEEDED',
                status ?? 429,
                retryInfo.retryAfter
              );
            }
            
            // Verificar se é erro de API key inválida (403)
            if (isInvalidApiKeyError(error)) {
              logger.warn(
                'Erro de API key inválida detectado (403), marcando como esgotada',
                'callGeminiWithRetry',
                { keyAttempt: keyAttempt + 1, status }
              );
              geminiApiKeyManager.markCurrentKeyAsExhausted();
              throw buildGeminiError(
                'API key do Gemini inválida ou sem permissão. Atualize as credenciais em Configurações > API Keys.',
                'GEMINI_KEYS_INVALID',
                status ?? 403
              );
            }

            // Enriquecer erro com informações de retry se disponíveis
            const enrichedError = error instanceof Error 
              ? error 
              : new Error(String(error));
            
            if (retryInfo.status) {
              (enrichedError as GeminiAppError).status = retryInfo.status;
            } else if (status) {
              (enrichedError as GeminiAppError).status = status;
            }
            
            if (retryInfo.retryAfter) {
              (enrichedError as GeminiAppError).retryAfter = retryInfo.retryAfter;
            }
            
            throw enrichedError;
          } finally {
            // Sempre liberar a requisição simultânea quando terminar (sucesso ou erro)
            geminiRateLimiter.release();
          }
        },
        {
          maxRetries: 3, // Reduzido para 3 tentativas - erros 503 persistentes indicam problema no servidor
          initialDelay: 1000,
          backoffMultiplier: 2,
          maxDelay: 60000, // 60s máximo para erros 503
          maxTotalTimeout: 300000, // 5 minutos máximo total para evitar retries infinitos
          useJitter: true,
          isRetryable: isRetryableGeminiError,
          onRetry: (attempt, error, delay) => {
            const retryInfo = extractRetryInfo(error);
            const statusInfo = retryInfo.status ? ` (HTTP ${retryInfo.status})` : '';
            logger.warn(
              `Retry ${attempt}/3 para API Gemini após ${delay}ms${statusInfo}`,
              'callGeminiWithRetry',
              { attempt, delay, keyAttempt: keyAttempt + 1, status: retryInfo.status }
            );
          },
        }
      );
    } catch (error) {
      lastError = error;
      // Não há outras keys; sair do loop para normalizar erro
      break;
    }
  }

  // Se chegou aqui, todas as keys foram tentadas ou houve falha final
  const status = extractHttpStatus(lastError);
  const stats = geminiApiKeyManager.getStats();

  if (lastError instanceof Error && (lastError as GeminiAppError).code) {
    throw lastError;
  }

  if (status === 403) {
    throw buildGeminiError(
      `Todas as ${stats.totalKeys} API key(s) do Gemini estão inválidas ou sem permissões. Verifique as configurações em Configurações > API Keys.`,
      'GEMINI_KEYS_INVALID',
      status
    );
  }

  if (status === 429 || isQuotaExceededError(lastError)) {
    const exhaustedInfo = geminiApiKeyManager.getExhaustedKeysInfo();
    let timeInfo = '';
    if (exhaustedInfo.length > 0 && stats.nextResetInMs) {
      const hoursUntilReset = Math.ceil(stats.nextResetInMs / (60 * 60 * 1000));
      timeInfo = ` As keys podem ser reutilizadas em aproximadamente ${hoursUntilReset} hora(s).`;
    }
    throw buildGeminiError(
      `Todas as ${stats.totalKeys} API key(s) do Gemini excederam a quota. Aguarde algumas horas ou adicione uma nova API key em Configurações > API Keys.${timeInfo}`,
      'GEMINI_QUOTA_EXCEEDED',
      429
    );
  }

  if (status === 503) {
    throw buildGeminiError(
      'A API do Gemini está temporariamente indisponível (erro 503). Após 3 tentativas, o serviço ainda não está respondendo. Tente novamente em alguns minutos ou verifique o status da API do Google.',
      'GEMINI_TEMP_UNAVAILABLE',
      status
    );
  }

  const networkMessage =
    lastError instanceof Error
      ? `Falha ao comunicar com a API Gemini após tentar ${stats.totalKeys} API key(s): ${lastError.message}`
      : `Falha ao comunicar com a API Gemini após tentar ${stats.totalKeys} API key(s).`;

  throw buildGeminiError(networkMessage, 'GEMINI_NETWORK_ERROR', status ?? undefined);
}


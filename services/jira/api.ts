import type { JiraConfig } from './types';
import { logger } from '../../utils/logger';
import { RateLimiter } from '../../utils/rateLimiter';
import { getJiraProxyHeaders } from '../../utils/jiraProxyHeaders';

type JiraApiRoot = 'api/3' | 'agile/1.0' | 'servicedeskapi' | 'proforma/1';
type JiraUrlMode = 'rest' | 'site' | 'atlassian';

/** Rate limiter global para chamadas Jira (50 req/min com delay de 200ms). */
const jiraRateLimiter = new RateLimiter({
  maxRequests: 50,
  windowMs: 60000,
  minDelayMs: 200,
  maxConcurrent: 4,
});

const RATE_LIMIT_STORAGE_KEY = 'jira-rate-limit-state';

/** Rastreia backoff adaptativo para 429 — persistido em sessionStorage para sobreviver a reloads. */
function loadRateLimitState(): { consecutive429s: number; backoffUntil: number } {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const now = Date.now();
      // Ignorar estado expirado
      if (parsed.backoffUntil && parsed.backoffUntil <= now) {
        sessionStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
        return { consecutive429s: 0, backoffUntil: 0 };
      }
      return {
        consecutive429s: typeof parsed.consecutive429s === 'number' ? parsed.consecutive429s : 0,
        backoffUntil: typeof parsed.backoffUntil === 'number' ? parsed.backoffUntil : 0,
      };
    }
  } catch {
    /* sessionStorage indisponível */
  }
  return { consecutive429s: 0, backoffUntil: 0 };
}

function saveRateLimitState(consecutive429s: number, backoffUntil: number): void {
  try {
    sessionStorage.setItem(
      RATE_LIMIT_STORAGE_KEY,
      JSON.stringify({ consecutive429s, backoffUntil })
    );
  } catch {
    /* sessionStorage indisponível */
  }
}

function resetRateLimitState(): void {
  consecutive429s = 0;
  backoffUntil = 0;
  try {
    sessionStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

let { consecutive429s, backoffUntil } = loadRateLimitState();
/** Retry-After header da última resposta 429 (passado da fn interna para executeWithRetry). */
let lastRetryAfter = 0;

/** Mutex simples para serializar mutações no estado global de rate limit. */
let rateLimitLock: Promise<void> = Promise.resolve();
async function withRateLimitLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const prev = rateLimitLock;
  let nextResolve: () => void;
  rateLimitLock = new Promise<void>(resolve => { nextResolve = resolve; });
  await prev;
  try {
    return await fn();
  } finally {
    nextResolve!();
  }
}

const MAX_RETRIES = 3;

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  attempt: number = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const is429 = error instanceof Error && error.message.includes('429');
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const isNetwork = error instanceof TypeError;

    if (!is429 && !isTimeout && !isNetwork) {
      throw error; // Erro não recuperável
    }

    if (attempt >= MAX_RETRIES) {
      if (is429) {
        throw new Error(
          'Jira API rate limit excedido após 3 tentativas. Aguarde alguns instantes e tente novamente.'
        );
      }
      throw error;
    }

    if (is429) {
      const backoffMs = lastRetryAfter > 0
        ? lastRetryAfter * 1000
        : Math.min(5000 * Math.pow(2, attempt - 1), 60000);
      await withRateLimitLock(() => {
        consecutive429s++;
        lastRetryAfter = 0;
        const newConcurrent = Math.max(1, 4 - consecutive429s);
        logger.warn(
          `Rate limit (429) na tentativa ${attempt}/${MAX_RETRIES}. Backoff de ${backoffMs}ms, reduzindo concurrency para ${newConcurrent}.`,
          'jiraApi'
        );
        backoffUntil = Date.now() + backoffMs;
        saveRateLimitState(consecutive429s, backoffUntil);
      });
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    } else {
      // Timeout ou erro de rede: backoff mais curto
      const waitMs = Math.min(1000 * attempt, 10000);
      logger.debug(
        `Erro recuperável (tentativa ${attempt}/${MAX_RETRIES}): ${error instanceof Error ? error.message : 'desconhecido'}. Aguardando ${waitMs}ms.`,
        'jiraApi'
      );
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }

    return executeWithRetry(fn, attempt + 1);
  }
}

async function jiraRequest<T>(
  config: JiraConfig,
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    timeout?: number;
    apiRoot?: JiraApiRoot;
    urlMode?: JiraUrlMode;
    extraHeaders?: Record<string, string>;
    /** 403/404 são logados em debug em vez de error (endpoints opcionais). */
    quietHttpErrors?: boolean;
  } = {}
): Promise<T> {
  const timeout = options.timeout || 60000;
  const apiRoot = options.apiRoot ?? 'api/3';

  // Aguardar backoff se estiver em período de resfriamento por 429
  if (Date.now() < backoffUntil) {
    const waitTime = backoffUntil - Date.now();
    logger.debug(`Aguardando backoff de 429 por ${waitTime}ms`, 'jiraApi');
    await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 5000)));
  }

  // Acquire rate limiter
  await jiraRateLimiter.acquire();

  return executeWithRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let rateLimitReleased = false;
    try {
      const requestBody = {
        url: config.url,
        email: config.email,
        apiToken: config.apiToken,
        endpoint,
        apiRoot,
        urlMode: options.urlMode ?? 'rest',
        extraHeaders: options.extraHeaders,
        method: options.method || 'GET',
        body: options.body
          ? typeof options.body === 'string'
            ? JSON.parse(options.body)
            : options.body
          : undefined,
      };

      logger.debug('Fazendo requisição ao proxy Jira', 'jiraService', {
        endpoint,
        apiRoot,
        method: requestBody.method,
      });

      let response: Response;
      try {
        response = await fetch('/api/jira-proxy', {
          method: 'POST',
          headers: getJiraProxyHeaders(),
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } catch (proxyError) {
        controller.abort();
        clearTimeout(timeoutId);
        logger.warn('Proxy Jira indisponível', 'jiraApi', proxyError);
        throw new Error(
          `Proxy Jira indisponível. Verifique sua conexão de rede e tente novamente.`
        );
      }

      clearTimeout(timeoutId);

      logger.debug('Resposta do proxy', 'jiraService', { status: response.status, ok: response.ok });

      if (response.status === 429) {
        // Apenas lê Retry-After, sem mutar estado (executeWithRetry gerencia)
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
            lastRetryAfter = seconds;
          }
        }
        await jiraRateLimiter.release();
        rateLimitReleased = true;
        throw new Error(`Jira API Error (429) - Rate limit`);
      }

      // Reset contagem de 429 em sucesso
      await withRateLimitLock(() => {
        resetRateLimitState();
      });

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      if (!response.ok) {
        let errorData: { error?: string };
        const isQuietHttpError =
          options.quietHttpErrors && (response.status === 403 || response.status === 404);
        const logHttpError = isQuietHttpError ? logger.debug.bind(logger) : logger.error.bind(logger);

        if (contentType.includes('text/html')) {
          logHttpError('Proxy retornou HTML (possível erro de deploy ou rota)', 'jiraService', {
            status: response.status,
            snippet: responseText.substring(0, 300),
          });
          throw new Error(
            `Erro no servidor proxy (HTTP ${response.status}). Verifique se a URL do proxy está correta e tente novamente.`
          );
        }

        try {
          errorData = JSON.parse(responseText) as { error?: string };
          logHttpError('Erro do proxy', 'jiraService', errorData);
        } catch {
          logHttpError('Erro do proxy (texto)', 'jiraService', responseText.substring(0, 500));
          errorData = { error: responseText || `Jira API Error (${response.status})` };
        }
        throw new Error(errorData.error || `Jira API Error (${response.status})`);
      }

      await jiraRateLimiter.release();
      rateLimitReleased = true;

      if (!responseText.trim()) {
        logger.debug('Resposta vazia do proxy Jira', 'jiraService', { endpoint });
        return undefined as unknown as T;
      }

      if (contentType.includes('text/html')) {
        logger.error('Proxy retornou HTML inesperado em resposta 200', 'jiraService', {
          endpoint,
          snippet: responseText.substring(0, 300),
        });
        throw new Error('Resposta inesperada do servidor proxy. Tente novamente.');
      }

      const data = JSON.parse(responseText) as T;
      logger.debug('Dados recebidos do proxy', 'jiraService', data);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (!rateLimitReleased) {
        await jiraRateLimiter.release();
      }

      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('Timeout na requisição', 'jiraService', error);
        throw new Error(
          `Timeout: A requisição demorou mais de ${timeout / 1000} segundos. Verifique sua conexão ou tente novamente.`
        );
      }
      if (options.quietHttpErrors && error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes('403') ||
          msg.includes('404') ||
          msg.includes('forbidden') ||
          msg.includes('not found')
        ) {
          logger.debug('Requisição Jira opcional falhou', 'jiraService', error);
          throw error;
        }
      }
      logger.error('Erro na requisição', 'jiraService', error);
      throw error;
    }
  });
}

export const jiraApiCall = async <T>(
  config: JiraConfig,
  endpoint: string,
  options: { method?: string; body?: unknown; timeout?: number } = {}
): Promise<T> => jiraRequest<T>(config, endpoint, options);

export const jiraAgileApiCall = async <T>(
  config: JiraConfig,
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    timeout?: number;
    quietHttpErrors?: boolean;
  } = {}
): Promise<T> => jiraRequest<T>(config, endpoint, { ...options, apiRoot: 'agile/1.0' });

export const jiraServiceDeskApiCall = async <T>(
  config: JiraConfig,
  endpoint: string,
  options: { method?: string; body?: unknown; timeout?: number } = {}
): Promise<T> => jiraRequest<T>(config, endpoint, { ...options, apiRoot: 'servicedeskapi' });

/** Chamadas fora de `/rest/*` (ex.: `/_edge/tenant_info`, `/jira/forms/...`). */
export const jiraSitePathCall = async <T>(
  config: JiraConfig,
  path: string,
  options: { method?: string; body?: unknown; timeout?: number } = {}
): Promise<T> => jiraRequest<T>(config, path, { ...options, urlMode: 'site' });

/** API Proforma (Data Center / instâncias legadas). */
export const jiraProformaApiCall = async <T>(
  config: JiraConfig,
  endpoint: string,
  options: { method?: string; body?: unknown; timeout?: number } = {}
): Promise<T> =>
  jiraRequest<T>(config, endpoint, {
    ...options,
    apiRoot: 'proforma/1',
    quietHttpErrors: true,
  });

const FORMS_API_HEADERS = { 'X-ExperimentalApi': 'opt-in' };

/** Forms API do Jira Cloud (`api.atlassian.com/jira/forms/cloud/...`). */
export const jiraFormsApiCall = async <T>(
  config: JiraConfig,
  endpoint: string,
  options: { method?: string; body?: unknown; timeout?: number } = {}
): Promise<T> =>
  jiraRequest<T>(config, endpoint, {
    ...options,
    urlMode: 'atlassian',
    extraHeaders: FORMS_API_HEADERS,
    quietHttpErrors: true,
  });

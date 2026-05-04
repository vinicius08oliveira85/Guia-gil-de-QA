import type { JiraConfig } from './types';
import { logger } from '../../utils/logger';

export const jiraApiCall = async <T>(
  config: JiraConfig,
  endpoint: string,
  options: { method?: string; body?: any; timeout?: number } = {}
): Promise<T> => {
  const timeout = options.timeout || 60000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const requestBody = {
      url: config.url,
      email: config.email,
      apiToken: config.apiToken,
      endpoint,
      method: options.method || 'GET',
      body: options.body
        ? typeof options.body === 'string'
          ? JSON.parse(options.body)
          : options.body
        : undefined,
    };

    logger.debug('Fazendo requisição ao proxy Jira', 'jiraService', {
      endpoint,
      method: requestBody.method,
    });

    const response = await fetch('/api/jira-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    logger.debug('Resposta do proxy', 'jiraService', { status: response.status, ok: response.ok });

    if (!response.ok) {
      let errorData: { error?: string };
      try {
        errorData = await response.json();
        logger.error('Erro do proxy', 'jiraService', errorData);
      } catch {
        const errorText = await response.text();
        logger.error('Erro do proxy (texto)', 'jiraService', errorText);
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `Jira API Error (${response.status})`);
    }

    const data = await response.json();
    logger.debug('Dados recebidos do proxy', 'jiraService', data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Timeout na requisição', 'jiraService', error);
      throw new Error(
        `Timeout: A requisição demorou mais de ${timeout / 1000} segundos. Verifique sua conexão ou tente novamente.`
      );
    }
    logger.error('Erro na requisição', 'jiraService', error);
    throw error;
  }
};

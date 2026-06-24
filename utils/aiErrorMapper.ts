import { GeminiAppError } from '../services/ai/geminiApiWrapper';

type AIError = Partial<GeminiAppError> | (Error & { code?: string; status?: number });

const fallbackMessage = 'Não foi possível completar a ação com a IA. Tente novamente em instantes.';

const codeToMessage: Record<string, string> = {
  GEMINI_QUOTA_EXCEEDED:
    'Cota do Gemini esgotada ou limite diário atingido. Tente: trocar a API key em Configurações > API Keys; mudar o modelo para gemini-1.5-flash (costuma ter cota mais estável no gratuito); ou configurar VITE_OPENAI_API_KEY (GPT-4o-mini) para o app usar OpenAI automaticamente quando o Gemini estiver limitado.',
  GEMINI_RATE_LIMITED:
    'Limite temporário do Gemini (429 — requisições por minuto ou cota). Aguarde alguns minutos, use outra chave Gemini em Configurações, altere o modelo para gemini-1.5-flash nas configurações do app ou configure uma chave OpenAI (GPT-4o-mini) no .env como backup.',
  GEMINI_TEMP_UNAVAILABLE:
    'Serviço do Gemini indisponível (503) após tentar vários modelos. Aguarde alguns minutos, defina VITE_GEMINI_MODEL=gemini-1.5-flash no deploy ou configure VITE_OPENAI_API_KEY para fallback automático.',
  GEMINI_KEYS_INVALID:
    'API key do Gemini inválida ou sem permissão. Atualize as credenciais em Configurações > API Keys.',
  GEMINI_NO_KEY: 'Nenhuma API key do Gemini configurada. Adicione uma em Configurações > API Keys.',
  GEMINI_KEY_UNAVAILABLE:
    'A chave do Gemini está configurada, mas não pôde ser usada agora. Recarregue a página ou confira Configurações > API Keys.',
  GEMINI_NETWORK_ERROR:
    'Não foi possível comunicar com a API do Gemini. Verifique sua conexão e tente novamente.',
  OPENAI_QUOTA_EXCEEDED:
    'Limite de uso da API de IA atingido. Aguarde alguns minutos e tente novamente ou verifique seu plano em Configurações.',
  OPENAI_RATE_LIMIT: 'Muitas requisições. Aguarde um momento e tente novamente.',
  OPENAI_KEYS_INVALID:
    'API key inválida ou sem permissão. Atualize as credenciais em Configurações > API Keys.',
  OPENAI_SERVICE_ERROR: 'Serviço de IA indisponível no momento. Tente novamente em alguns minutos.',
};

/** Extrai HTTP status de erros de API (Gemini/OpenAI/fetch). */
export function extractHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const e = error as { status?: unknown; statusCode?: unknown };
  const s = e.status ?? e.statusCode;
  return typeof s === 'number' ? s : undefined;
}

export const getFriendlyAIErrorMessage = (error: unknown): string => {
  if (!error) {
    return fallbackMessage;
  }

  const extracted: AIError = error as AIError;
  const code = typeof extracted.code === 'string' ? extracted.code : undefined;
  const status = typeof extracted.status === 'number' ? extracted.status : undefined;

  if (code && codeToMessage[code]) {
    return codeToMessage[code];
  }

  if (status === 429) {
    return 'Limite de uso da IA (HTTP 429). Aguarde alguns minutos, troque a chave do provedor em Configurações ou no .env, ou use outro provedor (ex.: OpenAI com VITE_OPENAI_API_KEY se o Gemini estiver limitado).';
  }

  if (status === 503) {
    return 'Serviço de IA indisponível no momento. Tente novamente em alguns minutos.';
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: string }).message === 'string'
        ? (error as { message: string }).message
        : '';
  if (message) {
    const lower = message.toLowerCase();
    if (lower.includes('rate limit') || lower.includes('quota') || lower.includes('usage limit')) {
      return `${codeToMessage.OPENAI_RATE_LIMIT} Se usar Gemini, considere gemini-1.5-flash ou chave OpenAI em paralelo.`;
    }
    if (
      lower.includes('invalid api key') ||
      lower.includes('incorrect api key') ||
      lower.includes('authentication')
    ) {
      return codeToMessage.OPENAI_KEYS_INVALID;
    }
    return message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
};

/**
 * Constrói um `Error` com mensagem amigável preservando `code`/`status` para toasts
 * (duração, id) e para `useErrorHandler`.
 */
export function toToastableAiError(error: unknown): Error {
  const message = getFriendlyAIErrorMessage(error);
  const err = new Error(message);
  if (error && typeof error === 'object') {
    const e = error as { code?: unknown };
    if (typeof e.code === 'string') {
      (err as GeminiAppError).code = e.code;
    }
    const st = extractHttpStatus(error);
    if (st !== undefined) {
      (err as GeminiAppError).status = st;
    }
  }
  return err;
}

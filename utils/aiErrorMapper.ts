import { GeminiAppError } from '../services/ai/geminiApiWrapper';

type AIError = Partial<GeminiAppError> | (Error & { code?: string; status?: number });

const fallbackMessage = 'Não foi possível completar a ação com a IA. Tente novamente em instantes.';

const codeToMessage: Record<string, string> = {
  GEMINI_QUOTA_EXCEEDED: 'Limite de uso do Gemini atingido. Aguarde alguns minutos e tente novamente ou configure uma nova API key em Configurações > API Keys.',
  GEMINI_RATE_LIMITED:
    'Limite temporário do Gemini (requisições por minuto ou cota). Aguarde alguns minutos e tente de novo. Se continuar, confira o uso em Google AI Studio.',
  GEMINI_TEMP_UNAVAILABLE: 'Serviço do Gemini indisponível no momento. Tente novamente em alguns minutos.',
  GEMINI_KEYS_INVALID: 'API key do Gemini inválida ou sem permissão. Atualize as credenciais em Configurações > API Keys.',
  GEMINI_NO_KEY: 'Nenhuma API key do Gemini configurada. Adicione uma em Configurações > API Keys.',
  GEMINI_NETWORK_ERROR: 'Não foi possível comunicar com a API do Gemini. Verifique sua conexão e tente novamente.',
  OPENAI_QUOTA_EXCEEDED: 'Limite de uso da API de IA atingido. Aguarde alguns minutos e tente novamente ou verifique seu plano em Configurações.',
  OPENAI_RATE_LIMIT: 'Muitas requisições. Aguarde um momento e tente novamente.',
  OPENAI_KEYS_INVALID: 'API key inválida ou sem permissão. Atualize as credenciais em Configurações > API Keys.',
  OPENAI_SERVICE_ERROR: 'Serviço de IA indisponível no momento. Tente novamente em alguns minutos.',
};

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
    return 'Limite de uso da IA atingido. Aguarde alguns minutos e tente novamente ou configure outra API key em Configurações > API Keys.';
  }

  if (status === 503) {
    return 'Serviço de IA indisponível no momento. Tente novamente em alguns minutos.';
  }

  const message = error instanceof Error ? error.message : typeof (error as { message?: string }).message === 'string' ? (error as { message: string }).message : '';
  if (message) {
    const lower = message.toLowerCase();
    if (lower.includes('rate limit') || lower.includes('quota') || lower.includes('usage limit')) {
      return codeToMessage.OPENAI_RATE_LIMIT;
    }
    if (lower.includes('invalid api key') || lower.includes('incorrect api key') || lower.includes('authentication')) {
      return codeToMessage.OPENAI_KEYS_INVALID;
    }
    return message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
};


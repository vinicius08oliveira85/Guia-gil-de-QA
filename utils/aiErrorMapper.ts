import { GeminiAppError } from '../services/ai/geminiApiWrapper';

type AIError = Partial<GeminiAppError> | (Error & { code?: string; status?: number });

const fallbackMessage = 'Não foi possível completar a ação com a IA. Tente novamente em instantes.';

const codeToMessage: Record<string, string> = {
  GEMINI_QUOTA_EXCEEDED: 'Limite de uso do Gemini atingido. Aguarde alguns minutos e tente novamente ou configure uma nova API key em Configurações > API Keys.',
  GEMINI_TEMP_UNAVAILABLE: 'Serviço do Gemini indisponível no momento. Tente novamente em alguns minutos.',
  GEMINI_KEYS_INVALID: 'API key do Gemini inválida ou sem permissão. Atualize as credenciais em Configurações > API Keys.',
  GEMINI_NO_KEY: 'Nenhuma API key do Gemini configurada. Adicione uma em Configurações > API Keys.',
  GEMINI_NETWORK_ERROR: 'Não foi possível comunicar com a API do Gemini. Verifique sua conexão e tente novamente.',
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
    return codeToMessage.GEMINI_QUOTA_EXCEEDED;
  }

  if (status === 503) {
    return codeToMessage.GEMINI_TEMP_UNAVAILABLE;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
};


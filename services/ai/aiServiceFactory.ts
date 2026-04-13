import { AIService } from './aiServiceInterface';
import { GeminiService } from './geminiService';
import { OpenAIService } from './openaiService';
import { logger } from '../../utils/logger';
import { getGeminiConfig } from '../geminiConfigService';

export type AIProvider = 'gemini' | 'openai';

let currentService: AIService | null = null;
let currentProvider: AIProvider | null = null;

/**
 * Resolve qual provedor de IA usar.
 *
 * Ordem de precedência:
 * 1. Chave Gemini salva pelo usuário em Configurações (localStorage) — uso explícito do Gemini na UI.
 * 2. `VITE_OPENAI_API_KEY` / `OPENAI_API_KEY` no ambiente.
 * 3. `VITE_GEMINI_API_KEY` / `GEMINI_API_KEY` no ambiente.
 * 4. Padrão: Gemini (a chave efetiva nas chamadas vem do `geminiApiKeyManager`: localStorage depois env).
 */
export const resolveConfiguredAIProvider = (): AIProvider => {
  const geminiUiKey = getGeminiConfig()?.apiKey?.trim() ?? '';
  if (geminiUiKey) {
    return 'gemini';
  }

  const geminiEnvKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '').trim();
  const openaiKey = (import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY || '').trim();

  if (openaiKey) {
    return 'openai';
  }
  if (geminiEnvKey) {
    return 'gemini';
  }

  return 'gemini';
};

const getConfiguredProvider = (): AIProvider => resolveConfiguredAIProvider();

/**
 * Cria uma instância do serviço de IA baseado no provedor especificado
 */
const createAIService = (provider: AIProvider): AIService => {
  switch (provider) {
    case 'openai':
      return new OpenAIService();
    case 'gemini':
    default:
      return new GeminiService();
  }
};

/**
 * Obtém ou cria a instância do serviço de IA
 */
export const getAIService = (provider?: AIProvider): AIService => {
  const selectedProvider = provider || getConfiguredProvider();
  
  // Se o provedor mudou ou ainda não foi inicializado, cria uma nova instância
  if (!currentService || currentProvider !== selectedProvider) {
    currentService = createAIService(selectedProvider);
    currentProvider = selectedProvider;
    logger.info(`AI Service inicializado com provedor: ${selectedProvider}`, 'aiServiceFactory');
  }
  
  return currentService;
};

/**
 * Define explicitamente o provedor de IA a ser usado
 */
export const setAIProvider = (provider: AIProvider): void => {
  currentService = createAIService(provider);
  currentProvider = provider;
  logger.info(`Provedor de IA alterado para: ${provider}`, 'aiServiceFactory');
};

/**
 * Obtém o provedor atual
 */
export const getCurrentAIProvider = (): AIProvider => {
  return currentProvider || getConfiguredProvider();
};

/**
 * Limpa o cache do serviço para que o próximo `getAIService()` recalcule o provedor
 * (ex.: após salvar ou remover a chave Gemini nas Configurações).
 */
export const invalidateAIServiceCache = (): void => {
  currentService = null;
  currentProvider = null;
};


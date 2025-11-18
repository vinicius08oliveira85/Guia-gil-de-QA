import { AIService } from './aiServiceInterface';
import { GeminiService } from './geminiService';
import { OpenAIService } from './openaiService';

export type AIProvider = 'gemini' | 'openai';

let currentService: AIService | null = null;
let currentProvider: AIProvider | null = null;

/**
 * Obtém o provedor de IA configurado nas variáveis de ambiente
 */
const getConfiguredProvider = (): AIProvider => {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;

  // Prioridade: OpenAI > Gemini
  if (openaiKey) {
    return 'openai';
  }
  if (geminiKey) {
    return 'gemini';
  }
  
  // Default para Gemini se nenhuma chave estiver configurada
  return 'gemini';
};

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
    console.log(`AI Service inicializado com provedor: ${selectedProvider}`);
  }
  
  return currentService;
};

/**
 * Define explicitamente o provedor de IA a ser usado
 */
export const setAIProvider = (provider: AIProvider): void => {
  currentService = createAIService(provider);
  currentProvider = provider;
  console.log(`Provedor de IA alterado para: ${provider}`);
};

/**
 * Obtém o provedor atual
 */
export const getCurrentAIProvider = (): AIProvider => {
  return currentProvider || getConfiguredProvider();
};


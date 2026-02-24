/**
 * Serviço para gerenciar configuração da API Key do Gemini
 * Armazena a chave no localStorage seguindo o padrão do jiraService
 */

const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key';

export interface GeminiConfig {
  apiKey: string;
}

/**
 * Salva a configuração da API Key do Gemini no localStorage
 */
export const saveGeminiConfig = (config: GeminiConfig): void => {
  // Verificar se localStorage está disponível
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('localStorage não está disponível');
  }
  localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, JSON.stringify(config));
};

/**
 * Recupera a configuração da API Key do Gemini do localStorage
 * @returns Configuração do Gemini ou null se não existir
 */
export const getGeminiConfig = (): GeminiConfig | null => {
  // Verificar se localStorage está disponível (pode não estar em SSR ou durante build)
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const stored = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    // Se houver erro ao fazer parse, retorna null
    return null;
  }
};

/**
 * Remove a configuração da API Key do Gemini do localStorage
 */
export const deleteGeminiConfig = (): void => {
  // Verificar se localStorage está disponível
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
};

/**
 * Verifica se a configuração do Gemini está salva
 * @returns true se a configuração existe, false caso contrário
 */
export const hasGeminiConfig = (): boolean => {
  // Verificar se localStorage está disponível
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  return getGeminiConfig() !== null;
};

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
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, JSON.stringify(config));
};

/**
 * Recupera a configuração da API Key do Gemini do localStorage
 * @returns Configuração do Gemini ou null se não existir
 */
export const getGeminiConfig = (): GeminiConfig | null => {
    const stored = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    if (!stored) {
        return null;
    }
    try {
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
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
};

/**
 * Verifica se a configuração do Gemini está salva
 * @returns true se a configuração existe, false caso contrário
 */
export const hasGeminiConfig = (): boolean => {
    return getGeminiConfig() !== null;
};


/**
 * Modelo padrão na Gemini API (Developer API / AI Studio).
 * `gemini-1.5-flash` sem sufixo de versão pode retornar 404 em chaves/API atuais; a documentação oficial
 * exemplifica `gemini-2.0-flash` para o SDK @google/genai.
 * @see https://ai.google.dev/api/models
 */
const envModel = (import.meta.env.VITE_GEMINI_MODEL || '').trim();

export const GEMINI_DEFAULT_MODEL = envModel || 'gemini-2.0-flash';

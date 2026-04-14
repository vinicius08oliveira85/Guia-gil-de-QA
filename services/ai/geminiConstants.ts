/**
 * Modelo padrão na Gemini API (Developer API / AI Studio).
 * Padrão: `gemini-2.5-flash` (amplamente disponível em v1beta). Override com `VITE_GEMINI_MODEL`.
 * Se a API retornar 404 ou indisponível, tente `gemini-2.5-flash-lite`, `gemini-2.0-flash` ou `gemini-1.5-flash-latest`.
 * @see https://ai.google.dev/api/models
 */
const envModel = (import.meta.env.VITE_GEMINI_MODEL || '').trim();

export const GEMINI_DEFAULT_MODEL = envModel || 'gemini-2.5-flash';

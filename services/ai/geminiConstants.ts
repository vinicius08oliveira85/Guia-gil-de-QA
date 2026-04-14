/**
 * Modelo padrão na Gemini API (Developer API / AI Studio).
 * Padrão: `gemini-2.5-flash` (amplamente disponível em v1beta). Override com `VITE_GEMINI_MODEL`.
 * Se a API retornar 404 ou indisponível, tente `gemini-2.5-flash-lite`, `gemini-2.0-flash` ou `gemini-1.5-flash-latest`.
 * @see https://ai.google.dev/api/models
 */
const envModel = (import.meta.env.VITE_GEMINI_MODEL || '').trim();

export const GEMINI_DEFAULT_MODEL = envModel || 'gemini-2.5-flash';

/** Modelos alternativos quando o principal falha com 404 ou 5xx transitório (ex.: 503). */
export const GEMINI_MODEL_FALLBACK_CANDIDATES = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
] as const;

function normalizeGeminiModelId(id: string): string {
  return id.replace(/^models\//, '').trim();
}

/** Cadeia sem duplicatas: preferido (param ou default), depois candidatos distintos. */
export function getGeminiModelFallbackChain(preferredModel: string | undefined): string[] {
  const raw = normalizeGeminiModelId((preferredModel ?? '').trim() || GEMINI_DEFAULT_MODEL);
  const primary = raw || GEMINI_DEFAULT_MODEL;
  const chain: string[] = [];
  const seen = new Set<string>();
  for (const id of [primary, ...GEMINI_MODEL_FALLBACK_CANDIDATES]) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    chain.push(id);
  }
  return chain;
}

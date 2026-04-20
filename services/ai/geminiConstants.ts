/**
 * Modelo padrão na Gemini API (Developer API / AI Studio).
 * Padrão: `gemini-2.5-flash`. Override com `VITE_GEMINI_MODEL`.
 * Fallback fixo: `gemini-2.5-flash-lite` (o wrapper alterna logo em 503/404 no modelo principal).
 * @see https://ai.google.dev/api/models
 */
const envModel = (import.meta.env.VITE_GEMINI_MODEL || '').trim();

export const GEMINI_DEFAULT_MODEL = envModel || 'gemini-2.5-flash';

/** Versão REST do Generative Language API usada pelo SDK (`@google/genai`); modelos recentes costumam exigir v1beta. */
export const GEMINI_API_VERSION = 'v1beta' as const;

/** Único modelo alternativo na cadeia padrão (após o preferido / default). */
export const GEMINI_MODEL_FALLBACK_CANDIDATES = ['gemini-2.5-flash-lite'] as const;

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

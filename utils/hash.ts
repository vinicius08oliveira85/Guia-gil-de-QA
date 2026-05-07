/**
 * Utilitários de hash não-criptográficos.
 *
 * Indicado para invalidação de cache, fingerprints de snapshots e detecção de
 * mudança em conteúdo serializado. **Não usar para segurança.**
 */

/**
 * Hash 32-bit determinístico (algoritmo djb2-like) sobre a string informada.
 *
 * Resultado em base 36 para chaves curtas. O algoritmo é idêntico ao usado
 * historicamente em `services/ai/*` para invalidar caches por snapshot.
 */
export function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const chr = value.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString(36);
}

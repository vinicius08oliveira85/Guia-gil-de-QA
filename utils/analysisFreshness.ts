/**
 * Utilitários para detectar quando uma análise de IA está desatualizada
 * em relação ao estado atual do projeto/tarefa/teste.
 *
 * Estratégia em camadas (do mais preciso ao mais permissivo):
 * 1. Se a análise tem `snapshotHash` E ele difere do `currentHash` → desatualizada.
 * 2. Se a análise tem `isOutdated === true` (marcação manual/heurística) → desatualizada.
 * 3. Sem nenhuma das informações → considera-se atualizada (caller decide o fallback).
 */

/** Forma comum a todas as análises de IA persistidas no projeto. */
export interface AnalysisFreshnessFields {
  isOutdated?: boolean;
  snapshotHash?: string;
}

/**
 * Indica se a análise está desatualizada em relação ao `currentHash` informado.
 *
 * - Quando o `snapshotHash` da análise está presente, a comparação é determinística:
 *   `analysis.snapshotHash !== currentHash` ⇒ desatualizada.
 * - Quando ausente, recai no flag manual `isOutdated`.
 * - Para ausência total da análise, prefira tratar como "desatualizada" no caller.
 */
export function isAnalysisOutdated(
  analysis: AnalysisFreshnessFields | undefined | null,
  currentHash: string
): boolean {
  if (!analysis) return true;
  if (analysis.snapshotHash) {
    return analysis.snapshotHash !== currentHash;
  }
  return analysis.isOutdated === true;
}

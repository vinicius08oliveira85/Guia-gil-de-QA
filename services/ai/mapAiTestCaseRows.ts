import type { TestCaseExecutionKind } from '../../types';

/**
 * Linha bruta de caso de teste no JSON retornado pela IA (Gemini / OpenAI).
 * Campos legados (`description`, `steps`) são aceitos pelo migrate em camadas acima.
 */
export type AiRawTestCaseRow = {
  action?: string;
  parameters?: string;
  expectedResult?: string;
  description?: string;
  steps?: string[];
  /** Valor bruto; normalizado em `resolveExecutionKindFromRecord` / `migrateTestCase`. */
  executionKind?: TestCaseExecutionKind | string;
  environment?: string;
  suite?: string;
  /** Legado / importação; interpretado junto com `executionKind`. */
  isAutomated?: boolean;
};

/**
 * Escolhe o texto de `parameters` sem alterar o conteúdo com `.trim()`:
 * preserva espaços e quebras internas até `normalizeAiMultilineField` no
 * `testCaseGenerationService`. Usa `trim` apenas para decidir se o campo veio
 * vazio e então cair no fallback `steps[]` legado.
 */
export function coalesceParametersFromAiRow(item: AiRawTestCaseRow): string {
  const p = item.parameters;
  if (p != null && String(p).trim() !== '') {
    return String(p);
  }
  if (Array.isArray(item.steps)) {
    return item.steps.join('\n');
  }
  return '';
}

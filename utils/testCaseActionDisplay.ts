/**
 * Normaliza texto de ação de caso de teste em passos para exibição.
 * Cobre listas numeradas em várias linhas e passos colados na mesma linha (ex.: "...'.2. Informe...").
 */
export function parseTestCaseActionSteps(action: string): string[] {
  const trimmed = (action || '').trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines.every(l => /^\d+\.\s/.test(l))) {
    return lines;
  }

  const byNumberedBreak = trimmed
    .split(/(?<=[.!?…])\s*(?=\d+\.\s)/)
    .map(s => s.trim())
    .filter(Boolean);

  if (byNumberedBreak.length > 1) {
    return byNumberedBreak;
  }

  return [trimmed];
}

/** Remove o prefixo "N. " do início do passo para usar com `<ol>` nativo. */
export function stripLeadingStepIndex(step: string): string {
  const next = step.replace(/^\d+\.\s*/, '').trim();
  return next || step.trim();
}

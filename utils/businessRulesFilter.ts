import type { BusinessRule } from '../types';

/**
 * Filtra regras por título ou descrição (case-insensitive).
 * Mantém a lógica em um único lugar para painel Documentos e modal de tarefa.
 */
export function filterBusinessRulesByQuery(rules: BusinessRule[], query: string): BusinessRule[] {
  const q = query.trim().toLowerCase();
  if (!q) return rules;
  return rules.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.category && r.category.toLowerCase().includes(q))
  );
}

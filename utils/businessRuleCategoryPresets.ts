import type { BusinessRule, Project } from '../types';
import { DEFAULT_BUSINESS_RULE_CATEGORY, normalizeBusinessRule } from './businessRuleDefaults';

/** Valores iniciais sugeridos quando o projeto ainda não definiu a lista explicitamente. */
export const DEFAULT_BUSINESS_RULE_CATEGORY_PRESETS = [
  'Geral',
  'Segurança',
  'Financeiro',
  'UX',
  'Compliance',
  'Integração',
] as const;

/** Rótulo efetivo da categoria da regra (trim ou padrão "Geral"). */
export function businessRuleCategoryLabel(rule: BusinessRule): string {
  const t = rule.category?.trim();
  return t ? t : DEFAULT_BUSINESS_RULE_CATEGORY;
}

/** Lista salva no projeto ou cópia dos padrões quando `undefined` ou lista vazia (ex.: após remover todos os presets). */
export function effectiveCategoryPresets(project: Project): string[] {
  const p = project.businessRuleCategoryPresets;
  if (p === undefined || p.length === 0) return [...DEFAULT_BUSINESS_RULE_CATEGORY_PRESETS];
  return [...p];
}

/** Opções do filtro e sugestões: união de presets efetivos + categorias usadas nas regras. */
export function getMergedBusinessRuleCategories(project: Project, rules: BusinessRule[]): string[] {
  const set = new Set<string>();
  for (const x of effectiveCategoryPresets(project)) {
    const t = x.trim();
    if (t) set.add(t);
  }
  for (const r of rules) set.add(businessRuleCategoryLabel(r));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

export function addCategoryPreset(
  project: Project,
  rawName: string
): { project: Project; error?: 'empty' | 'duplicate' } {
  const name = rawName.trim();
  if (!name) return { project, error: 'empty' };
  const current = effectiveCategoryPresets(project);
  if (current.some(c => c.trim().toLowerCase() === name.toLowerCase())) {
    return { project, error: 'duplicate' };
  }
  return { project: { ...project, businessRuleCategoryPresets: [...current, name] } };
}

export function removeCategoryPreset(project: Project, name: string): Project {
  const current = effectiveCategoryPresets(project);
  const next = current.filter(c => c !== name);
  if (next.length === 0) {
    const { businessRuleCategoryPresets: _removed, ...rest } = project;
    return rest as Project;
  }
  return { ...project, businessRuleCategoryPresets: next };
}

export function renameCategoryPreset(
  project: Project,
  oldName: string,
  rawNewName: string
): { project: Project; error?: 'empty' | 'duplicate' } {
  const newName = rawNewName.trim();
  if (!newName) return { project, error: 'empty' };
  const current = effectiveCategoryPresets(project);
  if (newName !== oldName && current.some(c => c.trim().toLowerCase() === newName.toLowerCase())) {
    return { project, error: 'duplicate' };
  }
  const nextPresets = [...new Set(current.map(c => (c === oldName ? newName : c)))];
  const businessRules = project.businessRules.map(r =>
    businessRuleCategoryLabel(r) === oldName
      ? normalizeBusinessRule({ ...r, category: newName })
      : r
  );
  return { project: { ...project, businessRuleCategoryPresets: nextPresets, businessRules } };
}

export function countRulesInCategory(rules: BusinessRule[], categoryName: string): number {
  return rules.filter(r => businessRuleCategoryLabel(r) === categoryName).length;
}

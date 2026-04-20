import type { BusinessRule, Project } from '../types';

export const DEFAULT_BUSINESS_RULE_CATEGORY = 'Geral';

/** Entrada ao hidratar JSON legado (sem `category`). */
export type BusinessRuleInput = Omit<BusinessRule, 'category'> & { category?: string };

export function normalizeBusinessRule(rule: BusinessRuleInput): BusinessRule {
  const category =
    typeof rule.category === 'string' && rule.category.trim()
      ? rule.category.trim()
      : DEFAULT_BUSINESS_RULE_CATEGORY;
  return { ...rule, category };
}

/** Garante `businessRules` sempre definido e cada regra com `category`. */
export function normalizeProjectBusinessRules(project: Project): Project {
  const next: Project = {
    ...project,
    businessRules: (project.businessRules ?? []).map(normalizeBusinessRule),
  };
  if (next.businessRuleCategoryPresets?.length === 0) {
    delete next.businessRuleCategoryPresets;
  }
  return next;
}

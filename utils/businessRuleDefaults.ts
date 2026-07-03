import type { BusinessRule, Project } from '../types';

export const DEFAULT_BUSINESS_RULE_CATEGORY = 'Geral';
export const MAX_BUSINESS_RULE_ANALYSIS_HISTORY = 5;

/** Máximo de prints por regra enviados à IA na análise do dossiê. */
export const MAX_BUSINESS_RULE_SCREENSHOTS = 20;

/** Entrada ao hidratar JSON legado ou parcial. */
export type BusinessRuleInput = Partial<BusinessRule> &
  Pick<BusinessRule, 'id' | 'title' | 'createdAt'>;

export function isLegacyBusinessRule(rule: BusinessRule): boolean {
  return !rule.analysis && Boolean(rule.description?.trim());
}

export function normalizeBusinessRule(rule: BusinessRuleInput): BusinessRule {
  const category =
    typeof rule.category === 'string' && rule.category.trim()
      ? rule.category.trim()
      : DEFAULT_BUSINESS_RULE_CATEGORY;

  const linkedTaskIds = Array.isArray(rule.linkedTaskIds) ? [...rule.linkedTaskIds] : [];
  const analysisHistory = (rule.analysisHistory ?? []).slice(0, MAX_BUSINESS_RULE_ANALYSIS_HISTORY);

  const normalized: BusinessRule = {
    id: rule.id,
    title: rule.title,
    createdAt: rule.createdAt,
    linkedTaskIds,
    category,
    ...(rule.searchKeywords?.length ? { searchKeywords: [...rule.searchKeywords] } : {}),
    ...(rule.updatedAt ? { updatedAt: rule.updatedAt } : {}),
    ...(rule.taskSnapshotHash ? { taskSnapshotHash: rule.taskSnapshotHash } : {}),
    ...(rule.screenshots?.length ? { screenshots: rule.screenshots } : {}),
    ...(rule.analysis ? { analysis: rule.analysis } : {}),
    ...(analysisHistory.length > 0 ? { analysisHistory } : {}),
    ...(rule.isOutdated ? { isOutdated: true } : {}),
    ...(rule.description?.trim() ? { description: rule.description.trim() } : {}),
    ...(rule.linkedBusinessRuleIds?.length
      ? { linkedBusinessRuleIds: rule.linkedBusinessRuleIds }
      : {}),
  };

  if (!normalized.analysis && normalized.description) {
    normalized.isOutdated = true;
  }

  return normalized;
}

/** Garante `businessRules` sempre definido e cada regra normalizada. */
export function normalizeProjectBusinessRules(project: Project): Project {
  const next: Project = {
    ...project,
    businessRules: (project.businessRules ?? []).map(rule =>
      normalizeBusinessRule(rule as BusinessRuleInput)
    ),
  };
  if (next.businessRuleCategoryPresets?.length === 0) {
    delete next.businessRuleCategoryPresets;
  }
  return next;
}

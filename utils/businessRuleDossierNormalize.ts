import type { BusinessRuleFunctionalityItem, BusinessRuleTaskSheet } from '../types';

const PLACEHOLDER = '[A CONFIRMAR]';

/** Normaliza ficha técnica da IA. */
export function normalizeTaskSheetItem(
  raw: Partial<BusinessRuleTaskSheet> & { taskId: string }
): BusinessRuleTaskSheet {
  return {
    taskId: raw.taskId.trim(),
    taskTitle: raw.taskTitle?.trim() || raw.taskId.trim(),
    implemented: raw.implemented?.trim() || PLACEHOLDER,
    legacyBefore: raw.legacyBefore?.trim() || PLACEHOLDER,
    improvedAfter: raw.improvedAfter?.trim() || PLACEHOLDER,
    purpose: raw.purpose?.trim() || PLACEHOLDER,
    integratedSystems: raw.integratedSystems?.trim() || PLACEHOLDER,
    expectedResult: raw.expectedResult?.trim() || PLACEHOLDER,
  };
}

export function normalizeTaskSheetItems(
  items: Array<Partial<BusinessRuleTaskSheet> & { taskId: string }> | undefined
): BusinessRuleTaskSheet[] {
  return (items ?? []).map(normalizeTaskSheetItem);
}

/** Normaliza funcionalidade da IA ou legado (só description). */
export function normalizeFunctionalityItem(
  raw: Partial<BusinessRuleFunctionalityItem> & { name: string }
): BusinessRuleFunctionalityItem {
  const description = raw.description?.trim() ?? '';
  const implemented = raw.implemented?.trim() || description || '[A CONFIRMAR]';
  const expectedResult = raw.expectedResult?.trim() || '[A CONFIRMAR]';

  return {
    name: raw.name.trim() || 'Funcionalidade',
    description: description || implemented.slice(0, 200),
    implemented,
    expectedResult,
    taskIds: Array.isArray(raw.taskIds) ? raw.taskIds.filter(Boolean) : [],
    ...(raw.implementationStatus ? { implementationStatus: raw.implementationStatus } : {}),
  };
}

export function normalizeFunctionalityItems(
  items: Array<Partial<BusinessRuleFunctionalityItem> & { name: string }> | undefined
): BusinessRuleFunctionalityItem[] {
  return (items ?? []).map(normalizeFunctionalityItem);
}

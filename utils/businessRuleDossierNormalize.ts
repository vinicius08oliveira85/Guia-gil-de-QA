import type { BusinessRuleFunctionalityItem } from '../types';

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

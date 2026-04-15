import type { BusinessRule } from '../types';

export type BusinessRuleSortKey = 'title_asc' | 'title_desc' | 'created_desc' | 'created_asc';

export function sortBusinessRules(rules: BusinessRule[], sort: BusinessRuleSortKey): BusinessRule[] {
  const copy = [...rules];
  copy.sort((a, b) => {
    switch (sort) {
      case 'title_asc':
        return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
      case 'title_desc':
        return b.title.localeCompare(a.title, 'pt-BR', { sensitivity: 'base' });
      case 'created_desc': {
        const ta = Date.parse(a.createdAt) || 0;
        const tb = Date.parse(b.createdAt) || 0;
        return tb - ta;
      }
      case 'created_asc': {
        const ta = Date.parse(a.createdAt) || 0;
        const tb = Date.parse(b.createdAt) || 0;
        return ta - tb;
      }
      default:
        return 0;
    }
  });
  return copy;
}

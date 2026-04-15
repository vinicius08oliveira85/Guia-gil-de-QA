import { describe, it, expect } from 'vitest';
import { exportBusinessRulesToJSON } from '../../utils/exportService';
import type { BusinessRule } from '../../types';

describe('exportBusinessRulesToJSON', () => {
  it('gera JSON com metadados e array businessRules', () => {
    const rules: BusinessRule[] = [{ id: '1', title: 'T', description: 'D', createdAt: 'x' }];
    const json = exportBusinessRulesToJSON('Meu Projeto', rules);
    const parsed = JSON.parse(json) as { projectName: string; exportedAt: string; businessRules: BusinessRule[] };
    expect(parsed.projectName).toBe('Meu Projeto');
    expect(parsed.businessRules).toEqual(rules);
    expect(parsed.exportedAt).toBeDefined();
  });
});

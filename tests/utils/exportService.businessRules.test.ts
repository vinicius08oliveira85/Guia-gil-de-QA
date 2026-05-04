import { describe, it, expect } from 'vitest';
import { exportBusinessRulesToJSON } from '../../utils/exportService';
import {
  BUSINESS_RULES_EXPORT_FORMAT_ID,
  BUSINESS_RULES_EXPORT_FORMAT_VERSION,
} from '../../utils/businessRulesExportEnvelope';
import type { BusinessRule } from '../../types';

describe('exportBusinessRulesToJSON', () => {
  it('gera JSON com metadados e array businessRules', () => {
    const rules: BusinessRule[] = [
      { id: '1', title: 'T', description: 'D', category: 'Geral', createdAt: 'x' },
    ];
    const json = exportBusinessRulesToJSON('Meu Projeto', rules);
    const parsed = JSON.parse(json) as {
      format: string;
      formatVersion: number;
      readme: string;
      projectName: string;
      exportedAt: string;
      businessRules: BusinessRule[];
    };
    expect(parsed.format).toBe(BUSINESS_RULES_EXPORT_FORMAT_ID);
    expect(parsed.formatVersion).toBe(BUSINESS_RULES_EXPORT_FORMAT_VERSION);
    expect(parsed.readme).toContain('businessRules');
    expect(parsed.readme).toContain('category');
    expect(parsed.projectName).toBe('Meu Projeto');
    expect(parsed.businessRules).toEqual(rules);
    expect(parsed.exportedAt).toBeDefined();
  });
});

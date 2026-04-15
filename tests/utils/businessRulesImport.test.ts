import { describe, it, expect } from 'vitest';
import { mergeBusinessRulesInto, parseBusinessRulesImportJson } from '../../utils/businessRulesImport';
import type { BusinessRule } from '../../types';

describe('parseBusinessRulesImportJson', () => {
  it('aceita formato export', () => {
    const json = JSON.stringify({
      projectName: 'P',
      exportedAt: 'x',
      businessRules: [{ id: 'a', title: 'T', description: 'D', createdAt: '2020-01-01' }],
    });
    const r = parseBusinessRulesImportJson(json);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rules).toHaveLength(1);
      expect(r.sourceProject).toBe('P');
      expect(r.skipped).toBe(0);
    }
  });

  it('aceita array direto', () => {
    const json = JSON.stringify([{ id: 'b', title: 'X', description: '', createdAt: '' }]);
    const r = parseBusinessRulesImportJson(json);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rules[0]?.id).toBe('b');
      expect(r.rules[0]?.createdAt).toMatch(/\d{4}/);
    }
  });

  it('rejeita JSON inválido', () => {
    expect(parseBusinessRulesImportJson('{').ok).toBe(false);
  });
});

describe('mergeBusinessRulesInto', () => {
  const e: BusinessRule[] = [{ id: '1', title: 'A', description: 'a', createdAt: 't1' }];

  it('adiciona novas ao final', () => {
    const incoming: BusinessRule[] = [{ id: '2', title: 'B', description: 'b', createdAt: 't2' }];
    const { merged, addedCount, updatedCount } = mergeBusinessRulesInto(e, incoming);
    expect(addedCount).toBe(1);
    expect(updatedCount).toBe(0);
    expect(merged.map((r) => r.id)).toEqual(['1', '2']);
  });

  it('atualiza por id e preserva ordem', () => {
    const incoming: BusinessRule[] = [{ id: '1', title: 'A2', description: 'a2', createdAt: 't99' }];
    const { merged, addedCount, updatedCount } = mergeBusinessRulesInto(e, incoming);
    expect(updatedCount).toBe(1);
    expect(addedCount).toBe(0);
    expect(merged[0]?.title).toBe('A2');
    expect(merged[0]?.createdAt).toBe('t1');
  });
});

import { describe, it, expect } from 'vitest';
import { sortBusinessRules } from '../../utils/businessRulesSort';
import type { BusinessRule } from '../../types';

const rules: BusinessRule[] = [
  { id: 'b', title: 'Beta', description: '', createdAt: '2020-01-02T00:00:00.000Z' },
  { id: 'a', title: 'Alpha', description: '', createdAt: '2020-01-01T00:00:00.000Z' },
];

describe('sortBusinessRules', () => {
  it('title_asc', () => {
    const s = sortBusinessRules(rules, 'title_asc').map((r) => r.id);
    expect(s).toEqual(['a', 'b']);
  });

  it('created_desc', () => {
    const s = sortBusinessRules(rules, 'created_desc').map((r) => r.id);
    expect(s).toEqual(['b', 'a']);
  });

  it('não muta o array original', () => {
    const copy = [...rules];
    sortBusinessRules(rules, 'title_desc');
    expect(rules).toEqual(copy);
  });
});

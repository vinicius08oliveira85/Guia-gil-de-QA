import { describe, it, expect } from 'vitest';
import { sortBusinessRules } from '../../utils/businessRulesSort';
import type { BusinessRule } from '../../types';

const rules: BusinessRule[] = [
  {
    id: 'b',
    title: 'Beta',
    description: '',
    category: 'Geral',
    createdAt: '2020-01-02T00:00:00.000Z',
  },
  {
    id: 'a',
    title: 'Alpha',
    description: '',
    category: 'Geral',
    createdAt: '2020-01-01T00:00:00.000Z',
  },
];

const mixedCategory: BusinessRule[] = [
  {
    id: 'z',
    title: 'Zeta',
    description: '',
    category: 'Segurança',
    createdAt: '2020-01-01T00:00:00.000Z',
  },
  {
    id: 'y',
    title: 'Yota',
    description: '',
    category: 'Geral',
    createdAt: '2020-01-01T00:00:00.000Z',
  },
  {
    id: 'x',
    title: 'Xis',
    description: '',
    category: 'Segurança',
    createdAt: '2020-01-01T00:00:00.000Z',
  },
];

describe('sortBusinessRules', () => {
  it('title_asc', () => {
    const s = sortBusinessRules(rules, 'title_asc').map(r => r.id);
    expect(s).toEqual(['a', 'b']);
  });

  it('created_desc', () => {
    const s = sortBusinessRules(rules, 'created_desc').map(r => r.id);
    expect(s).toEqual(['b', 'a']);
  });

  it('category_asc desempata por título', () => {
    const s = sortBusinessRules(mixedCategory, 'category_asc').map(r => r.id);
    expect(s).toEqual(['y', 'x', 'z']);
  });

  it('category_desc desempata por título', () => {
    const s = sortBusinessRules(mixedCategory, 'category_desc').map(r => r.id);
    expect(s).toEqual(['x', 'z', 'y']);
  });

  it('não muta o array original', () => {
    const copy = [...rules];
    sortBusinessRules(rules, 'title_desc');
    expect(rules).toEqual(copy);
  });
});

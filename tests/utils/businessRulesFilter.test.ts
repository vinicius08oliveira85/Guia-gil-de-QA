import { describe, it, expect } from 'vitest';
import { filterBusinessRulesByQuery } from '../../utils/businessRulesFilter';
import type { BusinessRule } from '../../types';

const rules: BusinessRule[] = [
  { id: '1', title: 'Login obrigatório', description: 'Usuário deve autenticar', category: 'Segurança', createdAt: 'x' },
  { id: '2', title: 'Cupom', description: 'Desconto máximo 10%', category: 'Financeiro', createdAt: 'x' },
];

describe('filterBusinessRulesByQuery', () => {
  it('retorna todas quando query vazia', () => {
    expect(filterBusinessRulesByQuery(rules, '')).toEqual(rules);
    expect(filterBusinessRulesByQuery(rules, '   ')).toEqual(rules);
  });

  it('filtra por título', () => {
    expect(filterBusinessRulesByQuery(rules, 'login')).toHaveLength(1);
    expect(filterBusinessRulesByQuery(rules, 'LOGIN')[0]?.id).toBe('1');
  });

  it('filtra por descrição', () => {
    expect(filterBusinessRulesByQuery(rules, '10%')).toHaveLength(1);
    expect(filterBusinessRulesByQuery(rules, 'autenticar')).toHaveLength(1);
  });

  it('retorna vazio quando não há match', () => {
    expect(filterBusinessRulesByQuery(rules, 'xyz')).toEqual([]);
  });

  it('filtra por categoria', () => {
    expect(filterBusinessRulesByQuery(rules, 'financeiro')[0]?.id).toBe('2');
    expect(filterBusinessRulesByQuery(rules, 'segurança')).toHaveLength(1);
  });
});

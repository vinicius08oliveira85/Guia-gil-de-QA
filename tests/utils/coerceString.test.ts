import { describe, expect, it } from 'vitest';
import { categorizeJiraStatus } from '../../utils/jiraStatusCategorizer';
import { coerceOptionalString, coerceString } from '../../utils/coerceString';
import { businessRuleCategoryLabel } from '../../utils/businessRuleCategoryPresets';
import { getTestCaseEnvironment } from '../../utils/testCaseMigration';

describe('coerceString', () => {
  it('converte números e objetos com name', () => {
    expect(coerceString(123)).toBe('123');
    expect(coerceOptionalString({ name: '  Done  ' })).toBe('Done');
    expect(coerceString(null)).toBe('');
  });
});

describe('categorizeJiraStatus — dados legados', () => {
  it('aceita jiraStatus numérico ou objeto sem lançar', () => {
    expect(categorizeJiraStatus(123)).toBe('Outros');
    expect(categorizeJiraStatus({ name: 'Em Andamento' })).toBe('Em Andamento');
    expect(categorizeJiraStatus(undefined)).toBe('Pendente');
  });
});

describe('helpers com trim defensivo', () => {
  it('businessRuleCategoryLabel com category numérica', () => {
    expect(
      businessRuleCategoryLabel({
        id: '1',
        title: 'Regra',
        description: 'd',
        category: 5 as unknown as string,
      })
    ).toBe('5');
  });

  it('getTestCaseEnvironment com environment numérico', () => {
    expect(
      getTestCaseEnvironment({
        id: '1',
        action: 'a',
        parameters: 'p',
        expectedResult: 'e',
        observedResult: '',
        status: 'Not Run',
        environment: 5 as unknown as string,
      })
    ).toBe('5');
  });
});

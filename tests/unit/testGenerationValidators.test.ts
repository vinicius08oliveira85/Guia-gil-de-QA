import { describe, expect, it } from 'vitest';
import { normalizeStrategyReferences } from '../../services/ai/testGenerationValidators';

describe('normalizeStrategyReferences', () => {
  it('mantém apenas tipos que existem na estratégia', () => {
    const allowed = [
      { testType: 'Teste Funcional', description: '', howToExecute: [], tools: '' },
      { testType: 'Teste de API', description: '', howToExecute: [], tools: '' },
    ];
    expect(normalizeStrategyReferences(['Teste Funcional', 'Inventado'], allowed)).toEqual(['Teste Funcional']);
  });

  it('usa o primeiro tipo permitido quando a IA não retornou nenhum válido', () => {
    const allowed = [{ testType: 'Teste Funcional', description: '', howToExecute: [], tools: '' }];
    expect(normalizeStrategyReferences(['X'], allowed)).toEqual(['Teste Funcional']);
  });

  it('retorna vazio quando não há estratégias', () => {
    expect(normalizeStrategyReferences(['Algo'], [])).toEqual([]);
  });
});

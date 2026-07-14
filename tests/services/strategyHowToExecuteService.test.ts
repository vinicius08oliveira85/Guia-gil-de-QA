import { describe, it, expect } from 'vitest';
import { normalizeHowToExecuteSteps } from '../../services/ai/strategyHowToExecuteService';

describe('normalizeHowToExecuteSteps', () => {
  it('filtra vazios e limita quantidade', () => {
    const steps = normalizeHowToExecuteSteps([
      ' Abrir DBeaver ',
      '',
      'Consultar tabela',
      1,
      '   ',
    ]);
    expect(steps).toEqual(['Abrir DBeaver', 'Consultar tabela', '1']);
  });

  it('retorna vazio para entrada inválida', () => {
    expect(normalizeHowToExecuteSteps(null)).toEqual([]);
    expect(normalizeHowToExecuteSteps('x')).toEqual([]);
  });
});

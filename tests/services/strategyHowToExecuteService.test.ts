import { describe, it, expect } from 'vitest';
import {
  normalizeCursorAgentTestPrompts,
  normalizeHowToExecuteSteps,
} from '../../services/ai/strategyHowToExecuteService';

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

describe('normalizeCursorAgentTestPrompts', () => {
  it('garante um prompt por ferramenta na ordem pedida', () => {
    const result = normalizeCursorAgentTestPrompts(
      [
        { tool: 'Insomnia', prompt: 'Crie collection Insomnia', action: 'create' },
        { tool: 'Postman', prompt: 'Crie collection Postman', action: 'modify' },
      ],
      ['Postman', 'DBeaver']
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      tool: 'Postman',
      prompt: 'Crie collection Postman',
      action: 'modify',
    });
    expect(result[1].tool).toBe('DBeaver');
    expect(result[1].prompt.length).toBeGreaterThan(20);
    expect(result[1].action).toBe('create');
  });

  it('gera fallback quando a IA omite prompts', () => {
    const result = normalizeCursorAgentTestPrompts(undefined, ['Kibana']);
    expect(result).toHaveLength(1);
    expect(result[0].tool).toBe('Kibana');
    expect(result[0].prompt).toContain('Kibana');
  });
});

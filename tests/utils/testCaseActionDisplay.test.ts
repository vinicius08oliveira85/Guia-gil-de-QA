import { describe, expect, it } from 'vitest';
import {
  parseTestCaseActionSteps,
  stripLeadingStepIndex,
} from '../../utils/testCaseActionDisplay';

describe('parseTestCaseActionSteps', () => {
  it('divide passos colados após ponto final antes do próximo índice', () => {
    const raw =
      "1. Acesse o 'Mapa de Internação'.2. Informe o Nº da Guia '3368023'.3. Preencha todos os campos obrigatórios para 'Adicionar Leito do Dia'.4. Clique no botão 'Salvar'.";
    const steps = parseTestCaseActionSteps(raw);
    expect(steps).toHaveLength(4);
    expect(steps[0]).toMatch(/^1\.\s*Acesse/);
    expect(steps[1]).toMatch(/^2\.\s*Informe/);
    expect(steps[2]).toMatch(/^3\.\s*Preencha/);
    expect(steps[3]).toMatch(/^4\.\s*Clique/);
  });

  it('preserva parágrafo único quando não há padrão de passos', () => {
    const one = 'Apenas uma instrução sem numeração.';
    expect(parseTestCaseActionSteps(one)).toEqual([one]);
  });

  it('reconhece várias linhas já numeradas', () => {
    const multiline = "1. Primeiro passo\n2. Segundo passo\n3. Terceiro";
    expect(parseTestCaseActionSteps(multiline)).toEqual([
      '1. Primeiro passo',
      '2. Segundo passo',
      '3. Terceiro',
    ]);
  });
});

describe('stripLeadingStepIndex', () => {
  it('remove índice inicial', () => {
    expect(stripLeadingStepIndex('1. Abrir o menu')).toBe('Abrir o menu');
  });

  it('mantém texto se não houver índice', () => {
    expect(stripLeadingStepIndex('Sem número')).toBe('Sem número');
  });
});

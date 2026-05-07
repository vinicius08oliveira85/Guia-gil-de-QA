import { describe, expect, it } from 'vitest';
import {
  parseTestCaseActionSteps,
  stripLeadingStepIndex,
  structureTestCaseExpected,
  structureTestCaseParameters,
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

describe('structureTestCaseParameters', () => {
  it('extrai pares rótulo/valor em linha única com pontos entre itens', () => {
    const raw =
      "Tela: 'Mapa de Internação'. Nº da Guia: '3368023'. Paciente: JUSSARA LUCIA DA SILVA. Dados de preenchimento para Leito do Dia: Válidos e completos (ex: Leito, Data Internação, etc.).";
    const v = structureTestCaseParameters(raw);
    expect(v.kind).toBe('parameters');
    if (v.kind === 'parameters') {
      expect(v.rows).toHaveLength(4);
      expect(v.rows[0]).toEqual({ key: 'Tela', value: "'Mapa de Internação'" });
      expect(v.rows[1].key).toBe('Nº da Guia');
      expect(v.rows[2].key).toBe('Paciente');
      expect(v.rows[3].key).toBe('Dados de preenchimento para Leito do Dia');
    }
  });

  it('mantém texto simples quando não há padrão de parâmetros', () => {
    const v = structureTestCaseParameters('Texto sem dois pontos');
    expect(v.kind).toBe('plain');
    if (v.kind === 'plain') expect(v.text).toBe('Texto sem dois pontos');
  });
});

describe('structureTestCaseExpected', () => {
  it('divide em cláusulas após ponto quando a próxima frase começa com padrão comum', () => {
    const raw =
      "O registro do 'Leito do Dia' deve ser salvo com sucesso e a guia '3368023' deve ser atualizada corretamente. O sistema NÃO deve apresentar a mensagem de erro impeditiva.";
    const v = structureTestCaseExpected(raw);
    expect(v.kind).toBe('ordered');
    if (v.kind === 'ordered') {
      expect(v.listStyle).toBe('disc');
      expect(v.items).toHaveLength(2);
      expect(v.items[0]).toMatch(/corretamente\.?$/);
      expect(v.items[1]).toMatch(/^O sistema NÃO/);
    }
  });
});

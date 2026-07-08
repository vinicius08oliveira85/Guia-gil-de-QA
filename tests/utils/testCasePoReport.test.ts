import { describe, expect, it } from 'vitest';
import {
  getTestCaseActionSummary,
  getTestCaseContextLine,
  getTestCasePoSummary,
} from '../../utils/testCaseActionDisplay';
import type { TestCase } from '../../types';

const sampleCase: TestCase = {
  id: 'tc-1',
  action: '1. Acessar o painel.\n2. Validar coluna.\n3. Conferir tooltip.',
  parameters: 'Usuário: backoffice',
  expectedResult: 'A coluna Anotações é exibida na tabela.',
  observedResult: 'Coluna visível conforme esperado.',
  status: 'Passed',
  environment: 'Homologação',
};

describe('helpers de relatório PO', () => {
  it('getTestCasePoSummary retorna resultado esperado completo', () => {
    expect(getTestCasePoSummary(sampleCase)).toBe('A coluna Anotações é exibida na tabela.');
  });

  it('getTestCaseActionSummary condensa passos', () => {
    expect(getTestCaseActionSummary(sampleCase, 2)).toBe('Acessar o painel.; Validar coluna.…');
  });

  it('getTestCaseContextLine agrega parâmetros e ambiente', () => {
    expect(getTestCaseContextLine(sampleCase)).toContain('Usuário: backoffice');
    expect(getTestCaseContextLine(sampleCase)).toContain('Ambiente: Homologação');
  });
});

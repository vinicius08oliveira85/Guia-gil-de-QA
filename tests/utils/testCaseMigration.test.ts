import { describe, it, expect } from 'vitest';
import {
  migrateTestCase,
  testCaseLooksAutomated,
  getTestCaseEnvironment,
  getTestCaseSuite,
  resolveExecutionKindFromRecord,
  getExecutionKindBadgeDisplay,
  getNextExecutionKind,
  resolveEffectiveExecutionKind,
} from '../../utils/testCaseMigration';
import type { TestCase } from '../../types';

describe('migrateTestCase', () => {
  it('retorna formato mínimo para entrada inválida', () => {
    const tc = migrateTestCase(null);
    expect(tc.action).toBe('—');
    expect(tc.parameters).toBe('—');
    expect(tc.status).toBe('Not Run');
  });

  it('preserva roteiro novo (action + parameters)', () => {
    const tc = migrateTestCase({
      id: 't1',
      action: 'Fazer login',
      parameters: 'Usuário válido',
      expectedResult: 'Dashboard',
      observedResult: '',
      status: 'Passed',
      executionKind: 'manual',
      environment: 'HML',
      suite: 'Smoke',
    });
    expect(tc.action).toBe('Fazer login');
    expect(tc.parameters).toBe('Usuário válido');
    expect(tc.executionKind).toBe('manual');
    expect(tc.environment).toBe('HML');
    expect(tc.suite).toBe('Smoke');
    expect(tc.status).toBe('Passed');
  });

  it('preenche parameters com "—" quando ausente no formato novo', () => {
    const tc = migrateTestCase({
      id: 't2',
      action: 'Somente ação',
      expectedResult: 'ok',
      status: 'Not Run',
    });
    expect(tc.parameters).toBe('—');
    expect(tc.action).toBe('Somente ação');
  });

  it('converte legado description + steps em action', () => {
    const tc = migrateTestCase({
      id: 'leg',
      description: 'Fluxo X',
      steps: ['Abrir app', 'Clicar em OK'],
      expectedResult: 'OK',
      status: 'Not Run',
    });
    expect(tc.action).toContain('Fluxo X');
    expect(tc.action).toContain('1. Abrir app');
    expect(tc.parameters).not.toBe('');
  });

  it('mapeia isAutomated legado para executionKind', () => {
    const auto = migrateTestCase({
      id: 'a',
      description: 'd',
      steps: [],
      isAutomated: true,
      expectedResult: '',
      status: 'Not Run',
    });
    expect(auto.executionKind).toBe('automated');

    const man = migrateTestCase({
      id: 'b',
      description: 'd',
      steps: [],
      isAutomated: false,
      expectedResult: '',
      status: 'Not Run',
    });
    expect(man.executionKind).toBe('manual');
  });

  it('normaliza executionKind a partir de strings em português', () => {
    expect(
      migrateTestCase({
        id: 'x',
        action: 'a',
        parameters: '—',
        executionKind: 'automático',
        expectedResult: '',
        status: 'Not Run',
      }).executionKind
    ).toBe('automated');
  });
});

describe('resolveExecutionKindFromRecord', () => {
  it('normaliza strings e legado isAutomated', () => {
    expect(resolveExecutionKindFromRecord({ executionKind: 'Misto' })).toBe('mixed');
    expect(resolveExecutionKindFromRecord({ executionKind: 'MANUAL' })).toBe('manual');
    expect(resolveExecutionKindFromRecord({ isAutomated: true })).toBe('automated');
    expect(resolveExecutionKindFromRecord({})).toBeUndefined();
  });
});

describe('testCaseLooksAutomated', () => {
  const base = (): TestCase => ({
    id: '1',
    action: 'teste',
    parameters: '—',
    expectedResult: '',
    observedResult: '',
    status: 'Not Run',
  });

  it('obedece executionKind manual', () => {
    expect(testCaseLooksAutomated({ ...base(), executionKind: 'manual' })).toBe(false);
  });

  it('obedece executionKind automated', () => {
    expect(testCaseLooksAutomated({ ...base(), executionKind: 'automated' })).toBe(true);
  });

  it('usa heurística quando executionKind ausente', () => {
    expect(
      testCaseLooksAutomated({
        ...base(),
        parameters: 'Executar com Selenium',
      })
    ).toBe(true);
    expect(testCaseLooksAutomated({ ...base(), action: 'clique manual', parameters: '—' })).toBe(
      false
    );
  });
});

describe('execution kind cycle', () => {
  const base = (): TestCase => ({
    id: '1',
    action: 'teste',
    parameters: '—',
    expectedResult: '',
    observedResult: '',
    status: 'Not Run',
  });

  it('resolveEffectiveExecutionKind usa inferência quando ausente', () => {
    expect(resolveEffectiveExecutionKind({ ...base(), executionKind: 'manual' })).toBe('manual');
    expect(
      resolveEffectiveExecutionKind({
        ...base(),
        parameters: 'Executar com Selenium',
      })
    ).toBe('automated');
  });

  it('getNextExecutionKind alterna manual → automatizado → misto', () => {
    expect(getNextExecutionKind({ ...base(), executionKind: 'manual' })).toBe('automated');
    expect(getNextExecutionKind({ ...base(), executionKind: 'automated' })).toBe('mixed');
    expect(getNextExecutionKind({ ...base(), executionKind: 'mixed' })).toBe('manual');
  });

  it('getExecutionKindBadgeDisplay rotula tipos explícitos e inferidos', () => {
    expect(getExecutionKindBadgeDisplay({ ...base(), executionKind: 'manual' }).label).toBe(
      'Manual'
    );
    expect(getExecutionKindBadgeDisplay({ ...base(), executionKind: 'automated' }).label).toBe(
      'Automatizado'
    );
    expect(
      getExecutionKindBadgeDisplay({ ...base(), parameters: 'Executar com Selenium' }).label
    ).toBe('Automatizado (inferido)');
  });
});

describe('getTestCaseEnvironment / getTestCaseSuite', () => {
  it('prioriza campos estruturados', () => {
    const tc: TestCase = {
      id: '1',
      action: 'a',
      parameters: 'Ambiente: LEGADO\nSuíte: ANTIGA',
      expectedResult: '',
      observedResult: '',
      status: 'Not Run',
      environment: 'HML',
      suite: 'API',
    };
    expect(getTestCaseEnvironment(tc)).toBe('HML');
    expect(getTestCaseSuite(tc)).toBe('API');
  });

  it('faz parse das linhas em parameters quando estruturados vazios', () => {
    const tc: TestCase = {
      id: '2',
      action: 'a',
      parameters: 'Ambiente: QA1\nSuíte: Regressão',
      expectedResult: '',
      observedResult: '',
      status: 'Not Run',
    };
    expect(getTestCaseEnvironment(tc)).toBe('QA1');
    expect(getTestCaseSuite(tc)).toBe('Regressão');
  });
});

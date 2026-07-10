import { describe, it, expect } from 'vitest';
import type { JiraTask } from '../../types';
import {
  generateDevImplementationReport,
  generateDevImplementationExecutiveSummary,
} from '../../utils/devImplementationReportGenerator';

const baseTask: JiraTask = {
  id: 'SIS-188',
  title: 'Validar fluxo de autenticação',
  description: 'Configurar Postman para login em duas etapas.',
  type: 'Tarefa',
  status: 'Done',
  testCases: [],
  devGuidance: {
    overview: 'Validar login e token de acesso.',
    prerequisites: ['Postman instalado'],
    implementationSteps: [
      {
        order: 1,
        title: 'Criar request de login',
        description: 'POST /login com Bearer master token.',
        validationChecklist: ['Status 200', 'Token no body'],
      },
      {
        order: 2,
        title: 'Extrair access token',
        description: 'Salvar token no environment.',
      },
    ],
    suggestedTests: ['Repetir login com credenciais inválidas'],
    cursorAgentMasterPrompt: 'Implemente health check',
  },
  devImplementationRecord: {
    completedAt: '2026-07-10T13:00:00.000Z',
    completedStepOrders: [1, 2],
    notes: 'Validado no Postman com status 200.',
    evidenceLinks: ['https://example.com/pr/42'],
    suggestedTestsResult: 'passed',
  },
};

describe('devImplementationReportGenerator', () => {
  it('gera registro completo em texto', () => {
    const report = generateDevImplementationReport(baseTask, { mode: 'structured' });
    expect(report).toContain('REGISTRO DE IMPLEMENTAÇÃO DEV');
    expect(report).toContain('SIS-188');
    expect(report).toContain('[CONCLUÍDO ✓] Criar request de login');
    expect(report).toContain('Validado no Postman');
    expect(report).toContain('https://example.com/pr/42');
  });

  it('gera resumo executivo e modo PO', () => {
    const summary = generateDevImplementationExecutiveSummary(baseTask, {
      record: baseTask.devImplementationRecord,
    });
    expect(summary).toContain('Resumo executivo');
    expect(summary).toContain('2/2 passo');

    const po = generateDevImplementationReport(baseTask, {
      mode: 'po',
      record: baseTask.devImplementationRecord,
    });
    expect(po).toContain('Entrega de implementação');
  });
});

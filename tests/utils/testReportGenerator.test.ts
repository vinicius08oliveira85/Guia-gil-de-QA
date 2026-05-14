import { describe, expect, it } from 'vitest';
import {
  generateTestExecutiveSummary,
  generateTestReport,
  generateTestResultsOnlyReport,
} from '../../utils/testReportGenerator';
import type { JiraTask } from '../../types';

function buildTask(): JiraTask {
  return {
    id: 'TASK-123',
    title: 'Validar contador de beneficiários',
    description: '',
    status: 'In Progress',
    type: 'Tarefa',
    testCases: [
      {
        id: 'tc-1',
        action:
          '1. Acessar o painel com perfil backoffice.\n2. Importar um CSV com 2.645 beneficiários.\n3. Validar o card total.',
        parameters: 'Usuário: backoffice',
        expectedResult: 'Card exibe a contagem correta de beneficiários após a importação.',
        observedResult: 'Card apresentou 2.645 beneficiários corretamente.',
        status: 'Passed',
      },
      {
        id: 'tc-2',
        action: '1. Executar carga total.\n2. Interromper a integração externa.',
        parameters: 'Ambiente: homolog',
        expectedResult: 'Sistema informa bloqueio temporário da atualização sem perder consistência.',
        observedResult: 'Dependência externa indisponível no momento da validação.',
        status: 'Blocked',
      },
      {
        id: 'tc-3',
        action: 'Executar validação complementar',
        parameters: '',
        expectedResult: 'Sem divergências adicionais.',
        observedResult: '',
        status: 'Not Run',
      },
    ],
    testStrategy: [
      {
        testType: 'Teste funcional',
        description: 'Validação do contador e da carga importada',
        howToExecute: [],
        tools: '',
      },
    ],
  };
}

describe('generateTestReport', () => {
  it('gera texto estruturado simplificado sem passo a passo detalhado', () => {
    const report = generateTestReport(buildTask(), new Date('2026-05-13T14:00:00.000Z'));

    expect(report).toContain('SÍNTESE DA EXECUÇÃO:');
    expect(report).toContain('Bloqueados: 1');
    expect(report).toContain('[APROVADO ✅]');
    expect(report).toContain('[BLOQUEADO ⚠️]');
    expect(report).not.toContain('Parâmetros necessários');
    expect(report).not.toContain('Resultado esperado');
    expect(report).not.toContain('1. Acessar o painel com perfil backoffice');
    expect(report).toContain('Card exibe a contagem correta de beneficiários após a importação.');
    expect(report).not.toContain('Card exibe a contagem correta de beneficiários…');
  });

  it('gera versão resumida focada no resultado final', () => {
    const report = generateTestReport(buildTask(), new Date('2026-05-13T14:00:00.000Z'), {
      concise: true,
      format: 'text',
    });

    expect(report).toContain('Resumo: 1 aprovado(s) | 0 reprovado(s) | 1 bloqueado(s) | 1 não executado(s)');
    expect(report).toContain('- Aprovado ✅: Card exibe a contagem correta de beneficiários após a importação.');
    expect(report).toContain(
      '- Bloqueado ⚠️: Sistema informa bloqueio temporário da atualização sem perder consistência.'
    );
    expect(report).not.toContain('1. Acessar o painel com perfil backoffice');
  });

  it('gera atalho só com resultados executados', () => {
    const report = generateTestResultsOnlyReport(buildTask(), new Date('2026-05-13T14:00:00.000Z'));

    expect(report).toContain('RESULTADOS EXECUTADOS | TASK-123');
    expect(report).toContain(
      '1. Aprovado ✅: Card exibe a contagem correta de beneficiários após a importação.'
    );
    expect(report).toContain(
      '2. Bloqueado ⚠️: Sistema informa bloqueio temporário da atualização sem perder consistência.'
    );
    expect(report).not.toContain('Não executado');
  });

  it('gera resumo executivo com síntese e pontos de atenção', () => {
    const summary = generateTestExecutiveSummary(buildTask(), new Date('2026-05-13T14:00:00.000Z'));

    expect(summary).toContain('Resumo executivo da validação TASK-123');
    expect(summary).toContain('Status consolidado: 1 aprovado(s), 0 reprovado(s), 1 bloqueado(s) e 1 não executado(s).');
    expect(summary).toContain('Pontos de atenção:');
    expect(summary).toContain('Bloqueado: Sistema informa bloqueio temporário da atualização sem perder consistência.');
  });
});

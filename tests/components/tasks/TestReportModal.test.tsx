import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestReportModal } from '../../../components/tasks/TestReportModal';
import type { JiraTask } from '../../../types';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../services/ai/testReportSummaryService', () => ({
  summarizeTestReport: vi.fn(async (text: string) => text),
}));

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
        parameters: '',
        expectedResult: 'Sistema informa bloqueio temporário da atualização sem perder consistência.',
        observedResult: 'Dependência externa indisponível no momento da validação.',
        status: 'Blocked',
      },
    ],
  };
}

describe('TestReportModal', () => {
  it('mantém apenas Texto estruturado e Resumido, com resumo visual colorido por status', async () => {
    render(<TestReportModal isOpen={true} onClose={() => {}} task={buildTask()} />);

    expect(screen.getAllByText('Texto estruturado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Resumido').length).toBeGreaterThan(0);
    expect(screen.queryByText('Markdown')).not.toBeInTheDocument();
    expect(screen.getByText('Aprovados')).toBeInTheDocument();
    expect(screen.getByText('Bloqueados')).toBeInTheDocument();
    expect(screen.getByLabelText('Prévia do relatório de testes')).toBeInTheDocument();
    expect(screen.queryByLabelText('Conteúdo do relatório de testes')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('SÍNTESE DA EXECUÇÃO')).toBeInTheDocument();
      expect(screen.getByText('Bloqueados: 1')).toBeInTheDocument();
      expect(screen.queryByText('1. Acessar o painel com perfil backoffice')).not.toBeInTheDocument();
    });
  });

  it('exibe atalhos de cópia para resumo e resultados', async () => {
    render(<TestReportModal isOpen={true} onClose={() => {}} task={buildTask()} />);

    const copySummaryButton = screen.getByRole('button', { name: 'Copiar resumo executivo' });
    const copyResultsButton = screen.getByRole('button', { name: 'Copiar somente resultados' });

    expect(copySummaryButton).toBeInTheDocument();
    expect(copyResultsButton).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessRulesManager } from '../../../components/project/BusinessRulesManager';
import { createMockProject } from '../../integration/mocks';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('BusinessRulesManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filtra por categoria e ordena por título', async () => {
    const user = userEvent.setup();
    const project = createMockProject({
      businessRules: [
        { id: '1', title: 'Zebra', description: 'd', category: 'Geral', createdAt: '2020-01-03T00:00:00.000Z' },
        { id: '2', title: 'Alpha-seg', description: 'd', category: 'Segurança', createdAt: '2020-01-01T00:00:00.000Z' },
        { id: '3', title: 'Beta-seg', description: 'd', category: 'Segurança', createdAt: '2020-01-02T00:00:00.000Z' },
      ],
    });

    const { container } = render(
      <BusinessRulesManager project={project} onUpdateProject={() => {}} />
    );

    expect(screen.getByText('Zebra')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filtrar por categoria'), 'Segurança');
    expect(screen.queryByText('Zebra')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha-seg')).toBeInTheDocument();
    expect(screen.getByText('Beta-seg')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Ordenar lista de regras'), 'title_asc');
    const summaries = container.querySelectorAll('li > details > summary');
    const texts = [...summaries].map((s) => s.textContent ?? '');
    expect(texts[0]).toContain('Alpha-seg');
    expect(texts[1]).toContain('Beta-seg');
  });

  it('mostra mensagem quando busca não encontra resultados', async () => {
    const user = userEvent.setup();
    const project = createMockProject({
      businessRules: [
        { id: '1', title: 'Só Esta', description: 'x', category: 'Geral', createdAt: '2020-01-01T00:00:00.000Z' },
      ],
    });

    render(<BusinessRulesManager project={project} onUpdateProject={() => {}} />);

    await user.type(screen.getByLabelText('Filtrar regras de negócio'), 'inexistente');
    expect(screen.getByRole('status')).toHaveTextContent(/Nenhuma regra corresponde à busca ou ao filtro de categoria/);
  });
});

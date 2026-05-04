import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project } from '../../../types';
import { render, screen, within } from '@testing-library/react';
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
        {
          id: '1',
          title: 'Zebra',
          description: 'd',
          category: 'Geral',
          createdAt: '2020-01-03T00:00:00.000Z',
        },
        {
          id: '2',
          title: 'Alpha-seg',
          description: 'd',
          category: 'Segurança',
          createdAt: '2020-01-01T00:00:00.000Z',
        },
        {
          id: '3',
          title: 'Beta-seg',
          description: 'd',
          category: 'Segurança',
          createdAt: '2020-01-02T00:00:00.000Z',
        },
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
    const texts = [...summaries].map(s => s.textContent ?? '');
    expect(texts[0]).toContain('Alpha-seg');
    expect(texts[1]).toContain('Beta-seg');
  });

  it('mostra mensagem quando busca não encontra resultados', async () => {
    const user = userEvent.setup();
    const project = createMockProject({
      businessRules: [
        {
          id: '1',
          title: 'Só Esta',
          description: 'x',
          category: 'Geral',
          createdAt: '2020-01-01T00:00:00.000Z',
        },
      ],
    });

    render(<BusinessRulesManager project={project} onUpdateProject={() => {}} />);

    await user.type(screen.getByLabelText('Filtrar regras de negócio'), 'inexistente');
    expect(screen.getByRole('status')).toHaveTextContent(
      /Nenhuma regra corresponde à busca ou ao filtro de categoria/
    );
  });

  it('categoria é um select nativo com opções do projeto', async () => {
    const user = userEvent.setup();
    const project = createMockProject({
      businessRules: [
        {
          id: '1',
          title: 'Regra Um',
          description: 'd',
          category: 'Geral',
          createdAt: '2020-01-01T00:00:00.000Z',
        },
      ],
    });
    render(<BusinessRulesManager project={project} onUpdateProject={() => {}} />);

    await user.click(screen.getByText('Regra Um'));
    await user.click(screen.getByRole('button', { name: /Editar regra Regra Um/i }));

    const catSelect = within(screen.getByRole('dialog')).getByLabelText('Categoria');
    expect(catSelect.tagName).toBe('SELECT');
    await user.selectOptions(catSelect, 'Segurança');
    expect(catSelect).toHaveValue('Segurança');
  });

  it('vincula regra existente pelo dropdown no formulário', async () => {
    const user = userEvent.setup();
    const project = createMockProject({
      businessRules: [
        {
          id: 'a',
          title: 'Alfa',
          description: 'd1',
          category: 'Geral',
          createdAt: '2020-01-01T00:00:00.000Z',
        },
        {
          id: 'b',
          title: 'Beta',
          description: 'd2',
          category: 'Segurança',
          createdAt: '2020-01-02T00:00:00.000Z',
        },
      ],
    });

    render(<BusinessRulesManager project={project} onUpdateProject={() => {}} />);

    await user.click(screen.getByText('Alfa'));
    await user.click(screen.getByRole('button', { name: /Editar regra Alfa/i }));

    await user.selectOptions(
      screen.getByLabelText(/Vincular rapidamente escolhendo uma regra existente na lista/i),
      'b'
    );

    expect((screen.getByLabelText('Descrição') as HTMLTextAreaElement).value).toContain('@Beta');
  });

  it('abre gestão de categorias e adiciona preset ao projeto', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const project = createMockProject({ businessRules: [] });
    render(<BusinessRulesManager project={project} onUpdateProject={onUpdate} />);

    await user.click(
      screen.getByRole('button', { name: /Gerenciar categorias de regras de negócio/i })
    );
    expect(screen.getByText('Gerenciar categorias')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Nova categoria/i), 'MinhaCategoria');
    await user.click(screen.getByRole('button', { name: /^Adicionar$/ }));

    expect(onUpdate).toHaveBeenCalled();
    const updated = onUpdate.mock.calls[0][0] as Project;
    expect(updated.businessRuleCategoryPresets).toContain('MinhaCategoria');
  });
});

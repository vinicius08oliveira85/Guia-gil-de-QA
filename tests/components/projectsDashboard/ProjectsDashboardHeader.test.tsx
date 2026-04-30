import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectsDashboardHeader } from '../../../components/projectsDashboard/ProjectsDashboardHeader';

describe('ProjectsDashboardHeader', () => {
  const baseProps = {
    projectCount: 2,
    sortBy: 'name' as const,
    onSortByChange: vi.fn(),
    lastActivityText: 'há cerca de 1 hora',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('expõe região nomeada pelo título para leitores de tela', () => {
    render(<ProjectsDashboardHeader {...baseProps} />);
    expect(screen.getByRole('region', { name: /Meus Projetos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Meus Projetos/i })).toBeInTheDocument();
  });

  it('agrupa meta do workspace com rótulo acessível', () => {
    render(<ProjectsDashboardHeader {...baseProps} />);
    expect(
      screen.getByRole('group', { name: /Workspace: quantidade de projetos e ordenação da lista/i })
    ).toBeInTheDocument();
  });

  it('exibe ordenação quando há mais de um projeto', () => {
    render(<ProjectsDashboardHeader {...baseProps} projectCount={2} />);
    expect(screen.getByLabelText(/Ordenar projetos por/i)).toBeInTheDocument();
  });

  it('não exibe ordenação com um único projeto', () => {
    render(<ProjectsDashboardHeader {...baseProps} projectCount={1} />);
    expect(screen.queryByLabelText(/Ordenar projetos por/i)).not.toBeInTheDocument();
  });

  it('chama onSortByChange ao alterar o select', async () => {
    const user = userEvent.setup();
    const onSortByChange = vi.fn();
    render(<ProjectsDashboardHeader {...baseProps} onSortByChange={onSortByChange} />);
    await user.selectOptions(screen.getByLabelText(/Ordenar projetos por/i), 'updatedAt');
    expect(onSortByChange).toHaveBeenCalledWith('updatedAt');
  });

  it('exibe última atividade quando informada', () => {
    render(<ProjectsDashboardHeader {...baseProps} lastActivityText="há 2 dias" />);
    expect(screen.getByText(/Última atividade: há 2 dias/i)).toBeInTheDocument();
  });

  it('dispara evento global ao acionar busca', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(window, 'dispatchEvent');
    render(<ProjectsDashboardHeader {...baseProps} />);
    await user.click(screen.getByRole('button', { name: /Abrir busca/i }));
    expect(spy).toHaveBeenCalled();
    const evt = spy.mock.calls.find((c) => c[0] instanceof CustomEvent)?.[0] as CustomEvent | undefined;
    expect(evt?.type).toBe('open-global-search');
    spy.mockRestore();
  });

  it('ordem de foco: busca antes do select', async () => {
    const user = userEvent.setup();
    render(<ProjectsDashboardHeader {...baseProps} />);
    await user.tab();
    expect(screen.getByRole('button', { name: /Abrir busca/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText(/Ordenar projetos por/i)).toHaveFocus();
  });

  it('não renderiza faixa de indicadores quando não há última atividade', () => {
    render(<ProjectsDashboardHeader {...baseProps} lastActivityText={null} />);
    expect(
      screen.queryByRole('group', { name: /Indicadores de atividade do workspace/i })
    ).not.toBeInTheDocument();
  });
});

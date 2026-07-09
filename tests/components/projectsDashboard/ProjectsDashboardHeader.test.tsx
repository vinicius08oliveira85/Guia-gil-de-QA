import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectsDashboardHeader } from '../../../components/projectsDashboard/ProjectsDashboardHeader';

describe('ProjectsDashboardHeader', () => {
  const baseProps = {
    title: 'Projetos QA',
    projectCount: 2,
    lastActivityText: 'há cerca de 1 hora',
    searchQuery: '',
    onSearchQueryChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('expõe região nomeada pelo título para leitores de tela', () => {
    render(<ProjectsDashboardHeader {...baseProps} />);
    expect(screen.getByRole('region', { name: /Projetos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Projetos/i })).toBeInTheDocument();
  });

  it('não exibe ordenação nem botão de novo projeto', () => {
    render(<ProjectsDashboardHeader {...baseProps} />);
    expect(screen.queryByLabelText(/Ordenar projetos por/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Criar novo projeto/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /Ações do workspace/i })).not.toBeInTheDocument();
  });

  it('exibe meta compacta com última atividade', () => {
    render(<ProjectsDashboardHeader {...baseProps} lastActivityText="há 2 dias" />);
    expect(screen.getByText(/2 projetos/i)).toBeInTheDocument();
    expect(screen.getByText(/última atividade há 2 dias/i)).toBeInTheDocument();
  });

  it('dispara evento global ao acionar busca global', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(window, 'dispatchEvent');
    render(<ProjectsDashboardHeader {...baseProps} />);
    await user.click(screen.getByRole('button', { name: /Abrir busca global/i }));
    expect(spy).toHaveBeenCalled();
    const evt = spy.mock.calls.find(c => c[0] instanceof CustomEvent)?.[0] as
      | CustomEvent
      | undefined;
    expect(evt?.type).toBe('open-global-search');
    spy.mockRestore();
  });

  it('filtra projetos pelo campo de busca local', async () => {
    const user = userEvent.setup();
    const onSearchQueryChange = vi.fn();
    render(<ProjectsDashboardHeader {...baseProps} onSearchQueryChange={onSearchQueryChange} />);
    await user.type(screen.getByLabelText(/Filtrar projetos por nome/i), 'abc');
    expect(onSearchQueryChange).toHaveBeenCalled();
  });

  it('não exibe última atividade quando não informada', () => {
    render(<ProjectsDashboardHeader {...baseProps} lastActivityText={null} />);
    expect(screen.queryByText(/última atividade/i)).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceAlertsPanel } from '../../../components/projectsDashboard/WorkspaceAlertsPanel';
import type { Project } from '../../../types';

const p = (id: string, name: string): Project =>
  ({
    id,
    name,
    description: '',
    documents: [],
    businessRules: [],
    tasks: [],
    phases: [],
  }) as Project;

describe('WorkspaceAlertsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não renderiza quando não há alertas', () => {
    const { container } = render(
      <WorkspaceAlertsPanel
        healthProjects={[]}
        testExecutionAlertProjects={[]}
        onSelectProject={vi.fn()}
        listFilterNeedsAttention={false}
        onToggleListFilterNeedsAttention={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('exibe aba Saúde e lista de projetos', () => {
    render(
      <WorkspaceAlertsPanel
        healthProjects={[p('1', 'Alpha')]}
        testExecutionAlertProjects={[]}
        onSelectProject={vi.fn()}
        listFilterNeedsAttention={false}
        onToggleListFilterNeedsAttention={vi.fn()}
      />
    );
    expect(screen.getByRole('tab', { name: /Saúde do workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
  });

  it('alterna filtro da grade ao clicar no botão', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <WorkspaceAlertsPanel
        healthProjects={[p('1', 'Alpha')]}
        testExecutionAlertProjects={[]}
        onSelectProject={vi.fn()}
        listFilterNeedsAttention={false}
        onToggleListFilterNeedsAttention={onToggle}
      />
    );
    await user.click(screen.getByRole('button', { name: /Filtrar grade: só estes projetos/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('troca para aba Execução quando ambas existem', async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceAlertsPanel
        healthProjects={[p('1', 'Alpha')]}
        testExecutionAlertProjects={[p('2', 'Beta')]}
        onSelectProject={vi.fn()}
        listFilterNeedsAttention={false}
        onToggleListFilterNeedsAttention={vi.fn()}
      />
    );
    await user.click(screen.getByRole('tab', { name: /Execução de testes/i }));
    expect(screen.getByRole('button', { name: 'Beta' })).toBeVisible();
  });
});

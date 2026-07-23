import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectDashboard } from '../../../components/dashboard/ProjectDashboard';
import type { JiraTask, Project, TestCase } from '../../../types';

function tc(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: `tc-${Math.random()}`,
    action: 'a',
    parameters: 'p',
    expectedResult: 'e',
    observedResult: '',
    status: 'Passed',
    ...overrides,
  };
}

function bug(overrides: Partial<JiraTask> = {}): JiraTask {
  return {
    id: `BUG-${Math.random()}`,
    type: 'Bug',
    title: 'Bug aberto',
    status: 'Open',
    jiraStatus: 'Open',
    severity: 'Médio',
    tags: ['Auth'],
    testCases: [],
    ...overrides,
  };
}

function project(tasks: JiraTask[]): Project {
  return {
    id: 'p1',
    name: 'Projeto',
    description: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    documents: [],
    businessRules: [],
    phases: [],
    tasks: [
      {
        id: 'TASK-1',
        type: 'Tarefa',
        title: 'Com testes',
        status: 'Open',
        testCases: [tc(), tc({ status: 'Failed' })],
      },
      ...tasks,
    ],
  };
}

describe('ProjectDashboard — drill-down', () => {
  it('dispara severidade ao clicar na linha com contagem', async () => {
    const user = userEvent.setup();
    const onInsightDrillDown = vi.fn();
    render(
      <ProjectDashboard
        project={project([bug({ severity: 'Crítico', tags: ['Auth'] }), bug({ severity: 'Crítico' })])}
        onInsightDrillDown={onInsightDrillDown}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Filtrar bugs abertos com severidade Crítico: 2/i })
    );
    expect(onInsightDrillDown).toHaveBeenCalledWith({ kind: 'severity', value: 'Crítico' });
  });

  it('dispara módulo ao clicar na linha do módulo', async () => {
    const user = userEvent.setup();
    const onInsightDrillDown = vi.fn();
    render(
      <ProjectDashboard
        project={project([bug({ tags: ['Billing'] }), bug({ tags: ['Billing'] })])}
        onInsightDrillDown={onInsightDrillDown}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Filtrar bugs abertos do módulo Billing: 2/i })
    );
    expect(onInsightDrillDown).toHaveBeenCalledWith({ kind: 'module', value: 'Billing' });
  });

  it('não cria botões de drill-down sem callback', () => {
    render(
      <ProjectDashboard project={project([bug({ severity: 'Alto', tags: ['X'] })])} />
    );
    expect(
      screen.queryByRole('button', { name: /Filtrar bugs abertos/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: /Bugs abertos por severidade/i })).toBeInTheDocument();
  });

  it('expõe região principal dos indicadores', () => {
    render(<ProjectDashboard project={project([])} />);
    expect(
      screen.getByRole('region', { name: /Indicadores de qualidade e execução/i })
    ).toBeInTheDocument();
  });
});

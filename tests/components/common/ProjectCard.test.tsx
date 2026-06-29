import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '../../../components/common/ProjectCard';
import type { JiraTask, Project, TestCase } from '../../../types';

function testCase(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: `tc-${Math.random()}`,
    action: 'Executar fluxo',
    parameters: '—',
    expectedResult: 'Fluxo concluído',
    observedResult: '',
    status: 'Passed',
    ...overrides,
  };
}

function task(overrides: Partial<JiraTask> = {}): JiraTask {
  return {
    id: `TASK-${Math.random()}`,
    type: 'Tarefa',
    title: 'Tarefa de QA',
    status: 'Done',
    testCases: [],
    ...overrides,
  };
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    name: 'Portal QA Moderno',
    description: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    documents: [],
    businessRules: [],
    phases: [],
    tasks: [],
    settings: { jiraProjectKey: 'QA' },
    ...overrides,
  };
}

describe('ProjectCard', () => {
  it('renderiza saúde, anel de progresso e métricas modernas', () => {
    render(
      <ProjectCard
        project={project({
          tasks: [
            task({
              id: 'TASK-1',
              status: 'Done',
              jiraStatus: 'Done',
              testCases: [testCase({ status: 'Passed' }), testCase({ status: 'Passed' })],
            }),
            task({ id: 'TASK-2', status: 'To Do' }),
            task({ id: 'BUG-1', type: 'Bug', status: 'In Progress', title: 'Bug aberto' }),
          ],
        })}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /abrir projeto: portal qa moderno/i })).toBeInTheDocument();
    expect(screen.getByText('Jira: QA')).toBeInTheDocument();
    expect(screen.getByText('Atenção')).toBeInTheDocument();
    expect(screen.getByText('1 bug')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /conclusão de tarefas: 33%/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /exec\.: 100%/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /sucesso: 100%/i })).toBeInTheDocument();
  });
});

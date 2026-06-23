import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProjectsDashboard } from '../../components/ProjectsDashboard';
import type { JiraTask, Project } from '../../types';

const baseProject: Project = {
  id: 'p1',
  name: 'Projeto Teste',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
  tasks: [],
  documents: [],
  phases: [],
};

function task(overrides: Partial<JiraTask>): JiraTask {
  return {
    id: 't1',
    type: 'Tarefa',
    title: 'Tarefa',
    status: 'To Do',
    ...overrides,
  };
}

describe('ProjectsDashboard — dados corrompidos', () => {
  it('não quebra com jiraStatus numérico (regressão trim/toLowerCase)', () => {
    const projects: Project[] = [
      {
        ...baseProject,
        tasks: [task({ jiraStatus: 123 as unknown as string })],
      },
    ];

    expect(() =>
      render(
        <ProjectsDashboard
          projects={projects}
          onSelectProject={() => {}}
          onCreateProject={async () => {}}
        />
      )
    ).not.toThrow();
  });

  it('não quebra com categoria de regra numérica', () => {
    const projects: Project[] = [
      {
        ...baseProject,
        businessRules: [
          {
            id: 'br1',
            title: 'Regra',
            description: 'Desc',
            category: 5 as unknown as string,
          },
        ],
      },
    ];

    expect(() =>
      render(
        <ProjectsDashboard
          projects={projects}
          onSelectProject={() => {}}
          onCreateProject={async () => {}}
        />
      )
    ).not.toThrow();
  });

  it('não quebra com environment numérico em caso de teste', () => {
    const projects: Project[] = [
      {
        ...baseProject,
        tasks: [
          task({
            testCases: [
              {
                id: 'tc1',
                action: 'Ação',
                parameters: '—',
                expectedResult: 'OK',
                observedResult: '',
                status: 'Passed',
                environment: 5 as unknown as string,
              },
            ],
          }),
        ],
      },
    ];

    expect(() =>
      render(
        <ProjectsDashboard
          projects={projects}
          onSelectProject={() => {}}
          onCreateProject={async () => {}}
        />
      )
    ).not.toThrow();
  });
});

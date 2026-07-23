import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import type { JiraTask, Project } from '../../types';

function bug(overrides: Partial<JiraTask> = {}): JiraTask {
  return {
    id: `BUG-${Math.random()}`,
    type: 'Bug',
    title: 'Bug',
    status: 'Open',
    jiraStatus: 'Open',
    severity: 'Médio',
    tags: ['Auth'],
    testCases: [],
    ...overrides,
  };
}

function makeProject(tasks: JiraTask[]): Project {
  return {
    id: 'proj-insight',
    name: 'P',
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
        title: 'Task',
        status: 'Open',
        testCases: [],
      },
      ...tasks,
    ],
  };
}

describe('useTaskFilters — insight nav', () => {
  it('aplica filtro de severidade via insightNav', () => {
    const project = makeProject([
      bug({ id: 'B1', severity: 'Crítico', tags: ['Auth'], jiraStatus: 'Open' }),
      bug({ id: 'B2', severity: 'Baixo', tags: ['Auth'], jiraStatus: 'Open' }),
      bug({ id: 'B3', severity: 'Crítico', status: 'Done', jiraStatus: 'Done', tags: ['Auth'] }),
    ]);

    const { result, rerender } = renderHook(
      ({ navKey, nav }) =>
        useTaskFilters(project, { insightNavKey: navKey, insightNav: nav }),
      {
        initialProps: {
          navKey: 0,
          nav: null as { kind: 'severity' | 'module'; value: string } | null,
        },
      }
    );

    act(() => {
      rerender({ navKey: 1, nav: { kind: 'severity', value: 'Crítico' } });
    });

    expect(result.current.typeFilter).toEqual(['Bug']);
    expect(result.current.bugSeverityFilter).toEqual(['Crítico']);
    expect(result.current.filteredTasks.map(t => t.id)).toEqual(['B1']);
  });

  it('aplica filtro de módulo via insightNav', () => {
    const project = makeProject([
      bug({ id: 'B1', tags: ['Billing'], jiraStatus: 'Open' }),
      bug({ id: 'B2', tags: ['Auth'], jiraStatus: 'Open' }),
      bug({ id: 'B3', tags: ['Billing'], status: 'Done', jiraStatus: 'Done' }),
    ]);

    const { result, rerender } = renderHook(
      ({ navKey, nav }) =>
        useTaskFilters(project, { insightNavKey: navKey, insightNav: nav }),
      {
        initialProps: {
          navKey: 0,
          nav: null as { kind: 'severity' | 'module'; value: string } | null,
        },
      }
    );

    act(() => {
      rerender({ navKey: 1, nav: { kind: 'module', value: 'Billing' } });
    });

    expect(result.current.bugModuleFilter).toEqual(['Billing']);
    expect(result.current.filteredTasks.map(t => t.id)).toEqual(['B1']);
  });
});

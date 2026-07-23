import { describe, expect, it } from 'vitest';
import type { JiraTask } from '../../types';
import {
  computeOpenBugsByModule,
  getBugModuleLabel,
  getBugSeverity,
  isOpenBug,
  taskMatchesBugModule,
} from '../../components/dashboard/projectDashboardHelpers';

function bug(overrides: Partial<JiraTask> = {}): JiraTask {
  return {
    id: 'BUG-1',
    type: 'Bug',
    title: 'Falha',
    status: 'Open',
    jiraStatus: 'Open',
    testCases: [],
    ...overrides,
  };
}

describe('projectDashboardHelpers — módulo e severidade', () => {
  it('getBugModuleLabel prioriza tag, depois componente, senão Sem módulo', () => {
    expect(getBugModuleLabel(bug({ tags: ['Auth'] }))).toBe('Auth');
    expect(
      getBugModuleLabel(bug({ tags: [], components: [{ id: '1', name: 'Billing' }] }))
    ).toBe('Billing');
    expect(getBugModuleLabel(bug({ tags: [], components: [] }))).toBe('Sem módulo');
  });

  it('getBugSeverity usa default Médio', () => {
    expect(getBugSeverity(bug({ severity: 'Alto' }))).toBe('Alto');
    expect(getBugSeverity(bug({}))).toBe('Médio');
  });

  it('isOpenBug ignora concluídos e não-bugs', () => {
    expect(isOpenBug(bug({ status: 'Open', jiraStatus: 'Open' }))).toBe(true);
    expect(isOpenBug(bug({ status: 'Done', jiraStatus: 'Done' }))).toBe(false);
    expect(isOpenBug(bug({ type: 'Tarefa', status: 'Open', jiraStatus: 'Open' }))).toBe(false);
  });

  it('computeOpenBugsByModule agrupa só bugs abertos e ordena por volume', () => {
    const rows = computeOpenBugsByModule([
      bug({ id: '1', tags: ['Auth'], status: 'Open', jiraStatus: 'Open' }),
      bug({ id: '2', tags: ['Auth'], status: 'Open', jiraStatus: 'Open' }),
      bug({ id: '3', tags: ['Auth'], status: 'Done', jiraStatus: 'Done' }),
      bug({ id: '4', tags: ['Pay'], status: 'Open', jiraStatus: 'Open' }),
      {
        id: 'T-1',
        type: 'Tarefa',
        title: 'x',
        status: 'Open',
        jiraStatus: 'Open',
        testCases: [],
        tags: ['Auth'],
      },
    ]);
    expect(rows).toEqual([
      { label: 'Auth', count: 2 },
      { label: 'Pay', count: 1 },
    ]);
  });

  it('taskMatchesBugModule compara o label canônico', () => {
    expect(taskMatchesBugModule(bug({ tags: ['Auth'] }), 'Auth')).toBe(true);
    expect(taskMatchesBugModule(bug({ tags: ['Auth'] }), 'Pay')).toBe(false);
  });
});

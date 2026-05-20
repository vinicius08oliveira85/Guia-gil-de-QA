import { describe, it, expect } from 'vitest';
import {
  assignSprintsToTaskSync,
  parseSprintsFromCustomFields,
  parseSprintsFromIssueFields,
  sprintsSnapshotEqual,
} from '../../utils/jiraSprintFields';
import type { JiraSprint, JiraTask } from '../../types';

function task(partial: Partial<JiraTask> & Pick<JiraTask, 'id'>): JiraTask {
  return {
    id: partial.id,
    title: partial.title ?? partial.id,
    description: '',
    status: partial.status ?? 'To Do',
    type: partial.type ?? 'Tarefa',
    testCases: [],
    ...partial,
  };
}

describe('jiraSprintFields', () => {
  it('parseia string GreenHopper do Jira', () => {
    const gh =
      'com.atlassian.greenhopper.service.sprint.Sprint@abc[id=42,rapidViewId=1,state=ACTIVE,name=Sprint+Alpha,startDate=2024-01-01]';
    const t = task({
      id: 'PROJ-1',
      jiraCustomFields: { customfield_10020: gh },
    });
    assignSprintsToTaskSync(t);
    expect(t.sprints).toHaveLength(1);
    expect(t.sprints![0]).toMatchObject({ id: 42, name: 'Sprint Alpha', state: 'active' });
  });

  it('parseia customfield_10020 no formato Jira Cloud (GDPI-443)', () => {
    const t = task({
      id: 'GDPI-443',
      jiraCustomFields: {
        customfield_10020: [
          {
            id: 4009,
            name: 'Sprint 6',
            state: 'active',
            boardId: 780,
            goal: '',
            startDate: '2026-05-20T13:29:01.430Z',
            endDate: '2026-05-29T21:00:00.000Z',
          },
        ],
      },
    });
    assignSprintsToTaskSync(t);
    expect(t.sprints).toHaveLength(1);
    expect(t.sprints![0]).toMatchObject({ id: 4009, name: 'Sprint 6', state: 'active' });
  });

  it('parseia array de objetos estruturados', () => {
    const t = task({
      id: 'PROJ-2',
      jiraCustomFields: {
        Sprint: [
          { id: 10, name: 'Futura', state: 'future' },
          { id: 11, name: 'Atual', state: 'active' },
        ],
      },
    });
    const sprints = parseSprintsFromCustomFields(t);
    expect(sprints).toHaveLength(2);
    expect(sprints.map(s => s.name).sort()).toEqual(['Atual', 'Futura']);
  });

  it('resolve sprint só pelo id usando catálogo Agile', () => {
    const catalog = new Map<number, JiraSprint>([
      [99, { id: 99, name: 'Sprint Catálogo', state: 'active' }],
    ]);
    const sprints = parseSprintsFromIssueFields(
      { customfield_10020: 99 },
      { sprintCatalog: catalog, sprintFieldIds: ['customfield_10020'] }
    );
    expect(sprints[0]?.name).toBe('Sprint Catálogo');
  });

  it('sprintsSnapshotEqual detecta mudança de sprint', () => {
    const a: JiraSprint[] = [{ id: 1, name: 'S1', state: 'active' }];
    const b: JiraSprint[] = [{ id: 2, name: 'S2', state: 'future' }];
    expect(sprintsSnapshotEqual(a, a)).toBe(true);
    expect(sprintsSnapshotEqual(a, b)).toBe(false);
    expect(sprintsSnapshotEqual(undefined, [])).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import {
  resolveTaskDisplaySprint,
  groupBacklogTasksBySprint,
  BACKLOG_UNASSIGNED_SPRINT_LABEL,
  buildBacklogSprintFilterOptions,
  filterTasksByBacklogSprint,
} from '../../utils/taskSprintDisplay';
import { getBacklogTaskComparator } from '../../utils/backlogTasks';
import type { JiraSprint, JiraTask } from '../../types';

function task(partial: Partial<JiraTask> & Pick<JiraTask, 'id' | 'type' | 'status'>): JiraTask {
  return {
    id: partial.id,
    title: partial.title ?? partial.id,
    description: '',
    status: partial.status,
    type: partial.type,
    testCases: [],
    ...partial,
  };
}

const sprint = (partial: Partial<JiraSprint> & Pick<JiraSprint, 'id' | 'name' | 'state'>): JiraSprint =>
  partial as JiraSprint;

describe('taskSprintDisplay', () => {
  it('resolveTaskDisplaySprint prioriza sprint ativa', () => {
    const sprints = [
      sprint({ id: 1, name: 'Futura', state: 'future' }),
      sprint({ id: 2, name: 'Atual', state: 'active' }),
    ];
    expect(resolveTaskDisplaySprint(task({ id: 'A', type: 'Bug', status: 'To Do', sprints }))?.name).toBe(
      'Atual'
    );
  });

  it('groupBacklogTasksBySprint ordena grupos: ativa, futura, sem sprint', () => {
    const tasks = [
      task({
        id: 'T-1',
        type: 'Bug',
        status: 'To Do',
        sprints: [sprint({ id: 10, name: 'Z Futura', state: 'future' })],
      }),
      task({
        id: 'T-2',
        type: 'Bug',
        status: 'To Do',
        sprints: [sprint({ id: 20, name: 'Alpha', state: 'active' })],
      }),
      task({ id: 'T-3', type: 'Bug', status: 'To Do' }),
    ];
    const groups = groupBacklogTasksBySprint(tasks, getBacklogTaskComparator('id'));
    expect(groups.map(g => g.label)).toEqual(['Alpha', 'Z Futura', BACKLOG_UNASSIGNED_SPRINT_LABEL]);
    expect(groups[0].isActive).toBe(true);
    expect(groups[2].tasks.map(t => t.id)).toEqual(['T-3']);
  });

  it('buildBacklogSprintFilterOptions e filterTasksByBacklogSprint', () => {
    const tasks = [
      task({
        id: 'T-1',
        type: 'Bug',
        status: 'To Do',
        sprints: [sprint({ id: 20, name: 'Alpha', state: 'active' })],
      }),
      task({ id: 'T-2', type: 'Bug', status: 'To Do' }),
    ];
    const options = buildBacklogSprintFilterOptions(tasks);
    expect(options.map(o => o.value)).toContain('all');
    expect(options.some(o => o.value === 'sprint:20')).toBe(true);
    const filtered = filterTasksByBacklogSprint(tasks, 'sprint:20');
    expect(filtered.map(t => t.id)).toEqual(['T-1']);
  });
});

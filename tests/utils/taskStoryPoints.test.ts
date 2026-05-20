import { describe, it, expect } from 'vitest';
import type { JiraTask } from '../../types';
import {
  assignStoryPointsToTask,
  parseStoryPointsFromCustomFields,
  resolveTaskStoryPoints,
} from '../../utils/taskStoryPoints';

function makeTask(overrides: Partial<JiraTask> = {}): JiraTask {
  return {
    id: 'QA-1',
    title: 'Tarefa',
    description: 'desc',
    status: 'To Do',
    type: 'Tarefa',
    ...overrides,
  };
}

describe('taskStoryPoints', () => {
  it('resolveTaskStoryPoints prioriza task.storyPoints', () => {
    const task = makeTask({
      storyPoints: 5,
      jiraCustomFields: { 'Story Points': 13 },
    });
    expect(resolveTaskStoryPoints(task)).toBe(5);
  });

  it('parseStoryPointsFromCustomFields lê Story Points e customfield_*', () => {
    expect(
      parseStoryPointsFromCustomFields(
        makeTask({ jiraCustomFields: { 'Story Points': 8 } })
      )
    ).toBe(8);
    expect(
      parseStoryPointsFromCustomFields(
        makeTask({ jiraCustomFields: { customfield_10016: '3,5' } })
      )
    ).toBe(3.5);
  });

  it('assignStoryPointsToTask espelha custom fields em storyPoints', () => {
    const task = makeTask({ jiraCustomFields: { customfield_10016: 13 } });
    assignStoryPointsToTask(task);
    expect(task.storyPoints).toBe(13);
    expect(resolveTaskStoryPoints(task)).toBe(13);
  });
});

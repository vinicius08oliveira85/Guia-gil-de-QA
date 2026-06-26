import { describe, expect, it, vi } from 'vitest';
import type { JiraTask } from '../../types';
import { importFilasRelatedIssues } from '../../services/jira/filasRelatedIssues';

vi.mock('../../services/jira/issues', () => ({
  getJiraIssueByKey: vi.fn(),
}));

vi.mock('../../services/jira/issueToTask', () => ({
  jiraIssueToTask: vi.fn(),
}));

import { getJiraIssueByKey } from '../../services/jira/issues';
import { jiraIssueToTask } from '../../services/jira/issueToTask';

const config = { url: 'https://jira.test', email: 'a@b.com', apiToken: 'token' };

function makeTask(overrides: Partial<JiraTask> = {}): JiraTask {
  return {
    id: 'SUS-1',
    title: 'Principal',
    description: '',
    status: 'To Do',
    type: 'Tarefa',
    testCases: [],
    issueLinks: [{ id: '1', type: 'Blocks', relatedKey: 'SUS-2', direction: 'outward' }],
    ...overrides,
  };
}

describe('importFilasRelatedIssues', () => {
  it('importa tarefa relacionada ausente e vincula como filha da principal', async () => {
    const primary = makeTask();
    vi.mocked(getJiraIssueByKey).mockResolvedValue({ key: 'SUS-2', fields: {} });
    vi.mocked(jiraIssueToTask).mockResolvedValue({
      id: 'SUS-2',
      title: 'Relacionada',
      description: '',
      status: 'To Do',
      type: 'Tarefa',
      testCases: [],
    });

    const result = await importFilasRelatedIssues(config, [primary], {
      primaryTaskIds: new Set(['SUS-1']),
    });

    expect(getJiraIssueByKey).toHaveBeenCalledWith(config, 'SUS-2');
    expect(result).toHaveLength(2);
    const related = result.find(t => t.id === 'SUS-2');
    expect(related?.parentId).toBe('SUS-1');
  });

  it('não reimporta tarefa já presente na fila', async () => {
    const primary = makeTask();
    const existing: JiraTask = {
      id: 'SUS-2',
      title: 'Já importada',
      description: '',
      status: 'To Do',
      type: 'Tarefa',
      testCases: [],
    };

    const result = await importFilasRelatedIssues(config, [primary], {
      existingTasks: [existing],
      primaryTaskIds: new Set(['SUS-1']),
    });

    expect(getJiraIssueByKey).not.toHaveBeenCalled();
    expect(result.find(t => t.id === 'SUS-2')?.parentId).toBe('SUS-1');
  });

  it('não altera parentId de tarefas primárias importadas da fila', async () => {
    const primary = makeTask({
      issueLinks: [{ id: '1', type: 'Blocks', relatedKey: 'SUS-1', direction: 'inward' }],
    });

    const result = await importFilasRelatedIssues(config, [primary], {
      primaryTaskIds: new Set(['SUS-1']),
    });

    expect(result.find(t => t.id === 'SUS-1')?.parentId).toBeUndefined();
    expect(getJiraIssueByKey).not.toHaveBeenCalled();
  });
});

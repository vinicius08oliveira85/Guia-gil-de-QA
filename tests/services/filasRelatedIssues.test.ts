import { describe, expect, it, vi } from 'vitest';
import type { JiraTask } from '../../types';
import { importFilasRelatedIssues } from '../../services/jira/filasRelatedIssues';

vi.mock('../../services/jira/issues', () => ({
  getJiraIssuesByKeysBulk: vi.fn(),
}));

vi.mock('../../services/jira/issueToTask', () => ({
  jiraIssueToTask: vi.fn(),
}));

import { getJiraIssuesByKeysBulk } from '../../services/jira/issues';
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
    vi.mocked(getJiraIssuesByKeysBulk).mockResolvedValue([{ key: 'SUS-2', fields: {} }]);
    vi.mocked(jiraIssueToTask).mockResolvedValue({
      id: 'SUS-2',
      title: 'Relacionada',
      description: '',
      status: 'To Do',
      type: 'Tarefa',
      testCases: [],
    });

    const result = await importFilasRelatedIssues(config, [primary], {
      rootTaskIds: new Set(['SUS-1']),
    });

    expect(getJiraIssuesByKeysBulk).toHaveBeenCalledWith(config, ['SUS-2'], undefined);
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
      rootTaskIds: new Set(['SUS-1']),
    });

    expect(getJiraIssuesByKeysBulk).not.toHaveBeenCalled();
    expect(result.find(t => t.id === 'SUS-2')?.parentId).toBe('SUS-1');
  });

  it('não altera parentId de tarefas raiz importadas por ID', async () => {
    const primary = makeTask({
      issueLinks: [{ id: '1', type: 'Blocks', relatedKey: 'SUS-1', direction: 'inward' }],
    });

    const result = await importFilasRelatedIssues(config, [primary], {
      rootTaskIds: new Set(['SUS-1']),
    });

    expect(result.find(t => t.id === 'SUS-1')?.parentId).toBeUndefined();
    expect(getJiraIssuesByKeysBulk).not.toHaveBeenCalled();
  });

  it('vincula tarefas da mesma importação em lote pelo issue link', async () => {
    const parent: JiraTask = {
      id: 'SUS-1',
      title: 'Principal',
      description: '',
      status: 'To Do',
      type: 'Tarefa',
      testCases: [],
      issueLinks: [{ id: '1', type: 'Blocks', relatedKey: 'SUS-2', direction: 'outward' }],
    };
    const child: JiraTask = {
      id: 'SUS-2',
      title: 'Relacionada na fila',
      description: '',
      status: 'To Do',
      type: 'Tarefa',
      testCases: [],
    };

    const result = await importFilasRelatedIssues(config, [parent, child]);

    expect(getJiraIssuesByKeysBulk).not.toHaveBeenCalled();
    expect(result.find(t => t.id === 'SUS-2')?.parentId).toBe('SUS-1');
  });
});

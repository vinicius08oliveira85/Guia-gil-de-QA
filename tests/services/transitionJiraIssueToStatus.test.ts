import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { JiraConfig } from '../../services/jira/types';

const jiraApiCall = vi.fn();

vi.mock('../../services/jira/api', () => ({
  jiraApiCall: (...args: unknown[]) => jiraApiCall(...args),
}));

import { transitionJiraIssueToStatus } from '../../services/jira/taskSync';

const config: JiraConfig = {
  url: 'https://example.atlassian.net',
  email: 'qa@example.com',
  apiToken: 'token',
};

describe('transitionJiraIssueToStatus', () => {
  beforeEach(() => {
    jiraApiCall.mockReset();
  });

  it('aplica transição cujo destino coincide com o nome do status', async () => {
    jiraApiCall
      .mockResolvedValueOnce({
        transitions: [
          { id: '11', name: 'In Progress', to: { name: 'Em andamento' } },
          { id: '21', name: 'Done', to: { name: 'Concluído' } },
        ],
      })
      .mockResolvedValueOnce(undefined);

    await transitionJiraIssueToStatus(config, 'QA-42', 'Concluído');

    expect(jiraApiCall).toHaveBeenCalledTimes(2);
    expect(jiraApiCall.mock.calls[0][1]).toBe('issue/QA-42/transitions');
    expect(jiraApiCall.mock.calls[1][2]?.method).toBe('POST');
    expect(JSON.parse(jiraApiCall.mock.calls[1][2]?.body as string)).toEqual({
      transition: { id: '21' },
    });
  });

  it('falha com mensagem clara quando não há transição para o status', async () => {
    jiraApiCall.mockResolvedValueOnce({
      transitions: [{ id: '11', name: 'Start', to: { name: 'Em andamento' } }],
    });

    await expect(transitionJiraIssueToStatus(config, 'QA-1', 'Concluído')).rejects.toThrow(
      /Não há transição/
    );
  });
});

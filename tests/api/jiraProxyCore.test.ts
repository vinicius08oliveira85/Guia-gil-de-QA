import { describe, expect, it, vi, afterEach } from 'vitest';
import { executeJiraProxy } from '../../api/jiraProxyCore';

describe('executeJiraProxy', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna 400 quando faltam parâmetros', async () => {
    const result = await executeJiraProxy({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toContain('Missing');
    }
  });

  it('encaminha GET ao Jira e devolve JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accountId: '1', displayName: 'QA' }),
      headers: { get: () => 'application/json' },
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await executeJiraProxy({
      url: 'https://example.atlassian.net',
      email: 'a@b.com',
      apiToken: 'token',
      endpoint: 'myself',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isBinary).toBe(false);
      expect(result.payload).toEqual({ accountId: '1', displayName: 'QA' });
    }
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.atlassian.net/rest/api/3/myself',
      expect.objectContaining({ method: 'GET' })
    );
  });
});

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  executeJiraProxy,
  parseJiraProxyBody,
  type JiraProxyRequestBody,
} from './_jiraProxyCore';

/**
 * Proxy serverless Jira (Vercel).
 * Credenciais (email + API token) vêm no body; não há JIRA_PROXY_AUTH_TOKEN no código atual.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    let body: JiraProxyRequestBody;
    try {
      body = parseJiraProxyBody(req.body);
    } catch (parseErr) {
      const message = parseErr instanceof Error ? parseErr.message : 'Invalid JSON body';
      console.error('[jira-proxy] Body parse error:', message);
      res.status(400).json({ error: message });
      return;
    }

    const result = await executeJiraProxy(body);

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    if (result.isBinary) {
      const buffer = result.payload as Buffer;
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.status(200).send(buffer);
      return;
    }

    res.status(200).json(result.payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jira-proxy] Unhandled error:', message, err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
}

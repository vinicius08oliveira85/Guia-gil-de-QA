import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeJiraProxy, type JiraProxyRequestBody } from './jiraProxyCore';

const AUTH_TOKEN = process.env.JIRA_PROXY_AUTH_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (AUTH_TOKEN) {
      const provided = req.headers['x-proxy-token'];
      if (provided && provided !== AUTH_TOKEN) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
    }

    const result = await executeJiraProxy(req.body as JiraProxyRequestBody);

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
    console.error('[jira-proxy] Unhandled error:', err);
    try {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    } catch {
      console.error('[jira-proxy] Failed to send error response');
    }
  }
}

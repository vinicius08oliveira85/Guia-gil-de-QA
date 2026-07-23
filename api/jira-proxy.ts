import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeJiraProxy, type JiraProxyRequestBody } from './jiraProxyCore';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
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
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jira-proxy] Unhandled error:', message, err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
}

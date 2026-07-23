import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy serverless Jira (Vercel) — arquivo autocontido.
 * Não importe módulos relativos do app: com "type":"module" a Vercel
 * falha com FUNCTION_INVOCATION_FAILED (ERR_MODULE_NOT_FOUND).
 * Lógica espelhada em services/jira/proxyCore.ts (Vite/tests).
 */

interface JiraProxyRequestBody {
  url?: string;
  email?: string;
  apiToken?: string;
  endpoint?: string;
  method?: string;
  body?: unknown;
  isBinary?: boolean;
  apiRoot?: string;
  urlMode?: 'rest' | 'site' | 'atlassian';
  extraHeaders?: Record<string, string>;
}

type JiraProxyResult =
  | {
      ok: true;
      status: number;
      contentType: string;
      payload: unknown;
      isBinary: boolean;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

function parseJiraProxyBody(raw: unknown): JiraProxyRequestBody {
  if (raw == null) {
    return {};
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    return JSON.parse(trimmed) as JiraProxyRequestBody;
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(raw)) {
    const trimmed = raw.toString('utf8').trim();
    if (!trimmed) return {};
    return JSON.parse(trimmed) as JiraProxyRequestBody;
  }
  if (typeof raw === 'object') {
    return raw as JiraProxyRequestBody;
  }
  throw new Error('Invalid request body type');
}

async function executeJiraProxy(
  body: JiraProxyRequestBody | null | undefined
): Promise<JiraProxyResult> {
  if (!body || typeof body !== 'object') {
    return { ok: false, status: 400, error: 'Missing or invalid request body' };
  }

  const {
    url,
    email,
    apiToken,
    endpoint,
    method = 'GET',
    body: requestBody,
    isBinary = false,
    apiRoot = 'api/3',
    urlMode = 'rest',
    extraHeaders = {},
  } = body;

  if (!url || !email || !apiToken || !endpoint) {
    return { ok: false, status: 400, error: 'Missing required parameters' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const isAttachment = endpoint.includes('/secure/attachment/') || isBinary;
    const baseUrl = url.replace(/\/$/, '');
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const jiraUrl = isAttachment
      ? `${baseUrl}/${normalizedEndpoint}`
      : urlMode === 'atlassian'
        ? `https://api.atlassian.com/${normalizedEndpoint}`
        : urlMode === 'site'
          ? `${baseUrl}/${normalizedEndpoint}`
          : `${baseUrl}/rest/${apiRoot}/${normalizedEndpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Basic ${credentials}`,
      ...(extraHeaders && typeof extraHeaders === 'object' ? extraHeaders : {}),
    };

    if (isAttachment) {
      headers.Accept = '*/*';
    } else {
      headers.Accept = 'application/json';
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(jiraUrl, {
      method,
      headers,
      body:
        requestBody && !isAttachment
          ? JSON.stringify(requestBody)
          : (requestBody as BodyInit | undefined),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        status: response.status,
        error: `Jira API Error (${response.status}): ${errorText}`,
      };
    }

    if (isAttachment) {
      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      return {
        ok: true,
        status: 200,
        contentType,
        payload: Buffer.from(arrayBuffer),
        isBinary: true,
      };
    }

    const data: unknown = await response.json();
    return {
      ok: true,
      status: 200,
      contentType: 'application/json',
      payload: data,
      isBinary: false,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        status: 504,
        error: 'Timeout: A requisição ao Jira demorou mais de 60 segundos',
      };
    }

    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}

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

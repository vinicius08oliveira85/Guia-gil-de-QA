import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { executeJiraProxy, type JiraProxyRequestBody } from '../api/jiraProxyCore';

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) {
    return {};
  }
  return JSON.parse(raw) as unknown;
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
}

/**
 * Em `vite` puro (sem `vercel dev` na :3000), atende APIs locais necessárias.
 * - GET /api/manifest — PWA
 * - POST /api/jira-proxy — integração Jira (evita 404/timeout do proxy :3000)
 */
export function devApiMiddlewarePlugin(projectRoot: string): Plugin {
  return {
    name: 'dev-api-middleware',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0] ?? '';

        if (pathname === '/api/manifest' && (req.method === 'GET' || req.method === 'HEAD')) {
          try {
            const file = path.resolve(projectRoot, 'public', 'manifest.json');
            const body = fs.readFileSync(file, 'utf-8');
            JSON.parse(body);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/manifest+json');
            res.setHeader('Cache-Control', 'public, max-age=0');
            res.end(body);
          } catch {
            const fallback: Record<string, unknown> = {
              name: 'QA Agile Guide',
              short_name: 'QA Guide',
              description: 'Ferramenta de gestão de projetos de QA',
              start_url: '/',
              display: 'standalone',
              background_color: '#ffffff',
              theme_color: '#0E6DFD',
              icons: [],
            };
            sendJson(res, 200, fallback);
          }
          return;
        }

        if (pathname === '/api/jira-proxy') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: 'Method not allowed' });
            return;
          }

          void (async () => {
            try {
              let body: JiraProxyRequestBody;
              try {
                body = (await readJsonBody(req)) as JiraProxyRequestBody;
              } catch {
                sendJson(res, 400, { error: 'Invalid JSON body' });
                return;
              }
              const result = await executeJiraProxy(body);

              if (!result.ok) {
                sendJson(res, result.status, { error: result.error });
                return;
              }

              if (result.isBinary) {
                const buffer = result.payload as Buffer;
                res.statusCode = 200;
                res.setHeader('Content-Type', result.contentType);
                res.setHeader('Content-Length', buffer.length.toString());
                res.setHeader('Cache-Control', 'public, max-age=3600');
                res.end(buffer);
                return;
              }

              sendJson(res, 200, result.payload);
            } catch (error) {
              sendJson(res, 500, {
                error: error instanceof Error ? error.message : 'Internal server error',
              });
            }
          })();
          return;
        }

        next();
      });
    },
  };
}

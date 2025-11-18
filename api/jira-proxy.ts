import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Permitir apenas requisições POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { url, email, apiToken, endpoint, method = 'GET', body } = req.body;

  if (!url || !email || !apiToken || !endpoint) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos

  try {
    // Criar credenciais Basic Auth
    const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const jiraUrl = `${url.replace(/\/$/, '')}/rest/api/3/${endpoint}`;

    // Fazer requisição ao Jira com timeout de 60 segundos
    const response = await fetch(jiraUrl, {
      method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ 
        error: `Jira API Error (${response.status}): ${errorText}` 
      });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(504).json({ 
        error: 'Timeout: A requisição ao Jira demorou mais de 60 segundos' 
      });
      return;
    }
    
    console.error('Jira proxy error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

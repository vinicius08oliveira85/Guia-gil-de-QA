import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Permitir apenas requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, email, apiToken, endpoint, method = 'GET', body } = req.body;

  if (!url || !email || !apiToken || !endpoint) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Criar credenciais Basic Auth
    const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const jiraUrl = `${url.replace(/\/$/, '')}/rest/api/3/${endpoint}`;

    // Fazer requisição ao Jira
    const response = await fetch(jiraUrl, {
      method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `Jira API Error (${response.status}): ${errorText}` 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Jira proxy error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}


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

  const { url, email, apiToken, endpoint, method = 'GET', body, isBinary = false } = req.body;

  if (!url || !email || !apiToken || !endpoint) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos

  try {
    // Criar credenciais Basic Auth
    const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
    
    // Se o endpoint contém /secure/attachment/, é uma imagem/anexo binário
    const isAttachment = endpoint.includes('/secure/attachment/') || isBinary;
    
    // Construir URL: se for attachment, usar URL direta; senão, usar REST API
    const jiraUrl = isAttachment 
      ? `${url.replace(/\/$/, '')}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`
      : `${url.replace(/\/$/, '')}/rest/api/3/${endpoint}`;

    // Headers apropriados para binário ou JSON
    const headers: Record<string, string> = {
      'Authorization': `Basic ${credentials}`,
    };

    if (isAttachment) {
      // Para anexos/imagens, aceitar qualquer tipo de mídia
      headers['Accept'] = '*/*';
    } else {
      headers['Accept'] = 'application/json';
      headers['Content-Type'] = 'application/json';
    }

    // Fazer requisição ao Jira com timeout de 60 segundos
    const response = await fetch(jiraUrl, {
      method,
      headers,
      body: body && !isAttachment ? JSON.stringify(body) : body,
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

    // Se for binário (imagem/anexo), retornar blob
    if (isAttachment) {
      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', blob.size.toString());
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache de 1 hora
      
      const buffer = await blob.arrayBuffer();
      res.status(200).send(Buffer.from(buffer));
      return;
    }

    // Caso contrário, retornar JSON
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

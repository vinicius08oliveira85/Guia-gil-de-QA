// Adaptação do jira-proxy para Netlify Functions
// Versão JavaScript para compatibilidade

exports.handler = async (event, context) => {
  // Permitir apenas requisições POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { url, email, apiToken, endpoint, method = 'GET', body } = JSON.parse(event.body || '{}');

  if (!url || !email || !apiToken || !endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' })
    };
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
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: `Jira API Error (${response.status}): ${errorText}` 
        })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        statusCode: 504,
        body: JSON.stringify({ 
          error: 'Timeout: A requisição ao Jira demorou mais de 60 segundos' 
        })
      };
    }
    
    console.error('Jira proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      })
    };
  }
};


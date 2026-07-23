const AUTH_TOKEN = import.meta.env.VITE_PROXY_AUTH_TOKEN;

/**
 * Headers padrão para requisições ao proxy Jira.
 * Inclui token de autenticação quando configurado via VITE_PROXY_AUTH_TOKEN.
 */
export function getJiraProxyHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) {
    headers['X-Proxy-Token'] = AUTH_TOKEN;
  }
  return headers;
}

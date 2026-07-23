/**
 * Detecta erros de permissão/autorização retornados pelo Jira (ou pelo proxy).
 */
export function isJiraPermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('403') ||
    msg.includes('401') ||
    msg.includes('forbidden') ||
    msg.includes('unauthorized') ||
    msg.includes('não tem permissão') ||
    msg.includes('nao tem permissao') ||
    msg.includes('permission')
  );
}

/**
 * Mensagem amigável para 401/403 do Jira — evita dump JSON cru na UI.
 */
export function formatJiraPermissionError(
  error: unknown,
  context = 'esta operação no Jira'
): Error {
  const detail =
    error instanceof Error
      ? error.message.replace(/^Jira API Error \(\d+\):\s*/i, '').slice(0, 180)
      : String(error);

  return new Error(
    `Sem permissão para ${context}. Verifique se o e-mail/token tem acesso de agente (Service Desk), ` +
      `Browse Projects e Browse Issues no projeto. Detalhe: ${detail}`
  );
}

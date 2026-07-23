import { logger } from './logger';

/**
 * Detalhe de erro por issue durante sincronização Jira.
 * Permite reportar falhas individuais sem abortar todo o sync.
 */
export interface SyncErrorDetail {
  issueKey: string;
  reason: string;
  statusCode?: number;
  recoverable: boolean;
}

/**
 * Resultado da sincronização com capacidade de reportar erros granulares.
 */
export interface SyncResult<T> {
  data: T;
  errors: SyncErrorDetail[];
  totalProcessed: number;
  totalErrors: number;
}

/**
 * Cria um SyncResult vazio (sem erros).
 */
export function successResult<T>(data: T, totalProcessed?: number): SyncResult<T> {
  return {
    data,
    errors: [],
    totalProcessed: totalProcessed ?? 0,
    totalErrors: 0,
  };
}

/**
 * Adiciona um erro ao SyncResult e loga.
 */
export function addSyncError<T>(
  result: SyncResult<T>,
  issueKey: string,
  error: unknown,
  recoverable = true
): void {
  const reason =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Erro desconhecido';

  const statusCodeMatch = reason.match(/(\d{3})/);
  const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1], 10) : undefined;

  result.errors.push({ issueKey, reason, statusCode, recoverable });
  result.totalErrors++;

  logger.warn(`Erro ao processar issue ${issueKey}: ${reason}`, 'syncErrorDetail', {
    statusCode,
    recoverable,
  });
}

/**
 * Retorna um resumo legível dos erros de sincronização.
 */
export function formatSyncErrors(errors: SyncErrorDetail[]): string {
  if (errors.length === 0) return '';

  const byStatusCode: Record<string, SyncErrorDetail[]> = {};
  errors.forEach(err => {
    const key = err.statusCode ? `${err.statusCode}` : 'unknown';
    if (!byStatusCode[key]) byStatusCode[key] = [];
    byStatusCode[key].push(err);
  });

  const parts: string[] = [];
  Object.entries(byStatusCode).forEach(([code, items]) => {
    const keys = items.slice(0, 5).map(e => e.issueKey).join(', ');
    const suffix = items.length > 5 ? ` e mais ${items.length - 5}` : '';
    parts.push(`${code === 'unknown' ? 'Erros' : `HTTP ${code}`} (${items.length}): ${keys}${suffix}`);
  });

  return parts.join('; ');
}

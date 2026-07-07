import { getJiraConfig } from '../jiraService';
import { isJiraAutoSyncRunning } from './jiraAutoSync';
import { syncFilasQueuesFromJira, type FilasQueueSyncResult } from './filasQueueSync';

/** Motivos pelos quais a sincronização de Filas pode ser ignorada (sem erro). */
export type FilasSyncSkipReason = 'no-config' | 'auto-sync-running' | 'no-selection';

/** Resultado discriminado da tentativa de sincronizar as Filas com o Jira. */
export type FilasSyncOutcome =
  | { status: 'success'; result: FilasQueueSyncResult }
  | { status: 'skipped'; reason: FilasSyncSkipReason }
  | { status: 'error'; error: unknown };

/**
 * Orquestra a sincronização das Filas (Jira) a partir da seleção persistida.
 *
 * Centraliza os guards (Jira configurado, sync automático em andamento) e o
 * tratamento de resultado nulo, retornando um resultado discriminado para que
 * cada chamador cuide de mensagens/estado de UI como preferir. Não lança: erros
 * são encapsulados em `{ status: 'error' }`.
 *
 * @param onProgress - Callback opcional de progresso (atual, total).
 */
export async function runFilasSelectionSync(
  onProgress?: (current: number, total?: number) => void
): Promise<FilasSyncOutcome> {
  if (!getJiraConfig()) return { status: 'skipped', reason: 'no-config' };
  if (isJiraAutoSyncRunning()) return { status: 'skipped', reason: 'auto-sync-running' };

  try {
    const result = await syncFilasQueuesFromJira(onProgress);
    if (!result) return { status: 'skipped', reason: 'no-selection' };
    return { status: 'success', result };
  } catch (error) {
    return { status: 'error', error };
  }
}

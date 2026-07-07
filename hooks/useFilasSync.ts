import { useCallback, useState } from 'react';
import { useErrorHandler } from './useErrorHandler';
import {
  runFilasSelectionSync,
  type FilasSyncOutcome,
  type FilasSyncSkipReason,
} from '../services/jira/filasSyncRunner';
import type { FilasQueueSyncResult } from '../services/jira/filasQueueSync';

export interface FilasSyncProgress {
  current: number;
  total?: number;
}

const DEFAULT_WARNING_MESSAGES: Record<FilasSyncSkipReason, string> = {
  'no-config': 'Configure o Jira em Configurações antes de atualizar.',
  'auto-sync-running': 'Aguarde a sincronização automática em andamento.',
  'no-selection': 'Nenhuma fila selecionada em Acompanhamento para atualizar.',
};

function defaultSuccessMessage(result: FilasQueueSyncResult): string {
  return result.tasks.length === 1
    ? '1 tarefa atualizada do Jira.'
    : `${result.tasks.length} tarefas atualizadas do Jira.`;
}

export interface UseFilasSyncOptions {
  /** Contexto usado no log de erro (default: "Atualizar tarefas do Jira"). */
  errorContext?: string;
  /** Gera a mensagem de sucesso a partir do resultado. */
  buildSuccessMessage?: (result: FilasQueueSyncResult) => string;
  /** Sobrescreve mensagens de aviso por motivo de "skip". */
  warningMessages?: Partial<Record<FilasSyncSkipReason, string>>;
  /** Executado após sincronização bem-sucedida (ex.: recarregar snapshot). */
  onSuccess?: (result: FilasQueueSyncResult) => void;
  /** Callback de progresso externo (além do estado interno do hook). */
  onProgress?: (current: number, total?: number) => void;
}

export interface UseFilasSyncState {
  isSyncing: boolean;
  progress: FilasSyncProgress | null;
  /** Dispara a sincronização, exibindo toasts, e retorna o resultado discriminado. */
  sync: () => Promise<FilasSyncOutcome>;
}

/**
 * Encapsula o fluxo de sincronização das Filas (Jira) com estado de carregamento,
 * progresso e notificações. Reaproveita `runFilasSelectionSync` para manter a
 * lógica centralizada e evitar duplicação entre a home e o painel de Filas.
 */
export function useFilasSync(options: UseFilasSyncOptions = {}): UseFilasSyncState {
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<FilasSyncProgress | null>(null);

  const { errorContext, buildSuccessMessage, warningMessages, onSuccess, onProgress } = options;

  const sync = useCallback(async (): Promise<FilasSyncOutcome> => {
    if (isSyncing) return { status: 'skipped', reason: 'auto-sync-running' };

    setIsSyncing(true);
    setProgress({ current: 0 });
    try {
      const outcome = await runFilasSelectionSync((current, total) => {
        setProgress({ current, total });
        onProgress?.(current, total);
      });

      if (outcome.status === 'skipped') {
        handleWarning(warningMessages?.[outcome.reason] ?? DEFAULT_WARNING_MESSAGES[outcome.reason]);
      } else if (outcome.status === 'error') {
        handleError(outcome.error, errorContext ?? 'Atualizar tarefas do Jira');
      } else {
        onSuccess?.(outcome.result);
        handleSuccess(
          (buildSuccessMessage ?? defaultSuccessMessage)(outcome.result)
        );
      }

      return outcome;
    } finally {
      setIsSyncing(false);
      setProgress(null);
    }
  }, [
    isSyncing,
    errorContext,
    buildSuccessMessage,
    warningMessages,
    onSuccess,
    onProgress,
    handleError,
    handleSuccess,
    handleWarning,
  ]);

  return { isSyncing, progress, sync };
}

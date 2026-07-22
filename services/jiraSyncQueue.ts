import { logger } from '../utils/logger';

type SyncTask<T> = () => Promise<T>;

interface QueuedItem<T> {
  id: string;
  task: SyncTask<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

const LOG_SCOPE = 'jiraSyncQueue';

/**
 * Fila serial de sincronização Jira (singleton).
 *
 * - Deduplicação por `id`: nova solicitação substitui a pendente com o mesmo id.
 * - Apenas uma sync executa por vez.
 * - Compartilhada entre useJiraSync, useJiraBugs e jiraAutoSync.
 */
class JiraSyncQueueService {
  private queue: Array<QueuedItem<unknown>> = [];
  private processing = false;

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    if (this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;

      try {
        logger.debug(`Executando sync da fila: ${item.id}`, LOG_SCOPE);
        const result = await item.task();
        item.resolve(result);
      } catch (error) {
        logger.error(`Sync falhou na fila: ${item.id}`, LOG_SCOPE, error);
        item.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Enfileira uma sync. Se já houver item com o mesmo `id`, substitui e rejeita o anterior.
   */
  enqueue<T>(id: string, task: SyncTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const existingIndex = this.queue.findIndex(item => item.id === id);
      if (existingIndex >= 0) {
        logger.debug(`Substituindo sync existente na fila: ${id}`, LOG_SCOPE);
        const existing = this.queue[existingIndex] as unknown as QueuedItem<T>;
        existing.reject(new Error('Substituído por nova solicitação de sync'));
        this.queue.splice(existingIndex, 1);
      }

      this.queue.push({ id, task, resolve, reject } as QueuedItem<unknown>);
      logger.debug(`Sync enfileirada: ${id}. Fila: ${this.queue.length}`, LOG_SCOPE);

      if (!this.processing) {
        void this.processQueue();
      }
    });
  }

  /** Cancela itens pendentes (não interrompe a sync em execução). */
  clearQueue(): void {
    const remaining = [...this.queue];
    this.queue = [];
    remaining.forEach(item => {
      item.reject(new Error('Fila de sync cancelada'));
    });
    logger.debug(`Fila de sync limpa: ${remaining.length} tarefa(s) cancelada(s)`, LOG_SCOPE);
  }

  get queueSize(): number {
    return this.queue.length;
  }

  get isProcessing(): boolean {
    return this.processing;
  }
}

/** Instância única usada em toda a aplicação. */
export const jiraSyncQueue = new JiraSyncQueueService();

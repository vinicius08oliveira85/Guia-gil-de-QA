import { logger } from '../utils/logger';

type SyncTask<T> = () => Promise<T>;

interface QueuedItem<T> {
  id: string;
  /** Grupo de paralelismo: projetos diferentes executam em paralelo, mesmo grupo é serial. */
  group: string;
  priority: 'high' | 'low';
  task: SyncTask<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  enqueuedAt: number;
}

const LOG_SCOPE = 'jiraSyncQueue';
const MAX_CONCURRENT_GROUPS = 3;

/**
 * Fila de sincronização Jira com prioridades e paralelismo seletivo (singleton).
 *
 * - Prioridade: `high` (usuário) sempre antes de `low` (auto-sync).
 * - Paralelismo: até `MAX_CONCURRENT_GROUPS` grupos diferentes executam em paralelo.
 * - Deduplicação por `id` dentro do mesmo grupo.
 */
class JiraSyncQueueService {
  private queue: Array<QueuedItem<unknown>> = [];
  /** IDs ativos no executor, chaveados por group. */
  private active = new Map<string, { itemId: string }>();

  private canStart(item: QueuedItem<unknown>): boolean {
    if (this.active.size >= MAX_CONCURRENT_GROUPS) return false;
    if (this.active.has(item.group)) return false;
    return true;
  }

  private async processQueue(): Promise<void> {
    // Ordenar: high priority first, then by enqueue time
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
      return a.enqueuedAt - b.enqueuedAt;
    });

    const toStart: Array<QueuedItem<unknown>> = [];
    const remaining: Array<QueuedItem<unknown>> = [];

    for (const item of this.queue) {
      if (toStart.length + this.active.size >= MAX_CONCURRENT_GROUPS) {
        remaining.push(item);
      } else if (this.canStart(item)) {
        toStart.push(item);
      } else {
        remaining.push(item);
      }
    }

    this.queue = remaining;

    for (const item of toStart) {
      this.executeItem(item);
    }
  }

  private async executeItem(item: QueuedItem<unknown>): Promise<void> {
    this.active.set(item.group, { itemId: item.id });

    try {
      logger.debug(
        `Executando sync: ${item.id} (grupo: ${item.group}, prioridade: ${item.priority})`,
        LOG_SCOPE
      );
      const result = await item.task();
      item.resolve(result);
    } catch (error) {
      logger.error(`Sync falhou: ${item.id}`, LOG_SCOPE, error);
      item.reject(error);
    } finally {
      this.active.delete(item.group);
      void this.processQueue();
    }
  }

  enqueue<T>(
    id: string,
    task: SyncTask<T>,
    options?: { group?: string; priority?: 'high' | 'low' }
  ): Promise<T> {
    const group = options?.group ?? id;
    const priority = options?.priority ?? 'low';

    return new Promise<T>((resolve, reject) => {
      // Deduplicação por id dentro do mesmo grupo (fila + ativos)
      const activeEntry = this.active.get(group);
      if (activeEntry && activeEntry.itemId === id) {
        logger.debug(`Sync já em execução: ${id}, ignorando duplicata`, LOG_SCOPE);
        return reject(new Error('Substituído por nova solicitação de sync'));
      }
      const existingIndex = this.queue.findIndex(
        item => item.id === id && item.group === group
      );
      if (existingIndex >= 0) {
        logger.debug(`Substituindo sync existente: ${id}`, LOG_SCOPE);
        const existing = this.queue[existingIndex] as unknown as QueuedItem<T>;
        existing.reject(new Error('Substituído por nova solicitação de sync'));
        this.queue.splice(existingIndex, 1);
      }

      this.queue.push({
        id,
        group,
        priority,
        task,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      } as QueuedItem<unknown>);

      logger.debug(
        `Sync enfileirada: ${id} (grupo: ${group}, prioridade: ${priority}). Fila: ${this.queue.length}, ativos: ${this.active.size}`,
        LOG_SCOPE
      );

      void this.processQueue();
    });
  }

  clearQueue(): void {
    const remaining = [...this.queue];
    this.queue = [];
    remaining.forEach(item => {
      item.reject(new Error('Fila de sync cancelada'));
    });
    logger.debug(
      `Fila limpa: ${remaining.length} sync(s) cancelada(s)`,
      LOG_SCOPE
    );
  }

  get queueSize(): number {
    return this.queue.length;
  }

  get isProcessing(): boolean {
    return this.active.size > 0;
  }

  get activeGroups(): number {
    return this.active.size;
  }
}

export const jiraSyncQueue = new JiraSyncQueueService();

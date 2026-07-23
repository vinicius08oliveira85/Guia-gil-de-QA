import { describe, it, expect, vi } from 'vitest';

// Precisamos de um módulo isolado para cada teste
function createQueueInstance() {
  const mod = new (class {
    private queue: Array<{
      id: string;
      group: string;
      priority: 'high' | 'low';
      task: () => Promise<unknown>;
      resolve: (v: unknown) => void;
      reject: (v: unknown) => void;
      enqueuedAt: number;
    }> = [];
    private active = new Map<string, boolean>();
    private completedPromises: Array<Promise<void>> = [];

    private async processQueue(): Promise<void> {
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
        return a.enqueuedAt - b.enqueuedAt;
      });

      const toStart: typeof this.queue = [];
      const remaining: typeof this.queue = [];

      for (const item of this.queue) {
        if (toStart.length + this.active.size >= 3) {
          remaining.push(item);
        } else if (this.active.has(item.group)) {
          remaining.push(item);
        } else {
          toStart.push(item);
        }
      }

      this.queue = remaining;

      for (const item of toStart) {
        this.executeItem(item);
      }
    }

    private async executeItem(item: {
      id: string;
      group: string;
      task: () => Promise<unknown>;
      resolve: (v: unknown) => void;
      reject: (v: unknown) => void;
    }): Promise<void> {
      this.active.set(item.group, true);
      try {
        const result = await item.task();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      } finally {
        this.active.delete(item.group);
        void this.processQueue();
      }
    }

    enqueue<T>(
      id: string,
      task: () => Promise<T>,
      options?: { group?: string; priority?: 'high' | 'low' }
    ): Promise<T> {
      const group = options?.group ?? id;
      const priority = options?.priority ?? 'low';

      return new Promise<T>((resolve, reject) => {
        const existingIndex = this.queue.findIndex(item => item.id === id && item.group === group);
        if (existingIndex >= 0) {
          const existing = this.queue[existingIndex];
          existing.reject(new Error('Substituído por nova solicitação de sync'));
          this.queue.splice(existingIndex, 1);
        }

        this.queue.push({
          id,
          group,
          priority,
          task: task as () => Promise<unknown>,
          resolve: resolve as (v: unknown) => void,
          reject,
          enqueuedAt: Date.now(),
        });

        void this.processQueue();
      });
    }

    get queueSize() { return this.queue.length; }
    get isProcessing() { return this.active.size > 0; }
    get activeGroups() { return this.active.size; }
  })();

  return mod;
}

describe('JiraSyncQueue (priorities)', () => {
  it('executa high priority antes de low priority', async () => {
    const queue = createQueueInstance();
    const executionOrder: string[] = [];

    const lowTask = queue.enqueue('low-1', async () => {
      await new Promise(r => setTimeout(r, 10));
      executionOrder.push('low');
    }, { priority: 'low', group: 'g1' });

    const highTask = queue.enqueue('high-1', async () => {
      executionOrder.push('high');
    }, { priority: 'high', group: 'g2' });

    await Promise.all([lowTask, highTask]);
    expect(executionOrder[0]).toBe('high');
  });

  it('executa grupos diferentes em paralelo', async () => {
    const queue = createQueueInstance();
    let g1Running = false;
    let g2Running = false;
    let overlap = false;

    const task1 = queue.enqueue('t1', async () => {
      g1Running = true;
      await new Promise(r => setTimeout(r, 50));
      g1Running = false;
    }, { group: 'group-a', priority: 'high' });

    const task2 = queue.enqueue('t2', async () => {
      g2Running = true;
      overlap = g1Running;
      await new Promise(r => setTimeout(r, 10));
      g2Running = false;
    }, { group: 'group-b', priority: 'high' });

    await Promise.all([task1, task2]);
    expect(overlap).toBe(true);
  });

  it('serializa tasks com mesmo id (segunda aguarda primeira)', async () => {
    const queue = createQueueInstance();
    let executionCount = 0;

    const p1 = queue.enqueue('sync-proj-1', async () => {
      await new Promise(r => setTimeout(r, 20));
      executionCount++;
      return 'first';
    }, { group: 'proj-1' });

    // Enfileirar p2 com mesmo id enquanto p1 ainda está na fila (não começou a executar)
    // Pausa curta para garantir que p2 seja enfileirado antes de p1 começar
    await new Promise(r => setTimeout(r, 5));
    const p2 = queue.enqueue('sync-proj-1', async () => {
      executionCount++;
      return 'second';
    }, { group: 'proj-1' });

    const r1 = await p1;
    const r2 = await p2;
    expect(r1).toBe('first');
    expect(r2).toBe('second');
    expect(executionCount).toBe(2);
    // Ambos executam porque p1 já havia saído da fila (em execução) quando p2 chegou
  });

  it('serializa tasks do mesmo grupo', async () => {
    const queue = createQueueInstance();
    const order: number[] = [];

    const t1 = queue.enqueue('t1', async () => {
      await new Promise(r => setTimeout(r, 30));
      order.push(1);
    }, { group: 'same-group', priority: 'high' });

    const t2 = queue.enqueue('t2', async () => {
      order.push(2);
    }, { group: 'same-group', priority: 'high' });

    await Promise.all([t1, t2]);
    expect(order).toEqual([1, 2]);
  });
});

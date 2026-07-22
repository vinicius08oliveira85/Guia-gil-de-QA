import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jiraSyncQueue } from '../../services/jiraSyncQueue';

vi.mock('../../utils/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

describe('jiraSyncQueue', () => {
  beforeEach(() => {
    jiraSyncQueue.clearQueue();
  });

  it('inicializa com fila vazia e sem processamento após clear', () => {
    expect(jiraSyncQueue.queueSize).toBe(0);
    expect(jiraSyncQueue.isProcessing).toBe(false);
  });

  it('executa uma tarefa na fila e resolve', async () => {
    const task = vi.fn().mockResolvedValue('ok');
    await expect(jiraSyncQueue.enqueue('test-1', task)).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('rejeita quando a tarefa lança erro', async () => {
    const error = new Error('Falha na tarefa');
    const task = vi.fn().mockRejectedValue(error);
    await expect(jiraSyncQueue.enqueue('test-2', task)).rejects.toThrow('Falha na tarefa');
  });

  it('deduplica tarefas com mesmo id (substitui a pendente)', async () => {
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>(resolve => {
      releaseFirst = resolve;
    });

    const task1 = vi.fn().mockImplementation(async () => {
      await firstGate;
      return 'primeira';
    });
    const task2 = vi.fn().mockResolvedValue('segunda');

    // Inicia processamento de task1 (fica bloqueada no gate)
    const p1 = jiraSyncQueue.enqueue('run-first', task1);
    await new Promise(r => setTimeout(r, 10));

    // Enquanto task1 roda, duas com mesmo id: a segunda substitui a primeira pendente
    const pPending1 = jiraSyncQueue.enqueue('same-id', vi.fn().mockResolvedValue('a'));
    const pPending2 = jiraSyncQueue.enqueue('same-id', task2);

    await expect(pPending1).rejects.toThrow('Substituído por nova solicitação de sync');

    releaseFirst?.();
    await expect(p1).resolves.toBe('primeira');
    await expect(pPending2).resolves.toBe('segunda');
    expect(task2).toHaveBeenCalled();
  });

  it('executa tarefas em série', async () => {
    const order: number[] = [];
    const task1 = vi.fn().mockImplementation(async () => {
      order.push(1);
    });
    const task2 = vi.fn().mockImplementation(async () => {
      order.push(2);
    });

    await Promise.all([
      jiraSyncQueue.enqueue('a', task1),
      jiraSyncQueue.enqueue('b', task2),
    ]);

    expect(order).toEqual([1, 2]);
  });

  it('clearQueue rejeita tarefas pendentes', async () => {
    const task1 = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('done'), 200))
    );
    const task2 = vi.fn().mockResolvedValue('nunca executa');

    void jiraSyncQueue.enqueue('blocking', task1);
    const promise2 = jiraSyncQueue.enqueue('canceled', task2);

    await new Promise(r => setTimeout(r, 30));
    jiraSyncQueue.clearQueue();

    await expect(promise2).rejects.toThrow('Fila de sync cancelada');
  });
});

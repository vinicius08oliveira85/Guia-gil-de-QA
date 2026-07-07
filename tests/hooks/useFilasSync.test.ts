import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilasSync } from '../../hooks/useFilasSync';

const { handleError, handleSuccess, handleWarning } = vi.hoisted(() => ({
  handleError: vi.fn(),
  handleSuccess: vi.fn(),
  handleWarning: vi.fn(),
}));

vi.mock('../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({ handleError, handleSuccess, handleWarning, handleInfo: vi.fn() }),
}));

vi.mock('../../services/jira/filasSyncRunner', () => ({
  runFilasSelectionSync: vi.fn(),
}));

import { runFilasSelectionSync } from '../../services/jira/filasSyncRunner';
import type { FilasQueueSyncResult } from '../../services/jira/filasQueueSync';

const runMock = vi.mocked(runFilasSelectionSync);

function makeResult(taskCount: number, queueCount = 1): FilasQueueSyncResult {
  return {
    tasks: Array.from({ length: taskCount }, (_, i) => ({ id: `SUS-${i + 1}` })),
    queueCount,
  } as FilasQueueSyncResult;
}

describe('useFilasSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('em sucesso: chama onSuccess, notifica e devolve o resultado', async () => {
    const result = makeResult(2);
    runMock.mockResolvedValue({ status: 'success', result });
    const onSuccess = vi.fn();

    const { result: hook } = renderHook(() => useFilasSync({ onSuccess }));
    let outcome;
    await act(async () => {
      outcome = await hook.current.sync();
    });

    expect(outcome).toEqual({ status: 'success', result });
    expect(onSuccess).toHaveBeenCalledWith(result);
    expect(handleSuccess).toHaveBeenCalledWith('2 tarefas atualizadas do Jira.');
    expect(hook.current.isSyncing).toBe(false);
  });

  it('usa singular na mensagem padrão quando há apenas 1 tarefa', async () => {
    runMock.mockResolvedValue({ status: 'success', result: makeResult(1) });

    const { result: hook } = renderHook(() => useFilasSync());
    await act(async () => {
      await hook.current.sync();
    });

    expect(handleSuccess).toHaveBeenCalledWith('1 tarefa atualizada do Jira.');
  });

  it('respeita buildSuccessMessage personalizado', async () => {
    const result = makeResult(3, 2);
    runMock.mockResolvedValue({ status: 'success', result });

    const { result: hook } = renderHook(() =>
      useFilasSync({ buildSuccessMessage: r => `Sincronizadas ${r.queueCount} filas` })
    );
    await act(async () => {
      await hook.current.sync();
    });

    expect(handleSuccess).toHaveBeenCalledWith('Sincronizadas 2 filas');
  });

  it('em skip: exibe a mensagem de aviso padrão do motivo', async () => {
    runMock.mockResolvedValue({ status: 'skipped', reason: 'no-config' });

    const { result: hook } = renderHook(() => useFilasSync());
    await act(async () => {
      await hook.current.sync();
    });

    expect(handleWarning).toHaveBeenCalledWith(
      'Configure o Jira em Configurações antes de atualizar.'
    );
    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it('em skip: permite sobrescrever a mensagem de aviso por motivo', async () => {
    runMock.mockResolvedValue({ status: 'skipped', reason: 'no-selection' });

    const { result: hook } = renderHook(() =>
      useFilasSync({ warningMessages: { 'no-selection': 'Nada selecionado aqui.' } })
    );
    await act(async () => {
      await hook.current.sync();
    });

    expect(handleWarning).toHaveBeenCalledWith('Nada selecionado aqui.');
  });

  it('em erro: encaminha para handleError com o contexto informado', async () => {
    const error = new Error('boom');
    runMock.mockResolvedValue({ status: 'error', error });

    const { result: hook } = renderHook(() =>
      useFilasSync({ errorContext: 'Contexto custom' })
    );
    await act(async () => {
      await hook.current.sync();
    });

    expect(handleError).toHaveBeenCalledWith(error, 'Contexto custom');
  });

  it('alterna isSyncing durante a sincronização', async () => {
    let resolveRun: (value: { status: 'skipped'; reason: 'no-selection' }) => void = () => {};
    runMock.mockReturnValue(
      new Promise(resolve => {
        resolveRun = resolve;
      })
    );

    const { result: hook } = renderHook(() => useFilasSync());

    let pending: Promise<unknown>;
    act(() => {
      pending = hook.current.sync();
    });
    expect(hook.current.isSyncing).toBe(true);

    await act(async () => {
      resolveRun({ status: 'skipped', reason: 'no-selection' });
      await pending;
    });
    expect(hook.current.isSyncing).toBe(false);
  });

  it('encaminha o progresso do runner para onProgress', async () => {
    runMock.mockImplementation(async onProgress => {
      onProgress?.(3, 10);
      return { status: 'skipped', reason: 'no-selection' };
    });
    const onProgress = vi.fn();

    const { result: hook } = renderHook(() => useFilasSync({ onProgress }));
    await act(async () => {
      await hook.current.sync();
    });

    expect(onProgress).toHaveBeenCalledWith(3, 10);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import toast from 'react-hot-toast';

// Mock do react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
  Toaster: () => null,
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve lidar com erros do tipo Error', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Erro de teste');

    act(() => {
      result.current.handleError(error, 'Contexto de teste');
    });

    expect(toast.error).toHaveBeenCalledWith('Erro de teste', {
      duration: 5000,
      position: 'top-right',
    });
  });

  it('deve lidar com strings de erro', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError('Erro de string', 'Contexto');
    });

    expect(toast.error).toHaveBeenCalledWith('Erro de string', {
      duration: 5000,
      position: 'top-right',
    });
  });

  it('deve mostrar mensagem de sucesso', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleSuccess('Operação bem-sucedida');
    });

    expect(toast.success).toHaveBeenCalledWith('Operação bem-sucedida', {
      duration: 3000,
      position: 'top-right',
    });
  });

  it('deve mostrar aviso', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleWarning('Aviso importante');
    });

    expect(toast).toHaveBeenCalledWith('Aviso importante', {
      icon: '⚠️',
      duration: 4000,
      position: 'top-right',
    });
  });
});

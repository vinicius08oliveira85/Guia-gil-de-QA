import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve retornar valor inicial quando não há valor salvo', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('deve salvar e recuperar valor', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorage.getItem('test-key')).toBe('"new-value"');
  });

  it('deve atualizar valor usando função', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('deve lidar com objetos complexos', () => {
    const initialValue = { name: 'Test', count: 0 };
    const { result } = renderHook(() => useLocalStorage('test-obj', initialValue));

    act(() => {
      result.current[1]({ name: 'Updated', count: 1 });
    });

    expect(result.current[0]).toEqual({ name: 'Updated', count: 1 });
  });
});


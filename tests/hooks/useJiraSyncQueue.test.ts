import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useJiraSyncQueue } from '../../hooks/useJiraSyncQueue';
import { jiraSyncQueue } from '../../services/jiraSyncQueue';

vi.mock('../../utils/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

describe('useJiraSyncQueue', () => {
  it('expõe a mesma instância singleton', () => {
    const { result } = renderHook(() => useJiraSyncQueue());
    expect(result.current).toBe(jiraSyncQueue);
  });

  it('executa enqueue via hook', async () => {
    const { result } = renderHook(() => useJiraSyncQueue());
    const task = vi.fn().mockResolvedValue('ok');
    await expect(result.current.enqueue('hook-1', task)).resolves.toBe('ok');
  });
});

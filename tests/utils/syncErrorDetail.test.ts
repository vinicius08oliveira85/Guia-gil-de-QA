import { describe, it, expect } from 'vitest';
import { successResult, addSyncError, formatSyncErrors } from '../../utils/syncErrorDetail';

describe('syncErrorDetail', () => {
  describe('successResult', () => {
    it('cria resultado vazio sem erros', () => {
      const result = successResult({ ok: true }, 10);
      expect(result.data).toEqual({ ok: true });
      expect(result.errors).toEqual([]);
      expect(result.totalProcessed).toBe(10);
      expect(result.totalErrors).toBe(0);
    });
  });

  describe('addSyncError', () => {
    it('adiciona erro com issueKey e mensagem', () => {
      const result = successResult('data', 0);
      addSyncError(result, 'PROJ-123', new Error('HTTP 404 - Not Found'));
      expect(result.totalErrors).toBe(1);
      expect(result.errors[0].issueKey).toBe('PROJ-123');
      expect(result.errors[0].reason).toContain('404');
      expect(result.errors[0].statusCode).toBe(404);
    });

    it('adiciona múltiplos erros', () => {
      const result = successResult('data', 10);
      addSyncError(result, 'PROJ-1', new Error('Timeout'));
      addSyncError(result, 'PROJ-2', 'Erro de rede');
      expect(result.totalErrors).toBe(2);
      expect(result.errors.length).toBe(2);
    });
  });

  describe('formatSyncErrors', () => {
    it('retorna string vazia para 0 erros', () => {
      expect(formatSyncErrors([])).toBe('');
    });

    it('formata erros agrupados por status code', () => {
      const result = successResult('data', 0);
      addSyncError(result, 'PROJ-1', new Error('HTTP 404'));
      addSyncError(result, 'PROJ-2', new Error('HTTP 404'));
      addSyncError(result, 'PROJ-3', new Error('Timeout'));
      const formatted = formatSyncErrors(result.errors);
      expect(formatted).toContain('HTTP 404');
      expect(formatted).toContain('PROJ-1');
      expect(formatted).toContain('PROJ-2');
    });
  });
});

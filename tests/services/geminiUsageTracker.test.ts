import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractTokenCountFromResponse,
  getGeminiKeyUsage,
  recordGeminiKeyUsage,
  resetGeminiKeyUsage,
} from '../../services/ai/geminiUsageTracker';

describe('geminiUsageTracker', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('incrementa contadores de sucesso e tokens', () => {
    recordGeminiKeyUsage('key-1', { success: true, tokens: 120 });
    recordGeminiKeyUsage('key-1', { success: true, tokens: 80 });

    const usage = getGeminiKeyUsage('key-1');
    expect(usage.requestCount).toBe(2);
    expect(usage.successCount).toBe(2);
    expect(usage.estimatedTokens).toBe(200);
  });

  it('incrementa contadores de erro e rate limit', () => {
    recordGeminiKeyUsage('key-1', {
      rateLimited: true,
      errorMessage: '429 quota',
    });

    const usage = getGeminiKeyUsage('key-1');
    expect(usage.requestCount).toBe(1);
    expect(usage.errorCount).toBe(1);
    expect(usage.rateLimitCount).toBe(1);
    expect(usage.lastErrorMessage).toContain('429');
  });

  it('extractTokenCountFromResponse lê usageMetadata', () => {
    const tokens = extractTokenCountFromResponse({
      usageMetadata: { totalTokenCount: 512 },
    });
    expect(tokens).toBe(512);
  });

  it('resetGeminiKeyUsage limpa métricas', () => {
    recordGeminiKeyUsage('key-1', { success: true });
    resetGeminiKeyUsage('key-1');
    expect(getGeminiKeyUsage('key-1').requestCount).toBe(0);
  });
});

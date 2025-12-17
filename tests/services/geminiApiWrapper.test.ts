import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callGeminiWithRetry } from '../../services/ai/geminiApiWrapper';
import { geminiApiKeyManager } from '../../services/ai/geminiApiKeyManager';

const generateContentMock = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: generateContentMock,
    },
  })),
}));

vi.mock('../../utils/rateLimiter', () => ({
  geminiRateLimiter: {
    acquire: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/ai/geminiApiKeyManager', () => {
  const getCurrentKey = vi.fn();
  const markCurrentKeyAsExhausted = vi.fn();
  const getStats = vi.fn();
  const getExhaustedKeysInfo = vi.fn();

  return {
    geminiApiKeyManager: {
      getCurrentKey,
      markCurrentKeyAsExhausted,
      getStats,
      getExhaustedKeysInfo,
    },
  };
});

vi.mock('../../utils/retry', () => ({
  retryWithBackoff: async (fn: () => Promise<unknown>) => fn(),
}));

describe('callGeminiWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (geminiApiKeyManager.getCurrentKey as unknown as vi.Mock).mockReturnValue('test-key');
    (geminiApiKeyManager.getStats as unknown as vi.Mock).mockReturnValue({
      totalKeys: 1,
      availableKeys: 1,
      exhaustedKeys: 0,
      currentKeyIndex: 0,
    });
    (geminiApiKeyManager.getExhaustedKeysInfo as unknown as vi.Mock).mockReturnValue([]);
  });

  it('deve marcar quota excedida e lançar erro tipado para 429', async () => {
    generateContentMock.mockRejectedValueOnce({ status: 429, message: 'quota exceeded' });

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.5-flash', contents: 'conteudo de teste' })
    ).rejects.toMatchObject({ code: 'GEMINI_QUOTA_EXCEEDED', status: 429 });

    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(geminiApiKeyManager.markCurrentKeyAsExhausted).toHaveBeenCalledTimes(1);
  });

  it('deve retornar erro amigável para indisponibilidade 503', async () => {
    generateContentMock.mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' });

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.5-flash', contents: 'conteudo de teste' })
    ).rejects.toMatchObject({ code: 'GEMINI_TEMP_UNAVAILABLE', status: 503 });

    expect(geminiApiKeyManager.markCurrentKeyAsExhausted).not.toHaveBeenCalled();
  });
});


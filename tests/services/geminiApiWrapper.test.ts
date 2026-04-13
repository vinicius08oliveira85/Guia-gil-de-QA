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
  const hasConfiguredKeySource = vi.fn();

  return {
    geminiApiKeyManager: {
      getCurrentKey,
      markCurrentKeyAsExhausted,
      getStats,
      getExhaustedKeysInfo,
      hasConfiguredKeySource,
    },
  };
});

vi.mock('../../utils/retry', () => ({
  retryWithBackoff: async (fn: () => Promise<unknown>) => fn(),
}));

describe('callGeminiWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geminiApiKeyManager.getCurrentKey).mockReturnValue('test-key');
    vi.mocked(geminiApiKeyManager.hasConfiguredKeySource).mockReturnValue(true);
    vi.mocked(geminiApiKeyManager.getStats).mockReturnValue({
      totalKeys: 1,
      availableKeys: 1,
      exhaustedKeys: 0,
      currentKeyIndex: 0,
    });
    vi.mocked(geminiApiKeyManager.getExhaustedKeysInfo).mockReturnValue([]);
  });

  it('429 com "quota" na mensagem (comum na API Google para RPM) não invalida a key; retorna GEMINI_RATE_LIMITED', async () => {
    generateContentMock.mockRejectedValueOnce({ status: 429, message: 'quota exceeded for generate_content' });

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.0-flash', contents: 'conteudo de teste' })
    ).rejects.toMatchObject({ code: 'GEMINI_RATE_LIMITED', status: 429 });

    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(geminiApiKeyManager.markCurrentKeyAsExhausted).not.toHaveBeenCalled();
  });

  it('não deve invalidar a key em 429 genérico (rate limit); após falhas retorna GEMINI_RATE_LIMITED', async () => {
    generateContentMock.mockRejectedValue({ status: 429, message: 'Too many requests per minute' });

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.0-flash', contents: 'conteudo de teste' })
    ).rejects.toMatchObject({ code: 'GEMINI_RATE_LIMITED', status: 429 });

    expect(geminiApiKeyManager.markCurrentKeyAsExhausted).not.toHaveBeenCalled();
  });

  it('sem chave e sem fonte configurada: GEMINI_NO_KEY', async () => {
    vi.mocked(geminiApiKeyManager.getCurrentKey).mockReturnValue(null);
    vi.mocked(geminiApiKeyManager.hasConfiguredKeySource).mockReturnValue(false);

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.0-flash', contents: 'x' })
    ).rejects.toMatchObject({ code: 'GEMINI_NO_KEY' });

    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it('sem chave disponível mas com fonte configurada: GEMINI_KEY_UNAVAILABLE', async () => {
    vi.mocked(geminiApiKeyManager.getCurrentKey).mockReturnValue(null);
    vi.mocked(geminiApiKeyManager.hasConfiguredKeySource).mockReturnValue(true);

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.0-flash', contents: 'x' })
    ).rejects.toMatchObject({ code: 'GEMINI_KEY_UNAVAILABLE', status: 503 });

    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it('deve retornar erro amigável para indisponibilidade 503', async () => {
    generateContentMock.mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' });

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.0-flash', contents: 'conteudo de teste' })
    ).rejects.toMatchObject({ code: 'GEMINI_TEMP_UNAVAILABLE', status: 503 });

    expect(geminiApiKeyManager.markCurrentKeyAsExhausted).not.toHaveBeenCalled();
  });
});


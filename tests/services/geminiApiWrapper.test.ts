import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  callGeminiWithRetry,
  isGeminiRateLimitOrQuotaError,
  isGeminiTemporaryServiceError,
} from '../../services/ai/geminiApiWrapper';
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
  const getCurrentKeyEntry = vi.fn();
  const markCurrentKeyAsExhausted = vi.fn();
  const getStats = vi.fn();
  const getExhaustedKeysInfo = vi.fn();
  const hasConfiguredKeySource = vi.fn();
  const getTotalKeyCount = vi.fn();
  const getEnabledKeyCount = vi.fn();

  return {
    geminiApiKeyManager: {
      getCurrentKey,
      getCurrentKeyEntry,
      markCurrentKeyAsExhausted,
      getStats,
      getExhaustedKeysInfo,
      hasConfiguredKeySource,
      getTotalKeyCount,
      getEnabledKeyCount,
    },
  };
});

vi.mock('../../services/ai/geminiUsageTracker', () => ({
  recordGeminiKeyUsage: vi.fn(),
  extractTokenCountFromResponse: vi.fn(() => 0),
}));

vi.mock('../../utils/retry', () => ({
  retryWithBackoff: async (fn: () => Promise<unknown>) => fn(),
}));

describe('isGeminiRateLimitOrQuotaError', () => {
  it('retorna true para códigos normalizados do wrapper', () => {
    expect(
      isGeminiRateLimitOrQuotaError(Object.assign(new Error('x'), { code: 'GEMINI_RATE_LIMITED' }))
    ).toBe(true);
    expect(
      isGeminiRateLimitOrQuotaError(
        Object.assign(new Error('x'), { code: 'GEMINI_QUOTA_EXCEEDED' })
      )
    ).toBe(true);
  });

  it('retorna true para HTTP 429 do SDK (antes ou depois do retry)', () => {
    expect(isGeminiRateLimitOrQuotaError({ status: 429, message: 'Too many requests' })).toBe(true);
  });

  it('retorna true quando retry estoura timeout mas preserva status 429', () => {
    const err = new Error('Timeout máximo total de 45s excedido após 2 tentativa(s).') as Error & {
      status?: number;
    };
    err.status = 429;
    expect(isGeminiRateLimitOrQuotaError(err)).toBe(true);
  });

  it('retorna false para erro genérico sem 429', () => {
    expect(isGeminiRateLimitOrQuotaError(new Error('Model not found'))).toBe(false);
  });
});

describe('callGeminiWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geminiApiKeyManager.getCurrentKey).mockReturnValue('test-key');
    vi.mocked(geminiApiKeyManager.getCurrentKeyEntry).mockReturnValue({
      id: 'key-1',
      name: 'Test',
      key: 'test-key',
      exhausted: false,
    });
    vi.mocked(geminiApiKeyManager.getTotalKeyCount).mockReturnValue(1);
    vi.mocked(geminiApiKeyManager.getEnabledKeyCount).mockReturnValue(1);
    vi.mocked(geminiApiKeyManager.hasConfiguredKeySource).mockReturnValue(true);
    vi.mocked(geminiApiKeyManager.getStats).mockReturnValue({
      totalKeys: 1,
      availableKeys: 1,
      exhaustedKeys: 0,
      currentKeyIndex: 0,
    });
    vi.mocked(geminiApiKeyManager.getExhaustedKeysInfo).mockReturnValue([]);
  });

  it('429 não retenta no mesmo modelo — avança imediatamente pela cadeia e retorna GEMINI_RATE_LIMITED ao esgotar', async () => {
    generateContentMock.mockRejectedValue({
      status: 429,
      message: 'quota exceeded for generate_content',
    });

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.0-flash', contents: 'conteudo de teste' })
    ).rejects.toMatchObject({ code: 'GEMINI_RATE_LIMITED', status: 429 });

    // Uma chamada por modelo da cadeia (sem retry dentro do mesmo modelo)
    expect(generateContentMock.mock.calls.length).toBe(3); // 2.0-flash + 2.5-flash-lite + 2.0-flash-lite
    expect(geminiApiKeyManager.markCurrentKeyAsExhausted).toHaveBeenCalledOnce();
  });

  it('429 genérico: não retenta no mesmo modelo; retorna GEMINI_RATE_LIMITED', async () => {
    generateContentMock.mockRejectedValue({ status: 429, message: 'Too many requests per minute' });

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.0-flash', contents: 'conteudo de teste' })
    ).rejects.toMatchObject({ code: 'GEMINI_RATE_LIMITED', status: 429 });

    expect(generateContentMock.mock.calls.length).toBe(3);
    expect(geminiApiKeyManager.markCurrentKeyAsExhausted).toHaveBeenCalledOnce();
  });

  it('429 com segunda chave disponível: marca esgotada e tenta fallback de key', async () => {
    vi.mocked(geminiApiKeyManager.getTotalKeyCount).mockReturnValue(2);
    vi.mocked(geminiApiKeyManager.getEnabledKeyCount)
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(1);

    vi.mocked(geminiApiKeyManager.getCurrentKeyEntry)
      .mockReturnValueOnce({
        id: 'key-1',
        name: 'Primeira',
        key: 'key-one',
        exhausted: false,
      })
      .mockReturnValueOnce({
        id: 'key-2',
        name: 'Segunda',
        key: 'key-two',
        exhausted: false,
      });

    generateContentMock
      .mockRejectedValueOnce({ status: 429, message: 'quota exceeded' })
      .mockRejectedValueOnce({ status: 429, message: 'quota exceeded' })
      .mockRejectedValueOnce({ status: 429, message: 'quota exceeded' })
      .mockResolvedValueOnce({ text: 'ok-second-key' });

    const result = await callGeminiWithRetry({
      model: 'gemini-2.0-flash',
      contents: 'conteudo de teste',
    });

    expect(result.text).toBe('ok-second-key');
    expect(geminiApiKeyManager.markCurrentKeyAsExhausted).toHaveBeenCalledOnce();
  });

  it('sem chave e sem fonte configurada: GEMINI_NO_KEY', async () => {
    vi.mocked(geminiApiKeyManager.getCurrentKeyEntry).mockReturnValue(null);
    vi.mocked(geminiApiKeyManager.getCurrentKey).mockReturnValue(null);
    vi.mocked(geminiApiKeyManager.hasConfiguredKeySource).mockReturnValue(false);

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.0-flash', contents: 'x' })
    ).rejects.toMatchObject({ code: 'GEMINI_NO_KEY' });

    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it('sem chave disponível mas com fonte configurada: GEMINI_KEY_UNAVAILABLE', async () => {
    vi.mocked(geminiApiKeyManager.getCurrentKeyEntry).mockReturnValue(null);
    vi.mocked(geminiApiKeyManager.getCurrentKey).mockReturnValue(null);
    vi.mocked(geminiApiKeyManager.hasConfiguredKeySource).mockReturnValue(true);

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.0-flash', contents: 'x' })
    ).rejects.toMatchObject({ code: 'GEMINI_KEY_UNAVAILABLE', status: 503 });

    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it('503 no terceiro modelo da cadeia pode obter sucesso (ex.: gemini-2.0-flash-lite)', async () => {
    generateContentMock
      .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
      .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
      .mockResolvedValueOnce({ text: 'ok-lite-2.0' });

    const result = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: 'x',
    });

    expect(result.text).toBe('ok-lite-2.0');
    expect(generateContentMock.mock.calls[2][0].model).toBe('gemini-2.0-flash-lite');
  });

  it('429 em modelo alternativo deve tentar o próximo da cadeia', async () => {
    generateContentMock
      .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
      .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
      .mockRejectedValueOnce({ status: 429, message: 'quota exceeded' })
      .mockResolvedValueOnce({ text: 'ok-2.0' });

    const result = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: 'x',
    });

    expect(result.text).toBe('ok-2.0');
    expect(generateContentMock.mock.calls[3][0].model).toBe('gemini-2.0-flash');
  });

  it('deve retornar erro amigável para indisponibilidade 503 após esgotar a cadeia de modelos', async () => {
    generateContentMock.mockRejectedValue({ status: 503, message: 'Service Unavailable' });

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.5-flash', contents: 'conteudo de teste' })
    ).rejects.toMatchObject({ code: 'GEMINI_TEMP_UNAVAILABLE', status: 503 });

    expect(geminiApiKeyManager.markCurrentKeyAsExhausted).not.toHaveBeenCalled();
    expect(generateContentMock.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it('503 no primeiro modelo deve tentar o próximo e retornar sucesso se a segunda chamada responder', async () => {
    generateContentMock
      .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
      .mockResolvedValueOnce({ text: 'ok' });

    const result = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: 'x',
    });

    expect(result.text).toBe('ok');
    expect(generateContentMock).toHaveBeenCalledTimes(2);
    const firstModel = generateContentMock.mock.calls[0][0].model;
    const secondModel = generateContentMock.mock.calls[1][0].model;
    expect(firstModel).toBe('gemini-2.5-flash');
    expect(secondModel).toBe('gemini-2.5-flash-lite');
  });

  it('404 no primeiro modelo alterna para gemini-2.5-flash-lite e pode obter sucesso', async () => {
    generateContentMock
      .mockRejectedValueOnce({ status: 404, message: 'Model not found' })
      .mockResolvedValueOnce({ text: 'ok-lite' });

    const result = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: 'x',
    });

    expect(result.text).toBe('ok-lite');
    expect(generateContentMock.mock.calls[1][0].model).toBe('gemini-2.5-flash-lite');
  });
});

describe('isGeminiTemporaryServiceError', () => {
  it('retorna true para código GEMINI_TEMP_UNAVAILABLE', () => {
    expect(
      isGeminiTemporaryServiceError(
        Object.assign(new Error('x'), { code: 'GEMINI_TEMP_UNAVAILABLE' })
      )
    ).toBe(true);
  });

  it('retorna true para HTTP 503', () => {
    expect(isGeminiTemporaryServiceError({ status: 503, message: 'Service Unavailable' })).toBe(
      true
    );
  });

  it('retorna false para 429', () => {
    expect(isGeminiTemporaryServiceError({ status: 429, message: 'quota' })).toBe(false);
  });
});

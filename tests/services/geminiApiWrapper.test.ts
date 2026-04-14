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

describe('isGeminiRateLimitOrQuotaError', () => {
  it('retorna true para códigos normalizados do wrapper', () => {
    expect(isGeminiRateLimitOrQuotaError(Object.assign(new Error('x'), { code: 'GEMINI_RATE_LIMITED' }))).toBe(
      true
    );
    expect(isGeminiRateLimitOrQuotaError(Object.assign(new Error('x'), { code: 'GEMINI_QUOTA_EXCEEDED' }))).toBe(
      true
    );
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

  it('deve retornar erro amigável para indisponibilidade 503 após esgotar a cadeia de modelos', async () => {
    generateContentMock.mockRejectedValue({ status: 503, message: 'Service Unavailable' });

    await expect(
      callGeminiWithRetry({ model: 'gemini-2.0-flash', contents: 'conteudo de teste' })
    ).rejects.toMatchObject({ code: 'GEMINI_TEMP_UNAVAILABLE', status: 503 });

    expect(geminiApiKeyManager.markCurrentKeyAsExhausted).not.toHaveBeenCalled();
    expect(generateContentMock.mock.calls.length).toBeGreaterThanOrEqual(2);
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
    expect(secondModel).not.toBe(firstModel);
  });
});

describe('isGeminiTemporaryServiceError', () => {
  it('retorna true para código GEMINI_TEMP_UNAVAILABLE', () => {
    expect(
      isGeminiTemporaryServiceError(Object.assign(new Error('x'), { code: 'GEMINI_TEMP_UNAVAILABLE' }))
    ).toBe(true);
  });

  it('retorna true para HTTP 503', () => {
    expect(isGeminiTemporaryServiceError({ status: 503, message: 'Service Unavailable' })).toBe(true);
  });

  it('retorna false para 429', () => {
    expect(isGeminiTemporaryServiceError({ status: 429, message: 'quota' })).toBe(false);
  });
});


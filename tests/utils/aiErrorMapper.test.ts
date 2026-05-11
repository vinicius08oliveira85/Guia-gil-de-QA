import { describe, it, expect } from 'vitest';
import {
  extractHttpStatus,
  getFriendlyAIErrorMessage,
  toToastableAiError,
} from '../../utils/aiErrorMapper';

describe('getFriendlyAIErrorMessage', () => {
  it('retorna mensagem amigável para quota excedida', () => {
    const message = getFriendlyAIErrorMessage({ code: 'GEMINI_QUOTA_EXCEEDED', status: 429 });
    expect(message).toMatch(/Cota do Gemini|OpenAI|gemini-1\.5-flash/i);
  });

  it('retorna mensagem amigável para indisponibilidade 503', () => {
    const message = getFriendlyAIErrorMessage({ status: 503 });
    expect(message).toMatch(/indisponível/i);
  });
});

describe('extractHttpStatus', () => {
  it('lê status ou statusCode', () => {
    expect(extractHttpStatus({ status: 429 })).toBe(429);
    expect(extractHttpStatus({ statusCode: 503 })).toBe(503);
  });
});

describe('toToastableAiError', () => {
  it('preserva code e status no novo Error', () => {
    const err = toToastableAiError({
      code: 'GEMINI_RATE_LIMITED',
      status: 429,
      message: 'raw',
    });
    expect(err.message).toMatch(/Limite|Gemini|429/i);
    expect((err as { code?: string }).code).toBe('GEMINI_RATE_LIMITED');
    expect((err as { status?: number }).status).toBe(429);
  });
});

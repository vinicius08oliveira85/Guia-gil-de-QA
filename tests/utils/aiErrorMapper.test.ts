import { describe, it, expect } from 'vitest';
import { getFriendlyAIErrorMessage } from '../../utils/aiErrorMapper';

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

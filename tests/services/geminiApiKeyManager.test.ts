import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { geminiApiKeyManager } from '../../services/ai/geminiApiKeyManager';
import { addGeminiKey, GEMINI_ENV_KEY_ID } from '../../services/geminiConfigService';

describe('geminiApiKeyManager', () => {
  beforeEach(() => {
    localStorage.clear();
    geminiApiKeyManager.reset();
    geminiApiKeyManager.reloadKeys();
  });

  it('reactivateKey remove estado esgotado de uma chave', () => {
    const entry = addGeminiKey({ name: 'Teste', apiKey: 'AIzaSyTESTKEY1234' });
    geminiApiKeyManager.reloadKeys();

    geminiApiKeyManager.markCurrentKeyAsExhausted();
    expect(geminiApiKeyManager.getStats().availableKeys).toBe(0);

    const ok = geminiApiKeyManager.reactivateKey(entry.id);
    expect(ok).toBe(true);
    expect(geminiApiKeyManager.getStats().availableKeys).toBe(1);
  });

  it('reactivateKey retorna false se chave não está esgotada', () => {
    const entry = addGeminiKey({ name: 'Teste', apiKey: 'AIzaSyTESTKEY1234' });
    geminiApiKeyManager.reloadKeys();
    expect(geminiApiKeyManager.reactivateKey(entry.id)).toBe(false);
  });

  it('exporta GEMINI_ENV_KEY_ID consistente', () => {
    expect(GEMINI_ENV_KEY_ID).toBe('env-gemini-key');
  });
});

import { describe, it, expect } from 'vitest';
import {
  getGeminiModelFallbackChain,
  GEMINI_DEFAULT_MODEL,
} from '../../services/ai/geminiConstants';

describe('getGeminiModelFallbackChain', () => {
  it('coloca o modelo preferido primeiro, depois candidatos de fallback, sem duplicatas', () => {
    const chain = getGeminiModelFallbackChain('gemini-2.0-flash');
    expect(chain[0]).toBe('gemini-2.0-flash');
    expect(chain).toContain('gemini-2.5-flash-lite');
    expect(chain).toContain('gemini-1.5-flash');
    expect(chain.length).toBe(3);
    expect(new Set(chain).size).toBe(chain.length);
  });

  it('cadeia padrão inclui 2.5-flash e três fallbacks', () => {
    const chain = getGeminiModelFallbackChain(undefined);
    expect(chain[0]).toBe(GEMINI_DEFAULT_MODEL);
    expect(chain).toEqual([
      GEMINI_DEFAULT_MODEL,
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ]);
  });

  it('usa o default quando o parâmetro está vazio', () => {
    const chain = getGeminiModelFallbackChain(undefined);
    expect(chain[0]).toBe(GEMINI_DEFAULT_MODEL);
  });

  it('aceita prefixo models/', () => {
    const chain = getGeminiModelFallbackChain('models/gemini-2.0-flash');
    expect(chain[0]).toBe('gemini-2.0-flash');
  });
});

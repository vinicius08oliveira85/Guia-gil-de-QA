import { describe, it, expect } from 'vitest';
import { getGeminiModelFallbackChain, GEMINI_DEFAULT_MODEL } from '../../services/ai/geminiConstants';

describe('getGeminiModelFallbackChain', () => {
  it('coloca o modelo preferido primeiro, depois só gemini-2.5-flash-lite, sem duplicatas', () => {
    const chain = getGeminiModelFallbackChain('gemini-2.0-flash');
    expect(chain[0]).toBe('gemini-2.0-flash');
    expect(chain[1]).toBe('gemini-2.5-flash-lite');
    expect(chain.length).toBe(2);
    expect(new Set(chain).size).toBe(chain.length);
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

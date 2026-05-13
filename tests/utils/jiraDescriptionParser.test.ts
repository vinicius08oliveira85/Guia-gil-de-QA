import { describe, expect, it } from 'vitest';

import { parseJiraDescription, parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';

describe('jiraDescriptionParser', () => {
  it('limita HTML gigante com imagem base64 antes do processamento pesado', () => {
    const hugeHtml = `<p>Descrição inicial</p><img src="data:image/png;base64,${'A'.repeat(120_000)}" /><p>fim</p>`;

    expect(() => parseJiraDescriptionHTML(hugeHtml)).not.toThrow();

    const html = parseJiraDescriptionHTML(hugeHtml);
    expect(html.length).toBeLessThanOrEqual(60_000);
    expect(html).toContain('Descrição inicial');
  });

  it('limita descrição textual gigante sem estourar a pilha', () => {
    const hugeText = `<div>${'X'.repeat(120_000)}</div>`;

    expect(() => parseJiraDescription(hugeText)).not.toThrow();

    const parsed = parseJiraDescription(hugeText);
    expect(parsed.length).toBeLessThanOrEqual(60_000);
  });
});

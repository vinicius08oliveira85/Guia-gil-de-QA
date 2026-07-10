import { describe, it, expect } from 'vitest';
import {
  formatCursorPromptForDisplay,
  parseCursorPromptBlocks,
} from '../../utils/cursorPromptDisplay';

describe('cursorPromptDisplay', () => {
  it('quebra passos numerados embutidos em parágrafo único', () => {
    const raw =
      'Atue como especialista. 1. Configure o Postman. 2. Execute GET /login. 3. Valide token. Restrições: Não gere código Python.';
    const formatted = formatCursorPromptForDisplay(raw);
    expect(formatted).toContain('1. Configure o Postman');
    expect(formatted).toContain('2. Execute GET /login');
    expect(parseCursorPromptBlocks(raw).filter(b => b.kind === 'numbered')).toHaveLength(3);
  });

  it('preserva prompts já multilinha', () => {
    const raw = 'Linha 1\n\nLinha 2\n\nLinha 3';
    expect(formatCursorPromptForDisplay(raw)).toBe(raw);
  });

  it('identifica seções e bullets', () => {
    const blocks = parseCursorPromptBlocks(
      'Objetivo: validar API.\n\nRestrições:\n- Não gere Python.\n- Foque em Postman.'
    );
    expect(blocks.some(b => b.kind === 'heading' && b.text.includes('Restrições'))).toBe(true);
    expect(blocks.filter(b => b.kind === 'bullet')).toHaveLength(2);
  });
});

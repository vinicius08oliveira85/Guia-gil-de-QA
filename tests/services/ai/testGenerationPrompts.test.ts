import { describe, it, expect } from 'vitest';
import { detailLevelBlock } from '../../../services/ai/testGenerationPrompts';

describe('testGenerationPrompts.detailLevelBlock', () => {
  it('Resumido: poucos passos e linguagem objetiva', () => {
    const block = detailLevelBlock('Resumido');
    expect(block).toContain('**Resumido**');
    expect(block).toContain('**poucos**');
    expect(block).toContain('**objetiva**');
    expect(block).not.toContain('**Estruturado**');
    expect(block).not.toContain('verificações intermediárias');
  });

  it('Estruturado: roteiro completo, verificações e referência a TEST_CASE_VISUAL_FORMAT_INSTRUCTIONS', () => {
    const block = detailLevelBlock('Estruturado');
    expect(block).toContain('**Estruturado**');
    expect(block).toContain('roteiro **completo**');
    expect(block).toContain('verificações intermediárias detalhadas');
    expect(block).toContain('TEST_CASE_VISUAL_FORMAT_INSTRUCTIONS');
    expect(block).toContain('•');
  });
});

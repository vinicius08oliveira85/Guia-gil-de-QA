import { describe, it, expect } from 'vitest';
import {
  devProjectAnalysisFingerprint,
  formatLatestDevProjectAnalysisForPrompt,
} from '../../utils/devProjectAnalysisFormat';

describe('devProjectAnalysisFormat', () => {
  it('formata análise vazia', () => {
    expect(formatLatestDevProjectAnalysisForPrompt([])).toContain('nenhuma análise Dev');
  });

  it('formata análise mais recente', () => {
    const text = formatLatestDevProjectAnalysisForPrompt([
      {
        summary: 'Resumo do projeto',
        stackAlignment: 'Alinhado',
        implementationBacklog: 'Item 1',
        architectureNotes: 'Camadas',
        strengths: ['Stack clara'],
        weaknesses: [],
        risks: ['Dívida técnica'],
        recommendations: ['Priorizar API'],
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    expect(text).toContain('Resumo do projeto');
    expect(text).toContain('Dívida técnica');
  });

  it('gera fingerprint estável', () => {
    const analyses = [
      {
        summary: 'A',
        stackAlignment: 'B',
        implementationBacklog: 'C',
        architectureNotes: 'D',
        strengths: [],
        weaknesses: [],
        risks: [],
        recommendations: [],
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    expect(devProjectAnalysisFingerprint(analyses)).toBe('2026-01-01T00:00:00.000Z|1|1');
  });
});

import { describe, expect, it } from 'vitest';
import {
  cleanJiraProjectName,
  formatJiraProjectLabel,
  formatJiraProjectSelectionSummary,
} from '../../utils/jiraProjectLabel';

describe('jiraProjectLabel', () => {
  it('remove chave redundante do nome', () => {
    expect(cleanJiraProjectName('Sustentação (SUS)', 'SUS')).toBe('Sustentação');
    expect(cleanJiraProjectName('APP da Regulação, (ADR)', 'ADR')).toBe('APP da Regulação');
  });

  it('formata rótulo compacto em uma linha', () => {
    expect(formatJiraProjectLabel({ key: 'SUS', name: 'Sustentação (SUS)' })).toBe(
      'SUS — Sustentação'
    );
  });

  it('resume múltiplos projetos selecionados', () => {
    const projects = [
      { key: 'SUS', name: 'Sustentação' },
      { key: 'ADR', name: 'APP da Regulação' },
    ];
    expect(formatJiraProjectSelectionSummary(projects, ['SUS', 'ADR'])).toBe('SUS +1');
  });
});

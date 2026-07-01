import { describe, expect, it } from 'vitest';
import {
  parseBusinessRuleSearchTermsFromTitle,
  parseKeywordsFromInput,
  matchTasksForBusinessRule,
  getSuggestedTaskIdsFromMatches,
  resolveBusinessRuleSearchTerms,
  suggestKeywordsFromRuleTitle,
} from '../../utils/businessRuleTaskMatcher';
import type { JiraTask } from '../../types';

const task = (id: string, title: string, description = ''): JiraTask => ({
  id,
  title,
  description,
  status: 'To Do',
  testCases: [],
  type: 'História',
});

describe('businessRuleTaskMatcher', () => {
  it('suggestKeywordsFromRuleTitle remove prefixo RN', () => {
    expect(suggestKeywordsFromRuleTitle('RN-Mapa_de_Internação')).toBe('Mapa de Internação');
  });

  it('parseKeywordsFromInput separa por vírgula', () => {
    expect(parseKeywordsFromInput('Foto do dia, Mapa de Internação')).toEqual([
      'Foto do dia',
      'Mapa de Internação',
    ]);
  });

  it('resolveBusinessRuleSearchTerms prioriza palavras-chave sobre título', () => {
    const terms = resolveBusinessRuleSearchTerms('RN-Outro', ['Foto do dia', 'Mapa de Internação']);
    expect(terms.some(t => t.includes('Mapa de Internação'))).toBe(true);
    expect(terms.some(t => t === 'Outro')).toBe(false);
  });

  it('parseBusinessRuleSearchTermsFromTitle extrai frase e termos', () => {
    const terms = parseBusinessRuleSearchTermsFromTitle('RN-Mapa_de_Internação');
    expect(terms).toContain('Mapa de Internação');
    expect(terms.some(t => t.toLowerCase().includes('mapa'))).toBe(true);
  });

  it('matchTasksForBusinessRule ranqueia tasks por palavras-chave', () => {
    const tasks = [
      task('GDPI-1', 'Outro módulo'),
      task('GDPI-2', 'Foto do dia no painel'),
      task('GDPI-3', 'Mapa de Internação - filtros', 'Tela do mapa de internação'),
    ];
    const matches = matchTasksForBusinessRule(tasks, 'RN-Qualquer', [
      'Foto do dia',
      'Mapa de Internação',
    ]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some(m => m.taskId === 'GDPI-2')).toBe(true);
    expect(matches.some(m => m.taskId === 'GDPI-3')).toBe(true);
  });

  it('getSuggestedTaskIdsFromMatches ignora confiança baixa', () => {
    const matches = matchTasksForBusinessRule(
      [task('GDPI-1', 'Mapa de Internação'), task('GDPI-2', 'Outro')],
      'RN-X',
      ['Mapa de Internação']
    );
    const suggested = getSuggestedTaskIdsFromMatches(matches);
    expect(suggested).toContain('GDPI-1');
    expect(suggested.every(id => matches.find(m => m.taskId === id)?.confidence !== 'baixa')).toBe(
      true
    );
  });
});

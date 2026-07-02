import { describe, expect, it } from 'vitest';
import {
  parseBusinessRuleSearchTermsFromTitle,
  parseKeywordsFromInput,
  matchTasksForBusinessRule,
  getSuggestedTaskIdsFromMatches,
  resolveBusinessRuleSearchTerms,
  resolveLinkedTasksForDossier,
  suggestKeywordsFromRuleTitle,
  phraseMatchesTaskText,
  significantTokensFromPhrase,
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
    expect(terms).toContain('Mapa de Internação');
    expect(terms).toContain('Foto do dia');
    expect(terms.some(t => t === 'Outro')).toBe(false);
  });

  it('parseBusinessRuleSearchTermsFromTitle extrai frase sem decompor em palavras soltas', () => {
    const terms = parseBusinessRuleSearchTermsFromTitle('RN-Mapa_de_Internação');
    expect(terms).toEqual(['Mapa de Internação']);
  });

  it('significantTokensFromPhrase ignora stopwords', () => {
    expect(significantTokensFromPhrase('Painel de Internação')).toEqual(['painel', 'internacao']);
    expect(significantTokensFromPhrase('Mapa de Internação')).toEqual(['mapa', 'internacao']);
  });

  it('não confunde Painel de Internação com Mapa de Internação', () => {
    const tasks = [
      task('GDPI-1', 'Painel de Internação - filtros'),
      task('GDPI-2', 'Mapa de Internação - layout', 'Tela do mapa de internação'),
      task('GDPI-3', 'Menu com módulos de internação', 'Cita internação sem o módulo específico'),
    ];
    const matches = matchTasksForBusinessRule(tasks, 'RN-Painel', ['Painel de Internação']);
    const ids = matches.map(m => m.taskId);

    expect(ids).toContain('GDPI-1');
    expect(ids).not.toContain('GDPI-2');
    expect(ids).not.toContain('GDPI-3');
  });

  it('não confunde Mapa de Internação com Painel de Internação', () => {
    const tasks = [
      task('GDPI-1', 'Painel de Internação - filtros'),
      task('GDPI-2', 'Mapa de Internação - layout'),
    ];
    const matches = matchTasksForBusinessRule(tasks, 'RN-Mapa', ['Mapa de Internação']);
    const ids = matches.map(m => m.taskId);

    expect(ids).toContain('GDPI-2');
    expect(ids).not.toContain('GDPI-1');
  });

  it('phraseMatchesTaskText exige todos os tokens em frases compostas', () => {
    expect(phraseMatchesTaskText('Painel de Internação', 'Painel de Internação - filtros').matches).toBe(
      true
    );
    expect(phraseMatchesTaskText('Painel de Internação', 'Mapa de Internação - layout').matches).toBe(
      false
    );
    expect(phraseMatchesTaskText('Foto do dia', 'Foto do dia no painel').matches).toBe(true);
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
    expect(matches.some(m => m.taskId === 'GDPI-1')).toBe(false);
  });

  it('getSuggestedTaskIdsFromMatches ignora confiança baixa e média por padrão', () => {
    const tasks = [
      task('GDPI-1', 'Mapa de Internação'),
      task('GDPI-2', 'Mapa de Internação secundário', 'mapa internacao extra'),
      task('GDPI-3', 'Outro'),
    ];
    const matches = matchTasksForBusinessRule(tasks, 'RN-X', ['Mapa de Internação']);
    const suggested = getSuggestedTaskIdsFromMatches(matches);
    expect(suggested.every(id => matches.find(m => m.taskId === id)?.confidence === 'alta')).toBe(
      true
    );
    expect(suggested).toContain('GDPI-1');
  });

  it('getSuggestedTaskIdsFromMatches aceita confiança mínima configurável', () => {
    const matches = matchTasksForBusinessRule(
      [task('GDPI-1', 'Mapa de Internação'), task('GDPI-2', 'Outro')],
      'RN-X',
      ['Mapa de Internação']
    );
    const suggestedMedia = getSuggestedTaskIdsFromMatches(matches, 'media');
    expect(suggestedMedia).toContain('GDPI-1');
    expect(suggestedMedia.every(id => matches.find(m => m.taskId === id)?.confidence !== 'baixa')).toBe(
      true
    );
  });

  it('resolveLinkedTasksForDossier mantém match forte e aplica limite máximo', () => {
    const tasks = [
      task('GDPI-1', 'Cirurgias Eletivas - painel'),
      ...Array.from({ length: 28 }, (_, i) => task(`GDPI-${i + 2}`, 'Outro módulo')),
    ];
    const rule = {
      title: 'RN-Cirurgias Eletivas',
      searchKeywords: ['Cirurgias Eletivas'],
      linkedTaskIds: tasks.map(t => t.id),
    };
    const { tasks: included, excludedTaskIds } = resolveLinkedTasksForDossier(tasks, rule);
    expect(included.map(t => t.id)).toContain('GDPI-1');
    expect(included.length).toBeLessThanOrEqual(25);
    expect(excludedTaskIds.length).toBeGreaterThan(0);
  });
});

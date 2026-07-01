import type { JiraTask } from '../types';

export type BusinessRuleMatchConfidence = 'alta' | 'media' | 'baixa';

export interface BusinessRuleTaskMatch {
  taskId: string;
  score: number;
  confidence: BusinessRuleMatchConfidence;
  matchedTerms: string[];
}

const DEFAULT_MAX_MATCHES = 30;

const PT_STOPWORDS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'o',
  'a',
  'os',
  'as',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'um',
  'uma',
  'uns',
  'umas',
  'por',
  'para',
  'com',
]);

/**
 * Sugere texto inicial de palavras-chave a partir do nome da regra (conversão legado).
 */
export function suggestKeywordsFromRuleTitle(title: string): string {
  const raw = title.trim().replace(/^(RN|REGRA|BR)[-_\s]*/i, '');
  return raw.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Converte texto do usuário em palavras-chave (vírgula ou ponto-e-vírgula).
 */
export function parseKeywordsFromInput(input: string): string[] {
  return input
    .split(/[,;]+/)
    .map(part => part.trim())
    .filter(Boolean);
}

/**
 * Formata palavras-chave para exibição/edição no formulário.
 */
export function formatKeywordsForInput(keywords: string[] | undefined): string {
  return (keywords ?? []).join(', ');
}

/**
 * Normaliza texto para comparação (minúsculas, sem acentos).
 */
export function normalizeBusinessRuleMatchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/**
 * Tokens significativos de uma frase (ignora stopwords curtas).
 */
export function significantTokensFromPhrase(phrase: string): string[] {
  const normalized = normalizeBusinessRuleMatchText(phrase);
  return normalized
    .split(/\s+/)
    .filter(word => word.length >= 3 && !PT_STOPWORDS.has(word));
}

function normalizePhrase(keyword: string): string {
  return keyword.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Frases de busca (sem decomposição em palavras soltas — evita falsos positivos).
 */
function collectSearchPhrases(sources: string[]): string[] {
  const phrases = new Set<string>();
  for (const source of sources) {
    const phrase = normalizePhrase(source);
    if (phrase) phrases.add(phrase);
  }
  return [...phrases].sort((a, b) => b.length - a.length);
}

/**
 * Extrai termos de busca a partir de palavras-chave explícitas ou do título (legado).
 */
export function resolveBusinessRuleSearchTerms(
  title: string,
  searchKeywords?: string[]
): string[] {
  if (searchKeywords && searchKeywords.length > 0) {
    return collectSearchPhrases(searchKeywords);
  }
  return parseBusinessRuleSearchTermsFromTitle(title);
}

/**
 * Extrai frases de busca a partir do título da regra (ex.: RN-Mapa_de_Internação).
 */
export function parseBusinessRuleSearchTermsFromTitle(title: string): string[] {
  const raw = title.trim();
  if (!raw) return [];

  const withoutPrefix = raw.replace(/^(RN|REGRA|BR)[-_\s]*/i, '');
  const phrase = withoutPrefix.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return phrase ? [phrase] : [];
}

function scoreToConfidence(score: number): BusinessRuleMatchConfidence {
  if (score >= 70) return 'alta';
  if (score >= 40) return 'media';
  return 'baixa';
}

function taskSearchBlob(task: JiraTask): string {
  const parts: string[] = [
    task.id,
    task.title,
    task.description ?? '',
    task.epicKey ?? '',
    task.parentId ?? '',
    ...(task.tags ?? []),
    ...(task.components?.map(c => c.name) ?? []),
    ...(task.issueLinks?.map(l => `${l.type} ${l.relatedKey}`) ?? []),
  ];

  const custom = task.jiraCustomFields;
  if (custom && typeof custom === 'object') {
    for (const value of Object.values(custom)) {
      if (typeof value === 'string') parts.push(value);
      else if (value && typeof value === 'object' && 'name' in value) {
        const named = value as { name?: string };
        if (named.name) parts.push(named.name);
      }
    }
  }

  return parts.join(' ');
}

/**
 * Verifica se uma frase-chave casa com o texto da task.
 * Frases com 2+ tokens exigem que TODOS os tokens significativos estejam presentes.
 */
export function phraseMatchesTaskText(
  phrase: string,
  text: string
): { matches: boolean; score: number } {
  const normalizedPhrase = normalizeBusinessRuleMatchText(phrase);
  const blob = normalizeBusinessRuleMatchText(text);
  if (!normalizedPhrase || !blob) return { matches: false, score: 0 };

  const tokens = significantTokensFromPhrase(phrase);
  if (tokens.length === 0) return { matches: false, score: 0 };

  if (tokens.length === 1) {
    const token = tokens[0];
    if (!blob.includes(token)) return { matches: false, score: 0 };
    const score = Math.min(55, 25 + token.length * 2);
    return { matches: true, score };
  }

  const allTokensPresent = tokens.every(token => blob.includes(token));
  if (!allTokensPresent) return { matches: false, score: 0 };

  let score = 45 + Math.min(25, normalizedPhrase.length);
  if (blob.includes(normalizedPhrase)) {
    score += 20;
  }
  return { matches: true, score: Math.min(85, score) };
}

function scoreTask(
  task: JiraTask,
  phrases: string[]
): { score: number; matchedTerms: string[] } {
  const blob = taskSearchBlob(task);
  const titleBlob = task.title ?? '';
  const matchedTerms: string[] = [];
  let score = 0;

  for (const phrase of phrases) {
    const { matches, score: phraseScore } = phraseMatchesTaskText(phrase, blob);
    if (!matches) continue;

    matchedTerms.push(phrase);
    score += phraseScore;

    const titleMatch = phraseMatchesTaskText(phrase, titleBlob);
    if (titleMatch.matches) score += 15;
    if (normalizeBusinessRuleMatchText(task.id).includes(normalizeBusinessRuleMatchText(phrase))) {
      score += 5;
    }
  }

  return { score: Math.min(100, score), matchedTerms };
}

function includeParentTasks(tasks: JiraTask[], matchedIds: Set<string>): void {
  const byId = new Map(tasks.map(t => [t.id, t]));
  for (const id of [...matchedIds]) {
    const task = byId.get(id);
    if (!task?.parentId) continue;
    const parent = byId.get(task.parentId);
    if (parent) matchedIds.add(parent.id);
    if (task.epicKey && byId.has(task.epicKey)) {
      matchedIds.add(task.epicKey);
    }
  }
}

/** IDs de tasks sugeridas para seleção automática (confiança alta ou média). */
export function getSuggestedTaskIdsFromMatches(
  matches: BusinessRuleTaskMatch[]
): string[] {
  return matches.filter(m => m.confidence !== 'baixa').map(m => m.taskId);
}

/**
 * Encontra tasks do projeto relacionadas às palavras-chave da regra.
 */
export function matchTasksForBusinessRule(
  tasks: JiraTask[],
  title: string,
  searchKeywords?: string[],
  maxMatches = DEFAULT_MAX_MATCHES
): BusinessRuleTaskMatch[] {
  const phrases = resolveBusinessRuleSearchTerms(title, searchKeywords);
  if (phrases.length === 0 || tasks.length === 0) return [];

  const scored = tasks
    .map(task => {
      const { score, matchedTerms } = scoreTask(task, phrases);
      return {
        taskId: task.id,
        score,
        confidence: scoreToConfidence(score),
        matchedTerms,
      };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, maxMatches);
  const matchedIds = new Set(top.map(m => m.taskId));
  includeParentTasks(tasks, matchedIds);

  const extra = tasks
    .filter(t => matchedIds.has(t.id) && !top.some(m => m.taskId === t.id))
    .map(task => ({
      taskId: task.id,
      score: 25,
      confidence: 'baixa' as const,
      matchedTerms: ['hierarquia'],
    }));

  return [...top, ...extra].sort((a, b) => b.score - a.score);
}

export function getMatchedTasks(
  tasks: JiraTask[],
  matchedTaskIds: string[]
): JiraTask[] {
  const idSet = new Set(matchedTaskIds);
  return tasks.filter(t => idSet.has(t.id));
}

/** @deprecated Use parseBusinessRuleSearchTermsFromTitle */
export const parseBusinessRuleSearchTerms = parseBusinessRuleSearchTermsFromTitle;

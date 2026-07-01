import type { JiraTask } from '../types';

export type BusinessRuleMatchConfidence = 'alta' | 'media' | 'baixa';

export interface BusinessRuleTaskMatch {
  taskId: string;
  score: number;
  confidence: BusinessRuleMatchConfidence;
  matchedTerms: string[];
}

const DEFAULT_MAX_MATCHES = 30;

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
 * Extrai termos de busca a partir de palavras-chave explícitas ou do título (legado).
 */
export function resolveBusinessRuleSearchTerms(
  title: string,
  searchKeywords?: string[]
): string[] {
  if (searchKeywords && searchKeywords.length > 0) {
    return expandSearchTerms(searchKeywords);
  }
  return parseBusinessRuleSearchTermsFromTitle(title);
}

function expandSearchTerms(keywords: string[]): string[] {
  const terms = new Set<string>();
  for (const keyword of keywords) {
    const phrase = keyword.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    if (!phrase) continue;
    terms.add(phrase);
    for (const part of phrase.split(/\s+/).filter(w => w.length >= 3)) {
      terms.add(part);
    }
  }
  return [...terms].sort((a, b) => b.length - a.length);
}

/**
 * Extrai termos de busca a partir do título da regra (ex.: RN-Mapa_de_Internação).
 */
export function parseBusinessRuleSearchTermsFromTitle(title: string): string[] {
  const raw = title.trim();
  if (!raw) return [];

  const withoutPrefix = raw.replace(/^(RN|REGRA|BR)[-_\s]*/i, '');
  const phrase = withoutPrefix.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const terms = new Set<string>();

  if (phrase) terms.add(phrase);

  for (const part of phrase.split(/\s+/).filter(w => w.length >= 3)) {
    terms.add(part);
  }

  return [...terms].sort((a, b) => b.length - a.length);
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

  return parts.join(' ').toLowerCase();
}

function scoreTask(task: JiraTask, terms: string[]): { score: number; matchedTerms: string[] } {
  const blob = taskSearchBlob(task);
  const matchedTerms: string[] = [];
  let score = 0;

  for (const term of terms) {
    const t = term.toLowerCase();
    if (!t) continue;
    if (blob.includes(t)) {
      matchedTerms.push(term);
      const weight = Math.min(50, 20 + t.length * 2);
      score += weight;
      if (task.title.toLowerCase().includes(t)) score += 15;
      if (task.id.toLowerCase().includes(t)) score += 5;
    }
  }

  return { score: Math.min(100, score), matchedTerms };
}

function includeParentTasks(
  tasks: JiraTask[],
  matchedIds: Set<string>
): void {
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
  const terms = resolveBusinessRuleSearchTerms(title, searchKeywords);
  if (terms.length === 0 || tasks.length === 0) return [];

  const scored = tasks
    .map(task => {
      const { score, matchedTerms } = scoreTask(task, terms);
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

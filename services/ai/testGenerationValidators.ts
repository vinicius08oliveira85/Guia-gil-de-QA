import type { TestStrategy } from '../../types';

/**
 * Garante que os tipos citados em cada caso existam nas estratégias geradas.
 * Se a IA inventar nomes, mantém apenas os válidos; se vazio, usa o primeiro tipo como fallback.
 */
export function normalizeStrategyReferences(
  strategiesField: string[] | undefined,
  allowedStrategies: TestStrategy[]
): string[] {
  const allowed = allowedStrategies.map((s) => s.testType).filter(Boolean);
  const set = new Set(allowed);
  const raw = Array.isArray(strategiesField) ? strategiesField : [];
  const filtered = raw.filter((x) => typeof x === 'string' && set.has(x));
  if (filtered.length > 0) return filtered;
  if (allowed.length > 0) return [allowed[0]];
  return [];
}

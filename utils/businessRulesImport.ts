import type { BusinessRule } from '../types';

export type BusinessRulesImportParseResult =
  | { ok: true; rules: BusinessRule[]; skipped: number; sourceProject?: string }
  | { ok: false; error: string };

export type BusinessRulesMergeResult = {
  merged: BusinessRule[];
  updatedCount: number;
  addedCount: number;
};

function normalizeRule(row: unknown): BusinessRule | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as Record<string, unknown>;
  if (typeof o.id !== 'string' || !String(o.id).trim()) return null;
  if (typeof o.title !== 'string') return null;
  const title = o.title.trim() || '(sem título)';
  const description = typeof o.description === 'string' ? o.description : '';
  const createdAt =
    typeof o.createdAt === 'string' && o.createdAt.trim() ? o.createdAt.trim() : new Date().toISOString();
  const linkedRaw = o.linkedBusinessRuleIds;
  const linkedBusinessRuleIds = Array.isArray(linkedRaw)
    ? linkedRaw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim())
    : undefined;
  return {
    id: String(o.id).trim(),
    title,
    description,
    createdAt,
    ...(linkedBusinessRuleIds && linkedBusinessRuleIds.length > 0 ? { linkedBusinessRuleIds } : {}),
  };
}

/**
 * Aceita o JSON gerado por `exportBusinessRulesToJSON` ou um array direto de regras.
 */
export function parseBusinessRulesImportJson(raw: string): BusinessRulesImportParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'JSON inválido.' };
  }

  let rows: unknown[];
  let sourceProject: string | undefined;

  if (Array.isArray(data)) {
    rows = data;
  } else if (data && typeof data === 'object' && Array.isArray((data as { businessRules?: unknown }).businessRules)) {
    rows = (data as { businessRules: unknown[] }).businessRules;
    const pn = (data as { projectName?: unknown }).projectName;
    if (typeof pn === 'string' && pn.trim()) sourceProject = pn.trim();
  } else {
    return { ok: false, error: 'Formato esperado: { "businessRules": [...] } ou um array de regras.' };
  }

  const rules: BusinessRule[] = [];
  let skipped = 0;
  for (const row of rows) {
    const n = normalizeRule(row);
    if (n) rules.push(n);
    else skipped += 1;
  }

  if (rules.length === 0) {
    return { ok: false, error: 'Nenhuma regra válida encontrada no arquivo.' };
  }

  return { ok: true, rules, skipped, sourceProject };
}

/**
 * Mescla por `id`: atualiza título/descrição se já existir (mantém `createdAt` local);
 * regras novas são acrescentadas ao final na ordem do arquivo importado.
 */
export function mergeBusinessRulesInto(existing: BusinessRule[], incoming: BusinessRule[]): BusinessRulesMergeResult {
  const existingIdSet = new Set(existing.map((r) => r.id));
  const map = new Map(existing.map((r) => [r.id, { ...r }]));

  const uniqueIncomingIds = new Set<string>();
  for (const inc of incoming) {
    uniqueIncomingIds.add(inc.id);
  }
  let updatedCount = 0;
  let addedCount = 0;
  for (const id of uniqueIncomingIds) {
    if (existingIdSet.has(id)) updatedCount += 1;
    else addedCount += 1;
  }

  for (const inc of incoming) {
    const cur = map.get(inc.id);
    if (cur) {
      map.set(inc.id, {
        ...cur,
        title: inc.title,
        description: inc.description,
        ...(inc.linkedBusinessRuleIds !== undefined
          ? { linkedBusinessRuleIds: inc.linkedBusinessRuleIds }
          : {}),
      });
    } else {
      map.set(inc.id, { ...inc });
    }
  }

  const newIdsInOrder: string[] = [];
  const seenNew = new Set<string>();
  for (const inc of incoming) {
    if (existingIdSet.has(inc.id) || seenNew.has(inc.id)) continue;
    seenNew.add(inc.id);
    newIdsInOrder.push(inc.id);
  }

  const head = existing.map((e) => map.get(e.id)!).filter(Boolean) as BusinessRule[];
  const tail = newIdsInOrder.map((id) => map.get(id)!).filter(Boolean) as BusinessRule[];

  return { merged: [...head, ...tail], updatedCount, addedCount };
}

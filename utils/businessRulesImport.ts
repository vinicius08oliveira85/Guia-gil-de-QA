import type { BusinessRule } from '../types';
import { DEFAULT_BUSINESS_RULE_CATEGORY, normalizeBusinessRule } from './businessRuleDefaults';
import {
  BUSINESS_RULES_EXPORT_FORMAT_ID,
  BUSINESS_RULES_IMPORT_MAX_FORMAT_VERSION,
} from './businessRulesExportEnvelope';

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
    typeof o.createdAt === 'string' && o.createdAt.trim()
      ? o.createdAt.trim()
      : new Date().toISOString();
  const catRaw = o.category;
  const category =
    typeof catRaw === 'string' && catRaw.trim() ? catRaw.trim() : DEFAULT_BUSINESS_RULE_CATEGORY;
  const linkedRaw = o.linkedBusinessRuleIds;
  const linkedBusinessRuleIds = Array.isArray(linkedRaw)
    ? linkedRaw
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map(x => x.trim())
    : undefined;
  const linkedTaskIdsRaw = o.linkedTaskIds;
  const linkedTaskIds = Array.isArray(linkedTaskIdsRaw)
    ? linkedTaskIdsRaw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];
  const searchKeywordsRaw = o.searchKeywords;
  const searchKeywords = Array.isArray(searchKeywordsRaw)
    ? searchKeywordsRaw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : undefined;
  return normalizeBusinessRule({
    id: String(o.id).trim(),
    title,
    description,
    category,
    createdAt,
    linkedTaskIds,
    ...(searchKeywords?.length ? { searchKeywords } : {}),
    ...(linkedBusinessRuleIds && linkedBusinessRuleIds.length > 0 ? { linkedBusinessRuleIds } : {}),
    ...(typeof o.analysis === 'object' && o.analysis ? { analysis: o.analysis as BusinessRule['analysis'] } : {}),
    ...(Array.isArray(o.analysisHistory) ? { analysisHistory: o.analysisHistory as BusinessRule['analysisHistory'] } : {}),
    ...(typeof o.taskSnapshotHash === 'string' ? { taskSnapshotHash: o.taskSnapshotHash } : {}),
    ...(typeof o.isOutdated === 'boolean' ? { isOutdated: o.isOutdated } : {}),
  });
}

/** Valida `format` / `formatVersion` quando presentes (legado sem campos continua válido). */
export function validateBusinessRulesImportEnvelope(obj: Record<string, unknown>): string | null {
  const fmt = obj.format;
  if (fmt === undefined || fmt === null) return null;
  if (typeof fmt !== 'string' || fmt.trim() !== BUSINESS_RULES_EXPORT_FORMAT_ID) {
    return `Formato de arquivo não reconhecido. Se o campo "format" existir, deve ser "${BUSINESS_RULES_EXPORT_FORMAT_ID}".`;
  }
  const fv = obj.formatVersion;
  if (fv === undefined || fv === null) return null;
  if (typeof fv !== 'number' || !Number.isInteger(fv)) {
    return 'O campo formatVersion deve ser um número inteiro.';
  }
  if (fv < 1) return 'formatVersion inválido.';
  if (fv > BUSINESS_RULES_IMPORT_MAX_FORMAT_VERSION) {
    return `Este arquivo usa formatVersion ${fv}, mas esta versão do app suporta até ${BUSINESS_RULES_IMPORT_MAX_FORMAT_VERSION}. Atualize o aplicativo para importar.`;
  }
  return null;
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
  } else if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { businessRules?: unknown }).businessRules)
  ) {
    const obj = data as Record<string, unknown>;
    const envelopeErr = validateBusinessRulesImportEnvelope(obj);
    if (envelopeErr) return { ok: false, error: envelopeErr };
    rows = (data as { businessRules: unknown[] }).businessRules;
    const pn = (data as { projectName?: unknown }).projectName;
    if (typeof pn === 'string' && pn.trim()) sourceProject = pn.trim();
  } else {
    return {
      ok: false,
      error: 'Formato esperado: { "businessRules": [...] } ou um array de regras.',
    };
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
export function mergeBusinessRulesInto(
  existing: BusinessRule[],
  incoming: BusinessRule[]
): BusinessRulesMergeResult {
  const existingIdSet = new Set(existing.map(r => r.id));
  const map = new Map(existing.map(r => [r.id, normalizeBusinessRule(r)]));

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
      map.set(inc.id, normalizeBusinessRule({
        ...cur,
        title: inc.title,
        description: inc.description ?? cur.description,
        category: inc.category?.trim() ? inc.category.trim() : cur.category,
        linkedTaskIds: inc.linkedTaskIds ?? cur.linkedTaskIds,
        searchKeywords: inc.searchKeywords ?? cur.searchKeywords,
        createdAt: cur.createdAt,
        ...(inc.linkedBusinessRuleIds !== undefined
          ? { linkedBusinessRuleIds: inc.linkedBusinessRuleIds }
          : {}),
        ...(inc.analysis ? { analysis: inc.analysis } : {}),
        ...(inc.analysisHistory ? { analysisHistory: inc.analysisHistory } : {}),
        ...(inc.taskSnapshotHash ? { taskSnapshotHash: inc.taskSnapshotHash } : {}),
        ...(inc.isOutdated !== undefined ? { isOutdated: inc.isOutdated } : {}),
      }));
    } else {
      map.set(inc.id, normalizeBusinessRule(inc));
    }
  }

  const newIdsInOrder: string[] = [];
  const seenNew = new Set<string>();
  for (const inc of incoming) {
    if (existingIdSet.has(inc.id) || seenNew.has(inc.id)) continue;
    seenNew.add(inc.id);
    newIdsInOrder.push(inc.id);
  }

  const head = existing.map(e => map.get(e.id)!).filter(Boolean) as BusinessRule[];
  const tail = newIdsInOrder.map(id => map.get(id)!).filter(Boolean) as BusinessRule[];

  return { merged: [...head, ...tail], updatedCount, addedCount };
}

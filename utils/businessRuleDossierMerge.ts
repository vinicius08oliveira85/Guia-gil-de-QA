import type {
  BusinessRuleAnalysis,
  BusinessRuleFunctionalityItem,
  BusinessRuleTaskSheet,
} from '../types';

const PLACEHOLDER = '[A CONFIRMAR]';

function isPlaceholder(value: string | undefined): boolean {
  const trimmed = value?.trim();
  return !trimmed || trimmed === PLACEHOLDER;
}

/** Mescla ficha técnica preservando conteúdo válido anterior quando a IA retorna placeholder. */
export function mergeTaskSheetItem(
  previous: BusinessRuleTaskSheet,
  incoming: BusinessRuleTaskSheet
): BusinessRuleTaskSheet {
  const pick = (field: keyof Omit<BusinessRuleTaskSheet, 'taskId' | 'taskTitle'>) =>
    isPlaceholder(incoming[field]) && !isPlaceholder(previous[field])
      ? previous[field]
      : incoming[field];

  return {
    taskId: incoming.taskId,
    taskTitle: incoming.taskTitle?.trim() || previous.taskTitle,
    implemented: pick('implemented'),
    legacyBefore: pick('legacyBefore'),
    improvedAfter: pick('improvedAfter'),
    purpose: pick('purpose'),
    integratedSystems: pick('integratedSystems'),
    expectedResult: pick('expectedResult'),
  };
}

/**
 * Mescla fichas técnicas após reanálise incremental.
 * Mantém fichas de tasks removidas do vínculo fora do resultado.
 */
export function mergeTaskSheetsForRefresh(
  previous: BusinessRuleTaskSheet[],
  incoming: BusinessRuleTaskSheet[],
  linkedTaskIds: string[]
): BusinessRuleTaskSheet[] {
  const linkedSet = new Set(linkedTaskIds);
  const previousById = new Map(previous.map(s => [s.taskId, s]));
  const incomingById = new Map(incoming.map(s => [s.taskId, s]));
  const result: BusinessRuleTaskSheet[] = [];
  const seen = new Set<string>();

  for (const sheet of previous) {
    if (!linkedSet.has(sheet.taskId)) continue;
    const inc = incomingById.get(sheet.taskId);
    result.push(inc ? mergeTaskSheetItem(sheet, inc) : sheet);
    seen.add(sheet.taskId);
  }

  for (const taskId of linkedTaskIds) {
    if (seen.has(taskId)) continue;
    const inc = incomingById.get(taskId);
    if (inc) {
      result.push(inc);
      seen.add(taskId);
    }
  }

  return result;
}

function mergeByKey<T>(previous: T[], incoming: T[], keyOf: (item: T) => string): T[] {
  const previousByKey = new Map(previous.map(item => [keyOf(item), item]));
  const incomingByKey = new Map(incoming.map(item => [keyOf(item), item]));
  const result: T[] = [];
  const seen = new Set<string>();

  for (const item of previous) {
    const key = keyOf(item);
    const inc = incomingByKey.get(key);
    result.push(inc ?? item);
    seen.add(key);
  }

  for (const item of incoming) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    result.push(item);
    seen.add(key);
  }

  return result;
}

/** Mescla núcleo estruturado do dossiê após modo refresh (preserva conteúdo existente). */
export function mergeDossierAnalysisCore(
  previous: Pick<
    BusinessRuleAnalysis,
    'taskSheets' | 'components' | 'functionalities' | 'integrations' | 'traceability'
  >,
  incoming: Pick<
    BusinessRuleAnalysis,
    'taskSheets' | 'components' | 'functionalities' | 'integrations' | 'traceability'
  >,
  linkedTaskIds: string[]
): Pick<
  BusinessRuleAnalysis,
  'taskSheets' | 'components' | 'functionalities' | 'integrations' | 'traceability'
> {
  return {
    taskSheets: mergeTaskSheetsForRefresh(
      previous.taskSheets ?? [],
      incoming.taskSheets ?? [],
      linkedTaskIds
    ),
    components: mergeByKey(previous.components ?? [], incoming.components ?? [], item =>
      item.name.trim().toLowerCase()
    ),
    functionalities: mergeByKey(
      previous.functionalities ?? [],
      incoming.functionalities ?? [],
      item => item.name.trim().toLowerCase()
    ) as BusinessRuleFunctionalityItem[],
    integrations: mergeByKey(previous.integrations ?? [], incoming.integrations ?? [], item =>
      item.system.trim().toLowerCase()
    ),
    traceability: [...(incoming.traceability ?? previous.traceability ?? [])],
  };
}

import type { BusinessRule, BusinessRuleScreenshot, Project } from '../types';
import { applyBusinessRuleTaskLinks } from './businessRuleTaskLinking';
import { getChangedTaskIds } from './businessRuleTaskSnapshot';

export interface BusinessRuleFormDraft {
  title: string;
  searchKeywords: string[];
  linkedTaskIds: string[];
  screenshots: BusinessRuleScreenshot[];
}

function sortedIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function keywordsEqual(a: string[] | undefined, b: string[]): boolean {
  return JSON.stringify(a ?? []) === JSON.stringify(b);
}

function screenshotIds(screenshots: BusinessRuleScreenshot[]): string[] {
  return sortedIds(screenshots.map(s => s.id));
}

/** Detecta alterações em metadados da regra (sem conteúdo gerado pela IA). */
export function hasBusinessRuleMetadataChanges(
  rule: BusinessRule,
  draft: BusinessRuleFormDraft
): boolean {
  if (rule.title.trim() !== draft.title.trim()) return true;
  if (!keywordsEqual(rule.searchKeywords, draft.searchKeywords)) return true;
  if (JSON.stringify(sortedIds(rule.linkedTaskIds ?? [])) !== JSON.stringify(sortedIds(draft.linkedTaskIds))) {
    return true;
  }
  if (JSON.stringify(screenshotIds(rule.screenshots ?? [])) !== JSON.stringify(screenshotIds(draft.screenshots))) {
    return true;
  }
  return false;
}

export interface SaveBusinessRuleMetadataResult {
  project: Project;
  rule: BusinessRule;
  markedOutdated: boolean;
}

/**
 * Persiste metadados da regra (tasks, keywords, prints) sem reanalisar o dossiê.
 */
export function saveBusinessRuleMetadata(
  project: Project,
  editingRule: BusinessRule | null | undefined,
  draft: BusinessRuleFormDraft
): SaveBusinessRuleMetadataResult {
  const now = new Date().toISOString();
  const title = draft.title.trim();

  const baseRule: BusinessRule = editingRule
    ? { ...editingRule, title, searchKeywords: draft.searchKeywords, screenshots: draft.screenshots }
    : {
        id: crypto.randomUUID(),
        title,
        searchKeywords: draft.searchKeywords,
        createdAt: now,
        linkedTaskIds: draft.linkedTaskIds,
        screenshots: draft.screenshots,
      };

  const linkedProject = applyBusinessRuleTaskLinks(project, baseRule.id, draft.linkedTaskIds);
  let rule: BusinessRule = {
    ...baseRule,
    linkedTaskIds: draft.linkedTaskIds,
    updatedAt: now,
  };

  const metadataChanged = editingRule ? hasBusinessRuleMetadataChanges(editingRule, draft) : true;
  const { hash, changed: tasksChanged } = getChangedTaskIds(
    rule.taskSnapshotHash,
    linkedProject.tasks,
    draft.linkedTaskIds
  );

  let markedOutdated = false;
  if (rule.analysis && (metadataChanged || tasksChanged)) {
    rule = { ...rule, isOutdated: true };
    markedOutdated = true;
  }

  if (tasksChanged && rule.taskSnapshotHash !== hash) {
    // Mantém hash anterior até reanálise; sync service usa comparação para marcar outdated.
  }

  const rules = linkedProject.businessRules.some(r => r.id === rule.id)
    ? linkedProject.businessRules.map(r => (r.id === rule.id ? rule : r))
    : [...linkedProject.businessRules, rule];

  return {
    project: { ...linkedProject, businessRules: rules },
    rule,
    markedOutdated,
  };
}

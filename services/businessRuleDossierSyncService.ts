import type { Project } from '../types';
import { getJiraConfig } from './jiraService';
import { refreshBusinessRuleDossier } from './ai/businessRuleDossierService';
import { getChangedTaskIds } from '../utils/businessRuleTaskSnapshot';
import { logger } from '../utils/logger';

const DEBOUNCE_MS = 2 * 60 * 1000;
const lastRefreshAtByRule = new Map<string, number>();

export interface BusinessRuleDossierSyncCallbacks {
  onAnalyzing?: (ruleId: string, analyzing: boolean) => void;
  onRuleUpdated?: (ruleId: string) => void;
}

/**
 * Reanalisa dossiês cujas tasks vinculadas mudaram após sync Jira.
 * @returns Quantidade de regras reanalisadas.
 */
export async function syncBusinessRuleDossiersAfterJira(
  project: Project,
  onUpdateProject: (project: Project) => void | Promise<void>,
  callbacks?: BusinessRuleDossierSyncCallbacks
): Promise<number> {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return 0;
  if (!getJiraConfig()) return 0;

  let current = project;
  let refreshedCount = 0;

  for (const rule of project.businessRules) {
    if (!rule.analysis || rule.linkedTaskIds.length === 0) continue;

    const { hash, changed } = getChangedTaskIds(
      rule.taskSnapshotHash,
      current.tasks,
      rule.linkedTaskIds
    );

    if (!changed) continue;

    const lastAt = lastRefreshAtByRule.get(rule.id) ?? 0;
    if (Date.now() - lastAt < DEBOUNCE_MS) {
      if (!rule.isOutdated) {
        current = {
          ...current,
          businessRules: current.businessRules.map(r =>
            r.id === rule.id ? { ...r, isOutdated: true, taskSnapshotHash: hash } : r
          ),
        };
        await onUpdateProject(current);
      }
      continue;
    }

    callbacks?.onAnalyzing?.(rule.id, true);
    try {
      const latestRule = current.businessRules.find(r => r.id === rule.id) ?? rule;
      const { rule: updatedRule } = await refreshBusinessRuleDossier(current, latestRule);
      current = {
        ...current,
        businessRules: current.businessRules.map(r => (r.id === updatedRule.id ? updatedRule : r)),
      };
      await onUpdateProject(current);
      lastRefreshAtByRule.set(rule.id, Date.now());
      refreshedCount += 1;
      callbacks?.onRuleUpdated?.(rule.id);
      logger.info('Dossiê reanalisado após sync Jira', 'businessRuleDossierSyncService', {
        ruleId: rule.id,
        version: updatedRule.analysis?.version,
      });
    } catch (error) {
      logger.warn('Falha ao reanalisar dossiê após sync Jira', 'businessRuleDossierSyncService', {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : String(error),
      });
      current = {
        ...current,
        businessRules: current.businessRules.map(r =>
          r.id === rule.id ? { ...r, isOutdated: true } : r
        ),
      };
      await onUpdateProject(current);
    } finally {
      callbacks?.onAnalyzing?.(rule.id, false);
    }
  }

  return refreshedCount;
}

/** Limpa debounce (útil em testes). */
export function resetBusinessRuleDossierSyncDebounce(): void {
  lastRefreshAtByRule.clear();
}

export const JIRA_AUTO_SYNC_COMPLETE_EVENT = 'jira-auto-sync-complete';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '../types';
import { useProjectsStore } from '../store/projectsStore';
import {
  JIRA_AUTO_SYNC_COMPLETE_EVENT,
  syncBusinessRuleDossiersAfterJira,
} from '../services/businessRuleDossierSyncService';
import toast from 'react-hot-toast';

/**
 * Escuta sync Jira e reanalisa dossiês de regras de negócio automaticamente.
 */
export function useBusinessRuleDossierSync(
  project: Project | null,
  onUpdateProject: (project: Project) => void | Promise<void>
): string[] {
  const [analyzingRuleIds, setAnalyzingRuleIds] = useState<string[]>([]);
  const syncInProgressRef = useRef(false);
  const projectIdRef = useRef(project?.id);

  projectIdRef.current = project?.id;

  const setAnalyzing = useCallback((ruleId: string, analyzing: boolean) => {
    setAnalyzingRuleIds(prev => {
      const s = new Set(prev);
      if (analyzing) s.add(ruleId);
      else s.delete(ruleId);
      return [...s];
    });
  }, []);

  const runSync = useCallback(async () => {
    if (syncInProgressRef.current) return;
    const projectId = projectIdRef.current;
    if (!projectId) return;

    const latest = useProjectsStore.getState().projects.find(p => p.id === projectId);
    if (!latest) return;

    syncInProgressRef.current = true;
    try {
      const count = await syncBusinessRuleDossiersAfterJira(latest, onUpdateProject, {
        onAnalyzing: setAnalyzing,
      });
      if (count > 0) {
        toast.success(
          count === 1
            ? '1 dossiê de regra reanalisado após sync Jira.'
            : `${count} dossiês reanalisados após sync Jira.`
        );
      }
    } finally {
      syncInProgressRef.current = false;
    }
  }, [onUpdateProject, setAnalyzing]);

  useEffect(() => {
    const handler = () => {
      void runSync();
    };
    window.addEventListener(JIRA_AUTO_SYNC_COMPLETE_EVENT, handler);
    return () => window.removeEventListener(JIRA_AUTO_SYNC_COMPLETE_EVENT, handler);
  }, [runSync]);

  return analyzingRuleIds;
}

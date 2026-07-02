import { useEffect, useState } from 'react';
import type { JiraTask } from '../types';
import { getJiraConfig } from '../services/jiraService';
import {
  fetchIssueAttachedForms,
  type JiraAttachedForm,
} from '../services/jira/attachedForms';
import { isJiraIntegratedTask } from '../utils/jiraAttachedFormsField';
import { logger } from '../utils/logger';

export interface UseJiraAttachedFormsResult {
  forms: JiraAttachedForm[];
  loading: boolean;
  fetched: boolean;
  error: string | null;
  shouldShow: boolean;
}

/**
 * Carrega formulários anexados do Jira ao abrir o resumo da tarefa.
 */
export function useJiraAttachedForms(task: JiraTask): UseJiraAttachedFormsResult {
  const [forms, setForms] = useState<JiraAttachedForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldShow = isJiraIntegratedTask(task) && !!getJiraConfig();

  useEffect(() => {
    if (!shouldShow) {
      setForms([]);
      setLoading(false);
      setFetched(false);
      setError(null);
      return;
    }

    const config = getJiraConfig();
    if (!config) return;

    let cancelled = false;
    setLoading(true);
    setFetched(false);
    setError(null);

    fetchIssueAttachedForms(config, task.id)
      .then(result => {
        if (cancelled) return;
        setForms(result);
      })
      .catch(err => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Erro ao carregar formulários';
        logger.debug('Falha ao buscar formulários anexados', 'useJiraAttachedForms', {
          taskId: task.id,
          message,
        });
        setError(message);
        setForms([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setFetched(true);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldShow, task.id]);

  return { forms, loading, fetched, error, shouldShow };
}

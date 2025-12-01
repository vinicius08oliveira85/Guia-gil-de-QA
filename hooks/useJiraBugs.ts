import { useState, useEffect, useCallback } from 'react';
import { Project, JiraTask } from '../types';
import { getJiraConfig } from '../services/jiraService';
import { syncBugsFromJira } from '../services/jiraBugsService';
import { useProjectsStore } from '../store/projectsStore';
import { logger } from '../utils/logger';

/**
 * Hook para buscar e sincronizar bugs do Jira
 */
export const useJiraBugs = (project: Project) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { updateProject } = useProjectsStore();

  const projectKey = project.settings?.jiraProjectKey;

  const syncBugs = useCallback(async () => {
    if (!projectKey) {
      logger.debug('Nenhuma chave de projeto Jira configurada', 'useJiraBugs');
      return;
    }

    const config = getJiraConfig();
    if (!config) {
      logger.debug('Configuração do Jira não encontrada', 'useJiraBugs');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newBugs = await syncBugsFromJira(projectKey, project.tasks);

      if (newBugs.length > 0) {
        const updatedProject: Project = {
          ...project,
          tasks: [...project.tasks, ...newBugs],
        };

        await updateProject(updatedProject);
        logger.info(`${newBugs.length} novos bugs sincronizados do Jira`, 'useJiraBugs');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao sincronizar bugs do Jira');
      logger.error('Erro ao sincronizar bugs', 'useJiraBugs', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [project, projectKey, updateProject]);

  // Sincronizar automaticamente quando o projeto carregar (se configurado)
  useEffect(() => {
    if (projectKey && getJiraConfig()) {
      // Sincronizar após um pequeno delay para não bloquear renderização inicial
      const timer = setTimeout(() => {
        syncBugs();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [projectKey]); // Apenas quando projectKey mudar

  return {
    syncBugs,
    isLoading,
    error,
    hasJiraConfig: !!getJiraConfig() && !!projectKey,
  };
};


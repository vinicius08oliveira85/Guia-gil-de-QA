import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { Project } from '../types';
import { getJiraConfig } from '../services/jiraService';
import { syncBugsFromJira } from '../services/jiraBugsService';
import { jiraSyncQueue } from '../services/jiraSyncQueue';
import { useProjectsStore } from '../store/projectsStore';
import { logger } from '../utils/logger';

/**
 * Hook para buscar e sincronizar bugs do Jira (via fila singleton).
 */
export const useJiraBugs = (project: Project) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { updateProject } = useProjectsStore();
  const projectRef = useRef(project);

  useLayoutEffect(() => {
    projectRef.current = project;
  }, [project]);

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
      await jiraSyncQueue.enqueue(`bugs-${project.id}`, async () => {
        const latestProject = projectRef.current;
        const { updatedBugs, newBugs } = await syncBugsFromJira(projectKey, latestProject.tasks);

        if (updatedBugs.length > 0 || newBugs.length > 0) {
          const tasksMap = new Map(latestProject.tasks.map(t => [t.id, t]));

          updatedBugs.forEach(bug => {
            tasksMap.set(bug.id, bug);
          });
          newBugs.forEach(bug => {
            tasksMap.set(bug.id, bug);
          });

          const updatedProject: Project = {
            ...latestProject,
            tasks: Array.from(tasksMap.values()),
          };

          await updateProject(updatedProject);

          const messages: string[] = [];
          if (updatedBugs.length > 0) {
            messages.push(`${updatedBugs.length} bug(s) atualizado(s)`);
          }
          if (newBugs.length > 0) {
            messages.push(`${newBugs.length} novo(s) bug(s) adicionado(s)`);
          }
          logger.info(messages.join(' e ') + ' do Jira', 'useJiraBugs');
        }
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('Substituído por nova solicitação')) {
        logger.debug('Sync de bugs substituída por nova solicitação', 'useJiraBugs');
        return;
      }
      const error = err instanceof Error ? err : new Error('Erro ao sincronizar bugs do Jira');
      logger.error('Erro ao sincronizar bugs', 'useJiraBugs', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [projectKey, project.id, updateProject]);

  useEffect(() => {
    if (!(projectKey && getJiraConfig())) {
      return;
    }

    const timer = setTimeout(() => {
      void syncBugs();
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectKey, syncBugs]);

  return {
    syncBugs,
    isLoading,
    error,
    hasJiraConfig: !!getJiraConfig() && !!projectKey,
  };
};

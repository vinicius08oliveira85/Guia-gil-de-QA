import { useState, useEffect, useCallback } from 'react';
import { Project } from '../types';
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
      const { updatedBugs, newBugs } = await syncBugsFromJira(projectKey, project.tasks);

      if (updatedBugs.length > 0 || newBugs.length > 0) {
        // Criar um Map de tarefas existentes para atualização eficiente
        const tasksMap = new Map(project.tasks.map(t => [t.id, t]));
        
        // Atualizar bugs existentes
        updatedBugs.forEach(bug => {
          tasksMap.set(bug.id, bug);
        });
        
        // Adicionar novos bugs
        newBugs.forEach(bug => {
          tasksMap.set(bug.id, bug);
        });

        const updatedProject: Project = {
          ...project,
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
    if (!(projectKey && getJiraConfig())) {
      return;
    }

    // Sincronizar após um pequeno delay para não bloquear renderização inicial
    const timer = setTimeout(() => {
      syncBugs();
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectKey, syncBugs]); // Apenas quando projectKey mudar

  return {
    syncBugs,
    isLoading,
    error,
    hasJiraConfig: !!getJiraConfig() && !!projectKey,
  };
};


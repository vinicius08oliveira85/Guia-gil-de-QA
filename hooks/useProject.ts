import { useCallback } from 'react';
import { useProjectsStore } from '../store/projectsStore';
import { Project, JiraTask } from '../types';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook auxiliar para trabalhar com projetos do store
 * Simplifica o uso do store em componentes
 */
export const useProject = (projectId: string | null) => {
  const { 
    projects, 
    getSelectedProject,
    updateProject: updateProjectInStore,
    addTaskToProject: addTaskInStore,
    updateTaskInProject: updateTaskInStore,
    deleteTaskFromProject: deleteTaskInStore,
  } = useProjectsStore();
  
  const { handleError, handleSuccess } = useErrorHandler();
  
  const project = projectId 
    ? projects.find(p => p.id === projectId) 
    : getSelectedProject();

  /**
   * Atualiza o projeto atual
   */
  const updateProject = useCallback(async (updatedProject: Project) => {
    if (!project) {
      handleError(new Error('Projeto não encontrado'), 'useProject');
      return;
    }
    
    try {
      await updateProjectInStore(updatedProject);
      handleSuccess('Projeto atualizado com sucesso!');
    } catch (error) {
      handleError(error, 'Atualizar projeto');
    }
  }, [project, updateProjectInStore, handleError, handleSuccess]);

  /**
   * Adiciona uma tarefa ao projeto
   */
  const addTask = useCallback(async (task: JiraTask) => {
    if (!project) {
      handleError(new Error('Projeto não encontrado'), 'useProject');
      return;
    }
    
    try {
      await addTaskInStore(project.id, task);
      handleSuccess('Tarefa adicionada com sucesso!');
    } catch (error) {
      handleError(error, 'Adicionar tarefa');
    }
  }, [project, addTaskInStore, handleError, handleSuccess]);

  /**
   * Atualiza uma tarefa do projeto
   */
  const updateTask = useCallback(async (taskId: string, updates: Partial<JiraTask>) => {
    if (!project) {
      handleError(new Error('Projeto não encontrado'), 'useProject');
      return;
    }
    
    try {
      await updateTaskInStore(project.id, taskId, updates);
      handleSuccess('Tarefa atualizada com sucesso!');
    } catch (error) {
      handleError(error, 'Atualizar tarefa');
    }
  }, [project, updateTaskInStore, handleError, handleSuccess]);

  /**
   * Remove uma tarefa do projeto
   */
  const deleteTask = useCallback(async (taskId: string) => {
    if (!project) {
      handleError(new Error('Projeto não encontrado'), 'useProject');
      return;
    }
    
    try {
      await deleteTaskInStore(project.id, taskId);
      handleSuccess('Tarefa removida com sucesso!');
    } catch (error) {
      handleError(error, 'Remover tarefa');
    }
  }, [project, deleteTaskInStore, handleError, handleSuccess]);

  return {
    project,
    updateProject,
    addTask,
    updateTask,
    deleteTask,
    isLoading: !project && projects.length > 0,
  };
};


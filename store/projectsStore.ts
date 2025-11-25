import { create } from 'zustand';
import { Project, JiraTask } from '../types';
import { 
  getAllProjects, 
  addProject, 
  updateProject, 
  deleteProject 
} from '../services/dbService';
import { createProjectFromTemplate } from '../utils/projectTemplates';
import { PHASE_NAMES } from '../utils/constants';
import { addAuditLog } from '../utils/auditLog';
import { logger } from '../utils/logger';

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  loadProjects: () => Promise<void>;
  createProject: (name: string, description: string, templateId?: string) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  selectProject: (projectId: string | null) => void;
  addTaskToProject: (projectId: string, task: JiraTask) => Promise<void>;
  updateTaskInProject: (projectId: string, taskId: string, updates: Partial<JiraTask>) => Promise<void>;
  deleteTaskFromProject: (projectId: string, taskId: string) => Promise<void>;
  getSelectedProject: () => Project | undefined;
  importProject: (project: Project) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  isLoading: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      logger.debug('Carregando projetos...', 'ProjectsStore');
      const projects = await getAllProjects();
      set({ projects, isLoading: false });
      logger.info(`Projetos carregados: ${projects.length}`, 'ProjectsStore');
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Erro ao carregar projetos');
      logger.error('Erro ao carregar projetos', 'ProjectsStore', errorObj);
      set({ 
        error: errorObj,
        isLoading: false 
      });
    }
  },

  createProject: async (name: string, description: string, templateId?: string) => {
    try {
      logger.debug(`Criando projeto: ${name}`, 'ProjectsStore', { templateId });
      let newProject: Project;
      
      if (templateId) {
        newProject = createProjectFromTemplate(templateId, name, description);
      } else {
        newProject = {
          id: `proj-${Date.now()}`,
          name,
          description,
          documents: [],
          tasks: [],
          phases: PHASE_NAMES.map(name => ({ name, status: 'Não Iniciado' })),
        };
      }
      
      await addProject(newProject);
      set((state) => ({
        projects: [...state.projects, newProject],
      }));
      
      addAuditLog({
        action: 'CREATE',
        entityType: 'project',
        entityId: newProject.id,
        entityName: newProject.name
      });
      
      logger.info(`Projeto criado: ${newProject.id}`, 'ProjectsStore');
      return newProject;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Erro ao criar projeto');
      logger.error('Erro ao criar projeto', 'ProjectsStore', errorObj);
      set({ 
        error: errorObj,
      });
      throw error;
    }
  },

  updateProject: async (project: Project) => {
    try {
      const state = get();
      const oldProject = state.projects.find((p) => p.id === project.id);
      
      await updateProject(project);
      set((state) => ({
        projects: state.projects.map((p) => 
          p.id === project.id ? project : p
        ),
      }));
      
      if (oldProject) {
        addAuditLog({
          action: 'UPDATE',
          entityType: 'project',
          entityId: project.id,
          entityName: project.name,
          changes: {
            name: { old: oldProject.name, new: project.name },
            description: { old: oldProject.description, new: project.description }
          }
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Erro ao atualizar projeto'),
      });
      throw error;
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      const state = get();
      const project = state.projects.find((p) => p.id === projectId);
      
      await deleteProject(projectId);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId,
      }));
      
      if (project) {
        addAuditLog({
          action: 'DELETE',
          entityType: 'project',
          entityId: projectId,
          entityName: project.name
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Erro ao deletar projeto'),
      });
      throw error;
    }
  },

  selectProject: (projectId: string | null) => {
    set({ selectedProjectId: projectId });
  },

  addTaskToProject: async (projectId: string, task: JiraTask) => {
    const state = get();
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    const updatedProject: Project = {
      ...project,
      tasks: [...project.tasks, task],
    };

    await get().updateProject(updatedProject);
  },

  updateTaskInProject: async (projectId: string, taskId: string, updates: Partial<JiraTask>) => {
    const state = get();
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    const updatedProject: Project = {
      ...project,
      tasks: project.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    };

    await get().updateProject(updatedProject);
  },

  deleteTaskFromProject: async (projectId: string, taskId: string) => {
    const state = get();
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    const updatedProject: Project = {
      ...project,
      tasks: project.tasks.filter((task) => task.id !== taskId),
    };

    await get().updateProject(updatedProject);
  },

  getSelectedProject: () => {
    const state = get();
    return state.projects.find((p) => p.id === state.selectedProjectId);
  },

  importProject: async (project: Project) => {
    try {
      await addProject(project);
      set((state) => {
        // Verificar se projeto já existe
        const exists = state.projects.some((p) => p.id === project.id);
        if (exists) {
          return {
            projects: state.projects.map((p) => 
              p.id === project.id ? project : p
            ),
          };
        }
        return {
          projects: [...state.projects, project],
        };
      });
      
      addAuditLog({
        action: 'CREATE',
        entityType: 'project',
        entityId: project.id,
        entityName: project.name
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Erro ao importar projeto'),
      });
      throw error;
    }
  },
}));


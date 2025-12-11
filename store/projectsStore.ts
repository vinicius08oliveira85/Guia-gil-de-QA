import { create } from 'zustand';
import { Project, JiraTask } from '../types';
import { 
  getAllProjects,
  loadProjectsFromIndexedDB,
  addProject, 
  updateProject, 
  deleteProject,
  saveProjectToSupabaseOnly
} from '../services/dbService';
import { loadProjectsFromSupabase, isSupabaseAvailable } from '../services/supabaseService';
import { migrateTestCases } from '../utils/testCaseMigration';
import { cleanupTestCasesForProjects } from '../utils/testCaseCleanup';
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
  syncProjectsFromSupabase: () => Promise<void>;
  saveProjectToSupabase: (projectId: string) => Promise<void>;
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
      logger.debug('Carregando projetos do IndexedDB (fase rápida)...', 'ProjectsStore');
      
      // Fase 1: Carregar rapidamente do IndexedDB
      const indexedDBProjects = await loadProjectsFromIndexedDB();
      set({ projects: indexedDBProjects, isLoading: false });
      logger.info(`Projetos carregados do IndexedDB: ${indexedDBProjects.length}`, 'ProjectsStore');
      
      // Fase 2: Sincronizar com Supabase em background (não bloqueia UI)
      if (isSupabaseAvailable()) {
        // Não usar await - executar em background
        get().syncProjectsFromSupabase().catch((error) => {
          logger.warn('Erro ao sincronizar com Supabase em background', 'ProjectsStore', error);
        });
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Erro ao carregar projetos');
      logger.error('Erro ao carregar projetos', 'ProjectsStore', errorObj);
      set({ 
        error: errorObj,
        isLoading: false 
      });
    }
  },

  syncProjectsFromSupabase: async () => {
    try {
      logger.debug('Sincronizando projetos do Supabase em background...', 'ProjectsStore');
      const supabaseProjects = await loadProjectsFromSupabase();
      
      if (supabaseProjects.length === 0) {
        logger.debug('Nenhum projeto encontrado no Supabase', 'ProjectsStore');
        return;
      }
      
      // Migrar TestCases dos projetos do Supabase (otimizado)
      const migratedSupabaseProjects = supabaseProjects.map(project => ({
        ...project,
        tasks: project.tasks.map(task => ({
          ...task,
          testCases: migrateTestCases(task.testCases || [])
        }))
      }));
      
      const state = get();
      const currentProjects = state.projects;
      
      // Fazer merge: criar um Map com ID como chave, priorizando Supabase
      const projectsMap = new Map<string, Project>();
      
      // Primeiro adicionar projetos atuais (IndexedDB)
      currentProjects.forEach(project => {
        projectsMap.set(project.id, project);
      });
      
      // Depois sobrescrever/atualizar com projetos do Supabase (prioridade)
      migratedSupabaseProjects.forEach(project => {
        projectsMap.set(project.id, project);
      });
      
      const mergedProjects = Array.from(projectsMap.values());
      
      // Limpar casos de teste de tipos não permitidos
      const cleanedProjects = cleanupTestCasesForProjects(mergedProjects);
      
      set({ projects: cleanedProjects });
      logger.info(`Projetos sincronizados do Supabase: ${cleanedProjects.length} (${supabaseProjects.length} do Supabase + ${currentProjects.length} do cache local)`, 'ProjectsStore');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Log mais detalhado para erros CORS ou timeout
      if (errorMessage.includes('CORS') || errorMessage.includes('cors')) {
        logger.warn('Erro CORS ao sincronizar projetos do Supabase. Configure VITE_SUPABASE_PROXY_URL.', 'ProjectsStore', error);
      } else if (errorMessage.includes('Timeout') || errorMessage.includes('timeout')) {
        logger.warn('Timeout ao sincronizar projetos do Supabase. Usando cache local.', 'ProjectsStore', error);
      } else {
        logger.warn('Erro ao sincronizar projetos do Supabase', 'ProjectsStore', error);
      }
      // Não atualizar estado em caso de erro - manter projetos do IndexedDB
    }
  },

  saveProjectToSupabase: async (projectId: string) => {
    const state = get();
    const project = state.projects.find((p) => p.id === projectId);
    
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    if (!isSupabaseAvailable()) {
      throw new Error('Supabase não está disponível. Configure VITE_SUPABASE_PROXY_URL.');
    }

    try {
      logger.debug(`Salvando projeto "${project.name}" no Supabase...`, 'ProjectsStore');
      await saveProjectToSupabaseOnly(project);
      // Log reduzido - apenas debug para evitar spam de "Success"
      logger.debug(`Projeto "${project.name}" salvo no Supabase`, 'ProjectsStore');
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Erro ao salvar projeto no Supabase');
      const errorMessage = errorObj.message.toLowerCase();
      
      // Verificar se é erro de rede - não logar como error se for
      const isNetworkErr = errorMessage.includes('timeout') || 
                          errorMessage.includes('connection reset') ||
                          errorMessage.includes('err_timed_out') ||
                          errorMessage.includes('err_connection_reset') ||
                          errorMessage.includes('err_name_not_resolved') ||
                          errorMessage.includes('failed to fetch') ||
                          errorMessage.includes('network');
      
      // Tratamento específico para erro 413 (Payload Too Large)
      if (errorMessage.includes('413') || 
          errorMessage.includes('payload muito grande') || 
          errorMessage.includes('content too large')) {
        logger.debug(
          `Projeto "${project.name}" muito grande para Supabase. Salvo apenas localmente.`,
          'ProjectsStore'
        );
        // Não lançar erro para 413 - apenas logar aviso
        // O projeto já está salvo localmente
        return;
      }
      
      // Se for erro de rede, não lançar erro (evita loop) - apenas logar debug
      if (isNetworkErr) {
        logger.debug('Erro de rede ao salvar projeto no Supabase. Projeto salvo apenas localmente.', 'ProjectsStore', errorObj);
        return; // Não lançar erro para evitar loop
      }
      
      logger.warn('Erro ao salvar projeto no Supabase', 'ProjectsStore', errorObj);
      throw errorObj;
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


import { create } from 'zustand';
import { Project, JiraTask } from '../types';
import { 
  loadProjectsFromIndexedDB,
  addProject, 
  updateProject, 
  deleteProject,
  saveProjectToSupabaseOnly
} from '../services/dbService';
import { loadProjectsFromSupabase, isSupabaseAvailable } from '../services/supabaseService';
import { autoBackupBeforeOperation, createBackup } from '../services/backupService';
import { migrateTestCases } from '../utils/testCaseMigration';
import { cleanupTestCasesForProjects } from '../utils/testCaseCleanup';
import { mergeProjectsList } from '../utils/projectMerge';
import { createProjectFromTemplate } from '../utils/projectTemplates';
import { PHASE_NAMES } from '../utils/constants';
import { addAuditLog } from '../utils/auditLog';
import { logger } from '../utils/logger';

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: Error | null;
  /** true quando a última tentativa de carregar do Supabase falhou (proxy/DB indisponível) */
  supabaseLoadFailed: boolean;
  /** Mensagem de erro retornada pelo proxy/Supabase (ex.: "Supabase não configurado") */
  supabaseLoadError: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  syncProjectsFromSupabase: () => Promise<void>;
  saveProjectToSupabase: (projectId: string) => Promise<void>;
  createProject: (name: string, description: string, templateId?: string) => Promise<Project>;
  updateProject: (project: Project, options?: { silent?: boolean }) => Promise<void>;
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
  supabaseLoadFailed: false,
  supabaseLoadError: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null, supabaseLoadFailed: false, supabaseLoadError: null });
    try {
      let supabaseProjects: Project[] = [];
      let supabaseLoadFailed = false;
      let supabaseLoadError: string | null = null;
      let indexedDBProjects: Project[] = [];

      // Fase 1: Tentar carregar do Supabase primeiro (se disponível)
      if (isSupabaseAvailable()) {
        logger.debug('Carregando projetos do Supabase primeiro...', 'ProjectsStore');
        const result = await loadProjectsFromSupabase();
        supabaseProjects = result.projects;
        supabaseLoadFailed = result.loadFailed;
        supabaseLoadError = result.errorMessage ?? null;
        if (supabaseProjects.length > 0) {
          logger.info(`Projetos carregados do Supabase: ${supabaseProjects.length}`, 'ProjectsStore');
        } else {
          logger.debug('Nenhum projeto encontrado no Supabase', 'ProjectsStore');
        }
      }
      
      // Fase 2: Carregar do IndexedDB (para merge ou fallback)
      try {
        logger.debug('Carregando projetos do IndexedDB...', 'ProjectsStore');
        indexedDBProjects = await loadProjectsFromIndexedDB();
        logger.info(`Projetos carregados do IndexedDB: ${indexedDBProjects.length}`, 'ProjectsStore');
      } catch (error) {
        logger.error('Erro ao carregar do IndexedDB', 'ProjectsStore', error);
        // Se IndexedDB falhar e não temos Supabase, lançar erro
        if (supabaseProjects.length === 0) {
          throw error;
        }
        // Se temos Supabase, continuar apenas com Supabase
        indexedDBProjects = [];
      }
      
      // Fase 3: Fazer merge inteligente dos dados (preservando dados mais recentes)
      let finalProjects: Project[];
      
      if (supabaseProjects.length > 0 && indexedDBProjects.length > 0) {
        // Criar backup antes de fazer merge (proteção contra perda de dados)
        try {
          const projectsToBackup = indexedDBProjects.filter(p => 
            supabaseProjects.some(sp => sp.id === p.id)
          );
          
          if (projectsToBackup.length > 0) {
            logger.debug(`Criando backups antes de merge para ${projectsToBackup.length} projetos`, 'ProjectsStore');
            await Promise.all(
              projectsToBackup.map(project =>
                createBackup(project, 'MERGE', 'Backup automático antes de merge Supabase/IndexedDB')
                  .catch(error => {
                    logger.warn(`Erro ao criar backup antes de merge para ${project.id}`, 'ProjectsStore', error);
                  })
              )
            );
          }
        } catch (error) {
          logger.warn('Erro ao criar backups antes de merge (continuando)', 'ProjectsStore', error);
        }
        
        // Migrar TestCases dos projetos do Supabase
        const migratedSupabaseProjects = supabaseProjects.map(project => ({
          ...project,
          tasks: (project.tasks || []).map(task => ({
            ...task,
            testCases: migrateTestCases(task.testCases || [])
          }))
        }));
        
        // Fazer merge inteligente preservando dados mais recentes
        finalProjects = mergeProjectsList(indexedDBProjects, migratedSupabaseProjects);
        
        // Limpar casos de teste de tipos não permitidos
        finalProjects = cleanupTestCasesForProjects(finalProjects);
        
        logger.info(
          `Projetos carregados com merge inteligente: ${finalProjects.length} (${supabaseProjects.length} do Supabase + ${indexedDBProjects.length} do cache local)`,
          'ProjectsStore'
        );
      } else if (supabaseProjects.length > 0) {
        // Apenas Supabase disponível
        const migratedSupabaseProjects = supabaseProjects.map(project => ({
          ...project,
          tasks: (project.tasks || []).map(task => ({
            ...task,
            testCases: migrateTestCases(task.testCases || [])
          }))
        }));
        finalProjects = cleanupTestCasesForProjects(migratedSupabaseProjects);
        logger.info(`Projetos carregados do Supabase: ${finalProjects.length}`, 'ProjectsStore');
      } else {
        // Apenas IndexedDB disponível
        finalProjects = indexedDBProjects;
        logger.info(`Projetos carregados do IndexedDB: ${finalProjects.length}`, 'ProjectsStore');
      }

      set({ projects: finalProjects, isLoading: false, supabaseLoadFailed, supabaseLoadError });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Erro ao carregar projetos');
      logger.error('Erro ao carregar projetos', 'ProjectsStore', errorObj);
      set({
        error: errorObj,
        isLoading: false,
        supabaseLoadFailed: false,
        supabaseLoadError: null,
      });
    }
  },

  syncProjectsFromSupabase: async () => {
    try {
      logger.debug('Sincronizando projetos do Supabase em background...', 'ProjectsStore');
      const { projects: supabaseProjects } = await loadProjectsFromSupabase();
      
      if (supabaseProjects.length === 0) {
        logger.debug('Nenhum projeto encontrado no Supabase', 'ProjectsStore');
        return;
      }
      
      // Migrar TestCases dos projetos do Supabase (otimizado)
      const migratedSupabaseProjects = supabaseProjects.map(project => ({
        ...project,
        tasks: (project.tasks || []).map(task => ({
          ...task,
          testCases: migrateTestCases(task.testCases || [])
        }))
      }));
      
      const state = get();
      const currentProjects = state.projects;
      
      // Criar backup antes de fazer merge (proteção contra perda de dados)
      try {
        const projectsToBackup = currentProjects.filter(p => 
          migratedSupabaseProjects.some(sp => sp.id === p.id)
        );
        
        if (projectsToBackup.length > 0) {
          logger.debug(`Criando backups antes de sync para ${projectsToBackup.length} projetos`, 'ProjectsStore');
          await Promise.all(
            projectsToBackup.map(project =>
              createBackup(project, 'SYNC', 'Backup automático antes de sincronização Supabase')
                .catch(error => {
                  logger.warn(`Erro ao criar backup antes de sync para ${project.id}`, 'ProjectsStore', error);
                })
            )
          );
        }
      } catch (error) {
        logger.warn('Erro ao criar backups antes de sync (continuando)', 'ProjectsStore', error);
      }
      
      // Fazer merge inteligente preservando dados mais recentes
      const mergedProjects = mergeProjectsList(currentProjects, migratedSupabaseProjects);
      
      // Limpar casos de teste de tipos não permitidos
      const cleanedProjects = cleanupTestCasesForProjects(mergedProjects);
      
      set({ projects: cleanedProjects });
      logger.info(`Projetos sincronizados do Supabase com merge inteligente: ${cleanedProjects.length} (${supabaseProjects.length} do Supabase + ${currentProjects.length} do cache local)`, 'ProjectsStore');
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

  updateProject: async (project: Project, options?: { silent?: boolean }) => {
    try {
      const state = get();
      const oldProject = state.projects.find((p) => p.id === project.id);
      
      logger.debug('updateProject chamado no store', 'ProjectsStore', {
        projectId: project.id,
        temProjetoAntigo: !!oldProject,
        silent: options?.silent || false
      });
      
      // PROTEÇÃO: Verificar se há perda de status executados ao substituir projeto
      let finalProject = project;
      if (oldProject) {
        logger.debug('Verificando perda de status executados ao substituir projeto', 'ProjectsStore', {
          projectId: project.id,
          totalStatusNoProjetoAntigo: oldProject.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length,
          totalStatusNoProjetoNovo: project.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length
        });
        // Criar mapa de status executados do projeto antigo
        const oldStatusMap = new Map<string, { taskId: string; testCaseId: string; status: string }>();
        oldProject.tasks.forEach(task => {
          (task.testCases || []).forEach(tc => {
            if (tc.id && tc.status !== 'Not Run') {
              oldStatusMap.set(`${task.id}-${tc.id}`, {
                taskId: task.id,
                testCaseId: tc.id,
                status: tc.status
              });
            }
          });
        });
        
        // Verificar se algum status foi perdido no novo projeto
        let statusPerdidos = 0;
        const restoredTasks = project.tasks.map(task => {
          const restoredTestCases = (task.testCases || []).map(tc => {
            const oldStatus = oldStatusMap.get(`${task.id}-${tc.id}`);
            if (oldStatus && tc.status === 'Not Run') {
              // Status executado foi perdido - restaurar do projeto antigo
              statusPerdidos++;
              logger.warn(`Status perdido detectado em updateProject do store: taskId=${task.id}, testCaseId=${tc.id}. Restaurando status "${oldStatus.status}" do projeto antigo`, 'ProjectsStore');
              return { ...tc, status: oldStatus.status as typeof tc.status };
            }
            return tc;
          });
          return { ...task, testCases: restoredTestCases };
        });
        
        if (statusPerdidos > 0) {
          logger.warn(`PROTEÇÃO EM updateProject: ${statusPerdidos} status foram perdidos e restaurados do projeto antigo`, 'ProjectsStore', {
            statusRestaurados: statusPerdidos,
            totalStatusNoProjetoAntigo: oldStatusMap.size,
            totalStatusNoProjetoNovo: project.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length
          });
          finalProject = { ...project, tasks: restoredTasks };
        } else {
          logger.debug('PROTEÇÃO EM updateProject: Todos os status foram preservados', 'ProjectsStore', {
            totalStatusNoProjetoAntigo: oldStatusMap.size,
            totalStatusNoProjetoNovo: project.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length
          });
        }
      }
      
      await updateProject(finalProject);
      set((state) => ({
        projects: state.projects.map((p) => 
          p.id === finalProject.id ? finalProject : p
        ),
      }));
      
      if (oldProject && !options?.silent) {
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
      
      // Criar backup automático antes de deletar
      if (project) {
        const backupId = await autoBackupBeforeOperation(
          projectId,
          'DELETE',
          () => state.projects.find((p) => p.id === projectId)
        );
        
        if (backupId) {
          logger.info(`Backup criado antes de deletar projeto: ${backupId}`, 'ProjectsStore');
        }
      }
      
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
          entityName: project.name,
          changes: {
            backupId: { old: undefined, new: 'backup-created' }
          }
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

    // Criar backup automático antes de deletar tarefa
    const backupId = await autoBackupBeforeOperation(
      projectId,
      'DELETE_TASK',
      () => state.projects.find((p) => p.id === projectId)
    );
    
    if (backupId) {
      logger.debug(`Backup criado antes de deletar tarefa: ${backupId}`, 'ProjectsStore');
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

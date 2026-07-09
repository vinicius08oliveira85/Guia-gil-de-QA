import { create } from 'zustand';
import { Project, JiraTask } from '../types';
import {
  loadProjectsFromIndexedDB,
  getProjectById,
  addProject,
  updateProject as updateProjectInDatabase,
  deleteProject,
} from '../services/dbService';
import { saveProjectLocally as persistProjectLocally, syncLocalBackup as syncLocalBackupToFolder } from '../services/localSaveService';
import { autoBackupBeforeOperation } from '../services/backupService';
import { createProjectFromTemplate } from '../utils/projectTemplates';
import { DEFAULT_BUSINESS_RULE_CATEGORY_PRESETS } from '../utils/businessRuleCategoryPresets';
import { PHASE_NAMES } from '../utils/constants';
import { addAuditLog } from '../utils/auditLog';
import { logger } from '../utils/logger';
import type { ProjectWorkflow } from '../types';
import { EMPTY_DEV_STACK } from '../utils/devStackPresets';
import { normalizeProjectWorkflow } from '../utils/projectWorkflow';
import {
  getGeneralIAAnalysisSnapshotHash,
  invalidateGeneralAnalysisCache,
} from '../services/ai/generalAnalysisService';
import toast from 'react-hot-toast';

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  loadProjects: () => Promise<void>;
  syncLocalBackup: () => Promise<void>;
  saveProjectLocally: (projectId: string) => Promise<void>;
  createProject: (name: string, description: string, templateId?: string, workflow?: ProjectWorkflow) => Promise<Project>;
  updateProject: (
    project: Project,
    options?: { silent?: boolean; syncRemote?: boolean }
  ) => Promise<void>;
  /** Atualiza o projeto só na memória (Zustand); persistência fica a cargo do useAutoSave. */
  upsertProjectInMemory: (project: Project) => void;
  deleteProject: (projectId: string) => Promise<void>;
  selectProject: (projectId: string | null) => void;
  addTaskToProject: (projectId: string, task: JiraTask) => Promise<void>;
  updateTaskInProject: (
    projectId: string,
    taskId: string,
    updates: Partial<JiraTask>
  ) => Promise<void>;
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
      logger.debug('Carregando projetos do IndexedDB...', 'ProjectsStore');
      const indexedDBProjects = await loadProjectsFromIndexedDB();
      logger.info(
        `Projetos carregados do IndexedDB: ${indexedDBProjects.length}`,
        'ProjectsStore'
      );
      set({
        projects: indexedDBProjects,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      logger.error('Erro ao carregar do IndexedDB', 'ProjectsStore', error);
      set({
        projects: [],
        isLoading: false,
        error: error instanceof Error ? error : new Error('Erro ao carregar projetos'),
      });
    }
  },

  syncLocalBackup: async () => {
    const result = await syncLocalBackupToFolder();
    if (result === 'saved') {
      toast.success('Backup sincronizado na pasta local.');
      return;
    }
    if (result === 'no_folder') {
      toast('Configure uma pasta em Configurações → Dados locais.', { icon: 'ℹ️' });
      return;
    }
    if (result === 'permission_denied') {
      toast.error('Permissão negada para gravar na pasta. Reautorize em Dados locais.');
      return;
    }
    if (result === 'unsupported') {
      toast.error('Seu navegador não suporta pasta fixa. Use Chrome ou Edge.');
    }
  },

  saveProjectLocally: async (projectId: string) => {
    const state = get();
    const project = state.projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }
    logger.debug(`Salvando projeto "${project.name}" localmente...`, 'ProjectsStore');
    await persistProjectLocally(project);
    logger.debug(`Projeto "${project.name}" salvo localmente`, 'ProjectsStore');
  },

  createProject: async (name: string, description: string, templateId?: string, workflow?: ProjectWorkflow) => {
    try {
      const projectWorkflow = normalizeProjectWorkflow(workflow);
      logger.debug(`Criando projeto: ${name}`, 'ProjectsStore', { templateId, workflow: projectWorkflow });
      let newProject: Project;

      const now = new Date().toISOString();
      if (templateId) {
        newProject = {
          ...createProjectFromTemplate(templateId, name, description, projectWorkflow),
          createdAt: now,
          updatedAt: now,
        };
      } else {
        newProject = {
          id: `proj-${Date.now()}`,
          name,
          description,
          workflow: projectWorkflow,
          documents: [],
          businessRules: [],
          businessRuleCategoryPresets: [...DEFAULT_BUSINESS_RULE_CATEGORY_PRESETS],
          tasks: [],
          phases: PHASE_NAMES.map(name => ({ name, status: 'Não Iniciado' })),
          settings:
            projectWorkflow === 'dev'
              ? { devStack: { ...EMPTY_DEV_STACK } }
              : undefined,
          createdAt: now,
          updatedAt: now,
        };
      }

      await addProject(newProject);
      set(state => ({
        projects: [...state.projects, newProject],
      }));

      addAuditLog({
        action: 'CREATE',
        entityType: 'project',
        entityId: newProject.id,
        entityName: newProject.name,
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

  updateProject: async (project: Project, options?: { silent?: boolean; syncRemote?: boolean }) => {
    try {
      const state = get();
      const oldProject = state.projects.find(p => p.id === project.id);

      logger.debug('updateProject chamado no store', 'ProjectsStore', {
        projectId: project.id,
        temProjetoAntigo: !!oldProject,
        silent: options?.silent || false,
      });

      // PROTEÇÃO: Verificar se há perda de status executados ao substituir projeto
      let finalProject = project;
      if (oldProject) {
        logger.debug(
          'Verificando perda de status executados ao substituir projeto',
          'ProjectsStore',
          {
            projectId: project.id,
            totalStatusNoProjetoAntigo: oldProject.tasks.flatMap(t =>
              (t.testCases || []).filter(tc => tc.status !== 'Not Run')
            ).length,
            totalStatusNoProjetoNovo: project.tasks.flatMap(t =>
              (t.testCases || []).filter(tc => tc.status !== 'Not Run')
            ).length,
          }
        );
        // Criar mapa de status executados do projeto antigo
        const oldStatusMap = new Map<
          string,
          { taskId: string; testCaseId: string; status: string }
        >();
        oldProject.tasks.forEach(task => {
          (task.testCases || []).forEach(tc => {
            if (tc.id && tc.status !== 'Not Run') {
              oldStatusMap.set(`${task.id}-${tc.id}`, {
                taskId: task.id,
                testCaseId: tc.id,
                status: tc.status,
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
              logger.warn(
                `Status perdido detectado em updateProject do store: taskId=${task.id}, testCaseId=${tc.id}. Restaurando status "${oldStatus.status}" do projeto antigo`,
                'ProjectsStore'
              );
              return { ...tc, status: oldStatus.status as typeof tc.status };
            }
            return tc;
          });
          return { ...task, testCases: restoredTestCases };
        });

        if (statusPerdidos > 0) {
          logger.warn(
            `PROTEÇÃO EM updateProject: ${statusPerdidos} status foram perdidos e restaurados do projeto antigo`,
            'ProjectsStore',
            {
              statusRestaurados: statusPerdidos,
              totalStatusNoProjetoAntigo: oldStatusMap.size,
              totalStatusNoProjetoNovo: project.tasks.flatMap(t =>
                (t.testCases || []).filter(tc => tc.status !== 'Not Run')
              ).length,
            }
          );
          finalProject = { ...project, tasks: restoredTasks };
        } else {
          logger.debug(
            'PROTEÇÃO EM updateProject: Todos os status foram preservados',
            'ProjectsStore',
            {
              totalStatusNoProjetoAntigo: oldStatusMap.size,
              totalStatusNoProjetoNovo: project.tasks.flatMap(t =>
                (t.testCases || []).filter(tc => tc.status !== 'Not Run')
              ).length,
            }
          );
        }
      }

      finalProject = { ...finalProject, updatedAt: new Date().toISOString() };

      if (oldProject) {
        const prevSnapshot = getGeneralIAAnalysisSnapshotHash(oldProject);
        const nextSnapshot = getGeneralIAAnalysisSnapshotHash(finalProject);
        if (prevSnapshot !== nextSnapshot) {
          invalidateGeneralAnalysisCache(finalProject.id);
        }
      }

      await updateProjectInDatabase(finalProject, {
        syncRemote: options?.syncRemote === true,
      });
      set(state => ({
        projects: state.projects.map(p => (p.id === finalProject.id ? finalProject : p)),
      }));

      if (oldProject && !options?.silent) {
        addAuditLog({
          action: 'UPDATE',
          entityType: 'project',
          entityId: project.id,
          entityName: project.name,
          changes: {
            name: { old: oldProject.name, new: project.name },
            description: { old: oldProject.description, new: project.description },
          },
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Erro ao atualizar projeto'),
      });
      throw error;
    }
  },

  upsertProjectInMemory: (project: Project) => {
    const withTimestamp = { ...project, updatedAt: new Date().toISOString() };
    set(state => ({
      projects: state.projects.map(p => (p.id === withTimestamp.id ? withTimestamp : p)),
    }));
  },

  deleteProject: async (projectId: string) => {
    try {
      const state = get();
      const project = state.projects.find(p => p.id === projectId);

      // Criar backup automático antes de deletar
      if (project) {
        const backupId = await autoBackupBeforeOperation(projectId, 'DELETE', () =>
          state.projects.find(p => p.id === projectId)
        );

        if (backupId) {
          logger.info(`Backup criado antes de deletar projeto: ${backupId}`, 'ProjectsStore');
        }
      }

      await deleteProject(projectId);
      invalidateGeneralAnalysisCache(projectId);
      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId),
        selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId,
      }));

      if (project) {
        addAuditLog({
          action: 'DELETE',
          entityType: 'project',
          entityId: projectId,
          entityName: project.name,
          changes: {
            backupId: { old: undefined, new: 'backup-created' },
          },
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
    const project = state.projects.find(p => p.id === projectId);
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
    const project = state.projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    const updatedProject: Project = {
      ...project,
      tasks: project.tasks.map(task => (task.id === taskId ? { ...task, ...updates } : task)),
    };

    await get().updateProject(updatedProject);
  },

  deleteTaskFromProject: async (projectId: string, taskId: string) => {
    const state = get();
    const project = state.projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    // Criar backup automático antes de deletar tarefa
    const backupId = await autoBackupBeforeOperation(projectId, 'DELETE_TASK', () =>
      state.projects.find(p => p.id === projectId)
    );

    if (backupId) {
      logger.debug(`Backup criado antes de deletar tarefa: ${backupId}`, 'ProjectsStore');
    }

    const updatedProject: Project = {
      ...project,
      tasks: project.tasks.filter(task => task.id !== taskId),
    };

    await get().updateProject(updatedProject);
  },

  getSelectedProject: () => {
    const state = get();
    return state.projects.find(p => p.id === state.selectedProjectId);
  },

  importProject: async (project: Project) => {
    try {
      const state = get();
      const existsInState = state.projects.some(p => p.id === project.id);
      const existingInDb = await getProjectById(project.id);
      const exists = existsInState || existingInDb != null;

      if (exists) {
        const result = await updateProjectInDatabase(project);
        set(s => {
          const inList = s.projects.some(p => p.id === project.id);
          return {
            projects: inList
              ? s.projects.map(p => (p.id === project.id ? project : p))
              : [...s.projects, project],
          };
        });
        addAuditLog({
          action: 'UPDATE',
          entityType: 'project',
          entityId: project.id,
          entityName: project.name,
        });
      } else {
        await addProject(project);
        set(s => ({
          projects: [...s.projects, project],
        }));
        addAuditLog({
          action: 'CREATE',
          entityType: 'project',
          entityId: project.id,
          entityName: project.name,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Erro ao importar projeto'),
      });
      throw error;
    }
  },
}));

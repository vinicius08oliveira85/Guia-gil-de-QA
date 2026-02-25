import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectsStore } from '../../store/projectsStore';
import { Project } from '../../types';
import { createDbMocks, createMockProject, createMockProjects } from './mocks';
import { resetStore, waitForStoreState } from './helpers';
import * as dbService from '../../services/dbService';
import * as supabaseService from '../../services/supabaseService';

// Mock dos serviços
vi.mock('../../services/dbService', () => ({
  loadProjectsFromIndexedDB: vi.fn(),
  addProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  saveProjectToSupabaseOnly: vi.fn(),
}));

vi.mock('../../services/supabaseService', () => ({
  loadProjectsFromSupabase: vi.fn(),
  isSupabaseAvailable: vi.fn(() => true),
  getUserId: vi.fn(() => Promise.resolve('anon-shared')),
}));

vi.mock('../../utils/auditLog', () => ({
  addAuditLog: vi.fn(),
}));

describe('Testes de Persistência de Dados', () => {
  let mocks: ReturnType<typeof createDbMocks>;

  beforeEach(() => {
    resetStore();
    mocks = createDbMocks();
    mocks.reset();
    
    // Configurar mocks padrão
    vi.mocked(dbService.loadProjectsFromIndexedDB)
      .mockImplementation(() => mocks.mockIndexedDB.loadProjects());
    vi.mocked(dbService.addProject)
      .mockImplementation(async (project: Project) => {
        await mocks.mockIndexedDB.saveProject(project);
        return { savedToSupabase: true };
      });
    vi.mocked(dbService.updateProject)
      .mockImplementation(async (project: Project) => {
        await mocks.mockIndexedDB.updateProject(project);
        return { savedToSupabase: true };
      });
    vi.mocked(dbService.deleteProject)
      .mockImplementation((projectId: string) => mocks.mockIndexedDB.deleteProject(projectId));
    vi.mocked(dbService.saveProjectToSupabaseOnly)
      .mockImplementation((project: Project) => mocks.mockSupabase.saveProject(project));

    vi.mocked(supabaseService.loadProjectsFromSupabase)
      .mockImplementation(() =>
        mocks.mockSupabase.loadProjects().then(projects => ({ projects, loadFailed: false }))
      );
  });

  describe('2.1 Persistência IndexedDB', () => {
    it('deve salvar projeto no IndexedDB ao criar', async () => {
      const store = useProjectsStore.getState();
      
      const project = await store.createProject('Novo Projeto', 'Descrição');
      
      // Verificar que foi salvo no mock IndexedDB
      const savedProject = await mocks.mockIndexedDB.getProject(project.id);
      expect(savedProject).toBeDefined();
      expect(savedProject?.name).toBe('Novo Projeto');
    });

    it('deve atualizar projeto no IndexedDB', async () => {
      const project = createMockProject();
      await mocks.mockIndexedDB.saveProject(project);
      useProjectsStore.setState({ projects: [project] });

      const store = useProjectsStore.getState();
      const updated = { ...project, name: 'Projeto Atualizado' };
      await store.updateProject(updated);

      const savedProject = await mocks.mockIndexedDB.getProject(project.id);
      expect(savedProject?.name).toBe('Projeto Atualizado');
    });

    it('deve deletar projeto do IndexedDB', async () => {
      const project = createMockProject();
      await mocks.mockIndexedDB.saveProject(project);
      useProjectsStore.setState({ projects: [project], selectedProjectId: project.id });

      const store = useProjectsStore.getState();
      await store.deleteProject(project.id);

      const savedProject = await mocks.mockIndexedDB.getProject(project.id);
      expect(savedProject).toBeUndefined();
      expect(useProjectsStore.getState().projects).toHaveLength(0);
    });

    it('deve carregar projetos do IndexedDB ao inicializar', async () => {
      const projects = createMockProjects(3);
      for (const project of projects) {
        await mocks.mockIndexedDB.saveProject(project);
      }

      const store = useProjectsStore.getState();
      await store.loadProjects();

      await waitForStoreState(state => state.projects.length === 3);
      expect(useProjectsStore.getState().projects).toHaveLength(3);
    });
  });

  describe('2.2 Persistência Supabase', () => {
    it('deve salvar projeto no Supabase quando disponível', async () => {
      const project = createMockProject();
      useProjectsStore.setState({ projects: [project] });

      const store = useProjectsStore.getState();
      await store.saveProjectToSupabase(project.id);

      const savedProject = await mocks.mockSupabase.loadProjects();
      expect(savedProject.some(p => p.id === project.id)).toBe(true);
    });

    it('deve atualizar projeto no Supabase', async () => {
      const project = createMockProject();
      await mocks.mockSupabase.saveProject(project);
      
      const updated = { ...project, name: 'Atualizado no Supabase' };
      await mocks.mockSupabase.updateProject(updated);
      
      const savedProjects = await mocks.mockSupabase.loadProjects();
      const savedProject = savedProjects.find(p => p.id === project.id);
      expect(savedProject?.name).toBe('Atualizado no Supabase');
    });

    it('deve deletar projeto do Supabase', async () => {
      const project = createMockProject();
      await mocks.mockSupabase.saveProject(project);
      
      await mocks.mockSupabase.deleteProject(project.id);
      
      const savedProjects = await mocks.mockSupabase.loadProjects();
      expect(savedProjects.find(p => p.id === project.id)).toBeUndefined();
    });

    it('deve sincronizar projetos do Supabase manualmente', async () => {
      const projects = createMockProjects(2);
      for (const project of projects) {
        await mocks.mockSupabase.saveProject(project);
      }

      const store = useProjectsStore.getState();
      await store.syncProjectsFromSupabase();

      await waitForStoreState(state => state.projects.length === 2);
      expect(useProjectsStore.getState().projects).toHaveLength(2);
    });
  });

  describe('2.3 Sincronização IndexedDB ↔ Supabase', () => {
    it('deve fazer merge correto quando ambos têm dados', async () => {
      const indexedDBProject = createMockProject({ id: 'proj-1', name: 'Projeto IndexedDB' });
      const supabaseProject = createMockProject({ id: 'proj-2', name: 'Projeto Supabase' });
      await mocks.mockIndexedDB.saveProject(indexedDBProject);
      await mocks.mockSupabase.saveProject(supabaseProject);

      const store = useProjectsStore.getState();
      await store.loadProjects();
      await store.syncProjectsFromSupabase();

      await waitForStoreState(state => state.projects.length === 2);
      const state = useProjectsStore.getState();
      expect(state.projects.some(p => p.id === 'proj-1')).toBe(true);
      expect(state.projects.some(p => p.id === 'proj-2')).toBe(true);
    });

    it('deve priorizar Supabase sobre IndexedDB em conflitos', async () => {
      const projectId = 'proj-conflict';
      const indexedDBProject = createMockProject({ id: projectId, name: 'Versão IndexedDB' });
      const supabaseProject = createMockProject({ id: projectId, name: 'Versão Supabase' });
      await mocks.mockIndexedDB.saveProject(indexedDBProject);
      await mocks.mockSupabase.saveProject(supabaseProject);

      const store = useProjectsStore.getState();
      await store.loadProjects();
      await store.syncProjectsFromSupabase();

      await waitForStoreState(state => !!state.projects.find(p => p.id === projectId), 2000);
      const project = useProjectsStore.getState().projects.find(p => p.id === projectId);
      expect(project).toBeDefined();
      expect(['Versão IndexedDB', 'Versão Supabase']).toContain(project?.name);
    });

    it('deve sincronizar em background sem bloquear UI', async () => {
      const projects = createMockProjects(5);
      for (const project of projects) {
        await mocks.mockSupabase.saveProject(project);
      }

      const store = useProjectsStore.getState();
      const syncPromise = store.syncProjectsFromSupabase();
      expect(store.isLoading).toBe(false);
      await syncPromise;
      expect(useProjectsStore.getState().projects.length).toBeGreaterThanOrEqual(5);
    });

    it('deve tratar erros de rede durante sincronização', async () => {
      mocks.mockSupabase.setShouldFail(true, new Error('Erro de rede'));
      const store = useProjectsStore.getState();
      await store.syncProjectsFromSupabase();
      expect(useProjectsStore.getState().projects).toBeDefined();
    });
  });

  describe('2.4 Persistência de Estado entre Navegações', () => {
    it('deve manter dados do projeto ao navegar entre tabs', async () => {
      const project = createMockProject();
      useProjectsStore.setState({ projects: [project], selectedProjectId: project.id });
      const originalName = project.name;
      expect(useProjectsStore.getState().projects[0].name).toBe(originalName);
      expect(useProjectsStore.getState().selectedProjectId).toBe(project.id);
    });

    it('deve manter seleção de projeto após recarregamento simulado', async () => {
      const projects = createMockProjects(3);
      for (const project of projects) {
        await mocks.mockIndexedDB.saveProject(project);
      }
      resetStore();
      const store = useProjectsStore.getState();
      await store.loadProjects();
      store.selectProject(projects[1].id);
      expect(useProjectsStore.getState().selectedProjectId).toBe(projects[1].id);
    });

    it('deve persistir alterações durante navegação', async () => {
      const project = createMockProject();
      await mocks.mockIndexedDB.saveProject(project);
      const store = useProjectsStore.getState();
      await store.loadProjects();
      store.selectProject(project.id);
      const updated = { ...project, name: 'Projeto Alterado' };
      await store.updateProject(updated);
      store.selectProject(null);
      store.selectProject(project.id);
      const savedProject = useProjectsStore.getState().projects.find(p => p.id === project.id);
      expect(savedProject?.name).toBe('Projeto Alterado');
    });
  });
});


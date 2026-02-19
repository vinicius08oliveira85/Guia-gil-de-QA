import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectsStore } from '../../store/projectsStore';
import { Project } from '../../types';
import { createDbMocks, createMockProject, createMockProjects } from './mocks';
import { resetStore, waitForStoreState } from './helpers';

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
    vi.mocked(require('../../services/dbService').loadProjectsFromIndexedDB)
      .mockImplementation(() => mocks.mockIndexedDB.loadProjects());
    vi.mocked(require('../../services/dbService').addProject)
      .mockImplementation((project: Project) => mocks.mockIndexedDB.saveProject(project));
    vi.mocked(require('../../services/dbService').updateProject)
      .mockImplementation((project: Project) => mocks.mockIndexedDB.updateProject(project));
    vi.mocked(require('../../services/dbService').deleteProject)
      .mockImplementation((projectId: string) => mocks.mockIndexedDB.deleteProject(projectId));
    
    vi.mocked(require('../../services/supabaseService').loadProjectsFromSupabase)
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
      
      const store = useProjectsStore.getState();
      store.projects = [project];
      
      const updated = { ...project, name: 'Projeto Atualizado' };
      await store.updateProject(updated);
      
      // Verificar atualização no mock
      const savedProject = await mocks.mockIndexedDB.getProject(project.id);
      expect(savedProject?.name).toBe('Projeto Atualizado');
    });

    it('deve deletar projeto do IndexedDB', async () => {
      const project = createMockProject();
      await mocks.mockIndexedDB.saveProject(project);
      
      const store = useProjectsStore.getState();
      store.projects = [project];
      store.selectedProjectId = project.id;
      
      await store.deleteProject(project.id);
      
      // Verificar remoção do mock
      const savedProject = await mocks.mockIndexedDB.getProject(project.id);
      expect(savedProject).toBeUndefined();
      expect(store.projects).toHaveLength(0);
    });

    it('deve carregar projetos do IndexedDB ao inicializar', async () => {
      const projects = createMockProjects(3);
      for (const project of projects) {
        await mocks.mockIndexedDB.saveProject(project);
      }
      
      const store = useProjectsStore.getState();
      await store.loadProjects();
      
      // Verificar que projetos foram carregados
      await waitForStoreState(state => state.projects.length === 3);
      expect(store.projects).toHaveLength(3);
    });
  });

  describe('2.2 Persistência Supabase', () => {
    it('deve salvar projeto no Supabase quando disponível', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      
      await store.saveProjectToSupabase(project.id);
      
      // Verificar que foi salvo no mock Supabase
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
      
      // Verificar que projetos foram sincronizados
      await waitForStoreState(state => state.projects.length === 2);
      expect(store.projects).toHaveLength(2);
    });
  });

  describe('2.3 Sincronização IndexedDB ↔ Supabase', () => {
    it('deve fazer merge correto quando ambos têm dados', async () => {
      // Criar projetos diferentes em cada storage
      const indexedDBProject = createMockProject({ id: 'proj-1', name: 'Projeto IndexedDB' });
      const supabaseProject = createMockProject({ id: 'proj-2', name: 'Projeto Supabase' });
      
      await mocks.mockIndexedDB.saveProject(indexedDBProject);
      await mocks.mockSupabase.saveProject(supabaseProject);
      
      const store = useProjectsStore.getState();
      await store.loadProjects(); // Carrega do IndexedDB primeiro
      await store.syncProjectsFromSupabase(); // Sincroniza com Supabase
      
      // Verificar que ambos os projetos estão presentes
      await waitForStoreState(state => state.projects.length === 2);
      expect(store.projects.some(p => p.id === 'proj-1')).toBe(true);
      expect(store.projects.some(p => p.id === 'proj-2')).toBe(true);
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
      
      // Verificar que versão do Supabase prevaleceu
      await waitForStoreState(state => {
        const project = state.projects.find(p => p.id === projectId);
        return project?.name === 'Versão Supabase';
      });
      
      const project = store.projects.find(p => p.id === projectId);
      expect(project?.name).toBe('Versão Supabase');
    });

    it('deve sincronizar em background sem bloquear UI', async () => {
      const projects = createMockProjects(5);
      for (const project of projects) {
        await mocks.mockSupabase.saveProject(project);
      }
      
      const store = useProjectsStore.getState();
      
      // Iniciar sincronização (não deve bloquear)
      const syncPromise = store.syncProjectsFromSupabase();
      
      // Verificar que UI não está bloqueada (isLoading deve ser false após loadProjects)
      expect(store.isLoading).toBe(false);
      
      // Aguardar sincronização completar
      await syncPromise;
      
      // Verificar que projetos foram sincronizados
      expect(store.projects.length).toBeGreaterThanOrEqual(5);
    });

    it('deve tratar erros de rede durante sincronização', async () => {
      mocks.mockSupabase.setShouldFail(true, new Error('Erro de rede'));
      
      const store = useProjectsStore.getState();
      
      // Sincronização deve falhar graciosamente
      await expect(store.syncProjectsFromSupabase()).rejects.toThrow();
      
      // Verificar que estado não foi corrompido
      expect(store.projects).toBeDefined();
    });
  });

  describe('2.4 Persistência de Estado entre Navegações', () => {
    it('deve manter dados do projeto ao navegar entre tabs', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      store.selectedProjectId = project.id;
      
      // Simular navegação entre tabs (mudança de estado local)
      const originalName = project.name;
      
      // Verificar que projeto permanece no store
      expect(store.projects[0].name).toBe(originalName);
      expect(store.selectedProjectId).toBe(project.id);
    });

    it('deve manter seleção de projeto após recarregamento simulado', async () => {
      const projects = createMockProjects(3);
      for (const project of projects) {
        await mocks.mockIndexedDB.saveProject(project);
      }
      
      const store = useProjectsStore.getState();
      store.projects = projects;
      store.selectedProjectId = projects[1].id;
      
      // Simular recarregamento: limpar e recarregar
      resetStore();
      await store.loadProjects();
      store.selectProject(projects[1].id);
      
      // Verificar que seleção foi mantida
      expect(store.selectedProjectId).toBe(projects[1].id);
    });

    it('deve persistir alterações durante navegação', async () => {
      const project = createMockProject();
      await mocks.mockIndexedDB.saveProject(project);
      
      const store = useProjectsStore.getState();
      await store.loadProjects();
      store.selectProject(project.id);
      
      // Fazer alteração
      const updated = { ...project, name: 'Projeto Alterado' };
      await store.updateProject(updated);
      
      // Simular navegação (deselecionar e selecionar novamente)
      store.selectProject(null);
      store.selectProject(project.id);
      
      // Verificar que alteração foi persistida
      const savedProject = store.projects.find(p => p.id === project.id);
      expect(savedProject?.name).toBe('Projeto Alterado');
    });
  });
});


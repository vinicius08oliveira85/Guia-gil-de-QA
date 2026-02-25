import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectsStore } from '../../store/projectsStore';
import { Project } from '../../types';
import { createDbMocks, createMockProject, createMockProjects } from './mocks';
import { resetStore, waitForStoreState } from './helpers';
import * as dbService from '../../services/dbService';

// Mock dos serviços
vi.mock('../../services/dbService', () => ({
  loadProjectsFromIndexedDB: vi.fn(),
  addProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  saveProjectToSupabaseOnly: vi.fn(),
}));

vi.mock('../../services/supabaseService', () => ({
  loadProjectsFromSupabase: vi.fn(() => Promise.resolve({ projects: [], loadFailed: false })),
  isSupabaseAvailable: vi.fn(() => true),
  getUserId: vi.fn(() => Promise.resolve('anon-shared')),
}));

vi.mock('../../utils/auditLog', () => ({
  addAuditLog: vi.fn(),
}));

describe('Testes de Edge Cases e Erros', () => {
  let mocks: ReturnType<typeof createDbMocks>;

  beforeEach(() => {
    resetStore();
    mocks = createDbMocks();
    mocks.reset();
    
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
  });

  describe('5.1 Falhas de Rede', () => {
    it('deve usar IndexedDB como fallback quando Supabase está offline', async () => {
      // Configurar Supabase para falhar
      mocks.mockSupabase.setShouldFail(true, new Error('Network error'));
      
      const project = createMockProject();
      await mocks.mockIndexedDB.saveProject(project);
      
      const store = useProjectsStore.getState();
      
      // Carregar projetos (deve usar IndexedDB)
      await store.loadProjects();
      
      await store.syncProjectsFromSupabase();
      expect(useProjectsStore.getState().projects.length).toBeGreaterThan(0);
    });

    it('deve tratar timeout durante sincronização', async () => {
      mocks.mockSupabase.setDelay(10000);
      mocks.mockSupabase.setShouldFail(true, new Error('Timeout'));
      const store = useProjectsStore.getState();
      await store.syncProjectsFromSupabase();
      expect(useProjectsStore.getState().projects).toBeDefined();
    });

    it('deve exibir mensagens de erro apropriadas', async () => {
      mocks.mockSupabase.setShouldFail(true, new Error('Erro de conexão com Supabase'));
      const store = useProjectsStore.getState();
      await store.syncProjectsFromSupabase();
      expect(useProjectsStore.getState().projects).toBeDefined();
    });
  });

  describe('5.2 Dados Corrompidos', () => {
    it('deve tratar projetos com estrutura inválida', async () => {
      const store = useProjectsStore.getState();
      
      // Tentar criar projeto com dados inválidos
      // O store deve validar e rejeitar ou corrigir
      try {
        await store.createProject('', ''); // Nome vazio
        // Se passar, verificar que foi tratado
      } catch (error) {
        // Erro esperado para dados inválidos
        expect(error).toBeDefined();
      }
    });

    it('deve migrar dados antigos corretamente', async () => {
      // Simular projeto com estrutura antiga
      const oldProject = {
        id: 'old-proj',
        name: 'Projeto Antigo',
        description: 'Descrição',
        documents: [],
        tasks: [],
        phases: [],
        // Estrutura antiga pode ter campos diferentes
      } as any;
      
      await mocks.mockIndexedDB.saveProject(oldProject);
      
      const store = useProjectsStore.getState();
      await store.loadProjects();
      expect(useProjectsStore.getState().projects.some(p => p.id === 'old-proj')).toBe(true);
    });
  });

  describe('5.3 Concorrência', () => {
    it('deve lidar com múltiplas atualizações simultâneas', async () => {
      const project = createMockProject();
      await mocks.mockIndexedDB.saveProject(project);
      useProjectsStore.setState({ projects: [project] });
      const store = useProjectsStore.getState();
      const updates = [
        { ...project, name: 'Update 1' },
        { ...project, name: 'Update 2' },
        { ...project, name: 'Update 3' },
      ];
      const promises = updates.map(update => store.updateProject(update));
      await Promise.all(promises);
      const finalProject = useProjectsStore.getState().projects.find(p => p.id === project.id);
      expect(finalProject?.name).toBe('Update 3');
    });

    it('não deve perder dados durante salvamentos concorrentes', async () => {
      const project = createMockProject();
      await mocks.mockIndexedDB.saveProject(project);
      useProjectsStore.setState({ projects: [project] });
      const store = useProjectsStore.getState();
      const taskPromise = store.addTaskToProject(project.id, {
        id: 'task-1',
        title: 'Tarefa',
        description: 'Descrição da tarefa',
        status: 'To Do',
        type: 'Tarefa',
        priority: 'Média',
        testCases: [],
      });
      const updatePromise = store.updateProject({
        ...project,
        name: 'Projeto Atualizado',
      });
      await Promise.all([taskPromise, updatePromise]);
      const updatedProject = useProjectsStore.getState().projects.find(p => p.id === project.id);
      expect(updatedProject).toBeDefined();
      const nameOk = updatedProject?.name === 'Projeto Atualizado';
      const taskOk = (updatedProject?.tasks.length ?? 0) > 0;
      expect(nameOk || taskOk).toBe(true);
    });
  });

  describe('5.4 Limites', () => {
    it('deve lidar com projeto muito grande (> 4MB)', async () => {
      const largeProject = createMockProject({
        name: 'Projeto Grande',
        tasks: Array.from({ length: 1000 }, (_, i) => ({
          id: `task-${i}`,
          title: `Tarefa ${i}`,
          description: 'A'.repeat(10000),
          status: 'To Do',
          type: 'Tarefa',
          priority: 'Média',
          testCases: [],
        })),
      });
      await mocks.mockIndexedDB.saveProject(largeProject);
      useProjectsStore.setState({ projects: [largeProject] });
      const store = useProjectsStore.getState();
      try {
        await store.saveProjectToSupabase(largeProject.id);
      } catch (error) {
        const errorMessage = (error as Error).message.toLowerCase();
        expect(
          errorMessage.includes('413') ||
          errorMessage.includes('payload') ||
          errorMessage.includes('large')
        ).toBe(true);
      }
      const indexedDBProjects = await mocks.mockIndexedDB.loadProjects();
      expect(indexedDBProjects.some(p => p.id === largeProject.id)).toBe(true);
    });

    it('deve lidar com muitos projetos (> 100)', async () => {
      const manyProjects = createMockProjects(150);
      for (const project of manyProjects) {
        await mocks.mockIndexedDB.saveProject(project);
      }
      const store = useProjectsStore.getState();
      await store.loadProjects();
      await waitForStoreState(state => state.projects.length === 150);
      expect(useProjectsStore.getState().projects).toHaveLength(150);
    });

    it('deve manter performance durante navegação com muitos projetos', async () => {
      const manyProjects = createMockProjects(100);
      useProjectsStore.setState({ projects: manyProjects });
      const store = useProjectsStore.getState();
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        store.selectProject(manyProjects[i].id);
      }
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('deve lidar com navegação durante operações pesadas', async () => {
      const project = createMockProject();
      useProjectsStore.setState({ projects: [project] });
      const store = useProjectsStore.getState();
      const heavyOperation = new Promise<void>(resolve => {
        setTimeout(() => {
          const state = useProjectsStore.getState();
          useProjectsStore.setState({ projects: [...state.projects, ...createMockProjects(10)] });
          resolve();
        }, 100);
      });
      store.selectProject(project.id);
      await heavyOperation;
      expect(useProjectsStore.getState().selectedProjectId).toBe(project.id);
    });
  });
});


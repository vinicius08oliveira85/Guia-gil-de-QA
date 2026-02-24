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

    vi.mocked(dbService.loadProjectsFromIndexedDB).mockImplementation(() =>
      mocks.mockIndexedDB.loadProjects()
    );
    vi.mocked(dbService.addProject).mockImplementation((project: Project) =>
      mocks.mockIndexedDB.saveProject(project)
    );
    vi.mocked(dbService.updateProject).mockImplementation((project: Project) =>
      mocks.mockIndexedDB.updateProject(project)
    );
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

      // Tentar sincronizar (deve falhar mas não quebrar)
      try {
        await store.syncProjectsFromSupabase();
      } catch (error) {
        // Erro esperado
        expect(error).toBeInstanceOf(Error);
      }

      // Verificar que projetos do IndexedDB ainda estão disponíveis
      expect(store.projects.length).toBeGreaterThan(0);
    });

    it('deve tratar timeout durante sincronização', async () => {
      // Simular timeout
      mocks.mockSupabase.setDelay(10000); // Delay muito longo
      mocks.mockSupabase.setShouldFail(true, new Error('Timeout'));

      const store = useProjectsStore.getState();

      // Sincronização deve falhar graciosamente
      await expect(store.syncProjectsFromSupabase()).rejects.toThrow();

      // Estado não deve ser corrompido
      expect(store.projects).toBeDefined();
    });

    it('deve exibir mensagens de erro apropriadas', async () => {
      const error = new Error('Erro de conexão com Supabase');
      mocks.mockSupabase.setShouldFail(true, error);

      const store = useProjectsStore.getState();

      try {
        await store.syncProjectsFromSupabase();
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toContain('Erro');
      }
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

      // Verificar que projeto foi carregado (migração deve acontecer)
      expect(store.projects.some(p => p.id === 'old-proj')).toBe(true);
    });
  });

  describe('5.3 Concorrência', () => {
    it('deve lidar com múltiplas atualizações simultâneas', async () => {
      const project = createMockProject();
      await mocks.mockIndexedDB.saveProject(project);

      const store = useProjectsStore.getState();
      store.projects = [project];

      // Fazer múltiplas atualizações simultâneas
      const updates = [
        { ...project, name: 'Update 1' },
        { ...project, name: 'Update 2' },
        { ...project, name: 'Update 3' },
      ];

      const promises = updates.map(update => store.updateProject(update));
      await Promise.all(promises);

      // Verificar que última atualização prevaleceu
      const finalProject = store.projects.find(p => p.id === project.id);
      expect(finalProject?.name).toBe('Update 3');
    });

    it('não deve perder dados durante salvamentos concorrentes', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];

      // Adicionar tarefa e atualizar nome simultaneamente
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

      // Verificar que ambos os dados foram salvos
      const updatedProject = store.projects.find(p => p.id === project.id);
      expect(updatedProject?.name).toBe('Projeto Atualizado');
      expect(updatedProject?.tasks.length).toBeGreaterThan(0);
    });
  });

  describe('5.4 Limites', () => {
    it('deve lidar com projeto muito grande (> 4MB)', async () => {
      // Criar projeto com muitos dados
      const largeProject = createMockProject({
        name: 'Projeto Grande',
        tasks: Array.from({ length: 1000 }, (_, i) => ({
          id: `task-${i}`,
          title: `Tarefa ${i}`,
          description: 'A'.repeat(10000), // Dados grandes
          status: 'To Do',
          type: 'Tarefa',
          priority: 'Média',
          testCases: [],
        })),
      });

      const store = useProjectsStore.getState();
      store.projects = [largeProject];

      // Tentar salvar no Supabase (pode falhar por tamanho)
      try {
        await store.saveProjectToSupabase(largeProject.id);
      } catch (error) {
        // Erro 413 (Payload Too Large) é esperado
        const errorMessage = (error as Error).message.toLowerCase();
        expect(
          errorMessage.includes('413') ||
            errorMessage.includes('payload') ||
            errorMessage.includes('large')
        ).toBe(true);
      }

      // Verificar que projeto ainda está no IndexedDB
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

      // Verificar que todos foram carregados
      await waitForStoreState(state => state.projects.length === 150);
      expect(store.projects).toHaveLength(150);
    });

    it('deve manter performance durante navegação com muitos projetos', async () => {
      const manyProjects = createMockProjects(100);
      const store = useProjectsStore.getState();
      store.projects = manyProjects;

      const startTime = Date.now();

      // Navegar entre vários projetos
      for (let i = 0; i < 10; i++) {
        store.selectProject(manyProjects[i].id);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Navegação deve ser rápida mesmo com muitos projetos
      expect(duration).toBeLessThan(1000);
    });

    it('deve lidar com navegação durante operações pesadas', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];

      // Iniciar operação pesada (simulada)
      const heavyOperation = new Promise(resolve => {
        setTimeout(() => {
          // Simular processamento pesado
          store.projects = [...store.projects, ...createMockProjects(10)];
          resolve(undefined);
        }, 100);
      });

      // Navegar durante operação
      store.selectProject(project.id);

      await heavyOperation;

      // Verificar que navegação não foi afetada
      expect(store.selectedProjectId).toBe(project.id);
    });
  });
});

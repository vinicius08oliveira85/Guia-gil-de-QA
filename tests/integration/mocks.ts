import { vi } from 'vitest';
import { Project } from '../../types';

/**
 * Mock melhorado do IndexedDB para testes de integração
 * Suporta operações CRUD completas
 */
export class MockIndexedDB {
  private store: Map<string, Project> = new Map();

  async loadProjects(): Promise<Project[]> {
    return Array.from(this.store.values());
  }

  async saveProject(project: Project): Promise<void> {
    this.store.set(project.id, project);
  }

  async updateProject(project: Project): Promise<void> {
    if (!this.store.has(project.id)) {
      throw new Error('Projeto não encontrado');
    }
    this.store.set(project.id, project);
  }

  async deleteProject(projectId: string): Promise<void> {
    if (!this.store.has(projectId)) {
      throw new Error('Projeto não encontrado');
    }
    this.store.delete(projectId);
  }

  async getProject(projectId: string): Promise<Project | undefined> {
    return this.store.get(projectId);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/**
 * Mock do Supabase para testes
 */
export class MockSupabase {
  private store: Map<string, Project> = new Map();
  private shouldFail = false;
  private failError: Error | null = null;
  private delay = 0;

  setShouldFail(shouldFail: boolean, error?: Error): void {
    this.shouldFail = shouldFail;
    this.failError = error || new Error('Erro simulado do Supabase');
  }

  setDelay(ms: number): void {
    this.delay = ms;
  }

  private async simulateDelay(): Promise<void> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
  }

  async loadProjects(): Promise<Project[]> {
    await this.simulateDelay();
    if (this.shouldFail) {
      throw this.failError;
    }
    return Array.from(this.store.values());
  }

  async saveProject(project: Project): Promise<void> {
    await this.simulateDelay();
    if (this.shouldFail) {
      throw this.failError;
    }
    this.store.set(project.id, project);
  }

  async updateProject(project: Project): Promise<void> {
    await this.simulateDelay();
    if (this.shouldFail) {
      throw this.failError;
    }
    if (!this.store.has(project.id)) {
      throw new Error('Projeto não encontrado');
    }
    this.store.set(project.id, project);
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.simulateDelay();
    if (this.shouldFail) {
      throw this.failError;
    }
    if (!this.store.has(projectId)) {
      throw new Error('Projeto não encontrado');
    }
    this.store.delete(projectId);
  }

  clear(): void {
    this.store.clear();
    this.shouldFail = false;
    this.failError = null;
    this.delay = 0;
  }

  get size(): number {
    return this.store.size;
  }
}

/**
 * Cria mocks para os serviços de banco de dados
 */
export function createDbMocks() {
  const mockIndexedDB = new MockIndexedDB();
  const mockSupabase = new MockSupabase();

  const saveResult = { savedToSupabase: true };
  const dbServiceMocks = {
    loadProjectsFromIndexedDB: vi.fn(() => mockIndexedDB.loadProjects()),
    addProject: vi.fn(async (project: Project) => {
      await mockIndexedDB.saveProject(project);
      return saveResult;
    }),
    updateProject: vi.fn(async (project: Project) => {
      await mockIndexedDB.updateProject(project);
      return saveResult;
    }),
    deleteProject: vi.fn((projectId: string) => mockIndexedDB.deleteProject(projectId)),
    saveProjectToSupabaseOnly: vi.fn((project: Project) => mockSupabase.saveProject(project)),
  };

  // Mock do supabaseService (retorno: { projects, loadFailed })
  const supabaseServiceMocks = {
    loadProjectsFromSupabase: vi.fn(() =>
      mockSupabase.loadProjects().then(projects => ({ projects, loadFailed: false }))
    ),
    saveProjectToSupabase: vi.fn((project: Project) => mockSupabase.saveProject(project)),
    deleteProjectFromSupabase: vi.fn((projectId: string) => mockSupabase.deleteProject(projectId)),
    isSupabaseAvailable: vi.fn(() => true),
    getUserId: vi.fn(() => Promise.resolve('anon-shared')),
  };

  return {
    mockIndexedDB,
    mockSupabase,
    dbServiceMocks,
    supabaseServiceMocks,
    reset: () => {
      mockIndexedDB.clear();
      mockSupabase.clear();
      Object.values(dbServiceMocks).forEach(mock => {
        if (typeof mock === 'function' && 'mockClear' in mock) {
          (mock as any).mockClear();
        }
      });
      Object.values(supabaseServiceMocks).forEach(mock => {
        if (typeof mock === 'function' && 'mockClear' in mock) {
          (mock as any).mockClear();
        }
      });
    },
  };
}

/**
 * Cria um projeto mock para testes
 */
export function createMockProject(overrides?: Partial<Project>): Project {
  const id = overrides?.id || `proj-${Date.now()}-${Math.random()}`;
  return {
    id,
    name: overrides?.name || 'Projeto de Teste',
    description: overrides?.description || 'Descrição do projeto de teste',
    documents: overrides?.documents || [],
    tasks: overrides?.tasks || [],
    phases: overrides?.phases || [],
    ...overrides,
  };
}

/**
 * Cria múltiplos projetos mock
 */
export function createMockProjects(count: number): Project[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProject({
      id: `proj-${i + 1}`,
      name: `Projeto ${i + 1}`,
      description: `Descrição do projeto ${i + 1}`,
    })
  );
}


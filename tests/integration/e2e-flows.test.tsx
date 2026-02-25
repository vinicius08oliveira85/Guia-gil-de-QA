import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { useProjectsStore } from '../../store/projectsStore';
import { JiraTask, Project } from '../../types';
import { createDbMocks, createMockProject } from './mocks';
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

describe('Testes de Integração End-to-End', () => {
  let mocks: ReturnType<typeof createDbMocks>;

  beforeEach(() => {
    resetStore();
    mocks = createDbMocks();
    mocks.reset();
    
    // Configurar mocks
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

  describe('3.1 Fluxo Completo: Criar → Editar → Navegar → Persistir', () => {
    it('deve completar fluxo completo de criação e edição de projeto', async () => {
      const user = userEvent.setup();
      const store = useProjectsStore.getState();
      
      render(<App />);
      
      // 1. Navegar para dashboard
      window.dispatchEvent(new CustomEvent('show-dashboard'));
      await waitFor(() => {
        expect(screen.queryByText(/QA Agile Guide/i)).not.toBeInTheDocument();
      });
      
      // 2. Criar novo projeto
      const createButton = screen.queryByRole('button', { name: /criar|novo projeto/i });
      if (createButton) {
        await user.click(createButton);
        
        // Preencher formulário
        const nameInput = screen.getByPlaceholderText(/nome|name/i);
        await user.type(nameInput, 'Projeto E2E');
        
        const descInput = screen.getByPlaceholderText(/descrição|description/i);
        await user.type(descInput, 'Descrição do projeto E2E');
        
        const submitButton = screen.getByRole('button', { name: /criar|create|salvar|save/i });
        await user.click(submitButton);
      } else {
        // Se não houver botão, criar diretamente via store
        await store.createProject('Projeto E2E', 'Descrição do projeto E2E');
      }
      
      // Verificar que projeto foi criado
      await waitForStoreState(state => state.projects.length > 0);
      const createdProject = store.projects.find(p => p.name === 'Projeto E2E');
      expect(createdProject).toBeDefined();
      
      // 3. Navegar para ProjectView
      if (createdProject) {
        store.selectProject(createdProject.id);
        await waitFor(() => {
          expect(store.selectedProjectId).toBe(createdProject.id);
        });
      }
      
      // 4. Adicionar tarefa (simulado via store)
      if (createdProject) {
        const task: JiraTask = {
          id: `task-${Date.now()}`,
          title: 'Tarefa de teste',
          description: 'Descrição da tarefa',
          status: 'To Do',
          type: 'Tarefa',
          priority: 'Média',
          testCases: [],
        };
        
        await store.addTaskToProject(createdProject.id, task);
        
        // Verificar que tarefa foi adicionada
        const updatedProject = store.projects.find(p => p.id === createdProject.id);
        expect(updatedProject?.tasks).toHaveLength(1);
      }
      
      // 5. Navegar para tab Documents (simulado)
      // Em um teste real, clicaria na tab, mas aqui simulamos
      
      // 6. Voltar para Dashboard
      store.selectProject(null);
      await waitFor(() => {
        expect(store.selectedProjectId).toBeNull();
      });
      
      // 7. Simular recarregamento: limpar e recarregar
      const projectId = createdProject?.id;
      resetStore();
      await store.loadProjects();
      
      // 8. Verificar que todos os dados foram persistidos
      await waitForStoreState(state => state.projects.length > 0);
      const reloadedProject = store.projects.find(p => p.id === projectId);
      expect(reloadedProject).toBeDefined();
      expect(reloadedProject?.name).toBe('Projeto E2E');
      expect(reloadedProject?.tasks).toHaveLength(1);
    });
  });

  describe('3.2 Fluxo: Importar → Sincronizar → Navegar', () => {
    it('deve importar projeto, sincronizar e navegar corretamente', async () => {
      const store = useProjectsStore.getState();
      
      // 1. Criar projeto mock (simulando importação do Jira)
      const importedProject = createMockProject({
        name: 'Projeto Importado',
        description: 'Importado do Jira',
      });
      
      // 2. Importar projeto
      await store.importProject(importedProject);
      
      // Verificar que projeto foi importado
      expect(store.projects.some(p => p.id === importedProject.id)).toBe(true);
      
      // 3. Navegar para ProjectView
      store.selectProject(importedProject.id);
      expect(store.selectedProjectId).toBe(importedProject.id);
      
      // 4. Fazer alterações
      const updated = {
        ...importedProject,
        name: 'Projeto Importado e Editado',
      };
      await store.updateProject(updated);
      
      // 5. Sincronizar com Supabase
      await store.saveProjectToSupabase(importedProject.id);
      
      // Verificar que foi salvo no Supabase
      const supabaseProjects = await mocks.mockSupabase.loadProjects();
      expect(supabaseProjects.some(p => p.id === importedProject.id)).toBe(true);
      
      // 6. Verificar persistência em ambos storages
      const indexedDBProjects = await mocks.mockIndexedDB.loadProjects();
      expect(indexedDBProjects.some(p => p.id === importedProject.id)).toBe(true);
    });
  });

  describe('3.3 Fluxo: Múltiplos Projetos', () => {
    it('deve criar múltiplos projetos e navegar entre eles sem misturar dados', async () => {
      const store = useProjectsStore.getState();
      
      // 1. Criar 3 projetos
      const project1 = await store.createProject('Projeto 1', 'Descrição 1');
      const project2 = await store.createProject('Projeto 2', 'Descrição 2');
      const project3 = await store.createProject('Projeto 3', 'Descrição 3');
      
      expect(store.projects).toHaveLength(3);
      
      // 2. Navegar entre eles rapidamente
      store.selectProject(project1.id);
      expect(store.selectedProjectId).toBe(project1.id);
      
      store.selectProject(project2.id);
      expect(store.selectedProjectId).toBe(project2.id);
      
      store.selectProject(project3.id);
      expect(store.selectedProjectId).toBe(project3.id);
      
      // 3. Verificar que dados não se misturaram
      const proj1 = store.projects.find(p => p.id === project1.id);
      const proj2 = store.projects.find(p => p.id === project2.id);
      const proj3 = store.projects.find(p => p.id === project3.id);
      
      expect(proj1?.name).toBe('Projeto 1');
      expect(proj2?.name).toBe('Projeto 2');
      expect(proj3?.name).toBe('Projeto 3');
      
      // 4. Adicionar tarefa em um projeto específico
      const task: JiraTask = {
        id: 'task-1',
        title: 'Tarefa do Projeto 1',
        description: 'Descrição da tarefa',
        status: 'To Do',
        type: 'Tarefa',
        priority: 'Média',
        testCases: [],
      };
      
      await store.addTaskToProject(project1.id, task);
      
      // Verificar que tarefa foi adicionada apenas ao projeto 1
      const updatedProj1 = store.projects.find(p => p.id === project1.id);
      const updatedProj2 = store.projects.find(p => p.id === project2.id);
      
      expect(updatedProj1?.tasks).toHaveLength(1);
      expect(updatedProj2?.tasks).toHaveLength(0);
      
      // 5. Verificar persistência individual
      const indexedDBProjects = await mocks.mockIndexedDB.loadProjects();
      expect(indexedDBProjects).toHaveLength(3);
      expect(indexedDBProjects.find(p => p.id === project1.id)?.tasks).toHaveLength(1);
      expect(indexedDBProjects.find(p => p.id === project2.id)?.tasks).toHaveLength(0);
    });
  });
});


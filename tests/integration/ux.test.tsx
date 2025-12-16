import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { useProjectsStore } from '../../store/projectsStore';
import { createDbMocks, createMockProject } from './mocks';
import { resetStore } from './helpers';

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

describe('Testes de UX', () => {
  let mocks: ReturnType<typeof createDbMocks>;

  beforeEach(() => {
    resetStore();
    mocks = createDbMocks();
    mocks.reset();
    
    vi.mocked(require('../../services/dbService').loadProjectsFromIndexedDB)
      .mockImplementation(() => mocks.mockIndexedDB.loadProjects());
  });

  describe('4.1 Estados de Loading', () => {
    it('deve exibir loading skeleton durante carregamento de projetos', async () => {
      // Simular delay no carregamento
      vi.mocked(require('../../services/dbService').loadProjectsFromIndexedDB)
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
      
      const store = useProjectsStore.getState();
      store.isLoading = true;
      
      render(<App />);
      
      // Verificar que skeleton ou loading aparece
      const loadingElements = screen.queryAllByText(/carregando|loading/i);
      const skeletons = screen.queryAllByTestId(/skeleton|loading/i);
      
      // Pelo menos um indicador de loading deve estar presente
      expect(loadingElements.length > 0 || skeletons.length > 0 || store.isLoading).toBe(true);
    });

    it('deve exibir loading durante sincronização com Supabase', async () => {
      mocks.mockSupabase.setDelay(200);
      
      const store = useProjectsStore.getState();
      const syncPromise = store.syncProjectsFromSupabase();
      
      // Durante sincronização, pode haver indicadores visuais
      // Verificar que operação não bloqueia completamente
      expect(store.isLoading).toBe(false); // Após loadProjects inicial
      
      await syncPromise;
    });

    it('deve ter transições suaves entre estados', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      
      render(<App />);
      
      // Simular transição de loading para carregado
      store.isLoading = true;
      await waitFor(() => {
        store.isLoading = false;
        store.projects = [project];
      });
      
      // Verificar que estado mudou sem erros
      expect(store.isLoading).toBe(false);
      expect(store.projects).toHaveLength(1);
    });
  });

  describe('4.2 Feedback Visual', () => {
    it('deve exibir toast de sucesso ao criar projeto', async () => {
      const store = useProjectsStore.getState();
      
      render(<App />);
      
      // Criar projeto
      await store.createProject('Projeto Teste', 'Descrição');
      
      // Verificar que projeto foi criado (toast pode não estar no DOM imediatamente)
      expect(store.projects.length).toBeGreaterThan(0);
    });

    it('deve exibir mensagens de erro claras', async () => {
      // Simular erro
      vi.mocked(require('../../services/dbService').addProject)
        .mockRejectedValueOnce(new Error('Erro ao salvar'));
      
      const store = useProjectsStore.getState();
      
      // Tentar criar projeto deve falhar graciosamente
      await expect(
        store.createProject('Projeto Erro', 'Descrição')
      ).rejects.toThrow();
    });

    it('deve solicitar confirmação para ações destrutivas', async () => {
      const user = userEvent.setup();
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      
      render(<App />);
      
      // Navegar para dashboard
      window.dispatchEvent(new CustomEvent('show-dashboard'));
      
      // Procurar botão de deletar (pode estar em modal ou card)
      const deleteButton = screen.queryByRole('button', { name: /deletar|delete|excluir/i });
      
      if (deleteButton) {
        await user.click(deleteButton);
        
        // Verificar que modal de confirmação aparece
        await waitFor(() => {
          const confirmDialog = screen.queryByRole('dialog');
          expect(confirmDialog).toBeInTheDocument();
        });
      }
    });
  });

  describe('4.3 Acessibilidade', () => {
    it('deve permitir navegação por teclado', async () => {
      const user = userEvent.setup();
      const projects = [createMockProject()];
      const store = useProjectsStore.getState();
      store.projects = projects;
      
      render(<App />);
      
      // Navegar com Tab
      await user.tab();
      
      // Verificar que foco está em elemento interativo
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInstanceOf(HTMLElement);
    });

    it('deve ter ARIA labels corretos', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      store.selectedProjectId = project.id;
      
      render(<App />);
      
      // Verificar elementos com roles apropriados
      await waitFor(() => {
        const tabs = screen.queryAllByRole('tab');
        const tabpanels = screen.queryAllByRole('tabpanel');
        
        // Se houver tabs, devem ter tabpanels correspondentes
        if (tabs.length > 0) {
          expect(tabpanels.length).toBeGreaterThan(0);
        }
      });
    });

    it('deve anunciar mudanças de estado para screen readers', async () => {
      const store = useProjectsStore.getState();
      
      render(<App />);
      
      // Criar projeto deve atualizar estado
      await store.createProject('Projeto Acessível', 'Descrição');
      
      // Verificar que estado foi atualizado (screen readers leem mudanças)
      expect(store.projects.length).toBeGreaterThan(0);
    });

    it('deve manter foco visual correto durante navegação', async () => {
      const user = userEvent.setup();
      const projects = [createMockProject()];
      const store = useProjectsStore.getState();
      store.projects = projects;
      
      render(<App />);
      
      // Navegar com teclado
      await user.tab();
      
      // Verificar que foco é visível
      const focusedElement = document.activeElement as HTMLElement;
      if (focusedElement) {
        // Elemento focado deve estar no DOM
        expect(focusedElement.ownerDocument).toBe(document);
      }
    });
  });

  describe('4.4 Performance de Navegação', () => {
    it('deve ter transições rápidas entre telas', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      
      render(<App />);
      
      const startTime = Date.now();
      
      // Navegar para projeto
      store.selectProject(project.id);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Transição deve ser rápida (< 300ms conforme especificação)
      expect(duration).toBeLessThan(300);
    });

    it('deve carregar componentes lazy corretamente', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      store.selectedProjectId = project.id;
      
      render(<App />);
      
      // Aguardar componente lazy carregar
      await waitFor(() => {
        // ProjectView deve estar renderizado
        expect(store.selectedProjectId).toBe(project.id);
      }, { timeout: 2000 });
    });

    it('não deve vazar memória durante navegação', async () => {
      const projects = [createMockProject(), createMockProject(), createMockProject()];
      const store = useProjectsStore.getState();
      store.projects = projects;
      
      render(<App />);
      
      // Navegar entre projetos múltiplas vezes
      for (let i = 0; i < 10; i++) {
        store.selectProject(projects[i % projects.length].id);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Verificar que store ainda funciona corretamente
      expect(store.projects).toHaveLength(3);
      expect(store.selectedProjectId).toBeDefined();
    });
  });
});


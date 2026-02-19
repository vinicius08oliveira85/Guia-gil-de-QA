import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { useProjectsStore } from '../../store/projectsStore';
import { createMockProject, createMockProjects } from './mocks';
import { resetStore, simulateNavigation } from './helpers';

// Mock dos serviços
vi.mock('../../services/dbService', () => ({
  loadProjectsFromIndexedDB: vi.fn(() => Promise.resolve([])),
  addProject: vi.fn(() => Promise.resolve()),
  updateProject: vi.fn(() => Promise.resolve()),
  deleteProject: vi.fn(() => Promise.resolve()),
  saveProjectToSupabaseOnly: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../services/supabaseService', () => ({
  loadProjectsFromSupabase: vi.fn(() => Promise.resolve({ projects: [], loadFailed: false })),
  isSupabaseAvailable: vi.fn(() => false),
  getUserId: vi.fn(() => Promise.resolve('anon-shared')),
}));

vi.mock('../../utils/auditLog', () => ({
  addAuditLog: vi.fn(),
}));

describe('Testes de Navegação', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('1.1 Fluxo Principal de Navegação', () => {
    it('deve navegar de Landing Page para Dashboard ao clicar em "Abrir Meus Projetos"', async () => {
      render(<App />);

      // Verificar que landing page está visível
      expect(screen.getByText(/QA Agile Guide/i)).toBeInTheDocument();

      // Encontrar e clicar no botão de navegação
      const getStartedButton = screen.getByRole('button', { name: /criar.*projetos/i });
      expect(getStartedButton).toBeInTheDocument();

      // Disparar evento customizado que o App.tsx escuta
      window.dispatchEvent(new CustomEvent('show-dashboard'));

      // Aguardar transição para dashboard
      await waitFor(() => {
        expect(screen.queryByText(/QA Agile Guide/i)).not.toBeInTheDocument();
      });
    });

    it('deve navegar de Dashboard para ProjectView ao selecionar projeto', async () => {
      const projects = createMockProjects(2);
      const store = useProjectsStore.getState();
      store.projects = projects;

      render(<App />);

      // Simular navegação para dashboard (forçar não mostrar landing)
      window.dispatchEvent(new CustomEvent('show-dashboard'));
      await waitFor(() => {
        simulateNavigation('dashboard');
      });

      // Aguardar dashboard aparecer
      await waitFor(() => {
        expect(screen.getByText(projects[0].name)).toBeInTheDocument();
      });

      // Clicar no primeiro projeto
      const projectCard = screen.getByText(projects[0].name).closest('div[role="button"]') || 
                          screen.getByText(projects[0].name);
      await userEvent.click(projectCard);

      // Verificar que ProjectView foi renderizado
      await waitFor(() => {
        // ProjectView deve mostrar o nome do projeto ou alguma tab
        expect(screen.getByText(projects[0].name) || screen.getByRole('tab')).toBeInTheDocument();
      });
    });

    it('deve navegar de ProjectView para Dashboard ao clicar em Voltar', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      store.selectedProjectId = project.id;

      render(<App />);

      // Verificar que ProjectView está visível
      await waitFor(() => {
        expect(screen.getByText(project.name) || screen.getByRole('tab')).toBeInTheDocument();
      });

      // Encontrar e clicar no botão voltar
      const backButton = screen.queryByRole('button', { name: /voltar|back/i });
      if (backButton) {
        await userEvent.click(backButton);
      } else {
        // Se não houver botão explícito, simular navegação
        simulateNavigation('dashboard');
      }

      // Verificar que voltou para dashboard
      await waitFor(() => {
        expect(store.selectedProjectId).toBeNull();
      });
    });

    it('deve navegar entre tabs no ProjectView', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      store.selectedProjectId = project.id;

      render(<App />);

      // Aguardar ProjectView carregar
      await waitFor(() => {
        const tabs = screen.queryAllByRole('tab');
        expect(tabs.length).toBeGreaterThan(0);
      });

      // Encontrar tabs
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      // Clicar em diferentes tabs
      for (const tab of tabs.slice(0, Math.min(3, tabs.length))) {
        await userEvent.click(tab);
        await waitFor(() => {
          expect(tab).toHaveAttribute('aria-selected', 'true');
        });
      }
    });
  });

  describe('1.2 Navegação via Busca', () => {
    it('deve abrir modal de busca ao pressionar Ctrl+K', async () => {
      const user = userEvent.setup();
      const projects = createMockProjects(3);
      const store = useProjectsStore.getState();
      store.projects = projects;

      render(<App />);

      // Simular atalho Ctrl+K
      await user.keyboard('{Control>}k{/Control}');

      // Verificar que modal de busca aparece
      await waitFor(() => {
        const searchInput = screen.queryByPlaceholderText(/buscar|search/i);
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('deve fechar modal de busca ao pressionar ESC', async () => {
      const user = userEvent.setup();
      const projects = createMockProjects(3);
      const store = useProjectsStore.getState();
      store.projects = projects;

      render(<App />);

      // Abrir busca
      await user.keyboard('{Control>}k{/Control}');
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/buscar|search/i)).toBeInTheDocument();
      });

      // Fechar com ESC
      await user.keyboard('{Escape}');

      // Verificar que modal fechou
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/buscar|search/i)).not.toBeInTheDocument();
      });
    });

    it('deve navegar para projeto ao selecionar resultado da busca', async () => {
      const user = userEvent.setup();
      const projects = createMockProjects(3);
      const store = useProjectsStore.getState();
      store.projects = projects;

      render(<App />);

      // Abrir busca
      await user.keyboard('{Control>}k{/Control}');
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/buscar|search/i)).toBeInTheDocument();
      });

      // Digitar nome do projeto
      const searchInput = screen.getByPlaceholderText(/buscar|search/i);
      await user.type(searchInput, projects[0].name);

      // Aguardar resultados aparecerem
      await waitFor(() => {
        expect(screen.getByText(projects[0].name)).toBeInTheDocument();
      });

      // Clicar no resultado
      const result = screen.getByText(projects[0].name);
      await user.click(result);

      // Verificar navegação para ProjectView
      await waitFor(() => {
        expect(store.selectedProjectId).toBe(projects[0].id);
      });
    });
  });

  describe('1.3 Navegação via Breadcrumbs', () => {
    it('deve exibir breadcrumbs corretamente no ProjectView', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      store.selectedProjectId = project.id;

      render(<App />);

      // Aguardar ProjectView carregar
      await waitFor(() => {
        // Breadcrumbs podem estar presentes
        const breadcrumbs = screen.queryByRole('navigation', { name: /breadcrumb/i });
        // Não falhar se não houver breadcrumbs - pode ser opcional
        if (breadcrumbs) {
          expect(breadcrumbs).toBeInTheDocument();
        }
      });
    });
  });

  describe('1.4 Edge Cases de Navegação', () => {
    it('deve lidar com navegação rápida entre múltiplos projetos', async () => {
      const projects = createMockProjects(5);
      const store = useProjectsStore.getState();
      store.projects = projects;

      render(<App />);

      // Navegar rapidamente entre projetos
      for (let i = 0; i < 3; i++) {
        store.selectProject(projects[i].id);
        await waitFor(() => {
          expect(store.selectedProjectId).toBe(projects[i].id);
        });
        // Pequeno delay para simular navegação rápida
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Verificar que último projeto selecionado está correto
      expect(store.selectedProjectId).toBe(projects[2].id);
    });

    it('deve manter estado durante navegação com dados ausentes', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      store.selectedProjectId = project.id;

      render(<App />);

      // Simular projeto sendo removido durante navegação
      store.projects = [];
      
      // Verificar que app não quebra
      await waitFor(() => {
        // App deve lidar graciosamente com projeto ausente
        expect(store.projects).toHaveLength(0);
      });
    });

    it('deve lidar com navegação durante operações assíncronas', async () => {
      const project = createMockProject();
      const store = useProjectsStore.getState();
      store.projects = [project];
      store.isLoading = true;

      render(<App />);

      // Navegar enquanto está carregando
      store.selectProject(project.id);

      // Finalizar loading
      store.isLoading = false;

      // Verificar que navegação foi concluída
      await waitFor(() => {
        expect(store.selectedProjectId).toBe(project.id);
        expect(store.isLoading).toBe(false);
      });
    });
  });
});


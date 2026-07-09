import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { useProjectsStore } from '../../store/projectsStore';
import type { Project } from '../../types';
import { createDbMocks, createMockProject, createMockProjects } from './mocks';
import { resetStore, simulateNavigation, setInitialRoute } from './helpers';
import { wireDbServiceMocks } from './wireDbServiceMocks';

// Mock dos serviços
vi.mock('../../services/dbService', () => ({
  loadProjectsFromIndexedDB: vi.fn(),
  getProjectById: vi.fn(),
  addProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  saveProjectToSupabaseOnly: vi.fn(),
  writeProjectToIndexedDBOnly: vi.fn(),
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
  let mocks: ReturnType<typeof createDbMocks>;

  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    mocks = createDbMocks();
    mocks.reset();
    wireDbServiceMocks(mocks);
  });

  async function seedAndLoadApp(projects: Project[], startPath = '/projects') {
    for (const p of projects) {
      await mocks.mockIndexedDB.saveProject(p);
    }
    setInitialRoute(startPath);
    render(<App />);
    await waitFor(
      () => {
        expect(useProjectsStore.getState().projects.length).toBe(projects.length);
      },
      { timeout: 20_000 }
    );
  }

  describe('1.1 Fluxo Principal de Navegação', () => {
    it('deve exibir o dashboard principal após o carregamento', async () => {
      setInitialRoute('/projects');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Projetos QA/i)).toBeInTheDocument();
      });
    });

    it('deve navegar de Dashboard para ProjectView ao selecionar projeto', async () => {
      const projects = createMockProjects(2);
      await seedAndLoadApp(projects);

      simulateNavigation('project', projects[0].id);

      await waitFor(() => {
        expect(useProjectsStore.getState().selectedProjectId).toBe(projects[0].id);
      });
    });

    it('deve navegar de ProjectView para Dashboard ao clicar em Voltar', async () => {
      const project = createMockProject();
      await seedAndLoadApp([project]);
      simulateNavigation('project', project.id);

      await waitFor(() => {
        expect(screen.getByText(project.name)).toBeInTheDocument();
      });

      simulateNavigation('dashboard');

      await waitFor(() => {
        expect(useProjectsStore.getState().selectedProjectId).toBeNull();
      });
    });

    it('deve navegar entre tabs no ProjectView', async () => {
      const project = createMockProject();
      await seedAndLoadApp([project]);
      simulateNavigation('project', project.id);

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
      await seedAndLoadApp(projects);

      await user.keyboard('{Control>}k{/Control}');

      await waitFor(() => {
        const searchInput = screen.queryByPlaceholderText(/buscar|search/i);
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('deve fechar modal de busca ao pressionar ESC', async () => {
      const user = userEvent.setup();
      const projects = createMockProjects(3);
      await seedAndLoadApp(projects);

      await user.keyboard('{Control>}k{/Control}');
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/buscar|search/i)).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/buscar|search/i)).not.toBeInTheDocument();
      });
    });

    it('deve navegar para projeto ao selecionar resultado da busca', async () => {
      const user = userEvent.setup();
      const projects = createMockProjects(3);
      await seedAndLoadApp(projects);

      await user.keyboard('{Control>}k{/Control}');
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/buscar|search/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar|search/i);
      await user.type(searchInput, projects[0].name);

      await waitFor(() => {
        expect(screen.getByText(projects[0].name)).toBeInTheDocument();
      });

      const result = screen.getAllByText(projects[0].name)[0];
      await user.click(result);

      await waitFor(() => {
        expect(useProjectsStore.getState().selectedProjectId).toBe(projects[0].id);
      });
    });
  });

  describe('1.3 Navegação via Breadcrumbs', () => {
    it('deve exibir breadcrumbs corretamente no ProjectView', async () => {
      const project = createMockProject();
      await seedAndLoadApp([project]);
      simulateNavigation('project', project.id);

      const breadcrumbs = await screen.findByRole('navigation', {
        name: /trilha de navegação|breadcrumb/i,
      });
      expect(breadcrumbs).toBeInTheDocument();
      expect(within(breadcrumbs).getByRole('button', { name: 'Projetos QA' })).toBeInTheDocument();
    });

    it('deve navegar para o dashboard ao clicar em Projetos no breadcrumb', async () => {
      const user = userEvent.setup();
      const project = createMockProject();
      await seedAndLoadApp([project]);
      simulateNavigation('project', project.id);

      await waitFor(() => {
        expect(screen.getByText(project.name)).toBeInTheDocument();
      });

      const breadcrumbs = await screen.findByRole('navigation', {
        name: /trilha de navegação|breadcrumb/i,
      });
      await user.click(within(breadcrumbs).getByRole('button', { name: 'Projetos QA' }));

      await waitFor(() => {
        expect(useProjectsStore.getState().selectedProjectId).toBeNull();
        expect(window.location.pathname).toBe('/projects/qa');
      });
    });
  });

  describe('1.4 Edge Cases de Navegação', () => {
    it('deve lidar com navegação rápida entre múltiplos projetos', async () => {
      const projects = createMockProjects(5);
      await seedAndLoadApp(projects);

      for (let i = 0; i < 3; i++) {
        simulateNavigation('project', projects[i].id);
        await waitFor(() => {
          expect(useProjectsStore.getState().selectedProjectId).toBe(projects[i].id);
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      expect(useProjectsStore.getState().selectedProjectId).toBe(projects[2].id);
    });

    it('deve manter estado durante navegação com dados ausentes', async () => {
      const project = createMockProject();
      await seedAndLoadApp([project]);
      simulateNavigation('project', project.id);

      useProjectsStore.setState({ projects: [] });

      await waitFor(() => {
        expect(useProjectsStore.getState().projects).toHaveLength(0);
      });
    });

    it('deve permitir selecionar projeto após carregar dados', async () => {
      const project = createMockProject();
      await seedAndLoadApp([project]);

      useProjectsStore.getState().selectProject(project.id);
      simulateNavigation('project', project.id);

      await waitFor(() => {
        expect(useProjectsStore.getState().selectedProjectId).toBe(project.id);
        expect(useProjectsStore.getState().isLoading).toBe(false);
      });
    });
  });
});

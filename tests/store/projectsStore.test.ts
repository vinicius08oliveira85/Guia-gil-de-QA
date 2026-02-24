import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectsStore } from '../../store/projectsStore';
import { Project } from '../../types';
import * as dbService from '../../services/dbService';

// Mock do dbService
vi.mock('../../services/dbService', () => ({
  getAllProjects: vi.fn(),
  loadProjectsFromIndexedDB: vi.fn(),
  addProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  saveProjectToSupabaseOnly: vi.fn(),
}));

// Mock do auditLog
vi.mock('../../utils/auditLog', () => ({
  addAuditLog: vi.fn(),
}));

describe('useProjectsStore', () => {
  beforeEach(() => {
    // Reset store antes de cada teste
    useProjectsStore.setState({
      projects: [],
      selectedProjectId: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('loadProjects', () => {
    it('deve carregar projetos com sucesso', async () => {
      const mockProjects: Project[] = [
        {
          id: 'proj-1',
          name: 'Projeto 1',
          description: 'Descrição 1',
          documents: [],
          tasks: [],
          phases: [],
        },
      ];

      vi.mocked(dbService.loadProjectsFromIndexedDB).mockResolvedValue(mockProjects);

      await useProjectsStore.getState().loadProjects();

      const state = useProjectsStore.getState();
      expect(state.projects).toEqual(mockProjects);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('deve tratar erro ao carregar projetos', async () => {
      const error = new Error('Erro ao carregar');
      vi.mocked(dbService.loadProjectsFromIndexedDB).mockRejectedValue(error);

      await useProjectsStore.getState().loadProjects();

      const state = useProjectsStore.getState();
      expect(state.projects).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeInstanceOf(Error);
    });
  });

  describe('createProject', () => {
    it('deve criar projeto sem template', async () => {
      vi.mocked(dbService.addProject).mockResolvedValue(undefined);

      const created = await useProjectsStore.getState().createProject('Novo Projeto', 'Descrição');

      expect(created.name).toBe('Novo Projeto');
      expect(created.description).toBe('Descrição');
      expect(useProjectsStore.getState().projects).toHaveLength(1);
    });

    it('deve criar projeto com template', async () => {
      vi.mocked(dbService.addProject).mockResolvedValue(undefined);

      const created = await useProjectsStore
        .getState()
        .createProject('Projeto Template', 'Descrição', 'web-app');

      expect(created.name).toBe('Projeto Template');
      expect(dbService.addProject).toHaveBeenCalled();
    });
  });

  describe('updateProject', () => {
    it('deve atualizar projeto existente', async () => {
      const project: Project = {
        id: 'proj-1',
        name: 'Projeto Original',
        description: 'Descrição',
        documents: [],
        tasks: [],
        phases: [],
      };

      useProjectsStore.setState({ projects: [project] });
      vi.mocked(dbService.updateProject).mockResolvedValue(undefined);

      const updated = { ...project, name: 'Projeto Atualizado' };
      await useProjectsStore.getState().updateProject(updated);

      const state = useProjectsStore.getState();
      expect(state.projects[0].name).toBe('Projeto Atualizado');
    });
  });

  describe('deleteProject', () => {
    it('deve deletar projeto', async () => {
      const project: Project = {
        id: 'proj-1',
        name: 'Projeto',
        description: 'Descrição',
        documents: [],
        tasks: [],
        phases: [],
      };

      useProjectsStore.setState({
        projects: [project],
        selectedProjectId: 'proj-1',
      });
      vi.mocked(dbService.deleteProject).mockResolvedValue(undefined);

      await useProjectsStore.getState().deleteProject('proj-1');

      const state = useProjectsStore.getState();
      expect(state.projects).toHaveLength(0);
      expect(state.selectedProjectId).toBeNull();
    });
  });

  describe('selectProject', () => {
    it('deve selecionar projeto', () => {
      useProjectsStore.getState().selectProject('proj-1');
      expect(useProjectsStore.getState().selectedProjectId).toBe('proj-1');
    });

    it('deve desselecionar projeto', () => {
      useProjectsStore.setState({ selectedProjectId: 'proj-1' });
      useProjectsStore.getState().selectProject(null);
      expect(useProjectsStore.getState().selectedProjectId).toBeNull();
    });
  });

  describe('getSelectedProject', () => {
    it('deve retornar projeto selecionado', () => {
      const project: Project = {
        id: 'proj-1',
        name: 'Projeto',
        description: 'Descrição',
        documents: [],
        tasks: [],
        phases: [],
      };

      useProjectsStore.setState({
        projects: [project],
        selectedProjectId: 'proj-1',
      });

      const selected = useProjectsStore.getState().getSelectedProject();
      expect(selected).toEqual(project);
    });

    it('deve retornar undefined se nenhum projeto selecionado', () => {
      const selected = useProjectsStore.getState().getSelectedProject();
      expect(selected).toBeUndefined();
    });
  });
});

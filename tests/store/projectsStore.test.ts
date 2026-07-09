import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectsStore } from '../../store/projectsStore';
import { Project } from '../../types';
import * as dbService from '../../services/dbService';
import { filterProjectsByWorkflow } from '../../utils/projectWorkflow';

vi.mock('../../services/localSaveService', () => ({
  saveProjectLocally: vi.fn(),
  syncLocalBackup: vi.fn(),
}));

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

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { dismiss: vi.fn(), promise: vi.fn() }),
}));

vi.mock('../../services/ai/generalAnalysisService', () => ({
  getGeneralIAAnalysisSnapshotHash: vi.fn(() => 'snapshot-default'),
  invalidateGeneralAnalysisCache: vi.fn(),
}));

import * as generalAnalysisService from '../../services/ai/generalAnalysisService';

describe('useProjectsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generalAnalysisService.getGeneralIAAnalysisSnapshotHash).mockImplementation(
      () => 'snapshot-default'
    );
    useProjectsStore.setState({
      projects: [],
      selectedProjectId: null,
      isLoading: false,
      error: null,
    });
  });

  describe('loadProjects', () => {
    it('deve carregar projetos com sucesso', async () => {
      const mockProjects: Project[] = [
        {
          id: 'proj-1',
          name: 'Projeto 1',
          description: 'Descrição 1',
          documents: [],
          businessRules: [],
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
      vi.mocked(dbService.addProject).mockResolvedValue({ savedToSupabase: true });

      const created = await useProjectsStore.getState().createProject('Novo Projeto', 'Descrição');

      expect(created.name).toBe('Novo Projeto');
      expect(created.description).toBe('Descrição');
      expect(useProjectsStore.getState().projects).toHaveLength(1);
    });

    it('deve criar projeto com template', async () => {
      vi.mocked(dbService.addProject).mockResolvedValue({ savedToSupabase: true });

      const created = await useProjectsStore
        .getState()
        .createProject('Projeto Template', 'Descrição', 'web-app');

      expect(created.name).toBe('Projeto Template');
      expect(dbService.addProject).toHaveBeenCalled();
    });

    it('cria projeto Dev sem aparecer na listagem QA', async () => {
      vi.mocked(dbService.addProject).mockResolvedValue({ savedToSupabase: false });

      await useProjectsStore.getState().createProject('Somente Dev', 'Desc', undefined, 'dev');
      await useProjectsStore.getState().createProject('Somente QA', 'Desc', undefined, 'qa');

      const { projects } = useProjectsStore.getState();
      expect(filterProjectsByWorkflow(projects, 'dev')).toHaveLength(1);
      expect(filterProjectsByWorkflow(projects, 'qa')).toHaveLength(1);
      expect(filterProjectsByWorkflow(projects, 'dev')[0]?.name).toBe('Somente Dev');
      expect(filterProjectsByWorkflow(projects, 'qa')[0]?.name).toBe('Somente QA');
    });
  });

  describe('updateProject', () => {
    it('deve atualizar projeto existente', async () => {
      const project: Project = {
        id: 'proj-1',
        name: 'Projeto Original',
        description: 'Descrição',
        documents: [],
        businessRules: [],
        tasks: [],
        phases: [],
      };

      useProjectsStore.setState({ projects: [project] });
      vi.mocked(dbService.updateProject).mockResolvedValue({ savedToSupabase: true });

      const updated = { ...project, name: 'Projeto Atualizado' };
      await useProjectsStore.getState().updateProject(updated);

      const state = useProjectsStore.getState();
      expect(state.projects[0].name).toBe('Projeto Atualizado');
    });

    it('invalida cache de análise geral quando o snapshot do projeto muda', async () => {
      const project: Project = {
        id: 'proj-1',
        name: 'Antes',
        description: 'Descrição',
        documents: [],
        businessRules: [],
        tasks: [],
        phases: [],
      };
      useProjectsStore.setState({ projects: [project] });
      vi.mocked(dbService.updateProject).mockResolvedValue({ savedToSupabase: true });

      vi.mocked(generalAnalysisService.getGeneralIAAnalysisSnapshotHash)
        .mockReturnValueOnce('hash-antigo')
        .mockReturnValueOnce('hash-novo');

      await useProjectsStore
        .getState()
        .updateProject({ ...project, name: 'Depois' });

      expect(generalAnalysisService.invalidateGeneralAnalysisCache).toHaveBeenCalledWith('proj-1');
    });

    it('não invalida cache quando o snapshot do projeto permanece igual', async () => {
      const project: Project = {
        id: 'proj-1',
        name: 'Igual',
        description: 'Descrição',
        documents: [],
        businessRules: [],
        tasks: [],
        phases: [],
      };
      useProjectsStore.setState({ projects: [project] });
      vi.mocked(dbService.updateProject).mockResolvedValue({ savedToSupabase: true });
      vi.mocked(generalAnalysisService.getGeneralIAAnalysisSnapshotHash).mockReturnValue('mesmo-hash');

      await useProjectsStore.getState().updateProject({ ...project });

      expect(generalAnalysisService.invalidateGeneralAnalysisCache).not.toHaveBeenCalled();
    });
  });

  describe('deleteProject', () => {
    it('deve deletar projeto', async () => {
      const project: Project = {
        id: 'proj-1',
        name: 'Projeto',
        description: 'Descrição',
        documents: [],
        businessRules: [],
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
      expect(generalAnalysisService.invalidateGeneralAnalysisCache).toHaveBeenCalledWith('proj-1');
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
        businessRules: [],
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

/**
 * Testes de integração: salvamento (store → dbService → Supabase mock + IndexedDB),
 * importação (novo e id existente) e round-trip export/import.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectsStore } from '../../store/projectsStore';
import { createDbMocks, createMockProject, createMockProjects } from './mocks';
import { resetStore, waitForStoreState } from './helpers';
import * as dbService from '../../services/dbService';
import * as supabaseService from '../../services/supabaseService';
import { exportProjectToJSON } from '../../utils/exportService';
import { importProjectFromJSON } from '../../services/fileImportService';
import { Project } from '../../types';

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

describe('Salvamento e recuperação (store → dbService → Supabase mock + IndexedDB)', () => {
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
        await mocks.mockSupabase.saveProject(project);
        return { savedToSupabase: true };
      });
    vi.mocked(dbService.updateProject)
      .mockImplementation(async (project: Project) => {
        await mocks.mockIndexedDB.updateProject(project);
        await mocks.mockSupabase.updateProject(project);
        return { savedToSupabase: true };
      });
    vi.mocked(supabaseService.loadProjectsFromSupabase)
      .mockImplementation(() =>
        mocks.mockSupabase.loadProjects().then(projects => ({ projects, loadFailed: false }))
      );
  });

  it('deve persistir no mock Supabase e no IndexedDB ao criar projeto', async () => {
    const store = useProjectsStore.getState();
    const project = await store.createProject('Projeto Salvamento', 'Descrição');

    const fromIndexedDB = await mocks.mockIndexedDB.getProject(project.id);
    const fromSupabase = await mocks.mockSupabase.loadProjects();

    expect(fromIndexedDB).toBeDefined();
    expect(fromIndexedDB?.name).toBe('Projeto Salvamento');
    expect(fromSupabase.some(p => p.id === project.id)).toBe(true);
    expect(fromSupabase.find(p => p.id === project.id)?.name).toBe('Projeto Salvamento');
  });

  it('deve persistir no mock Supabase e no IndexedDB ao atualizar projeto', async () => {
    const project = createMockProject({ id: 'proj-update', name: 'Original' });
    await mocks.mockIndexedDB.saveProject(project);
    await mocks.mockSupabase.saveProject(project);

    const store = useProjectsStore.getState();
    store.projects = [project];
    const updated = { ...project, name: 'Atualizado', description: 'Nova descrição' };
    await store.updateProject(updated);

    const fromIndexedDB = await mocks.mockIndexedDB.getProject(project.id);
    const fromSupabase = (await mocks.mockSupabase.loadProjects()).find(p => p.id === project.id);

    expect(fromIndexedDB?.name).toBe('Atualizado');
    expect(fromIndexedDB?.description).toBe('Nova descrição');
    expect(fromSupabase?.name).toBe('Atualizado');
    expect(fromSupabase?.description).toBe('Nova descrição');
  });
});

describe('Importação de projetos', () => {
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
        await mocks.mockSupabase.saveProject(project);
        return { savedToSupabase: true };
      });
    vi.mocked(dbService.updateProject)
      .mockImplementation(async (project: Project) => {
        await mocks.mockIndexedDB.updateProject(project);
        await mocks.mockSupabase.updateProject(project);
        return { savedToSupabase: true };
      });
    vi.mocked(supabaseService.loadProjectsFromSupabase)
      .mockImplementation(() =>
        mocks.mockSupabase.loadProjects().then(projects => ({ projects, loadFailed: false }))
      );
  });

  it('deve importar projeto novo e chamar addProject', async () => {
    const newProject: Project = {
      id: 'proj-import-new',
      name: 'Importado Novo',
      description: 'Desc',
      documents: [],
      tasks: [],
      phases: [],
    };

    await useProjectsStore.getState().importProject(newProject);

    const state = useProjectsStore.getState();
    expect(state.projects.some(p => p.id === newProject.id)).toBe(true);
    expect(state.projects.find(p => p.id === newProject.id)?.name).toBe('Importado Novo');
    const fromIndexedDB = await mocks.mockIndexedDB.getProject(newProject.id);
    expect(fromIndexedDB).toBeDefined();
    expect(dbService.addProject).toHaveBeenCalledWith(expect.objectContaining({ id: newProject.id }));
  });

  it('deve importar projeto com id já existente usando updateProject (sem ConstraintError)', async () => {
    const existing: Project = {
      id: 'proj-import-existing',
      name: 'Existente',
      description: 'Antiga',
      documents: [],
      tasks: [],
      phases: [],
    };
    await mocks.mockIndexedDB.saveProject(existing);
    await mocks.mockSupabase.saveProject(existing);

    useProjectsStore.setState({ projects: [existing] });

    const updated: Project = {
      ...existing,
      name: 'Existente Atualizado',
      description: 'Nova descrição',
    };

    await expect(useProjectsStore.getState().importProject(updated)).resolves.not.toThrow();

    await waitForStoreState(state => {
      const p = state.projects.find(proj => proj.id === existing.id);
      return p?.name === 'Existente Atualizado';
    });
    const state = useProjectsStore.getState();
    expect(state.projects.find(p => p.id === existing.id)?.description).toBe('Nova descrição');
    expect(dbService.updateProject).toHaveBeenCalledWith(expect.objectContaining({ id: existing.id, name: 'Existente Atualizado' }));
  });
});

describe('Round-trip export/import', () => {
  it('deve preservar campos do projeto ao exportar e importar', async () => {
    const project: Project = {
      id: 'proj-roundtrip',
      name: 'Projeto Round-Trip',
      description: 'Descrição',
      documents: [],
      tasks: [],
      phases: [{ name: 'Analysis', status: 'Concluído', summary: 'Ok' }],
      shiftLeftAnalysis: { recommendations: [{ phase: 'Analysis', recommendation: 'R1' }] },
      testPyramidAnalysis: { distribution: [] },
      tags: ['tag1'],
      specificationDocument: 'Conteúdo do doc',
    };

    const json = exportProjectToJSON(project);
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], 'export.json', { type: 'application/json' });
    if (typeof file.text !== 'function') {
      (file as unknown as { text: () => Promise<string> }).text = () => Promise.resolve(json);
    }

    const result = await importProjectFromJSON(file);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    const imported = result.data!;
    expect(imported.id).toBe(project.id);
    expect(imported.name).toBe(project.name);
    expect(imported.description).toBe(project.description);
    expect(imported.phases).toEqual(project.phases);
    expect(imported.shiftLeftAnalysis).toEqual(project.shiftLeftAnalysis);
    expect(imported.tags).toEqual(project.tags);
    expect(imported.specificationDocument).toBe(project.specificationDocument);
  });
});

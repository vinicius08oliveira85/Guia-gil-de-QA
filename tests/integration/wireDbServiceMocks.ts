import { vi } from 'vitest';
import type { Project } from '../../types';
import * as dbService from '../../services/dbService';
import * as supabaseService from '../../services/supabaseService';
import { createDbMocks } from './mocks';

const saveResult = { savedToSupabase: true as const };

type Mocks = ReturnType<typeof createDbMocks>;

/** Liga os mocks de `dbService` ao `MockIndexedDB` / `MockSupabase` do teste. */
export function wireDbServiceMocks(mocks: Mocks): void {
  vi.mocked(dbService.loadProjectsFromIndexedDB).mockImplementation(() => mocks.mockIndexedDB.loadProjects());

  vi.mocked(dbService.getProjectById).mockImplementation(async (id: string) => {
    const p = await mocks.mockIndexedDB.getProject(id);
    return p ?? null;
  });

  vi.mocked(dbService.addProject).mockImplementation(async (project: Project) => {
    await mocks.mockIndexedDB.saveProject(project);
    return saveResult;
  });

  vi.mocked(dbService.updateProject).mockImplementation(async (project: Project) => {
    const existing = await mocks.mockIndexedDB.getProject(project.id);
    if (existing) {
      await mocks.mockIndexedDB.updateProject(project);
    } else {
      await mocks.mockIndexedDB.saveProject(project);
    }
    return saveResult;
  });

  vi.mocked(dbService.deleteProject).mockImplementation(async (projectId: string) => {
    await mocks.mockIndexedDB.deleteProject(projectId);
  });

  vi.mocked(dbService.saveProjectToSupabaseOnly).mockImplementation(async (project: Project) => {
    await mocks.mockSupabase.saveProject(project);
  });

  vi.mocked(dbService.writeProjectToIndexedDBOnly).mockImplementation(async (project: Project) => {
    await mocks.mockIndexedDB.saveProject(project);
  });
}

/** Liga `loadProjectsFromSupabase` ao mock em memória (quando Supabase está “disponível”). */
export function wireSupabaseLoadMock(mocks: Mocks): void {
  vi.mocked(supabaseService.loadProjectsFromSupabase).mockImplementation(() =>
    mocks.mockSupabase.loadProjects().then((projects) => ({ projects, loadFailed: false as const }))
  );
}

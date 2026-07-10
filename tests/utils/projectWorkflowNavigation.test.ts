import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Project } from '../../types';
import {
  recordLastProjectsListWorkflow,
  resolveProjectViewNotFoundPath,
} from '../../utils/projectWorkflow';

vi.mock('../../utils/landingRecentProjects', () => ({
  getLastOpenedProjectIds: vi.fn(() => []),
}));

import { getLastOpenedProjectIds } from '../../utils/landingRecentProjects';

const devProject: Project = {
  id: 'dev-1',
  name: 'Dev',
  description: '',
  workflow: 'dev',
  tasks: [],
  documents: [],
  businessRules: [],
  phases: [],
};

describe('resolveProjectViewNotFoundPath', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(getLastOpenedProjectIds).mockReturnValue([]);
  });

  it('usa workflow do último projeto aberto', () => {
    vi.mocked(getLastOpenedProjectIds).mockReturnValue(['dev-1']);
    expect(resolveProjectViewNotFoundPath([devProject], 'missing')).toBe('/projects/dev');
  });

  it('usa última listagem visitada quando não há projeto aberto', () => {
    recordLastProjectsListWorkflow('dev');
    expect(resolveProjectViewNotFoundPath([], 'missing')).toBe('/projects/dev');
  });

  it('fallback padrão é QA', () => {
    expect(resolveProjectViewNotFoundPath([])).toBe('/projects/qa');
  });
});

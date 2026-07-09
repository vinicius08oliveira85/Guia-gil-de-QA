import { describe, expect, it } from 'vitest';
import {
  filterProjectsByWorkflow,
  findProjectByJiraKey,
  assertJiraProjectNotLinkedToOtherWorkflow,
  getProjectListPathForProject,
  getProjectsListPath,
  normalizeProjectWorkflow,
  parseProjectsListWorkflow,
} from '../../utils/projectWorkflow';
import type { Project } from '../../types';

const baseProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  name: 'Projeto',
  description: '',
  documents: [],
  businessRules: [],
  tasks: [],
  phases: [],
  ...overrides,
});

describe('projectWorkflow', () => {
  it('normaliza workflow legado como qa', () => {
    expect(normalizeProjectWorkflow(undefined)).toBe('qa');
    expect(normalizeProjectWorkflow('dev')).toBe('dev');
  });

  it('filtra projetos por workflow', () => {
    const projects = [
      baseProject({ id: 'qa-1', workflow: 'qa' }),
      baseProject({ id: 'dev-1', workflow: 'dev' }),
      baseProject({ id: 'legacy' }),
    ];
    expect(filterProjectsByWorkflow(projects, 'dev')).toHaveLength(1);
    expect(filterProjectsByWorkflow(projects, 'qa')).toHaveLength(2);
  });

  it('resolve rotas de listagem', () => {
    expect(getProjectsListPath('qa')).toBe('/projects/qa');
    expect(getProjectsListPath('dev')).toBe('/projects/dev');
    expect(parseProjectsListWorkflow('/projects')).toBe('qa');
    expect(parseProjectsListWorkflow('/projects/dev')).toBe('dev');
    expect(getProjectListPathForProject({ workflow: 'dev' })).toBe('/projects/dev');
  });

  it('localiza projeto por chave Jira', () => {
    const projects = [
      baseProject({ id: 'qa-jira', workflow: 'qa', settings: { jiraProjectKey: 'ABC' } }),
      baseProject({ id: 'dev-jira', workflow: 'dev', settings: { jiraProjectKey: 'XYZ' } }),
    ];
    expect(findProjectByJiraKey(projects, 'abc')?.id).toBe('qa-jira');
    expect(findProjectByJiraKey(projects, 'xyz', { workflow: 'dev' })?.id).toBe('dev-jira');
    expect(findProjectByJiraKey(projects, 'xyz', { workflow: 'qa' })).toBeUndefined();
  });

  it('bloqueia mesma chave Jira em QA e Dev', () => {
    const projects = [
      baseProject({ id: 'qa-jira', name: 'QA Jira', workflow: 'qa', settings: { jiraProjectKey: 'PROJ' } }),
    ];
    expect(() =>
      assertJiraProjectNotLinkedToOtherWorkflow(projects, 'PROJ', 'dev')
    ).toThrow(/Projetos QA/);
    expect(() =>
      assertJiraProjectNotLinkedToOtherWorkflow(projects, 'PROJ', 'qa', 'qa-jira')
    ).not.toThrow();
  });
});

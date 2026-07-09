import type { Project, ProjectWorkflow } from '../types';

export const PROJECT_WORKFLOWS = ['qa', 'dev'] as const;

export const DEFAULT_PROJECT_WORKFLOW: ProjectWorkflow = 'qa';

export const PROJECT_WORKFLOW_LABELS: Record<ProjectWorkflow, string> = {
  qa: 'Projetos QA',
  dev: 'Projetos Dev',
};

export const PROJECT_WORKFLOW_DESCRIPTIONS: Record<ProjectWorkflow, string> = {
  qa: 'Gerencie projetos, tarefas, casos de teste e dossiês de regras de negócio.',
  dev: 'Projetos para desenvolvedores: tarefas, documentos e regras com foco em implementação.',
};

export function normalizeProjectWorkflow(
  workflow: ProjectWorkflow | undefined | null
): ProjectWorkflow {
  return workflow === 'dev' ? 'dev' : 'qa';
}

export function normalizeProjectWorkflowFields<T extends Project>(project: T): T {
  return {
    ...project,
    workflow: normalizeProjectWorkflow(project.workflow),
  };
}

export function filterProjectsByWorkflow(
  projects: Project[],
  workflow: ProjectWorkflow
): Project[] {
  const normalized = normalizeProjectWorkflow(workflow);
  return projects.filter(p => normalizeProjectWorkflow(p.workflow) === normalized);
}

export function getProjectsListPath(workflow: ProjectWorkflow): `/projects/${ProjectWorkflow}` {
  return `/projects/${workflow}`;
}

export function parseProjectsListWorkflow(pathname: string): ProjectWorkflow | null {
  if (pathname === '/projects/qa' || pathname === '/projects') return 'qa';
  if (pathname === '/projects/dev') return 'dev';
  return null;
}

export function isProjectsListPath(pathname: string): boolean {
  return parseProjectsListWorkflow(pathname) !== null;
}

export function getProjectListPathForProject(project: Pick<Project, 'workflow'>): `/projects/${ProjectWorkflow}` {
  return getProjectsListPath(normalizeProjectWorkflow(project.workflow));
}

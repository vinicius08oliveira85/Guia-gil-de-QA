import type { Project, ProjectWorkflow } from '../types';
import { getLastOpenedProjectIds } from './landingRecentProjects';

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

const LAST_PROJECTS_LIST_WORKFLOW_KEY = 'qa_last_projects_list_workflow';

/** Persiste a última listagem de projetos visitada (QA ou Dev). */
export function recordLastProjectsListWorkflow(workflow: ProjectWorkflow): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LAST_PROJECTS_LIST_WORKFLOW_KEY, normalizeProjectWorkflow(workflow));
  } catch {
    /* quota / modo privado */
  }
}

function readLastProjectsListWorkflow(): ProjectWorkflow | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_PROJECTS_LIST_WORKFLOW_KEY);
    return raw === 'dev' ? 'dev' : raw === 'qa' ? 'qa' : null;
  } catch {
    return null;
  }
}

/**
 * Rota de fallback quando `/projects/:id` não encontra o projeto após o bootstrap.
 * Prioriza workflow do último projeto aberto ou da última listagem visitada.
 */
export function resolveProjectViewNotFoundPath(
  projects: Project[],
  requestedProjectId?: string
): `/projects/${ProjectWorkflow}` {
  const lastOpenedId = getLastOpenedProjectIds()[0];
  const lastOpenedProject = lastOpenedId
    ? projects.find(project => project.id === lastOpenedId)
    : undefined;
  if (lastOpenedProject) {
    return getProjectListPathForProject(lastOpenedProject);
  }

  if (requestedProjectId) {
    const stillListed = projects.some(project => project.id === requestedProjectId);
    if (!stillListed) {
      const lastList = readLastProjectsListWorkflow();
      if (lastList) return getProjectsListPath(lastList);
    }
  }

  const lastList = readLastProjectsListWorkflow();
  return getProjectsListPath(lastList ?? 'qa');
}

function normalizeJiraProjectKey(jiraProjectKey: string | undefined | null): string | null {
  const trimmed = jiraProjectKey?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

/** Localiza projeto local vinculado à mesma chave Jira (opcionalmente filtrando por workflow). */
export function findProjectByJiraKey(
  projects: Project[],
  jiraProjectKey: string,
  options?: { workflow?: ProjectWorkflow; excludeProjectId?: string }
): Project | undefined {
  const normalizedKey = normalizeJiraProjectKey(jiraProjectKey);
  if (!normalizedKey) return undefined;

  const targetWorkflow =
    options?.workflow !== undefined ? normalizeProjectWorkflow(options.workflow) : undefined;

  return projects.find(project => {
    if (options?.excludeProjectId && project.id === options.excludeProjectId) return false;
    if (normalizeJiraProjectKey(project.settings?.jiraProjectKey) !== normalizedKey) return false;
    if (targetWorkflow === undefined) return true;
    return normalizeProjectWorkflow(project.workflow) === targetWorkflow;
  });
}

/**
 * Impede vincular a mesma chave Jira em QA e Dev ao mesmo tempo.
 * @throws Error quando a chave já existe no outro workflow.
 */
export function assertJiraProjectNotLinkedToOtherWorkflow(
  projects: Project[],
  jiraProjectKey: string,
  targetWorkflow: ProjectWorkflow,
  excludeProjectId?: string
): void {
  const normalizedKey = normalizeJiraProjectKey(jiraProjectKey);
  if (!normalizedKey) return;

  const normalizedTarget = normalizeProjectWorkflow(targetWorkflow);
  const conflict = projects.find(project => {
    if (excludeProjectId && project.id === excludeProjectId) return false;
    if (normalizeJiraProjectKey(project.settings?.jiraProjectKey) !== normalizedKey) return false;
    return normalizeProjectWorkflow(project.workflow) !== normalizedTarget;
  });

  if (!conflict) return;

  const otherWorkflow = normalizeProjectWorkflow(conflict.workflow);
  throw new Error(
    `O projeto Jira "${jiraProjectKey}" já está em ${PROJECT_WORKFLOW_LABELS[otherWorkflow]} ("${conflict.name}"). ` +
      `Importe ou vincule apenas em um workspace (QA ou Dev).`
  );
}

import { LANDING_SECTIONS } from '../components/landing/landingSections';
import type { ProjectWorkflow } from '../types';
import {
  getProjectsListPath,
  isProjectsListPath,
  normalizeProjectWorkflow,
  parseProjectsListWorkflow,
  PROJECT_WORKFLOW_LABELS,
} from './projectWorkflow';

export type HeaderBackTarget = '/' | `/projects/${ProjectWorkflow}`;

export interface HeaderBackNavigation {
  label: string;
  targetPath: HeaderBackTarget;
  ariaLabel: string;
}

export interface HeaderBackNavigationOptions {
  projectWorkflow?: ProjectWorkflow;
}

/**
 * Define o destino e o rótulo do botão de voltar no header conforme a rota atual.
 */
export function resolveHeaderBackNavigation(
  pathname: string,
  options?: HeaderBackNavigationOptions
): HeaderBackNavigation | null {
  if (pathname === '/') return null;

  const projectDetailMatch = /^\/projects\/([^/]+)/.exec(pathname);
  if (projectDetailMatch) {
    const segment = projectDetailMatch[1];
    if (segment !== 'qa' && segment !== 'dev') {
      const workflow = normalizeProjectWorkflow(options?.projectWorkflow);
      const label = PROJECT_WORKFLOW_LABELS[workflow];
      const targetPath = getProjectsListPath(workflow);
      return {
        label,
        targetPath,
        ariaLabel: `Voltar para ${label}`,
      };
    }
  }

  if (isProjectsListPath(pathname)) {
    return {
      label: 'Menu',
      targetPath: '/',
      ariaLabel: 'Voltar para o Menu',
    };
  }

  if (pathname === '/jira-solus' || pathname === '/settings') {
    return {
      label: 'Menu',
      targetPath: '/',
      ariaLabel: 'Voltar para o Menu',
    };
  }

  return {
    label: 'Menu',
    targetPath: '/',
    ariaLabel: 'Voltar para o Menu',
  };
}

export function resolveProjectsListSectionTitle(pathname: string): string {
  const workflow = parseProjectsListWorkflow(pathname);
  if (workflow === 'dev') return LANDING_SECTIONS.projectsDev.title;
  return LANDING_SECTIONS.projectsQa.title;
}

export function resolveProjectsListSectionDescription(pathname: string): string {
  const workflow = parseProjectsListWorkflow(pathname);
  if (workflow === 'dev') return LANDING_SECTIONS.projectsDev.description;
  return LANDING_SECTIONS.projectsQa.description;
}

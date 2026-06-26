import { LANDING_SECTIONS } from '../components/landing/landingSections';

export type HeaderBackTarget = '/' | '/projects';

export interface HeaderBackNavigation {
  label: string;
  targetPath: HeaderBackTarget;
  ariaLabel: string;
}

/**
 * Define o destino e o rótulo do botão de voltar no header conforme a rota atual.
 */
export function resolveHeaderBackNavigation(pathname: string): HeaderBackNavigation | null {
  if (pathname === '/') return null;

  const projectDetailMatch = /^\/projects\/[^/]+/.exec(pathname);
  if (projectDetailMatch) {
    return {
      label: LANDING_SECTIONS.projects.title,
      targetPath: '/projects',
      ariaLabel: `Voltar para ${LANDING_SECTIONS.projects.title}`,
    };
  }

  if (pathname === '/projects' || pathname === '/jira-solus' || pathname === '/settings') {
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

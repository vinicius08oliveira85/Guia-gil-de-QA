import { useEffect, useRef } from 'react';
import { Project } from '../types';

interface UseRouterSyncOptions {
  selectedProjectId: string | null;
  projects: Project[];
  showSettings: boolean;
  setShowSettings: (value: boolean) => void;
  selectProject: (projectId: string | null) => void;
}

type ParsedRoute =
  | { type: 'dashboard' }
  | { type: 'settings' }
  | { type: 'project'; projectId: string };

function parseRouteFromSearch(search: string): ParsedRoute {
  const params = new URLSearchParams(search);

  const view = params.get('view');
  if (view === 'settings') return { type: 'settings' };

  const projectId = params.get('project');
  if (projectId && projectId.trim() !== '') return { type: 'project', projectId };

  return { type: 'dashboard' };
}

function buildCanonicalSearch(route: ParsedRoute): string {
  if (route.type === 'settings') return '?view=settings';
  if (route.type === 'project') return `?project=${encodeURIComponent(route.projectId)}`;
  return '';
}

function toRelativeUrlWithSearch(search: string): string {
  const url = new URL(window.location.href);
  url.search = search;
  return `${url.pathname}${url.search}${url.hash}`;
}

function isSelectedProjectValid(selectedProjectId: string, projects: Project[]): boolean {
  return projects.some(p => p.id === selectedProjectId);
}

/**
 * Sincroniza o "roteamento" da SPA (Dashboard/Projeto/Settings) com a URL via History API.
 * - URL -> estado: mount + popstate
 * - estado -> URL: pushState
 *
 * Convenção:
 * - Dashboard: /
 * - Projeto: ?project=ID
 * - Settings: ?view=settings
 */
export function useRouterSync({
  selectedProjectId,
  projects,
  showSettings,
  setShowSettings,
  selectProject,
}: UseRouterSyncOptions): void {
  const latestStateRef = useRef<{ selectedProjectId: string | null; showSettings: boolean }>({
    selectedProjectId,
    showSettings,
  });

  useEffect(() => {
    latestStateRef.current = { selectedProjectId, showSettings };
  }, [selectedProjectId, showSettings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyLocationToState = () => {
      const parsed = parseRouteFromSearch(window.location.search);
      const canonicalSearch = buildCanonicalSearch(parsed);

      // Normalização: remover queries não-canônicas (e conflitos project+settings)
      if (window.location.search !== canonicalSearch) {
        window.history.replaceState({}, '', toRelativeUrlWithSearch(canonicalSearch));
      }

      const current = latestStateRef.current;

      if (parsed.type === 'settings') {
        if (!current.showSettings) setShowSettings(true);
        if (current.selectedProjectId !== null) selectProject(null);
        return;
      }

      if (parsed.type === 'project') {
        if (current.showSettings) setShowSettings(false);
        if (current.selectedProjectId !== parsed.projectId) selectProject(parsed.projectId);
        return;
      }

      // dashboard
      if (current.showSettings) setShowSettings(false);
      if (current.selectedProjectId !== null) selectProject(null);
    };

    // Inicialização: URL -> estado
    applyLocationToState();

    // Voltar/Avançar: URL -> estado
    const onPopState = () => applyLocationToState();
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [selectProject, setShowSettings]);

  // Robustez: se o projeto selecionado não existe (ex.: link antigo), limpar seleção e URL.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (showSettings) return;
    if (!selectedProjectId) return;
    if (projects.length === 0) return;

    if (!isSelectedProjectValid(selectedProjectId, projects)) {
      selectProject(null);
      window.history.replaceState({}, '', toRelativeUrlWithSearch(''));
    }
  }, [projects, selectProject, selectedProjectId, showSettings]);

  // Estado -> URL: pushState só quando realmente mudou.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const desired: ParsedRoute = showSettings
      ? { type: 'settings' }
      : selectedProjectId
        ? { type: 'project', projectId: selectedProjectId }
        : { type: 'dashboard' };

    const desiredSearch = buildCanonicalSearch(desired);
    if (window.location.search === desiredSearch) return;

    window.history.pushState({}, '', toRelativeUrlWithSearch(desiredSearch));
  }, [selectedProjectId, showSettings]);
}

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Project } from '../types';

interface UseRouterSyncOptions {
  selectedProjectId: string | null;
  projects: Project[];
  showSettings: boolean;
  setShowSettings: (value: boolean) => void;
  selectProject: (projectId: string | null) => void;
  /** Enquanto true, não sincroniza estado → URL (evita replaceState no mesmo tick antes da hidratação URL → estado). */
  isLoading?: boolean;
}

type ParsedRoute =
  | { type: 'dashboard' }
  | { type: 'settings' }
  | { type: 'project'; projectId: string; subView?: 'backlog' };

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

function parseRouteFromLocation(search: string, pathname: string): ParsedRoute {
  const params = new URLSearchParams(search);
  const path = normalizePathname(pathname);

  const view = params.get('view');
  if (view === 'settings') return { type: 'settings' };

  const projectId = params.get('project')?.trim();
  if (projectId) {
    const subview = params.get('subview');
    if (subview === 'backlog' || view === 'backlog' || path === '/backlog') {
      return { type: 'project', projectId, subView: 'backlog' };
    }
    return { type: 'project', projectId };
  }

  if (path === '/backlog') {
    return { type: 'dashboard' };
  }

  return { type: 'dashboard' };
}

function buildCanonicalSearch(route: ParsedRoute): string {
  if (route.type === 'settings') return '?view=settings';
  if (route.type === 'project') {
    const params = new URLSearchParams();
    params.set('project', route.projectId);
    if (route.subView === 'backlog') params.set('subview', 'backlog');
    return `?${params.toString()}`;
  }
  return '';
}

function toRelativeUrlWithSearch(search: string, pathname = '/'): string {
  const base = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname || '/';
  return search ? `${base}${search}` : base;
}

function isSelectedProjectValid(selectedProjectId: string, projects: Project[]): boolean {
  return projects.some(p => p.id === selectedProjectId);
}

/**
 * Sincroniza o "roteamento" da SPA (Dashboard/Projeto/Settings) com a URL via History API.
 * - URL → estado: mount + popstate (useLayoutEffect; normalização com replaceState quando necessário)
 * - Estado → URL: replaceState (evita empilhar entradas no histórico a cada troca de projeto/aba interna)
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
  isLoading = false,
}: UseRouterSyncOptions): void {
  const latestStateRef = useRef<{ selectedProjectId: string | null; showSettings: boolean }>({
    selectedProjectId,
    showSettings,
  });

  // Layout: ref alinhada ao React antes de aplicar a URL (e antes dos efeitos passivos que espelham estado na URL).
  useLayoutEffect(() => {
    latestStateRef.current = { selectedProjectId, showSettings };
  }, [selectedProjectId, showSettings]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const applyLocationToState = () => {
      const parsed = parseRouteFromLocation(window.location.search, window.location.pathname);
      const canonicalSearch = buildCanonicalSearch(parsed);
      const canonicalPath = '/';

      // Normalização: /backlog → /?project=&subview=backlog; queries não-canônicas
      if (
        normalizePathname(window.location.pathname) !== canonicalPath ||
        window.location.search !== canonicalSearch
      ) {
        window.history.replaceState({}, '', toRelativeUrlWithSearch(canonicalSearch, canonicalPath));
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

  // Estado → URL: replaceState só quando a query canônica difere (não empilha histórico como pushState).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isLoading) return;

    const currentParsed = parseRouteFromLocation(
      window.location.search,
      window.location.pathname
    );

    // Backlog (subview na aba Tarefas): preserva URL até o store hidratar o projeto.
    if (
      !showSettings &&
      !selectedProjectId &&
      currentParsed.type === 'project' &&
      currentParsed.subView === 'backlog'
    ) {
      return;
    }

    const desired: ParsedRoute = showSettings
      ? { type: 'settings' }
      : selectedProjectId
        ? { type: 'project', projectId: selectedProjectId }
        : { type: 'dashboard' };

    let desiredSearch = buildCanonicalSearch(desired);
    // subview=backlog é controlado pelo ProjectView; não remover ao sincronizar só o project id.
    if (
      !showSettings &&
      selectedProjectId &&
      currentParsed.type === 'project' &&
      currentParsed.projectId === selectedProjectId &&
      currentParsed.subView === 'backlog'
    ) {
      const merged = new URLSearchParams(desiredSearch.startsWith('?') ? desiredSearch.slice(1) : desiredSearch);
      merged.set('subview', 'backlog');
      desiredSearch = `?${merged.toString()}`;
    }
    const desiredPath = '/';
    if (
      normalizePathname(window.location.pathname) === desiredPath &&
      window.location.search === desiredSearch
    ) {
      return;
    }

    window.history.replaceState({}, '', toRelativeUrlWithSearch(desiredSearch, desiredPath));
  }, [selectedProjectId, showSettings, isLoading]);
}

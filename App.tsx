import React, { useCallback, useEffect, useRef, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LAYER_Z_INDEX } from './utils/layerZIndex';
import { Project } from './types';
import { Header } from './components/common/Header';
import { OfflineBanner } from './components/common/OfflineBanner';
import { useProjectsStore } from './store/projectsStore';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useSearch } from './hooks/useSearch';
import { useKeyboardShortcuts, SHORTCUTS } from './hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './components/common/KeyboardShortcutsHelp';
import { getExportPreferences } from './utils/preferencesService';
import { startExportScheduler } from './utils/exportScheduler';
import {
  startJiraAutoSyncScheduler,
  stopJiraAutoSyncScheduler,
} from './utils/jiraAutoSyncScheduler';
import { useIsMobile } from './hooks/useIsMobile';
import { useTheme } from './hooks/useTheme';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { logger } from './utils/logger';
import { registerAppLogGlobalHandlers } from './utils/appLogStore';
import { LandingPage } from './pages/LandingPage';
import { ProjectViewPage } from './pages/ProjectViewPage';
import { JiraSolusView } from './components/jiraSolus/JiraSolusView';
import { LANDING_SECTIONS } from './components/landing/landingSections';
import { ProjectsDashboardSkeleton } from './components/projectsDashboard/ProjectsDashboardSkeleton';
import { useAriaLive } from './hooks/useAriaLive';
import { cn } from './utils/cn';
import { GlobalSearchDialog } from './components/common/GlobalSearchDialog';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { isLocalFolderBackupSupported } from './services/localFolderBackupService';
import {
  formatBackupSummaryForPrompt,
  formatRestoreResultMessage,
  restoreFromConfiguredFolder,
  setFolderRestorePromptDismissed,
  shouldOfferFolderRestoreOnStartup,
  type BackupFileSummary,
} from './services/localFolderRestoreService';

const ProjectsDashboard = lazyWithRetry(() =>
  import('./components/ProjectsDashboard').then(m => ({ default: m.ProjectsDashboard }))
);
const SettingsView = lazyWithRetry(() =>
  import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView }))
);

const AppContent: React.FC = () => {
  useTheme();

  useEffect(() => {
    registerAppLogGlobalHandlers();
  }, []);

  useEffect(() => {
    const run = () => {
      void import('./services/ai/testCaseGenerationCachePersistence').then(m =>
        m.cleanupExpiredTestGenerationCacheEntries()
      );
    };
    if (typeof window === 'undefined') return undefined;

    let idleId: number | undefined;
    let timeoutId: number | undefined;

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(run, { timeout: 10_000 });
    } else {
      timeoutId = window.setTimeout(run, 3_000);
    }

    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const {
    projects,
    selectedProjectId,
    isLoading,
    error: storeError,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
  } = useProjectsStore();

  const [showSearch, setShowSearch] = React.useState(false);
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();
  const { searchQuery, setSearchQuery, debouncedSearchQuery, searchResults } = useSearch(projects);
  const { announce } = useAriaLive();
  const navigate = useNavigate();
  const location = useLocation();

  const ariaNavReady = useRef(false);
  const prevSelectedProjectId = useRef<string | null | undefined>(undefined);
  const isSettings = location.pathname === '/settings';

  const folderRestoreCheckedRef = useRef(false);
  const [folderRestorePrompt, setFolderRestorePrompt] = React.useState<{
    folderLabel: string;
    summary: BackupFileSummary;
  } | null>(null);
  const [folderRestoreLoading, setFolderRestoreLoading] = React.useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (folderRestoreCheckedRef.current) return;
    if (!isLocalFolderBackupSupported()) return;
    folderRestoreCheckedRef.current = true;

    void (async () => {
      const offer = await shouldOfferFolderRestoreOnStartup();
      if (offer.offer) {
        setFolderRestorePrompt({
          folderLabel: offer.folderLabel,
          summary: offer.summary,
        });
      }
    })();
  }, [isLoading]);

  const handleConfirmFolderRestore = useCallback(async () => {
    setFolderRestoreLoading(true);
    try {
      const outcome = await restoreFromConfiguredFolder();
      if (outcome.status === 'success') {
        await loadProjects();
        handleSuccess(formatRestoreResultMessage(outcome.result));
        setFolderRestorePrompt(null);
        return;
      }
      if (outcome.status === 'no_permission') {
        handleWarning(
          'Permissão da pasta expirou. Abra Configurações → Dados locais → Salvar agora para reautorizar.'
        );
        setFolderRestorePrompt(null);
        return;
      }
      if (outcome.status === 'empty_backup') {
        handleWarning('O arquivo de backup na pasta não contém dados válidos.');
        setFolderRestorePrompt(null);
        return;
      }
      handleError(new Error('Não foi possível restaurar o backup da pasta.'), 'Restaurar da pasta');
    } catch (error) {
      handleError(error, 'Restaurar da pasta');
    } finally {
      setFolderRestoreLoading(false);
    }
  }, [loadProjects, handleSuccess, handleWarning, handleError]);

  const handleDismissFolderRestore = useCallback(() => {
    setFolderRestorePromptDismissed();
    setFolderRestorePrompt(null);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!ariaNavReady.current) {
      ariaNavReady.current = true;
      prevSelectedProjectId.current = selectedProjectId;
      return;
    }
    if (isSettings) {
      announce('Configurações abertas.', 'polite');
    }
  }, [isLoading, isSettings, announce]);

  useEffect(() => {
    if (isLoading || isSettings) return;
    if (!ariaNavReady.current) return;
    if (prevSelectedProjectId.current === selectedProjectId) return;
    prevSelectedProjectId.current = selectedProjectId;
    if (selectedProjectId) {
      const p = projects.find(x => x.id === selectedProjectId);
      announce(p ? `Projeto aberto: ${p.name}.` : 'Projeto selecionado.', 'polite');
    } else if (location.pathname === '/projects') {
      announce('Lista de projetos.', 'polite');
    }
  }, [isLoading, isSettings, selectedProjectId, projects, announce, location.pathname]);

  const searchAnnounceReady = useRef(false);
  const prevDebouncedSearch = useRef('');
  useEffect(() => {
    if (isLoading) return;
    if (!showSearch) {
      searchAnnounceReady.current = false;
      prevDebouncedSearch.current = '';
      return;
    }
    if (!searchAnnounceReady.current) {
      searchAnnounceReady.current = true;
      prevDebouncedSearch.current = debouncedSearchQuery;
      return;
    }
    if (prevDebouncedSearch.current === debouncedSearchQuery) return;
    prevDebouncedSearch.current = debouncedSearchQuery;
    const trimmed = debouncedSearchQuery.trim();
    if (!trimmed) {
      announce('Busca limpa.', 'polite');
      return;
    }
    const n = searchResults.length;
    announce(
      n === 0
        ? 'Nenhum resultado para a busca.'
        : `${n} resultado${n === 1 ? '' : 's'} encontrado${n === 1 ? '' : 's'}.`,
      'polite'
    );
  }, [isLoading, showSearch, debouncedSearchQuery, searchResults.length, announce]);

  useEffect(() => {
    if (isLoading) return;
    const pathParts = location.pathname.split('/').filter(Boolean);
    const currentView = pathParts[0];
    const currentId = pathParts[1];

    if (currentView === 'projects' && currentId) {
      if (selectedProjectId !== currentId) {
        selectProject(currentId);
      }
    } else if (currentView !== 'settings' && selectedProjectId) {
      selectProject(null);
    }
  }, [location.pathname, selectedProjectId, selectProject, isLoading]);

  useEffect(() => {
    loadProjects().catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        !errorMessage.toLowerCase().includes('nenhum projeto') &&
        !errorMessage.toLowerCase().includes('no projects')
      ) {
        logger.error('Erro ao carregar projetos', 'App', { error, errorMessage });
        handleError(error, 'Carregar projetos');
      } else {
        logger.info('Nenhum projeto encontrado ao carregar', 'App');
      }
    });
  }, [loadProjects, handleError]);

  useEffect(() => {
    if (storeError) {
      const errorMessage = storeError instanceof Error ? storeError.message : String(storeError);
      logger.error('Erro no store de projetos', 'App', {
        error: storeError,
        errorMessage,
        projectsCount: projects.length,
        isLoading,
      });
      handleError(storeError, 'Store');
    }
  }, [storeError, handleError, projects.length, isLoading]);

  const isMobile = useIsMobile();

  useEffect(() => {
    const exportPrefs = getExportPreferences();
    if (exportPrefs.schedule?.enabled) {
      startExportScheduler(exportPrefs.schedule);
    }

    const handlePreferencesUpdate = () => {
      const updatedPrefs = getExportPreferences();
      if (updatedPrefs.schedule?.enabled) {
        startExportScheduler(updatedPrefs.schedule);
      }
    };
    window.addEventListener('preferences-updated', handlePreferencesUpdate);
    return () => window.removeEventListener('preferences-updated', handlePreferencesUpdate);
  }, []);

  useEffect(() => {
    startJiraAutoSyncScheduler();
    return () => stopJiraAutoSyncScheduler();
  }, []);

  const handleCreateProject = useCallback(
    async (name: string, description: string, templateId?: string) => {
      try {
        await createProject(name, description, templateId);
        handleSuccess('Projeto criado com sucesso!');
      } catch (error) {
        handleError(error, 'Criar projeto');
      }
    },
    [createProject, handleError, handleSuccess]
  );

  const lastUpdatedProjectRef = React.useRef<{ id: string; timestamp: number } | null>(null);
  const updateDebounceMs = 5000;

  const handleUpdateProject = useCallback(
    async (updatedProject: Project) => {
      const now = Date.now();
      const lastUpdate = lastUpdatedProjectRef.current;
      const shouldShowToast =
        !lastUpdate ||
        lastUpdate.id !== updatedProject.id ||
        now - lastUpdate.timestamp > updateDebounceMs;

      if (shouldShowToast) {
        lastUpdatedProjectRef.current = { id: updatedProject.id, timestamp: now };
      }

      try {
        await updateProject(updatedProject);
        if (shouldShowToast) {
          handleSuccess('Projeto atualizado com sucesso!', { id: 'toast-project-updated' });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        const isNetworkErr =
          errorMessage.includes('timeout') ||
          errorMessage.includes('connection reset') ||
          errorMessage.includes('err_timed_out') ||
          errorMessage.includes('err_connection_reset') ||
          errorMessage.includes('err_name_not_resolved') ||
          errorMessage.includes('failed to fetch') ||
          errorMessage.includes('network');

        if (!isNetworkErr) {
          handleError(error, 'Atualizar projeto');
        }
      }
    },
    [updateProject, handleError, handleSuccess]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      try {
        await deleteProject(projectId);
        handleSuccess('Projeto deletado com sucesso!');
        navigate('/projects');
      } catch (error) {
        handleError(error, 'Deletar projeto');
      }
    },
    [deleteProject, handleError, handleSuccess, navigate]
  );

  const handleImportJiraProject = useCallback(
    async (project: Project) => {
      try {
        const { importProject } = useProjectsStore.getState();
        await importProject(project);
        selectProject(project.id);
        handleSuccess(`Projeto "${project.name}" importado do Jira com sucesso!`);
        navigate(`/projects/${project.id}`);
      } catch (error) {
        handleError(error, 'Importar projeto do Jira');
      }
    },
    [selectProject, handleError, handleSuccess, navigate]
  );

  const closeGlobalSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery('');
  }, [setSearchQuery]);

  const handleSearchSelect = useCallback(
    (result: { projectId?: string; id: string }) => {
      navigate(`/projects/${result.projectId || result.id}`);
      closeGlobalSearch();
    },
    [navigate, closeGlobalSearch]
  );

  useKeyboardShortcuts([
    {
      ...SHORTCUTS.SEARCH,
      action: () => setShowSearch(true),
    },
    {
      ...SHORTCUTS.ESCAPE,
      action: closeGlobalSearch,
    },
  ]);

  useEffect(() => {
    const handler = () => setShowSearch(true);
    window.addEventListener('open-global-search', handler);
    return () => window.removeEventListener('open-global-search', handler);
  }, []);

  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname === '/projects';
  const isJiraSolus = location.pathname === '/jira-solus';
  const shouldShowHeader = !isLanding;

  const headerBrandTitle = isDashboard
    ? LANDING_SECTIONS.projects.title
    : isJiraSolus
      ? LANDING_SECTIONS.jiraSolus.title
      : undefined;

  const headerBrandSubtitle = isDashboard
    ? LANDING_SECTIONS.projects.description
    : isJiraSolus
      ? LANDING_SECTIONS.jiraSolus.description
      : undefined;

  return (
    <div className="min-h-screen bg-base-100 font-body text-base-content">
      <div id="aria-live-region" className="sr-only" aria-live="polite" aria-atomic="true" />
      <Toaster
        position={isMobile ? 'top-center' : 'top-right'}
        containerStyle={{ zIndex: LAYER_Z_INDEX.toast }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--app-neu-bg)',
            color: 'var(--brand-text)',
            border: '1px solid color-mix(in srgb, var(--project-card-border) 80%, transparent)',
            boxShadow: 'var(--project-card-neu-hover)',
          },
          success: {
            iconTheme: {
              primary: 'oklch(var(--su))',
              secondary: 'oklch(100% 0 0)',
            },
          },
          error: {
            iconTheme: {
              primary: 'oklch(var(--er))',
              secondary: 'oklch(100% 0 0)',
            },
          },
        }}
      />
      {shouldShowHeader ? (
        <Header
          onProjectImported={handleImportJiraProject}
          onOpenCreateModal={() =>
            window.dispatchEvent(new CustomEvent('open-create-project-modal'))
          }
          showDashboardActions={isDashboard}
          onLogoClick={() => navigate('/')}
          brandTitle={headerBrandTitle}
          brandSubtitle={headerBrandSubtitle}
        />
      ) : null}
      <OfflineBanner />
      <GlobalSearchDialog
        isOpen={showSearch}
        onClose={closeGlobalSearch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        onSelectResult={handleSearchSelect}
      />

      <main
        id="main-content"
        className={cn(
          'app-page',
          shouldShowHeader
            ? 'min-h-[calc(100vh-var(--app-header-sticky-offset,4.5rem))]'
            : 'min-h-screen'
        )}
      >
        {storeError ? (
          <div className="container mx-auto px-4 py-3">
            <div
              className="flex flex-col gap-2 rounded-lg border border-error/30 bg-error/10 p-3 text-error-content sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <span className="text-sm">
                Não foi possível carregar os projetos.{' '}
                {storeError instanceof Error ? storeError.message : String(storeError)}
              </span>
              <button
                type="button"
                onClick={() => loadProjects()}
                disabled={isLoading}
                className="btn btn-sm btn-error btn-outline shrink-0"
              >
                {isLoading ? 'Carregando…' : 'Tentar novamente'}
              </button>
            </div>
          </div>
        ) : null}

        {isLoading && !isLanding ? (
          <ProjectsDashboardSkeleton />
        ) : (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/projects"
              element={
                <Suspense fallback={<ProjectsDashboardSkeleton />}>
                  <ProjectsDashboard
                    projects={projects}
                    onCreateProject={handleCreateProject}
                  />
                </Suspense>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProjectViewPage
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <Suspense
                  fallback={
                    <div className="container mx-auto p-4 sm:p-6">
                      <LoadingSkeleton variant="card" count={3} />
                    </div>
                  }
                >
                  <SettingsView
                    onProjectImported={handleImportJiraProject}
                    onLocalBackupRestored={() => loadProjects()}
                  />
                </Suspense>
              }
            />
            <Route path="/jira-solus" element={<JiraSolusView />} />
          </Routes>
        )}
      </main>
      <ConfirmDialog
        isOpen={folderRestorePrompt !== null}
        onClose={handleDismissFolderRestore}
        onConfirm={() => {
          void handleConfirmFolderRestore();
        }}
        title="Restaurar backup da pasta?"
        message={
          folderRestorePrompt
            ? `Foi encontrado um backup em "${folderRestorePrompt.folderLabel}" com ${formatBackupSummaryForPrompt(folderRestorePrompt.summary)}. Deseja restaurar esses dados neste dispositivo?`
            : ''
        }
        confirmText="Restaurar"
        cancelText="Agora não"
        variant="info"
        isLoading={folderRestoreLoading}
      />
      <KeyboardShortcutsHelp />
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;

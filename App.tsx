import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Project } from './types';
import { Header } from './components/common/Header';
import { OfflineBanner } from './components/common/OfflineBanner';
import { Spinner } from './components/common/Spinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SearchBar } from './components/common/SearchBar';
import { useProjectsStore } from './store/projectsStore';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useSearch, SearchResult } from './hooks/useSearch';
import { useKeyboardShortcuts, SHORTCUTS } from './hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './components/common/KeyboardShortcutsHelp';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { getExportPreferences } from './utils/preferencesService';
import { startExportScheduler } from './utils/exportScheduler';
import { useIsMobile } from './hooks/useIsMobile';
import { useTheme } from './hooks/useTheme';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { logger } from './utils/logger';
import { useRouterSync } from './hooks/useRouterSync';
import { isSupabaseAvailable } from './services/supabaseService';
import { FloatingNav } from '@/components/ui/floating-nav';
import { OnboardingGuide } from './components/onboarding/OnboardingGuide';
import { useAriaLive } from './hooks/useAriaLive';

// Code splitting - Lazy loading de componentes pesados
const ProjectView = lazyWithRetry(() =>
  import('./components/ProjectView').then(m => ({ default: m.ProjectView }))
);
const ProjectsDashboard = lazyWithRetry(() =>
  import('./components/ProjectsDashboard').then(m => ({ default: m.ProjectsDashboard }))
);
const AdvancedSearch = lazyWithRetry(() =>
  import('./components/common/AdvancedSearch').then(m => ({ default: m.AdvancedSearch }))
);
const SettingsView = lazyWithRetry(() =>
  import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView }))
);

let bootstrapSupabaseWarningLogged = false;

const App: React.FC = () => {
  // Tema global (fase atual: DaisyUI light fixo; outras opções permanecem no toggle para futuro)
  useTheme();

  // Aviso único no bootstrap quando Supabase não está configurado (apenas IndexedDB será usado)
  useEffect(() => {
    if (bootstrapSupabaseWarningLogged) return;
    if (!isSupabaseAvailable()) {
      bootstrapSupabaseWarningLogged = true;
      logger.warn(
        'Supabase não configurado; apenas IndexedDB será usado. Configure VITE_SUPABASE_PROXY_URL ou VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.',
        'App'
      );
    }
  }, []);

  // Estado global do store
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

  // Estado local de UI
  const [showSearch, setShowSearch] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { handleError, handleSuccess } = useErrorHandler();
  const { searchQuery, setSearchQuery, debouncedSearchQuery, searchResults } = useSearch(projects);
  const { announce } = useAriaLive();

  /** Evita anúncio duplicado na primeira renderização após o loading. */
  const ariaNavReady = useRef(false);
  const prevSelectedProjectId = useRef<string | null | undefined>(undefined);
  const prevShowSettings = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (isLoading) return;
    if (!ariaNavReady.current) {
      ariaNavReady.current = true;
      prevSelectedProjectId.current = selectedProjectId;
      prevShowSettings.current = showSettings;
      return;
    }
    if (prevShowSettings.current !== showSettings) {
      prevShowSettings.current = showSettings;
      if (showSettings) {
        announce('Configurações abertas.', 'polite');
      } else {
        announce('Saindo das configurações.', 'polite');
      }
    }
  }, [isLoading, showSettings, announce]);

  useEffect(() => {
    if (isLoading || showSettings) return;
    if (!ariaNavReady.current) return;
    if (prevSelectedProjectId.current === selectedProjectId) return;
    prevSelectedProjectId.current = selectedProjectId;
    if (selectedProjectId) {
      const p = projects.find(x => x.id === selectedProjectId);
      announce(p ? `Projeto aberto: ${p.name}.` : 'Projeto selecionado.', 'polite');
    } else {
      announce('Lista de projetos.', 'polite');
    }
  }, [isLoading, showSettings, selectedProjectId, projects, announce]);

  const searchAnnounceReady = useRef(false);
  const prevDebouncedSearch = useRef<string>('');
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

  useRouterSync({
    selectedProjectId,
    projects,
    showSettings,
    setShowSettings,
    selectProject,
    isLoading,
  });

  // Carregar projetos ao montar
  useEffect(() => {
    loadProjects().catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Não mostrar erro se for apenas "nenhum projeto encontrado" - isso é normal
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

  // Tratar erros do store
  useEffect(() => {
    if (storeError) {
      const errorMessage = storeError instanceof Error ? storeError.message : String(storeError);
      // Log detalhado do erro do store
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

  // Initialize export scheduler on app load
  useEffect(() => {
    const exportPrefs = getExportPreferences();
    if (exportPrefs.schedule?.enabled) {
      startExportScheduler(exportPrefs.schedule);
    }

    // Listen for preference updates
    const handlePreferencesUpdate = () => {
      const updatedPrefs = getExportPreferences();
      if (updatedPrefs.schedule?.enabled) {
        startExportScheduler(updatedPrefs.schedule);
      }
    };
    window.addEventListener('preferences-updated', handlePreferencesUpdate);
    return () => window.removeEventListener('preferences-updated', handlePreferencesUpdate);
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

  // Ref para rastrear último projeto atualizado e evitar toasts repetidos
  const lastUpdatedProjectRef = React.useRef<{ id: string; timestamp: number } | null>(null);
  const updateDebounceMs = 5000; // 5 segundos: só mostra um toast por janela

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
          const { lastSaveToSupabase } = useProjectsStore.getState();
          if (lastSaveToSupabase) {
            handleSuccess('Projeto atualizado com sucesso!', { id: 'toast-project-updated' });
          } else {
            handleSuccess(
              'Projeto salvo apenas neste dispositivo (não foi possível sincronizar com a nuvem).',
              { id: 'toast-project-local-only' }
            );
          }
        }
      } catch (error) {
        // Verificar se é erro de rede - não mostrar toast de erro se for
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
        // Erros de rede são silenciosos - projeto já está salvo localmente
      }
    },
    [updateProject, handleError, handleSuccess]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      try {
        await deleteProject(projectId);
        handleSuccess('Projeto deletado com sucesso!');
      } catch (error) {
        handleError(error, 'Deletar projeto');
      }
    },
    [deleteProject, handleError, handleSuccess]
  );

  const handleImportJiraProject = useCallback(
    async (project: Project) => {
      try {
        const { importProject } = useProjectsStore.getState();
        await importProject(project);
        selectProject(project.id);
        handleSuccess(`Projeto "${project.name}" importado do Jira com sucesso!`);
      } catch (error) {
        handleError(error, 'Importar projeto do Jira');
      }
    },
    [selectProject, handleError, handleSuccess]
  );

  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      if (result.type === 'project' || result.projectId) {
        selectProject(result.projectId || result.id);
        setShowSearch(false);
        setSearchQuery('');
      }
    },
    [selectProject]
  );

  const closeGlobalSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery('');
  }, []);

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

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return undefined;
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const isDashboard = !selectedProject && !showSettings;

  const handleGoToDashboard = useCallback(() => {
    selectProject(null);
    setShowSettings(false);
  }, [selectProject]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-4 bg-base-100 text-base-content">
        <Spinner />
        <p className="text-base text-base-content/80">Carregando…</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen font-sans text-text-primary">
        <div id="aria-live-region" className="sr-only" aria-live="polite" aria-atomic="true" />
        <a href="#main-content" className="skip-link" tabIndex={0}>
          Pular para o conteúdo principal
        </a>
        <OnboardingGuide />
        <Toaster
          position={isMobile ? 'top-center' : 'top-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--layer-1)',
              color: 'var(--text-primary)',
              border: '1px solid var(--surface-border)',
              boxShadow: '0 25px 60px rgba(3, 7, 23, 0.55)',
              backdropFilter: 'blur(24px) saturate(140%)',
            },
            success: {
              iconTheme: {
                primary: '#0E6DFD',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF5C70',
                secondary: '#fff',
              },
            },
          }}
        />
        <Header
          onProjectImported={handleImportJiraProject}
          onOpenSettings={() => setShowSettings(true)}
          onOpenCreateModal={() =>
            window.dispatchEvent(new CustomEvent('open-create-project-modal'))
          }
          showDashboardActions={isDashboard}
          onLogoClick={handleGoToDashboard}
        />
        <OfflineBanner />
        {showSearch && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Busca global"
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur pt-20 p-4"
            onClick={e => {
              if (e.target === e.currentTarget) closeGlobalSearch();
            }}
          >
            <div className="w-full max-w-2xl">
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchResults={searchResults}
                onSelectResult={handleSearchSelect}
              />
            </div>
          </div>
        )}

        {showAdvancedSearch && (
          <Suspense
            fallback={
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur">
                <Spinner />
              </div>
            }
          >
            <AdvancedSearch
              projects={projects}
              onResultSelect={result => {
                if (result.type === 'project' || result.projectId) {
                  selectProject(result.projectId || result.id);
                }
                setShowAdvancedSearch(false);
              }}
              onClose={() => setShowAdvancedSearch(false)}
            />
          </Suspense>
        )}

        {isMobile && (
          <FloatingNav
            onNavigate={index => {
              switch (index) {
                case 0:
                  handleGoToDashboard();
                  break;
                case 1:
                  window.dispatchEvent(new CustomEvent('open-global-search'));
                  break;
                case 2:
                  window.dispatchEvent(new CustomEvent('floating-nav-notifications'));
                  break;
                case 3:
                  window.dispatchEvent(new CustomEvent('floating-nav-settings'));
                  break;
                case 4:
                  window.dispatchEvent(new CustomEvent('floating-nav-glossary'));
                  break;
                case 5:
                  setShowAdvancedSearch(true);
                  break;
                case 6:
                  window.dispatchEvent(new CustomEvent('floating-nav-settings'));
                  break;
                default:
                  break;
              }
            }}
          />
        )}

        <main id="main-content" className={isMobile ? 'pb-28' : undefined}>
          {storeError && (
            <div className="container mx-auto px-4 py-3">
              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-error/10 border border-error/30 text-error-content"
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
          )}
          {showSettings ? (
            <Suspense
              fallback={
                <div className="container mx-auto p-4 sm:p-6">
                  <LoadingSkeleton variant="card" count={3} />
                </div>
              }
            >
              <SettingsView
                onClose={() => setShowSettings(false)}
                onProjectImported={handleImportJiraProject}
                onLocalBackupRestored={() => loadProjects()}
              />
            </Suspense>
          ) : selectedProject ? (
            <Suspense
              fallback={
                <div className="container mx-auto p-4 sm:p-6">
                  <LoadingSkeleton variant="card" count={3} />
                </div>
              }
            >
              <ProjectView
                project={selectedProject}
                onUpdateProject={handleUpdateProject}
                onBack={() => selectProject(null)}
                onDeleteProject={handleDeleteProject}
              />
            </Suspense>
          ) : (
            <Suspense
              fallback={
                <div className="container mx-auto p-4 sm:p-6">
                  <LoadingSkeleton variant="card" count={3} />
                </div>
              }
            >
              <ProjectsDashboard
                projects={projects}
                onSelectProject={selectProject}
                onCreateProject={handleCreateProject}
                onOpenSettings={() => setShowSettings(true)}
              />
            </Suspense>
          )}
        </main>
        <KeyboardShortcutsHelp />
      </div>
    </ErrorBoundary>
  );
};

export default App;

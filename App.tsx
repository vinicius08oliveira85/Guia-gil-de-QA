
import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Project } from './types';
import { Header } from './components/common/Header';
import { Spinner } from './components/common/Spinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SearchBar } from './components/common/SearchBar';
import { useProjectsStore } from './store/projectsStore';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useSearch, SearchResult } from './hooks/useSearch';
import { useKeyboardShortcuts, SHORTCUTS } from './hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './components/common/KeyboardShortcutsHelp';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { loadProjectsFromSupabase, isSupabaseAvailable } from './services/supabaseService';
import { getExportPreferences } from './utils/preferencesService';
import { startExportScheduler } from './utils/exportScheduler';
import { useIsMobile } from './hooks/useIsMobile';
import { useTheme } from './hooks/useTheme';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Code splitting - Lazy loading de componentes pesados
const ProjectView = lazyWithRetry(() => import('./components/ProjectView').then(m => ({ default: m.ProjectView })));
const ProjectsDashboard = lazyWithRetry(() => import('./components/ProjectsDashboard').then(m => ({ default: m.ProjectsDashboard })));
// Importação direta temporária para debug da landing page
import { LandingPage } from './components/landing/LandingPage';
const AdvancedSearch = lazyWithRetry(() => import('./components/common/AdvancedSearch').then(m => ({ default: m.AdvancedSearch })));
const ProjectComparisonModal = lazyWithRetry(() => import('./components/common/ProjectComparisonModal').then(m => ({ default: m.ProjectComparisonModal })));
const OnboardingGuide = lazyWithRetry(() => import('./components/onboarding/OnboardingGuide').then(m => ({ default: m.OnboardingGuide })));
const SettingsView = lazyWithRetry(() => import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView })));

const App: React.FC = () => {
    // Tema global (fase atual: DaisyUI light fixo; outras opções permanecem no toggle para futuro)
    useTheme();

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
    const [showProjectComparison, setShowProjectComparison] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [forceShowLanding, setForceShowLanding] = useState(true); // Sempre começar na landing page
    const { handleError, handleSuccess } = useErrorHandler();
    const { searchQuery, setSearchQuery, searchResults } = useSearch(projects);
    const supabaseEnabled = isSupabaseAvailable();

    // Carregar projetos ao montar
    useEffect(() => {
        loadProjects().catch((error) => {
            handleError(error, 'Carregar projetos');
        });
    }, [loadProjects, handleError]);

    // Tratar erros do store
    useEffect(() => {
        if (storeError) {
            handleError(storeError, 'Store');
        }
    }, [storeError, handleError]);

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

    const handleCreateProject = useCallback(async (name: string, description: string, templateId?: string) => {
        try {
            await createProject(name, description, templateId);
            handleSuccess('Projeto criado com sucesso!');
        } catch (error) {
            handleError(error, 'Criar projeto');
        }
    }, [createProject, handleError, handleSuccess]);

    // Ref para rastrear último projeto atualizado e evitar toasts repetidos
    const lastUpdatedProjectRef = React.useRef<{ id: string; timestamp: number } | null>(null);
    const updateDebounceMs = 1000; // 1 segundo de debounce para toasts

    const handleUpdateProject = useCallback(async (updatedProject: Project) => {
        try {
            await updateProject(updatedProject);
            
            // Mostrar toast apenas se não foi atualizado recentemente (evita spam)
            const now = Date.now();
            const lastUpdate = lastUpdatedProjectRef.current;
            const shouldShowToast = !lastUpdate || 
                lastUpdate.id !== updatedProject.id || 
                (now - lastUpdate.timestamp) > updateDebounceMs;
            
            if (shouldShowToast) {
                lastUpdatedProjectRef.current = { id: updatedProject.id, timestamp: now };
                handleSuccess('Projeto atualizado com sucesso!');
            }
        } catch (error) {
            // Verificar se é erro de rede - não mostrar toast de erro se for
            const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
            const isNetworkErr = errorMessage.includes('timeout') || 
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
    }, [updateProject, handleError, handleSuccess]);
    
    const handleDeleteProject = useCallback(async (projectId: string) => {
        try {
            await deleteProject(projectId);
            handleSuccess('Projeto deletado com sucesso!');
        } catch (error) {
            handleError(error, 'Deletar projeto');
        }
    }, [deleteProject, handleError, handleSuccess]);

    const handleSyncSupabase = useCallback(async () => {
        if (!supabaseEnabled) {
            handleError(new Error('Supabase não está configurado'), 'Sincronizar projetos');
            return;
        }
        try {
            const remoteProjects = await loadProjectsFromSupabase();
            // Atualizar store com projetos do Supabase
            // Nota: Isso pode ser melhorado criando uma ação específica no store
            for (const project of remoteProjects) {
                try {
                    await updateProject(project);
                } catch {
                    // Projeto não existe, criar
                    await createProject(project.name, project.description);
                }
            }
            await loadProjects(); // Recarregar do store
            handleSuccess(remoteProjects.length
                ? `${remoteProjects.length} projeto(s) sincronizado(s) do Supabase`
                : 'Nenhum projeto encontrado no Supabase');
        } catch (error) {
            handleError(error, 'Sincronizar projetos do Supabase');
        }
    }, [supabaseEnabled, handleError, handleSuccess, updateProject, createProject, loadProjects]);

    const handleImportJiraProject = useCallback(async (project: Project) => {
        try {
            const { importProject } = useProjectsStore.getState();
            await importProject(project);
            selectProject(project.id);
            handleSuccess(`Projeto "${project.name}" importado do Jira com sucesso!`);
        } catch (error) {
            handleError(error, 'Importar projeto do Jira');
        }
    }, [selectProject, handleError, handleSuccess]);

    const handleSearchSelect = useCallback((result: SearchResult) => {
        if (result.type === 'project' || result.projectId) {
            selectProject(result.projectId || result.id);
            setShowSearch(false);
            setSearchQuery('');
        }
    }, [selectProject]);

    useKeyboardShortcuts([
        {
            ...SHORTCUTS.SEARCH,
            action: () => setShowSearch(true)
        },
        {
            ...SHORTCUTS.ESCAPE,
            action: () => {
                setShowSearch(false);
                setSearchQuery('');
            }
        }
    ]);

    const selectedProject = useMemo(() => {
        if (!selectedProjectId) return undefined;
        return projects.find(p => p.id === selectedProjectId);
    }, [projects, selectedProjectId]);

    // Mostrar landing page quando forceShowLanding está ativo
    // O usuário pode navegar para projetos através do botão "Abrir Meus Projetos"
    const shouldShowLandingPage = useMemo(() => {
        return forceShowLanding && !showSettings;
    }, [forceShowLanding, showSettings]);

    // Sair da landing page quando um projeto é selecionado
    useEffect(() => {
        if (selectedProject) {
            setForceShowLanding(false);
        }
    }, [selectedProject]);

    // Listener para eventos da landing page
    useEffect(() => {
        const handleShowDashboard = () => {
            // Quando o usuário clica em "Começar Agora", desativar landing page forçada
            // Se não houver projetos, criar um projeto inicial
            setForceShowLanding(false);
            if (projects.length === 0) {
                handleCreateProject(
                    'Meu Primeiro Projeto',
                    'Bem-vindo ao QA Agile Guide! Este é seu primeiro projeto. Comece adicionando tarefas e casos de teste.'
                ).catch(() => {
                    // Erro já é tratado pelo handleCreateProject
                });
            }
        };
        
        const handleShowLanding = () => {
            // Quando o usuário clica em "Ver Landing Page" no dashboard
            setForceShowLanding(true);
        };
        
        window.addEventListener('show-dashboard', handleShowDashboard);
        window.addEventListener('show-landing', handleShowLanding);
        return () => {
            window.removeEventListener('show-dashboard', handleShowDashboard);
            window.removeEventListener('show-landing', handleShowLanding);
        };
    }, [projects.length, handleCreateProject]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <Spinner />
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen font-sans text-text-primary">
                <a href="#main-content" className="skip-link">
                    Pular para o conteúdo principal
                </a>
                <Toaster
                    position={isMobile ? "top-center" : "top-right"}
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
                {!shouldShowLandingPage && (
                    <Header 
                        onProjectImported={handleImportJiraProject}
                        onOpenSettings={() => setShowSettings(true)}
                    />
                )}
                {shouldShowLandingPage && (
                    <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/80 backdrop-blur">
                        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <h1 className="text-lg sm:text-xl font-bold text-base-content truncate">
                                    QA Agile Guide
                                </h1>
                                <span className="badge badge-outline badge-sm hidden sm:inline-flex">
                                    QA ágil
                                </span>
                            </div>

                            <nav className="hidden md:flex items-center gap-1" aria-label="Navegação da landing">
                                <a href="#features-section" className="btn btn-ghost btn-sm rounded-full">
                                    Funcionalidades
                                </a>
                                <a href="#benefits-section" className="btn btn-ghost btn-sm rounded-full">
                                    Benefícios
                                </a>
                                <a href="#cta-section" className="btn btn-ghost btn-sm rounded-full">
                                    Começar
                                </a>
                            </nav>

                            <div className="flex items-center gap-2">
                                <div className="dropdown dropdown-end md:hidden">
                                    <button
                                        type="button"
                                        tabIndex={0}
                                        className="btn btn-ghost btn-sm rounded-full"
                                        aria-label="Abrir menu"
                                    >
                                        Menu
                                    </button>
                                    <ul
                                        tabIndex={0}
                                        className="menu dropdown-content z-[1] mt-2 p-2 shadow bg-base-100 rounded-box w-56 border border-base-300"
                                    >
                                        <li><a href="#features-section">Funcionalidades</a></li>
                                        <li><a href="#benefits-section">Benefícios</a></li>
                                        <li><a href="#cta-section">Começar</a></li>
                                    </ul>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setForceShowLanding(false)}
                                    className="btn btn-primary btn-sm rounded-full"
                                >
                                    Abrir Meus Projetos
                                </button>
                            </div>
                        </div>
                    </header>
                )}
                {showSearch && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur pt-20 p-4">
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
                    <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur"><Spinner /></div>}>
                        <AdvancedSearch
                            projects={projects}
                            onResultSelect={(result) => {
                                if (result.type === 'project' || result.projectId) {
                                    selectProject(result.projectId || result.id);
                                }
                                setShowAdvancedSearch(false);
                            }}
                            onClose={() => setShowAdvancedSearch(false)}
                        />
                    </Suspense>
                )}

                {showProjectComparison && (
                    <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur"><Spinner /></div>}>
                        <ProjectComparisonModal
                            isOpen={showProjectComparison}
                            onClose={() => setShowProjectComparison(false)}
                            projects={projects}
                            onProjectSelect={(projectId) => {
                                selectProject(projectId);
                                setShowProjectComparison(false);
                            }}
                        />
                    </Suspense>
                )}

                <main id="main-content">
                    {showSettings ? (
                        <Suspense fallback={<div className="container mx-auto p-8"><LoadingSkeleton variant="card" count={3} /></div>}>
                            <SettingsView 
                                onClose={() => setShowSettings(false)}
                                onProjectImported={handleImportJiraProject}
                            />
                        </Suspense>
                    ) : shouldShowLandingPage ? (
                        <LandingPage />
                    ) : selectedProject ? (
                        <Suspense fallback={<div className="container mx-auto p-8"><LoadingSkeleton variant="card" count={3} /></div>}>
                            <ProjectView 
                                project={selectedProject} 
                                onUpdateProject={handleUpdateProject}
                                onBack={() => selectProject(null)}
                            />
                        </Suspense>
                    ) : (
                        <Suspense fallback={<div className="container mx-auto p-8"><LoadingSkeleton variant="card" count={3} /></div>}>
                            <ProjectsDashboard 
                                projects={projects} 
                                onSelectProject={selectProject} 
                                onCreateProject={handleCreateProject}
                                onDeleteProject={handleDeleteProject}
                                onComparisonClick={() => setShowProjectComparison(true)}
                                onSyncSupabase={handleSyncSupabase}
                            />
                        </Suspense>
                    )}
                </main>
                <KeyboardShortcutsHelp />
                <Suspense fallback={null}>
                    <OnboardingGuide />
                </Suspense>
            </div>
        </ErrorBoundary>
    );
};

export default App;
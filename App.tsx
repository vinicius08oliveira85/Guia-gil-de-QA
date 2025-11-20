
import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Project, PhaseName } from './types';
import { Header } from './components/common/Header';
import { Spinner } from './components/common/Spinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SearchBar } from './components/common/SearchBar';
import { getAllProjects, addProject, updateProject, deleteProject } from './services/dbService';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useSearch, SearchResult } from './hooks/useSearch';
import { useKeyboardShortcuts, SHORTCUTS } from './hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './components/common/KeyboardShortcutsHelp';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { loadProjectsFromSupabase, isSupabaseAvailable } from './services/supabaseService';
import { getExportPreferences } from './utils/preferencesService';
import { startExportScheduler } from './utils/exportScheduler';
import { useIsMobile } from './hooks/useIsMobile';

// Code splitting - Lazy loading de componentes pesados
const ProjectView = lazyWithRetry(() => import('./components/ProjectView').then(m => ({ default: m.ProjectView })));
const ProjectsDashboard = lazyWithRetry(() => import('./components/ProjectsDashboard').then(m => ({ default: m.ProjectsDashboard })));
const AdvancedSearch = lazyWithRetry(() => import('./components/common/AdvancedSearch').then(m => ({ default: m.AdvancedSearch })));
const ProjectComparisonModal = lazyWithRetry(() => import('./components/common/ProjectComparisonModal').then(m => ({ default: m.ProjectComparisonModal })));
const OnboardingGuide = lazyWithRetry(() => import('./components/onboarding/OnboardingGuide').then(m => ({ default: m.OnboardingGuide })));
import { PHASE_NAMES } from './utils/constants';
import { createProjectFromTemplate } from './utils/projectTemplates';
import { addAuditLog } from './utils/auditLog';
import { lazyWithRetry } from './utils/lazyWithRetry';

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [showProjectComparison, setShowProjectComparison] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();
    const { searchQuery, setSearchQuery, searchResults } = useSearch(projects);
    const supabaseEnabled = isSupabaseAvailable();

    useEffect(() => {
        let isMounted = true;
        
        const loadProjects = async () => {
            try {
                const storedProjects = await getAllProjects();
                if (isMounted) {
                    setProjects(storedProjects);
                    setIsLoading(false);
                }
            } catch (error) {
                if (isMounted) {
                    handleError(error, 'Carregar projetos');
                    setIsLoading(false);
                }
            }
        };
        
        loadProjects();
        
        return () => {
            isMounted = false;
        };
    }, []); // Removed handleError from dependencies as it's stable

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
        let newProject: Project;
        
        if (templateId) {
            newProject = createProjectFromTemplate(templateId, name, description);
        } else {
            newProject = {
                id: `proj-${Date.now()}`,
                name,
                description,
                documents: [],
                tasks: [],
                phases: PHASE_NAMES.map(name => ({ name, status: 'Não Iniciado' })),
            };
        }
        
        try {
            await addProject(newProject);
            setProjects(prev => [...prev, newProject]);
            addAuditLog({
                action: 'CREATE',
                entityType: 'project',
                entityId: newProject.id,
                entityName: newProject.name
            });
            handleSuccess('Projeto criado com sucesso!');
        } catch (error) {
            handleError(error, 'Criar projeto');
        }
    }, [handleError, handleSuccess]);

    const handleUpdateProject = useCallback(async (updatedProject: Project) => {
        try {
            const oldProject = projects.find(p => p.id === updatedProject.id);
            await updateProject(updatedProject);
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            
            if (oldProject) {
                addAuditLog({
                    action: 'UPDATE',
                    entityType: 'project',
                    entityId: updatedProject.id,
                    entityName: updatedProject.name,
                    changes: {
                        name: { old: oldProject.name, new: updatedProject.name },
                        description: { old: oldProject.description, new: updatedProject.description }
                    }
                });
            }
            
            handleSuccess('Projeto atualizado com sucesso!');
        } catch (error) {
            handleError(error, 'Atualizar projeto');
        }
    }, [handleError, handleSuccess, projects]);
    
    const handleDeleteProject = useCallback(async (projectId: string) => {
        try {
            const project = projects.find(p => p.id === projectId);
            await deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            
            if (project) {
                addAuditLog({
                    action: 'DELETE',
                    entityType: 'project',
                    entityId: projectId,
                    entityName: project.name
                });
            }
            
            handleSuccess('Projeto deletado com sucesso!');
        } catch (error) {
            handleError(error, 'Deletar projeto');
        }
    }, [handleError, handleSuccess, projects]);

    const handleSyncSupabase = useCallback(async () => {
        if (!supabaseEnabled) {
            handleError(new Error('Supabase não está configurado'), 'Sincronizar projetos');
            return;
        }
        try {
            const remoteProjects = await loadProjectsFromSupabase();
            setProjects(remoteProjects);
            handleSuccess(remoteProjects.length
                ? `${remoteProjects.length} projeto(s) carregado(s) do Supabase`
                : 'Nenhum projeto encontrado no Supabase');
        } catch (error) {
            handleError(error, 'Sincronizar projetos do Supabase');
        }
    }, [supabaseEnabled, handleError, handleSuccess]);

    const handleImportJiraProject = useCallback(async (project: Project) => {
        try {
            await addProject(project);
            setProjects(prev => [...prev, project]);
            setSelectedProjectId(project.id);
            addAuditLog({
                action: 'CREATE',
                entityType: 'project',
                entityId: project.id,
                entityName: project.name
            });
            handleSuccess(`Projeto "${project.name}" importado do Jira com sucesso!`);
        } catch (error) {
            handleError(error, 'Importar projeto do Jira');
        }
    }, [handleError, handleSuccess]);

    const handleSearchSelect = useCallback((result: SearchResult) => {
        if (result.type === 'project' || result.projectId) {
            setSelectedProjectId(result.projectId || result.id);
            setShowSearch(false);
            setSearchQuery('');
        }
    }, []);

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

    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

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
                <Header onProjectImported={handleImportJiraProject} />
                {showSearch && (
                    <div className="glass-overlay fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
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
                    <Suspense fallback={<div className="glass-overlay fixed inset-0 z-50 flex items-center justify-center"><Spinner /></div>}>
                        <AdvancedSearch
                            projects={projects}
                            onResultSelect={(result) => {
                                if (result.type === 'project' || result.projectId) {
                                    setSelectedProjectId(result.projectId || result.id);
                                }
                                setShowAdvancedSearch(false);
                            }}
                            onClose={() => setShowAdvancedSearch(false)}
                        />
                    </Suspense>
                )}

                {showProjectComparison && (
                    <Suspense fallback={<div className="glass-overlay fixed inset-0 z-50 flex items-center justify-center"><Spinner /></div>}>
                        <ProjectComparisonModal
                            isOpen={showProjectComparison}
                            onClose={() => setShowProjectComparison(false)}
                            projects={projects}
                            onProjectSelect={(projectId) => {
                                setSelectedProjectId(projectId);
                                setShowProjectComparison(false);
                            }}
                        />
                    </Suspense>
                )}

                <main>
                    {selectedProject ? (
                        <Suspense fallback={<div className="container mx-auto p-8"><LoadingSkeleton variant="card" count={3} /></div>}>
                            <ProjectView 
                                project={selectedProject} 
                                onUpdateProject={handleUpdateProject}
                                onBack={() => setSelectedProjectId(null)}
                            />
                        </Suspense>
                    ) : (
                        <Suspense fallback={<div className="container mx-auto p-8"><LoadingSkeleton variant="card" count={3} /></div>}>
                            <ProjectsDashboard 
                                projects={projects} 
                                onSelectProject={setSelectedProjectId} 
                                onCreateProject={handleCreateProject}
                                onDeleteProject={handleDeleteProject}
                                onSearchClick={() => setShowSearch(true)}
                                onAdvancedSearchClick={() => setShowAdvancedSearch(true)}
                                onComparisonClick={() => setShowProjectComparison(true)}
                                onSyncSupabase={supabaseEnabled ? handleSyncSupabase : undefined}
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
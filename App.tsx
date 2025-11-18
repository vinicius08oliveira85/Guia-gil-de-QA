
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Project, PhaseName } from './types';
import { Header } from './components/common/Header';
import { ProjectView } from './components/ProjectView';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { Spinner } from './components/common/Spinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SearchBar } from './components/common/SearchBar';
import { getAllProjects, addProject, updateProject, deleteProject } from './services/dbService';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useSearch, SearchResult } from './hooks/useSearch';
import { useKeyboardShortcuts, SHORTCUTS } from './hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './components/common/KeyboardShortcutsHelp';
import { AdvancedSearch } from './components/common/AdvancedSearch';
import { ProjectComparison } from './components/common/ProjectComparison';
import { JiraIntegration } from './components/jira/JiraIntegration';
import { LearningPathView } from './components/learning/LearningPathView';
import { OnboardingGuide } from './components/onboarding/OnboardingGuide';
import { PHASE_NAMES } from './utils/constants';
import { createProjectFromTemplate } from './utils/projectTemplates';
import { addAuditLog } from './utils/auditLog';

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [showProjectComparison, setShowProjectComparison] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();
    const { searchQuery, setSearchQuery, searchResults } = useSearch(projects);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const storedProjects = await getAllProjects();
                setProjects(storedProjects);
            } catch (error) {
                handleError(error, 'Carregar projetos');
            } finally {
                setIsLoading(false);
            }
        };
        loadProjects();
    }, [handleError]);

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

    // Detectar se é mobile para ajustar posição dos toasts
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <ErrorBoundary>
            <div className="min-h-screen font-sans text-text-primary">
                <Toaster
                    position={isMobile ? "top-center" : "top-right"}
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'rgba(30, 41, 59, 0.95)',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        },
                        success: {
                            iconTheme: {
                                primary: '#14B8A6',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
                <Header />
                {showSearch && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
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
                )}

                {showProjectComparison && (
                    <Modal
                        isOpen={showProjectComparison}
                        onClose={() => setShowProjectComparison(false)}
                        title="Comparar Projetos"
                    >
                        <ProjectComparison
                            projects={projects}
                            onProjectSelect={(projectId) => {
                                setSelectedProjectId(projectId);
                                setShowProjectComparison(false);
                            }}
                        />
                    </Modal>
                )}

                <main>
                    {selectedProject ? (
                        <ProjectView 
                            project={selectedProject} 
                            onUpdateProject={handleUpdateProject}
                            onBack={() => setSelectedProjectId(null)}
                        />
                    ) : (
                        <div className="space-y-6">
                            <JiraIntegration onProjectImported={handleImportJiraProject} />
                            <ProjectsDashboard 
                                projects={projects} 
                                onSelectProject={setSelectedProjectId} 
                                onCreateProject={handleCreateProject}
                                onDeleteProject={handleDeleteProject}
                                onSearchClick={() => setShowSearch(true)}
                                onAdvancedSearchClick={() => setShowAdvancedSearch(true)}
                                onComparisonClick={() => setShowProjectComparison(true)}
                            />
                            <div className="mt-8">
                                <LearningPathView />
                            </div>
                        </div>
                    )}
                </main>
                <KeyboardShortcutsHelp />
                <OnboardingGuide />
            </div>
        </ErrorBoundary>
    );
};

export default App;
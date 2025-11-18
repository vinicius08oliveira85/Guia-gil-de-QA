
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Project, PhaseName } from './types';
import { Header } from './components/common/Header';
import { ProjectView } from './components/ProjectView';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { Spinner } from './components/common/Spinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { getAllProjects, addProject, updateProject, deleteProject } from './services/dbService';
import { useErrorHandler } from './hooks/useErrorHandler';
import { PHASE_NAMES } from './utils/constants';

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { handleError, handleSuccess } = useErrorHandler();

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

    const handleCreateProject = useCallback(async (name: string, description: string) => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            description,
            documents: [],
            tasks: [],
            phases: PHASE_NAMES.map(name => ({ name, status: 'Não Iniciado' })),
        };
        try {
            await addProject(newProject);
            setProjects(prev => [...prev, newProject]);
            handleSuccess('Projeto criado com sucesso!');
        } catch (error) {
            handleError(error, 'Criar projeto');
        }
    }, [handleError, handleSuccess]);

    const handleUpdateProject = useCallback(async (updatedProject: Project) => {
        try {
            await updateProject(updatedProject);
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            handleSuccess('Projeto atualizado com sucesso!');
        } catch (error) {
            handleError(error, 'Atualizar projeto');
        }
    }, [handleError, handleSuccess]);
    
    const handleDeleteProject = useCallback(async (projectId: string) => {
        try {
            await deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            handleSuccess('Projeto deletado com sucesso!');
        } catch (error) {
            handleError(error, 'Deletar projeto');
        }
    }, [handleError, handleSuccess]);

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
                    position="top-right"
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
                <main>
                    {selectedProject ? (
                        <ProjectView 
                            project={selectedProject} 
                            onUpdateProject={handleUpdateProject}
                            onBack={() => setSelectedProjectId(null)}
                        />
                    ) : (
                        <ProjectsDashboard 
                            projects={projects} 
                            onSelectProject={setSelectedProjectId} 
                            onCreateProject={handleCreateProject}
                            onDeleteProject={handleDeleteProject}
                        />
                    )}
                </main>
            </div>
        </ErrorBoundary>
    );
};

export default App;
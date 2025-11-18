
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Project, PhaseName } from './types';
import { Header } from './components/common/Header';
import { ProjectView } from './components/ProjectView';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { Spinner } from './components/common/Spinner';
import { getAllProjects, addProject, updateProject, deleteProject } from './services/dbService';

const phaseNames: PhaseName[] = ['Request', 'Analysis', 'Design', 'Analysis and Code', 'Build', 'Test', 'Release', 'Deploy', 'Operate', 'Monitor'];

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const storedProjects = await getAllProjects();
                setProjects(storedProjects);
            } catch (error) {
                console.error("Failed to load projects from DB", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProjects();
    }, []);

    const handleCreateProject = useCallback(async (name: string, description: string) => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            description,
            documents: [],
            tasks: [],
            phases: phaseNames.map(name => ({ name, status: 'Não Iniciado' })),
        };
        try {
            await addProject(newProject);
            setProjects(prev => [...prev, newProject]);
        } catch (error) {
            console.error("Failed to create project", error);
            alert("Falha ao criar o projeto.");
        }
    }, []);

    const handleUpdateProject = useCallback(async (updatedProject: Project) => {
        try {
            await updateProject(updatedProject);
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        } catch (error) {
            console.error("Failed to update project", error);
            alert("Falha ao atualizar o projeto.");
        }
    }, []);
    
    const handleDeleteProject = useCallback(async (projectId: string) => {
        try {
            await deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (error) {
            console.error("Failed to delete project", error);
            alert("Falha ao deletar o projeto.");
        }
    }, []);

    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans text-text-primary">
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
    );
};

export default App;
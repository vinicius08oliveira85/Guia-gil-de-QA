/**
 * EXEMPLO: Versão migrada do ProjectView usando o store
 * 
 * Este é um exemplo de como migrar componentes para usar o store.
 * O componente real ProjectView.tsx ainda usa props, mas pode ser
 * migrado seguindo este padrão.
 */

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useProject } from '../hooks/useProject';
import { useProjectsStore } from '../store/projectsStore';
import { useProjectMetrics } from '../hooks/useProjectMetrics';
import { ProjectTrail } from './trail/ProjectTrail';
import { TasksView } from './tasks/TasksView';
import { DocumentsView } from './DocumentsView';
import { RoadmapView } from './roadmap/RoadmapView';
import { GlossaryView } from './glossary/GlossaryView';
import { PrintableReport } from './PrintableReport';
import { ExportMenu } from './common/ExportMenu';
import { Modal } from './common/Modal';
import { LearningPathView } from './learning/LearningPathView';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { QualityDashboard } from './dashboard/QualityDashboard';

/**
 * Versão migrada: usa o store diretamente em vez de receber props
 */
export const ProjectViewMigrated: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // Obter projeto selecionado do store
    const selectedProjectId = useProjectsStore((state) => state.selectedProjectId);
    const { project, updateProject, isLoading: projectLoading } = useProject(selectedProjectId);
    
    const [activeTab, setActiveTab] = useState('trail');
    const [isPrinting, setIsPrinting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    
    // Se não há projeto selecionado, mostrar mensagem
    if (!selectedProjectId) {
        return (
            <div className="container mx-auto p-8">
                <p>Nenhum projeto selecionado</p>
                <button onClick={onBack}>Voltar</button>
            </div>
        );
    }
    
    // Se está carregando
    if (projectLoading || !project) {
        return (
            <div className="container mx-auto p-8">
                <LoadingSkeleton variant="card" count={3} />
            </div>
        );
    }
    
    const metrics = useProjectMetrics(project);
    const previousPhasesRef = useRef<string>('');
    const isMountedRef = useRef(true);
    const projectRef = useRef(project);

    // Keep refs updated
    useEffect(() => {
        projectRef.current = project;
    }, [project]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        // Update project state only if the calculated phases have changed
        if (!metrics.newPhases || !isMountedRef.current) return;
        
        const newPhasesString = JSON.stringify(metrics.newPhases);
        const currentPhasesString = JSON.stringify(projectRef.current.phases);
        
        // Only update if phases actually changed and component is still mounted
        if (newPhasesString !== previousPhasesRef.current && newPhasesString !== currentPhasesString) {
            previousPhasesRef.current = newPhasesString;
            // Use setTimeout to ensure update happens after render, preventing React error #130
            setTimeout(() => {
                if (isMountedRef.current && project) {
                    updateProject({ ...project, phases: metrics.newPhases });
                }
            }, 0);
        }
    }, [metrics.newPhases, project, updateProject]);

    useEffect(() => {
        if (isPrinting) {
            const originalTitle = document.title;
            document.title = `Relatorio_${project.name.replace(/\s/g, '_')}`;
            const timer = setTimeout(() => {
                window.print();
                setIsPrinting(false);
                document.title = originalTitle;
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [isPrinting, project.name]);
    
    const handlePrint = () => {
        setIsPrinting(true);
    };
    
    const tabBaseClass = "tab-pill whitespace-nowrap";
    const activeTabStyle = "tab-pill--active";
    
    const tabs: Array<{ id: string; label: string; 'data-onboarding'?: string }> = [
        { id: 'trail', label: 'Trilha do Projeto' },
        { id: 'tasks', label: 'Tarefas' },
        { id: 'documents', label: 'Documentos' },
        { id: 'roadmap', label: 'Roadmap' },
        { id: 'glossary', label: 'Glossário' },
        { id: 'learning', label: 'Aprendizado' },
        { id: 'quality', label: 'Qualidade' },
    ];

    return (
        <div className="container mx-auto p-4 sm:p-8">
            {/* Header com botão voltar */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <button
                        onClick={onBack}
                        className="btn btn-secondary mb-2"
                        aria-label="Voltar para lista de projetos"
                    >
                        ← Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-text-primary">{project.name}</h1>
                    {project.description && (
                        <p className="text-text-secondary mt-2">{project.description}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="btn btn-secondary"
                    >
                        Exportar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="btn btn-secondary"
                    >
                        Imprimir
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex flex-wrap gap-2 border-b border-surface-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${tabBaseClass} ${activeTab === tab.id ? activeTabStyle : ''}`}
                        data-onboarding={tab['data-onboarding']}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Conteúdo da Tab */}
            <div className="mt-6">
                {activeTab === 'trail' && (
                    <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                        <ProjectTrail project={project} onUpdateProject={updateProject} />
                    </Suspense>
                )}
                {activeTab === 'tasks' && (
                    <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                        <TasksView 
                            project={project} 
                            onUpdateProject={updateProject}
                        />
                    </Suspense>
                )}
                {activeTab === 'documents' && (
                    <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                        <DocumentsView 
                            project={project} 
                            onUpdateProject={updateProject}
                        />
                    </Suspense>
                )}
                {activeTab === 'roadmap' && (
                    <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                        <RoadmapView project={project} />
                    </Suspense>
                )}
                {activeTab === 'glossary' && (
                    <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                        <GlossaryView />
                    </Suspense>
                )}
                {activeTab === 'learning' && (
                    <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                        <LearningPathView project={project} />
                    </Suspense>
                )}
                {activeTab === 'quality' && (
                    <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                        <QualityDashboard project={project} />
                    </Suspense>
                )}
            </div>

            {/* Modais */}
            {showExportMenu && (
                <ExportMenu
                    project={project}
                    onClose={() => setShowExportMenu(false)}
                />
            )}

            {isPrinting && (
                <div className="hidden">
                    <PrintableReport project={project} />
                </div>
            )}
        </div>
    );
};


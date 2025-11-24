import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Project } from '../types';
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

export const ProjectView: React.FC<{ project: Project; onUpdateProject: (project: Project) => void; onBack: () => void; }> = ({ project, onUpdateProject, onBack }) => {
    const [activeTab, setActiveTab] = useState('trail');
    const [isPrinting, setIsPrinting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const metrics = useProjectMetrics(project);
    const previousPhasesRef = useRef<string>('');
    const isMountedRef = useRef(true);
    const projectRef = useRef(project);
    const onUpdateProjectRef = useRef(onUpdateProject);

    // Keep refs updated
    useEffect(() => {
        projectRef.current = project;
        onUpdateProjectRef.current = onUpdateProject;
    }, [project, onUpdateProject]);

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
                if (isMountedRef.current) {
                    onUpdateProjectRef.current({ ...projectRef.current, phases: metrics.newPhases });
                }
            }, 0);
        }
    }, [metrics.newPhases]);

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
        { id: 'tasks', label: 'Tarefas & Testes', 'data-onboarding': 'tasks-tab' },
        { id: 'documents', label: 'Documentos' },
        { id: 'learning', label: '🎓 Aprender QA', 'data-onboarding': 'learning-tab' },
        { id: 'roadmap', label: 'Roadmap' },
        { id: 'glossary', label: 'Glossário' },
    ];

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
    };

    return (
        <>
            <div className="container mx-auto max-w-screen-2xl px-6 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-16 2xl:px-20 non-printable w-full">
                <div className="grid gap-4 mb-8 w-full lg:grid-cols-[auto,1fr] lg:items-center">
                    <button 
                        onClick={onBack} 
                        className="text-accent hover:text-accent-light transition-colors font-semibold w-full sm:w-auto text-left"
                    >
                        &larr; Voltar para Projetos
                    </button>
                    <div className="flex flex-wrap gap-2 w-full justify-end">
                        <button 
                            onClick={() => setShowExportMenu(true)} 
                            className="btn btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto lg:min-w-[180px]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span>Exportar</span>
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="btn btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto lg:min-w-[150px]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            <span>PDF</span>
                        </button>
                    </div>
                </div>
                
                <Modal isOpen={showExportMenu} onClose={() => setShowExportMenu(false)} title="Exportar Projeto">
                    <ExportMenu project={project} onClose={() => setShowExportMenu(false)} />
                </Modal>
                <h2 className="text-3xl sm:text-5xl font-bold text-text-primary mb-4 break-words text-balance leading-tight">{project.name}</h2>
                <p className="text-text-secondary mb-10 max-w-3xl break-words text-lg leading-relaxed">{project.description}</p>
                
                <div className="border-b border-surface-border mb-8 sticky top-[72px] md:static bg-background/90 backdrop-blur-lg z-10 px-2 sm:px-0 shadow-sm">
                    <nav className="hidden md:flex flex-wrap gap-2 py-2" aria-label="Navegação de abas desktop">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)} 
                                className={`${tabBaseClass} ${activeTab === tab.id ? activeTabStyle : ''}`}
                                data-onboarding={tab['data-onboarding']}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="md:hidden px-1 pb-3">
                        <div 
                            className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory w-full"
                            role="tablist"
                            aria-label="Navegação de abas mobile"
                        >
                            {tabs.map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => handleTabClick(tab.id)} 
                                    className={`${tabBaseClass} ${activeTab === tab.id ? activeTabStyle : ''} flex-shrink-0 snap-center`}
                                    data-onboarding={tab['data-onboarding']}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="mt-8">
                    {activeTab === 'trail' && (
                        <ProjectTrail
                            project={project}
                            onUpdateProject={onUpdateProject}
                            onNavigateToTask={() => handleTabClick('tasks')}
                            onNavigateToTab={handleTabClick}
                        />
                    )}
                    {activeTab === 'tasks' && (
                        <Suspense fallback={<LoadingSkeleton variant="task" count={5} />}>
                            <TasksView 
                                project={project} 
                                onUpdateProject={onUpdateProject}
                                onNavigateToTab={(tabId) => handleTabClick(tabId)}
                            />
                        </Suspense>
                    )}
                    {activeTab === 'documents' && (
                        <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
                            <DocumentsView project={project} onUpdateProject={onUpdateProject} />
                        </Suspense>
                    )}
                    {activeTab === 'learning' && (
                        <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                            <LearningPathView />
                        </Suspense>
                    )}
                    {activeTab === 'roadmap' && (
                        <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                            <RoadmapView />
                        </Suspense>
                    )}
                    {activeTab === 'glossary' && (
                        <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                            <GlossaryView />
                        </Suspense>
                    )}
                </div>
            </div>
            {isPrinting && <PrintableReport project={project} metrics={metrics} />}
        </>
    );
};
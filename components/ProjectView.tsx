import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Project } from '../types';
import { useProjectMetrics } from '../hooks/useProjectMetrics';
import { ProjectQADashboard } from './dashboard/ProjectQADashboard';
import { AnalysisView } from './analysis/AnalysisView';
import { TasksView } from './tasks/TasksView';
import { DocumentsView } from './DocumentsView';
import { RoadmapView } from './roadmap/RoadmapView';
import { GlossaryView } from './glossary/GlossaryView';
import { TimelineView } from './timeline/TimelineView';
import { PrintableReport } from './PrintableReport';
import { ExportMenu } from './common/ExportMenu';
import { Modal } from './common/Modal';
import { LearningPathView } from './learning/LearningPathView';
import { DependencyGraph } from './common/DependencyGraph';
import { BurndownChart } from './common/BurndownChart';
import { ProjectComparison } from './common/ProjectComparison';
import { ChangeHistory } from './common/ChangeHistory';
import { ActivityFeed } from './common/ActivityFeed';
import { QuickStats } from './common/QuickStats';
import { ProjectHealthScore } from './common/ProjectHealthScore';
import { TaskTimeline } from './common/TaskTimeline';
import { SDLCView } from './sdlc/SDLCView';
import { ShiftLeftAnalysis } from './shiftleft/ShiftLeftAnalysis';
import { PhaseTransitionGuide } from './phases/PhaseTransitionGuide';
import { SupabaseManager } from './common/SupabaseManager';
import { SuggestionsPanel } from './common/SuggestionsPanel';
import { LoadingSkeleton } from './common/LoadingSkeleton';

export const ProjectView: React.FC<{ project: Project; onUpdateProject: (project: Project) => void; onBack: () => void; }> = ({ project, onUpdateProject, onBack }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isPrinting, setIsPrinting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showDependencyGraph, setShowDependencyGraph] = useState(false);
    const [showBurndown, setShowBurndown] = useState(false);
    const [showChangeHistory, setShowChangeHistory] = useState(false);
    const [showActivityFeed, setShowActivityFeed] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
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
    
    const tabStyle = "px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap";
    const activeTabStyle = "bg-accent/20 text-accent-light";
    const inactiveTabStyle = "text-text-secondary hover:text-text-primary";
    
    const currentPhaseName = metrics.newPhases.find(p => p.status === 'Em Andamento')?.name || 'N/A';
    
    const tabs: Array<{ id: string; label: string; 'data-onboarding'?: string }> = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'tasks', label: 'Tarefas & Testes', 'data-onboarding': 'tasks-tab' },
        { id: 'timeline', label: 'Timeline' },
        { id: 'analysis', label: 'Análise IA' },
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
            <div className="container mx-auto max-w-6xl p-4 sm:p-6 md:p-8 non-printable w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <button 
                        onClick={onBack} 
                        className="text-accent hover:text-accent-light transition-colors font-semibold w-full sm:w-auto text-left"
                    >
                        &larr; Voltar para Projetos
                    </button>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => setShowExportMenu(true)} 
                            className="btn btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span>Exportar</span>
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="btn btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            <span>PDF</span>
                        </button>
                    </div>
                </div>
                
                <Modal isOpen={showExportMenu} onClose={() => setShowExportMenu(false)} title="Exportar Projeto">
                    <ExportMenu project={project} onClose={() => setShowExportMenu(false)} />
                </Modal>
                <h2 className="text-2xl sm:text-4xl font-bold text-text-primary mb-2 break-words mobile-no-overflow">{project.name}</h2>
                <p className="text-text-secondary mb-8 max-w-3xl break-words mobile-no-overflow">{project.description}</p>
                
                <div className="border-b border-surface-border mb-6 sticky top-[76px] md:static bg-background/90 backdrop-blur-lg z-10 -mx-3 px-3 sm:mx-0 sm:px-0">
                    <nav className="hidden md:flex flex-wrap gap-2 py-2" aria-label="Navegação de abas desktop">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)} 
                                className={`${tabStyle} ${activeTab === tab.id ? activeTabStyle : inactiveTabStyle}`}
                                data-onboarding={tab['data-onboarding']}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="md:hidden -mx-2 px-2 pb-3">
                        <div 
                            className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory"
                            role="tablist"
                            aria-label="Navegação de abas mobile"
                        >
                            {tabs.map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => handleTabClick(tab.id)} 
                                    className={`${tabStyle} ${activeTab === tab.id ? activeTabStyle : inactiveTabStyle} flex-shrink-0 snap-center`}
                                    data-onboarding={tab['data-onboarding']}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="mt-8">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Painel de Sugestões */}
                            <SuggestionsPanel project={project} />
                            
                            {/* Score de Saúde e Estatísticas Rápidas */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1">
                                    <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                                        <ProjectHealthScore project={project} />
                                    </Suspense>
                                </div>
                                <div className="lg:col-span-2">
                                    <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                                        <QuickStats project={project} />
                                    </Suspense>
                                </div>
                            </div>

                            <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                                <ProjectQADashboard project={project} />
                            </Suspense>
                            
                            {/* Gerenciador Supabase */}
                            <SupabaseManager 
                                project={project} 
                                onProjectUpdated={() => {
                                    // Recarregar projetos se necessário
                                    window.location.reload();
                                }}
                            />
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="p-4 bg-surface border border-surface-border rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-text-primary">Gráfico de Dependências</h3>
                                        <button
                                            onClick={() => setShowDependencyGraph(!showDependencyGraph)}
                                            className="text-sm text-accent hover:text-accent-light"
                                        >
                                            {showDependencyGraph ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                    {showDependencyGraph && (
                                        <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                                            <DependencyGraph
                                                project={project}
                                                onTaskSelect={(taskId) => {
                                                    const element = document.querySelector(`[data-task-id="${taskId}"]`);
                                                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }}
                                            />
                                        </Suspense>
                                    )}
                                </div>
                                
                                <div className="p-4 bg-surface border border-surface-border rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-text-primary">Burndown Chart</h3>
                                        <button
                                            onClick={() => setShowBurndown(!showBurndown)}
                                            className="text-sm text-accent hover:text-accent-light"
                                        >
                                            {showBurndown ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                    {showBurndown && (
                                        <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                                            <BurndownChart project={project} />
                                        </Suspense>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="p-4 bg-surface border border-surface-border rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-text-primary">Feed de Atividades</h3>
                                        <button
                                            onClick={() => setShowActivityFeed(!showActivityFeed)}
                                            className="text-sm text-accent hover:text-accent-light"
                                        >
                                            {showActivityFeed ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                    {showActivityFeed && (
                                        <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                                            <ActivityFeed project={project} />
                                        </Suspense>
                                    )}
                                </div>
                                
                                <div className="p-4 bg-surface border border-surface-border rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-text-primary">Histórico de Mudanças</h3>
                                        <button
                                            onClick={() => setShowChangeHistory(!showChangeHistory)}
                                            className="text-sm text-accent hover:text-accent-light"
                                        >
                                            {showChangeHistory ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                    {showChangeHistory && (
                                        <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                                            <ChangeHistory project={project} />
                                        </Suspense>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-surface border border-surface-border rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-text-primary">Linha do Tempo</h3>
                                    <button
                                        onClick={() => setShowTimeline(!showTimeline)}
                                        className="text-sm text-accent hover:text-accent-light"
                                    >
                                        {showTimeline ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                </div>
                                {showTimeline && (
                                    <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                                        <TaskTimeline project={project} />
                                    </Suspense>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'timeline' && (
                        <div className="space-y-6">
                            <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                                <TimelineView project={project} currentPhaseName={currentPhaseName} />
                            </Suspense>
                            <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                                <PhaseTransitionGuide project={project} currentPhase={currentPhaseName} />
                            </Suspense>
                        </div>
                    )}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6">
                            <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                                <AnalysisView project={project} onUpdateProject={onUpdateProject} />
                            </Suspense>
                            <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                                <SDLCView project={project} />
                            </Suspense>
                            <Suspense fallback={<LoadingSkeleton variant="card" count={1} />}>
                                <ShiftLeftAnalysis project={project} />
                            </Suspense>
                        </div>
                    )}
                    {activeTab === 'tasks' && (
                        <Suspense fallback={<LoadingSkeleton variant="task" count={5} />}>
                            <TasksView project={project} onUpdateProject={onUpdateProject} />
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
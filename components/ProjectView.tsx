import React, { useState, useEffect } from 'react';
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

export const ProjectView: React.FC<{ project: Project; onUpdateProject: (project: Project) => void; onBack: () => void; }> = ({ project, onUpdateProject, onBack }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showDependencyGraph, setShowDependencyGraph] = useState(false);
    const [showBurndown, setShowBurndown] = useState(false);
    const [showChangeHistory, setShowChangeHistory] = useState(false);
    const [showActivityFeed, setShowActivityFeed] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const metrics = useProjectMetrics(project);

    useEffect(() => {
        // Update project state only if the calculated phases have changed
        if (metrics.newPhases && JSON.stringify(metrics.newPhases) !== JSON.stringify(project.phases)) {
            onUpdateProject({ ...project, phases: metrics.newPhases });
        }
    }, [metrics.newPhases, project, onUpdateProject]);

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
    
    const mainTabs = tabs.slice(0, 2);
    const moreTabs = tabs.slice(2);
    const isMoreTabActive = moreTabs.some(tab => tab.id === activeTab);

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
        setIsMoreMenuOpen(false);
    };

    return (
        <>
            <div className="container mx-auto p-4 sm:p-6 md:p-8 non-printable">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <button onClick={onBack} className="text-accent hover:text-accent-light transition-colors font-semibold">&larr; Voltar para Projetos</button>
                    <div className="flex gap-2">
                        <button onClick={() => setShowExportMenu(true)} className="btn btn-secondary flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span>Exportar</span>
                        </button>
                    <button onClick={handlePrint} className="btn btn-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            <span>PDF</span>
                    </button>
                </div>
                </div>
                
                <Modal isOpen={showExportMenu} onClose={() => setShowExportMenu(false)} title="Exportar Projeto">
                    <ExportMenu project={project} onClose={() => setShowExportMenu(false)} />
                </Modal>
                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">{project.name}</h2>
                <p className="text-text-secondary mb-8 max-w-3xl">{project.description}</p>
                
                <div className="border-b border-surface-border mb-6">
                    <nav className="flex" aria-label="Tabs">
                         <div className="hidden md:flex space-x-2">
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
                        </div>

                        {/* Mobile tabs with dropdown */}
                        <div className="flex md:hidden w-full">
                            {mainTabs.map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => handleTabClick(tab.id)} 
                                    className={`${tabStyle} ${activeTab === tab.id ? activeTabStyle : inactiveTabStyle} flex-grow`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                            <div className="relative flex-grow">
                                <button
                                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                    className={`${tabStyle} w-full flex items-center justify-center ${isMoreTabActive ? activeTabStyle : inactiveTabStyle}`}
                                >
                                    Mais
                                    <svg className={`w-5 h-5 ml-1 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                {isMoreMenuOpen && (
                                    <div 
                                        className="absolute top-full right-0 mt-2 w-48 mica rounded-lg shadow-lg z-10"
                                        onMouseLeave={() => setIsMoreMenuOpen(false)}
                                    >
                                        {moreTabs.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabClick(tab.id)}
                                                className={`block w-full text-left px-4 py-2 text-sm ${activeTab === tab.id ? 'bg-accent text-white' : 'text-text-primary hover:bg-surface-hover'}`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </nav>
                </div>
                
                <div className="mt-8">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Score de Saúde e Estatísticas Rápidas */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1">
                                    <ProjectHealthScore project={project} />
                                </div>
                                <div className="lg:col-span-2">
                                    <QuickStats project={project} />
                                </div>
                            </div>

                            <ProjectQADashboard project={project} />
                            
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
                                        <DependencyGraph
                                            project={project}
                                            onTaskSelect={(taskId) => {
                                                const element = document.querySelector(`[data-task-id="${taskId}"]`);
                                                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }}
                                        />
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
                                    {showBurndown && <BurndownChart project={project} />}
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
                                    {showActivityFeed && <ActivityFeed project={project} />}
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
                                    {showChangeHistory && <ChangeHistory project={project} />}
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
                                {showTimeline && <TaskTimeline project={project} />}
                            </div>
                        </div>
                    )}
                    {activeTab === 'timeline' && (
                        <div className="space-y-6">
                            <TimelineView project={project} currentPhaseName={currentPhaseName} />
                            <PhaseTransitionGuide project={project} currentPhase={currentPhaseName} />
                        </div>
                    )}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6">
                            <AnalysisView project={project} onUpdateProject={onUpdateProject} />
                            <SDLCView project={project} />
                            <ShiftLeftAnalysis project={project} />
                        </div>
                    )}
                    {activeTab === 'tasks' && <TasksView project={project} onUpdateProject={onUpdateProject} />}
                    {activeTab === 'documents' && <DocumentsView project={project} onUpdateProject={onUpdateProject} />}
                    {activeTab === 'learning' && <LearningPathView />}
                    {activeTab === 'roadmap' && <RoadmapView />}
                    {activeTab === 'glossary' && <GlossaryView />}
                </div>
            </div>
            {isPrinting && <PrintableReport project={project} metrics={metrics} />}
        </>
    );
};
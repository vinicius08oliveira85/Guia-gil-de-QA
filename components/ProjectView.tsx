import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Project } from '../types';
import { useProjectMetrics } from '../hooks/useProjectMetrics';
import { TasksView } from './tasks/TasksView';
import { DocumentsView } from './DocumentsView';
import { GlossaryView } from './glossary/GlossaryView';
import { PrintableReport } from './PrintableReport';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { QADashboard } from './dashboard/QADashboard';
import { useProjectsStore } from '../store/projectsStore';
import { isSupabaseAvailable } from '../services/supabaseService';
import toast from 'react-hot-toast';
import { Spinner } from './common/Spinner';

export const ProjectView: React.FC<{ project: Project; onUpdateProject: (project: Project) => void; onBack: () => void; }> = ({ project, onUpdateProject, onBack }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSavingToSupabase, setIsSavingToSupabase] = useState(false);
    const metrics = useProjectMetrics(project);
    const previousPhasesRef = useRef<string>('');
    const isMountedRef = useRef(true);
    const projectRef = useRef(project);
    const onUpdateProjectRef = useRef(onUpdateProject);
    const { saveProjectToSupabase } = useProjectsStore();
    const supabaseAvailable = isSupabaseAvailable();

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

    const handleSaveToSupabase = async () => {
        if (!supabaseAvailable) {
            toast.error('Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.');
            return;
        }

        setIsSavingToSupabase(true);
        try {
            await saveProjectToSupabase(project.id);
            toast.success(`Projeto "${project.name}" salvo no Supabase com sucesso!`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            toast.error(`Erro ao salvar no Supabase: ${errorMessage}`);
        } finally {
            setIsSavingToSupabase(false);
        }
    };
    
    const tabBaseClass = "tab-pill whitespace-nowrap";
    const activeTabStyle = "tab-pill--active";
    
    const tabs: Array<{ id: string; label: string; 'data-onboarding'?: string }> = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'tasks', label: 'Tarefas & Testes', 'data-onboarding': 'tasks-tab' },
        { id: 'documents', label: 'Documentos' },
        { id: 'glossary', label: 'Glossário' },
    ];

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
    };

    return (
        <>
            <div className="container-wide py-md sm:py-lg non-printable w-full">
                <div className="grid gap-md mb-lg w-full lg:grid-cols-[auto,1fr] lg:items-center">
                    <button 
                        onClick={onBack} 
                        className="text-accent hover:text-accent-light transition-colors font-semibold w-full sm:w-auto text-left"
                    >
                        &larr; Voltar para Projetos
                    </button>
                    <div className="flex flex-wrap gap-sm w-full justify-end">
                        {/* Botão sempre visível, mas desabilitado se Supabase não estiver disponível */}
                        <button 
                            onClick={handleSaveToSupabase}
                            disabled={!supabaseAvailable || isSavingToSupabase}
                            className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto lg:min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!supabaseAvailable ? 'Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.' : 'Salvar projeto no Supabase'}
                        >
                            {isSavingToSupabase ? (
                                <>
                                    <Spinner small />
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 .836 1.659H12v8.959a.396.396 0 0 0 .724.229l9.075-12.476.401-.562a1.04 1.04 0 0 0-.838-1.66Z" fill="#3ECF8E"/>
                                    </svg>
                                    <span>Salvar</span>
                                </>
                            )}
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="btn btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto lg:min-w-[150px]"
                        >
                            <span className="emoji-sticker">📄</span>
                            <span>PDF</span>
                        </button>
                    </div>
                </div>
                
                <h2 className="heading-page text-text-primary mb-4 break-words">{project.name}</h2>
                <p className="text-lead mb-10 max-w-3xl break-words">{project.description}</p>
                
                <div className="border-b border-surface-border mb-lg sticky top-[72px] md:static bg-background/90 backdrop-blur-lg z-10 px-2 sm:px-0 shadow-sm">
                    <nav className="hidden md:flex flex-wrap gap-2 py-2" aria-label="Navegação de abas desktop" role="tablist">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)} 
                                className={`${tabBaseClass} ${activeTab === tab.id ? activeTabStyle : ''}`}
                                data-onboarding={tab['data-onboarding']}
                                id={`tab-${tab.id}`}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                aria-controls={`tab-panel-${tab.id}`}
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
                                    id={`tab-${tab.id}-mobile`}
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                    aria-controls={`tab-panel-${tab.id}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="mt-8">
                    {activeTab === 'dashboard' && (
                        <section id="tab-panel-dashboard" role="tabpanel" aria-labelledby="tab-dashboard tab-dashboard-mobile">
                        <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
                            <QADashboard project={project} onUpdateProject={onUpdateProject} />
                        </Suspense>
                        </section>
                    )}
                    {activeTab === 'tasks' && (
                        <section id="tab-panel-tasks" role="tabpanel" aria-labelledby="tab-tasks tab-tasks-mobile">
                        <Suspense fallback={<LoadingSkeleton variant="task" count={5} />}>
                            <TasksView 
                                project={project} 
                                onUpdateProject={onUpdateProject}
                                onNavigateToTab={(tabId) => handleTabClick(tabId)}
                            />
                        </Suspense>
                        </section>
                    )}
                    {activeTab === 'documents' && (
                        <section id="tab-panel-documents" role="tabpanel" aria-labelledby="tab-documents tab-documents-mobile">
                        <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
                            <DocumentsView project={project} onUpdateProject={onUpdateProject} />
                        </Suspense>
                        </section>
                    )}
                    {activeTab === 'glossary' && (
                        <section id="tab-panel-glossary" role="tabpanel" aria-labelledby="tab-glossary tab-glossary-mobile">
                        <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                            <GlossaryView />
                        </Suspense>
                        </section>
                    )}
                </div>
            </div>
            {isPrinting && <PrintableReport project={project} metrics={metrics} />}
        </>
    );
};
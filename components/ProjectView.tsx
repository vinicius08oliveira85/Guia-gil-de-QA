import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Project } from '../types';
import { useProjectMetrics } from '../hooks/useProjectMetrics';
import { TasksView } from './tasks/TasksView';
import { DocumentsView } from './DocumentsView';
import { PrintableReport } from './PrintableReport';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { QADashboard } from './dashboard/QADashboard';
import { Breadcrumbs } from './common/Breadcrumbs';
import { PageTransition } from './common/PageTransition';
import { SectionHeader } from './common/SectionHeader';
import { useProjectsStore } from '../store/projectsStore';
import { isSupabaseAvailable } from '../services/supabaseService';
import { useAutoSave } from '../hooks/useAutoSave';
import toast from 'react-hot-toast';
import { Spinner } from './common/Spinner';

export const ProjectView: React.FC<{ project: Project; onUpdateProject: (project: Project) => void; onBack: () => void; }> = ({ project, onUpdateProject, onBack }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSavingToSupabase, setIsSavingToSupabase] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const { saveProjectToSupabase, getSelectedProject } = useProjectsStore();
    const supabaseAvailable = isSupabaseAvailable();
    
    // IMPORTANTE: Sempre usar o projeto mais recente do store em vez de apenas o prop
    // Isso garante que temos a versão mais atualizada, especialmente após sincronizações
    const storeProject = getSelectedProject();
    const currentProject = storeProject || project; // Fallback para prop se store não tiver
    
    const metrics = useProjectMetrics(currentProject);
    const previousPhasesRef = useRef<string>('');
    const isMountedRef = useRef(true);
    const projectRef = useRef(currentProject);
    const onUpdateProjectRef = useRef(onUpdateProject);
    
    // Auto-save: monitora mudanças e salva automaticamente
    useAutoSave({
        project: currentProject,
        debounceMs: 300,
        disabled: !supabaseAvailable,
    });

    // Keep refs updated - usar currentProject (do store) em vez de apenas project prop
    useEffect(() => {
        projectRef.current = currentProject;
        onUpdateProjectRef.current = onUpdateProject;
    }, [currentProject, onUpdateProject]);

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
        if (!isPrinting) {
            return;
        }

        const originalTitle = document.title;
        document.title = `Relatorio_${currentProject.name.replace(/\s/g, '_')}`;
        const timer = setTimeout(() => {
            window.print();
            setIsPrinting(false);
            document.title = originalTitle;
        }, 300);

        return () => clearTimeout(timer);
    }, [isPrinting, currentProject.name]);
    
    const handlePrint = () => {
        setIsPrinting(true);
    };

    const handleSaveToSupabase = async () => {
        if (!supabaseAvailable) {
            toast.error('Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.');
            return;
        }

        setIsSavingToSupabase(true);
        setSaveStatus('saving');
        try {
            await saveProjectToSupabase(currentProject.id);
            setSaveStatus('saved');
            toast.success(`Projeto "${currentProject.name}" salvo no Supabase com sucesso!`);
            // Resetar status após 2 segundos
            setTimeout(() => {
                if (saveStatus === 'saved') {
                    setSaveStatus('idle');
                }
            }, 2000);
        } catch (error) {
            setSaveStatus('error');
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            toast.error(`Erro ao salvar no Supabase: ${errorMessage}`);
            // Resetar status de erro após 3 segundos
            setTimeout(() => {
                if (saveStatus === 'error') {
                    setSaveStatus('idle');
                }
            }, 3000);
        } finally {
            setIsSavingToSupabase(false);
        }
    };
    
    // Monitorar mudanças no projeto para atualizar status de salvamento
    useEffect(() => {
        if (supabaseAvailable && saveStatus === 'saved') {
            // Quando projeto muda, resetar status para indicar que precisa salvar novamente
            setSaveStatus('idle');
        }
    }, [currentProject, supabaseAvailable]);
    
    const tabs: Array<{ id: string; label: string; 'data-onboarding'?: string; 'data-tour'?: string }> = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'tasks', label: 'Tarefas & Testes', 'data-onboarding': 'tasks-tab', 'data-tour': 'tasks-tab' },
        { id: 'documents', label: 'Documentos' },
    ];

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
    };

    // Breadcrumbs items baseado na aba ativa
    const getBreadcrumbItems = () => {
        const baseItems = [
            { label: 'Projetos', onClick: onBack },
            { label: currentProject.name }
        ];

        const tabLabels: Record<string, string> = {
            dashboard: 'Dashboard',
            tasks: 'Tarefas & Testes',
            documents: 'Documentos'
        };

        if (activeTab !== 'dashboard') {
            baseItems.push({ label: tabLabels[activeTab] || activeTab });
        }

        return baseItems;
    };

    return (
        <>
            <div className="container mx-auto w-full max-w-7xl px-4 py-8 sm:py-10 non-printable">
                {/* Breadcrumbs */}
                <div className="mb-4">
                    <Breadcrumbs 
                        items={getBreadcrumbItems()}
                        onHomeClick={onBack}
                        className="mb-2"
                    />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                    {/* Indicador de status de salvamento */}
                    {supabaseAvailable && (
                        <div className="flex items-center gap-2 text-sm">
                            {saveStatus === 'saving' && (
                                <div className="flex items-center gap-2 text-info">
                                    <Spinner small />
                                    <span>Salvando...</span>
                                </div>
                            )}
                            {saveStatus === 'saved' && (
                                <div className="flex items-center gap-2 text-success">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                                    </svg>
                                    <span>Salvo</span>
                                </div>
                            )}
                            {saveStatus === 'error' && (
                                <div className="flex items-center gap-2 text-error">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                                    </svg>
                                    <span>Erro ao salvar</span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 ml-auto">
                        {/* Botão sempre visível, mas desabilitado se Supabase não estiver disponível */}
                        <button 
                            onClick={handleSaveToSupabase}
                            disabled={!supabaseAvailable || isSavingToSupabase}
                            className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!supabaseAvailable ? 'Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.' : 'Salvar projeto no Supabase manualmente'}
                            type="button"
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
                                    <span>Salvar Agora</span>
                                </>
                            )}
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="btn btn-outline flex items-center justify-center gap-2 w-full sm:w-auto"
                            type="button"
                        >
                            <span aria-hidden="true">📄</span>
                            <span>PDF</span>
                        </button>
                    </div>
                </div>
                
                <SectionHeader
                    as="h1"
                    align="left"
                    eyebrow={currentProject.settings?.jiraProjectKey ? `Jira: ${currentProject.settings.jiraProjectKey}` : 'Projeto'}
                    title={<span className="break-words">{currentProject.name}</span>}
                    description={
                        currentProject.description
                            ? <span className="break-words">{currentProject.description}</span>
                            : 'Sem descrição.'
                    }
                    className="max-w-4xl mb-8"
                />
                
                <div className="border-b border-base-300 pb-3">
                    <nav
                        className="tabs tabs-boxed overflow-x-auto w-full"
                        aria-label="Navegação de abas"
                        role="tablist"
                    >
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabClick(tab.id)}
                                className={`tab whitespace-nowrap ${activeTab === tab.id ? 'tab-active' : ''}`}
                                data-onboarding={tab['data-onboarding']}
                                data-tour={tab['data-tour']}
                                id={`tab-${tab.id}`}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                aria-controls={`tab-panel-${tab.id}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div className="mt-8">
                    <PageTransition key={activeTab}>
                        {activeTab === 'dashboard' && (
                            <section id="tab-panel-dashboard" role="tabpanel" aria-labelledby="tab-dashboard">
                            <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
                                <QADashboard 
                                    project={currentProject} 
                                    onUpdateProject={onUpdateProject}
                                    onNavigateToTab={(tabId) => handleTabClick(tabId)}
                                />
                            </Suspense>
                            </section>
                        )}
                        {activeTab === 'tasks' && (
                            <section id="tab-panel-tasks" role="tabpanel" aria-labelledby="tab-tasks">
                            <Suspense fallback={<LoadingSkeleton variant="task" count={5} />}>
                                <TasksView 
                                    project={currentProject} 
                                    onUpdateProject={onUpdateProject}
                                    onNavigateToTab={(tabId) => handleTabClick(tabId)}
                                />
                            </Suspense>
                            </section>
                        )}
                        {activeTab === 'documents' && (
                            <section id="tab-panel-documents" role="tabpanel" aria-labelledby="tab-documents">
                            <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
                                <DocumentsView project={currentProject} onUpdateProject={onUpdateProject} />
                            </Suspense>
                            </section>
                        )}
                    </PageTransition>
                </div>
            </div>
            {isPrinting && <PrintableReport project={currentProject} metrics={metrics} />}
        </>
    );
};
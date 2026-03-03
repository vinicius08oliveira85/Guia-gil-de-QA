import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
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
    const [initialTaskId, setInitialTaskId] = useState<string | undefined>(undefined);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSavingToSupabase, setIsSavingToSupabase] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const { saveProjectToSupabase, getSelectedProject, lastSaveToSupabase } = useProjectsStore();
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
    
    // Estado e Refs para indicadores de scroll nas abas
    const tabsRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        if (!tabsRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
        setCanScrollLeft(scrollLeft > 0);
        // Pequena margem de erro para precisão de float
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    // Monitorar scroll e resize para atualizar indicadores
    useEffect(() => {
        checkScroll();
        const tabsElement = tabsRef.current;
        if (!tabsElement) return;

        tabsElement.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        return () => {
            tabsElement.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll, activeTab]);
    
    // Auto-save: monitora mudanças e salva automaticamente (IndexedDB sempre; Supabase quando disponível)
    useAutoSave({
        project: currentProject,
        debounceMs: 300,
        disabled: false,
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
    
    // Toast quando um salvamento esperado na nuvem ficou apenas local (transição true -> false)
    const prevLastSaveToSupabaseRef = useRef<boolean | null>(null);
    useEffect(() => {
        if (lastSaveToSupabase === false && prevLastSaveToSupabaseRef.current === true) {
            toast('Salvo localmente (Supabase indisponível)', { icon: '⚠️', duration: 4000 });
        }
        prevLastSaveToSupabaseRef.current = lastSaveToSupabase;
    }, [lastSaveToSupabase]);

    // Monitorar mudanças no projeto para atualizar status de salvamento
    useEffect(() => {
        if (supabaseAvailable && saveStatus === 'saved') {
            // Quando projeto muda, resetar status para indicar que precisa salvar novamente
            setSaveStatus('idle');
        }
    }, [currentProject, supabaseAvailable]);

    // Verificar taskIdToFocus na montagem e ao mudar de projeto
    useEffect(() => {
        const taskIdToFocus = sessionStorage.getItem('taskIdToFocus');
        if (taskIdToFocus) {
            // Limpar o sessionStorage
            sessionStorage.removeItem('taskIdToFocus');
            // Navegar para a aba de tarefas
            setActiveTab('tasks');
            // Passar o taskId para o TasksView
            setInitialTaskId(taskIdToFocus);
        }
    }, [currentProject.id]);
    
    const tabs: Array<{ id: string; label: string }> = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'tasks', label: 'Tarefas & Testes' },
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
            <div className="container mx-auto w-full max-w-7xl px-4 py-4 sm:py-6 non-printable">
                {/* Breadcrumbs */}
                <div className="mb-2">
                    <Breadcrumbs 
                        items={getBreadcrumbItems()}
                        onHomeClick={onBack}
                        className="mb-2"
                    />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    {/* Indicador de status de salvamento (aria-live para leitores de tela) */}
                    {(supabaseAvailable || lastSaveToSupabase === false) && (
                        <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite" aria-atomic="true">
                            {saveStatus === 'saving' && (
                                <div className="flex items-center gap-2 text-info">
                                    <Spinner small />
                                    <span>Salvando...</span>
                                </div>
                            )}
                            {saveStatus === 'saved' && (
                                <div className={`flex items-center gap-2 ${lastSaveToSupabase === false ? 'text-warning' : 'text-success'}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                                    </svg>
                                    <span>{lastSaveToSupabase === false ? 'Salvo localmente (Supabase indisponível)' : 'Salvo'}</span>
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
                            {!supabaseAvailable && lastSaveToSupabase === false && saveStatus === 'idle' && (
                                <div className="flex items-center gap-2 text-warning">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V8h2v6z" fill="currentColor"/>
                                    </svg>
                                    <span>Salvo localmente (Supabase indisponível)</span>
                                </div>
                            )}
                            {supabaseAvailable && lastSaveToSupabase === false && saveStatus === 'idle' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-warning">Salvo localmente (nuvem indisponível)</span>
                                    <button
                                        type="button"
                                        onClick={handleSaveToSupabase}
                                        disabled={isSavingToSupabase}
                                        className="btn btn-sm btn-outline btn-primary"
                                        aria-label="Sincronizar projeto com a nuvem"
                                    >
                                        {isSavingToSupabase ? (
                                            <>
                                                <Spinner small />
                                                <span>Salvando...</span>
                                            </>
                                        ) : (
                                            'Sincronizar com a nuvem'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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
                    className="max-w-4xl mb-4"
                    compact
                />
                
                <div className="border-b border-base-300 pb-3 relative">
                    {/* Indicadores de Scroll para Mobile */}
                    {canScrollLeft && (
                        <div className="absolute left-0 top-0 bottom-3 w-8 bg-gradient-to-r from-base-100 to-transparent pointer-events-none z-10" />
                    )}
                    {canScrollRight && (
                        <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-base-100 to-transparent pointer-events-none z-10" />
                    )}

                    <nav
                        ref={tabsRef}
                        className="tabs tabs-boxed overflow-x-auto w-full flex-nowrap scroll-smooth no-scrollbar"
                        aria-label="Navegação de abas"
                        role="tablist"
                    >
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabClick(tab.id)}
                                className={`tab whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'tab-active' : ''}`}
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
                                    initialTaskId={initialTaskId}
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
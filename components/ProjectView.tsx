import React, { useState, useEffect, Suspense, useRef, useCallback, useMemo } from 'react';
import { Project, TestCase } from '../types';
import { useProjectMetrics } from '../hooks/useProjectMetrics';
import { PrintableReport } from './PrintableReport';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { QADashboard } from './dashboard/QADashboard';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const TasksView = lazyWithRetry(() => import('./tasks/TasksView').then(m => ({ default: m.TasksView })));
const DocumentsView = lazyWithRetry(() => import('./DocumentsView').then(m => ({ default: m.DocumentsView })));
const BusinessRulesManager = lazyWithRetry(() =>
    import('./project/BusinessRulesManager').then((m) => ({ default: m.BusinessRulesManager }))
);
import { PageTransition } from './common/PageTransition';
import { Breadcrumbs } from './common/Breadcrumbs';
import type { BreadcrumbItem } from './common/Breadcrumbs';
import { SectionHeader } from './common/SectionHeader';
import { ConfirmDialog } from './common/ConfirmDialog';
import { useProjectsStore } from '../store/projectsStore';
import { isSupabaseAvailable } from '../services/supabaseService';
import { useAutoSave } from '../hooks/useAutoSave';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import toast from 'react-hot-toast';
import { Spinner } from './common/Spinner';
import { Trash2, CheckCircle2, AlertTriangle, CloudOff } from 'lucide-react';
import { logger } from '../utils/logger';
import { Button } from './common/Button';
import { BackButton } from './common/BackButton';

const TAB_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    tasks: 'Tarefas & Testes',
    documents: 'Documentos',
    businessRules: 'Regras de negócio',
};

export const ProjectView: React.FC<{
  project: Project;
  onUpdateProject: (project: Project) => void | Promise<void>;
  onBack: () => void;
  onDeleteProject?: (projectId: string) => void | Promise<void>;
}> = ({ project, onUpdateProject, onBack, onDeleteProject }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [initialTaskId, setInitialTaskId] = useState<string | undefined>(undefined);
    /** Deep link do Dashboard: filtrar tarefas com casos em certos status (ex.: falhas). */
    const [tasksExecutionNavKey, setTasksExecutionNavKey] = useState(0);
    const [tasksExecutionNavStatuses, setTasksExecutionNavStatuses] = useState<TestCase['status'][]>([]);
    /** Tarefa com detalhes inline ou modal aberto — terceiro nível do breadcrumb. */
    const [breadcrumbTaskId, setBreadcrumbTaskId] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
    const [isDeletingProject, setIsDeletingProject] = useState(false);
    const [isSavingToSupabase, setIsSavingToSupabase] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const { saveProjectToSupabase, getSelectedProject, lastSaveToSupabase } = useProjectsStore();
    const supabaseAvailable = isSupabaseAvailable();
    const isOnline = useOnlineStatus();
    
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
    
    // Auto-save: IndexedDB automático; Supabase apenas pelo botão Salvar (ou sync manual)
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
                    Promise.resolve(
                        onUpdateProjectRef.current({ ...projectRef.current, phases: metrics.newPhases })
                    ).catch((err) => logger.warn('Erro ao atualizar fases do projeto', 'ProjectView', err));
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
            toast('Salvo localmente (Supabase indisponível)', {
                icon: <AlertTriangle className="text-warning" size={20} aria-hidden />,
                duration: 4000,
            });
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
        { id: 'businessRules', label: 'Regras de negócio' },
    ];

    const handleTabClick = useCallback((tabId: string) => {
        setActiveTab(tabId);
    }, []);

    const handleNavigateToTasksWithExecutionStatuses = useCallback((statuses: TestCase['status'][]) => {
        setTasksExecutionNavStatuses(statuses);
        setTasksExecutionNavKey((k) => k + 1);
        setActiveTab('tasks');
    }, []);

    const handleTaskDetailsOpenChange = useCallback((taskId: string, isOpen: boolean) => {
        if (isOpen) setBreadcrumbTaskId(taskId);
        else setBreadcrumbTaskId((prev) => (prev === taskId ? null : prev));
    }, []);

    useEffect(() => {
        if (activeTab !== 'tasks') setBreadcrumbTaskId(null);
    }, [activeTab]);

    const scrollToTaskInList = useCallback((taskId: string) => {
        setActiveTab('tasks');
        setInitialTaskId(taskId);
        const safe = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(taskId) : taskId.replace(/["\\]/g, '');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.querySelector(`[data-task-id="${safe}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        });
    }, []);

    const handleTabKeyDown = useCallback((e: React.KeyboardEvent) => {
        const index = tabs.findIndex(t => t.id === activeTab);
        if (index < 0) return;
        let nextIndex = index;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            nextIndex = (index + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
            e.preventDefault();
            nextIndex = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            nextIndex = tabs.length - 1;
        } else if (e.key >= '1' && e.key <= '9' && Number(e.key) <= tabs.length) {
            e.preventDefault();
            nextIndex = Number(e.key) - 1;
        } else return;
        if (nextIndex !== index) setActiveTab(tabs[nextIndex].id);
    }, [activeTab, tabs]);

    const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [{ label: 'Projetos', onClick: onBack }];

        const onlyProjectHome = activeTab === 'dashboard' && !breadcrumbTaskId;
        if (onlyProjectHome) {
            items.push({ label: currentProject.name });
            return items;
        }

        items.push({ label: currentProject.name, onClick: () => handleTabClick('dashboard') });

        if (activeTab === 'tasks') {
            if (breadcrumbTaskId) {
                const task = currentProject.tasks.find((t) => t.id === breadcrumbTaskId);
                const raw = task?.title?.trim() || 'Tarefa';
                const label = raw.length > 56 ? `${raw.slice(0, 53)}…` : raw;
                items.push({ label: TAB_LABELS.tasks, onClick: () => handleTabClick('tasks') });
                items.push({ label });
            } else {
                items.push({ label: TAB_LABELS.tasks });
            }
        } else if (activeTab === 'documents') {
            items.push({ label: TAB_LABELS.documents });
        } else if (activeTab === 'businessRules') {
            items.push({ label: TAB_LABELS.businessRules });
        }

        return items;
    }, [onBack, currentProject.name, currentProject.tasks, activeTab, breadcrumbTaskId, handleTabClick]);

    return (
        <>
            <div className="w-full max-w-full mx-auto px-4 sm:px-8 py-4 sm:py-6 non-printable">
                <div
                    className="sticky z-40 -mx-4 mb-4 min-w-0 max-w-full border-b border-base-200/50 bg-base-100/70 px-4 py-2 backdrop-blur-md sm:-mx-8 sm:px-8"
                    style={{ top: 'var(--app-header-h, 4.5rem)' }}
                >
                    <div className="mb-1.5 flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
                        <BackButton
                            className="self-start -ml-1 sm:shrink-0"
                            onClick={onBack}
                            aria-label="Voltar para a lista de projetos"
                        />
                        {(supabaseAvailable || lastSaveToSupabase === false) && (
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm sm:flex-initial" role="status" aria-live="polite" aria-atomic="true">
                                {saveStatus === 'saving' && (
                                    <div className="flex items-center gap-2 text-info">
                                        <Spinner small />
                                        <span>Salvando...</span>
                                    </div>
                                )}
                                {saveStatus === 'saved' && (
                                    <div className={`flex items-center gap-2 ${lastSaveToSupabase === false ? 'text-warning' : 'text-success'}`}>
                                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                                        <span>{lastSaveToSupabase === false ? 'Salvo localmente (Supabase indisponível)' : 'Salvo'}</span>
                                    </div>
                                )}
                                {saveStatus === 'error' && (
                                    <div className="flex items-center gap-2 text-error">
                                        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                                        <span>Erro ao salvar</span>
                                    </div>
                                )}
                                {!supabaseAvailable && lastSaveToSupabase === false && saveStatus === 'idle' && (
                                    <div className="flex items-center gap-2 text-warning">
                                        <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
                                        <span>Salvo localmente (Supabase indisponível)</span>
                                    </div>
                                )}
                                {supabaseAvailable && lastSaveToSupabase === false && saveStatus === 'idle' && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-warning">Salvo localmente (nuvem indisponível)</span>
                                        <button
                                            type="button"
                                            onClick={handleSaveToSupabase}
                                            disabled={isSavingToSupabase || !isOnline}
                                            className="btn btn-sm btn-outline btn-primary min-h-[44px] sm:min-h-0"
                                            aria-label="Sincronizar projeto com a nuvem"
                                            title={!isOnline ? 'É necessário estar online para sincronizar com a nuvem.' : undefined}
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

                    <div className="mb-2 flex min-w-0 w-full max-w-full flex-col gap-2 xl:flex-row xl:items-start xl:gap-5">
                        <Breadcrumbs
                            items={breadcrumbItems}
                            showHome={false}
                            align="left"
                            className="w-full min-w-0 shrink-0 xl:w-auto xl:max-w-md 2xl:max-w-lg"
                        />
                        <SectionHeader
                            as="h1"
                            align="left"
                            fullWidth
                            eyebrow={currentProject.settings?.jiraProjectKey ? `Jira: ${currentProject.settings.jiraProjectKey}` : 'Projeto'}
                            title={<span className="break-words">{currentProject.name}</span>}
                            description={
                                currentProject.description
                                    ? <span className="break-words">{currentProject.description}</span>
                                    : 'Sem descrição.'
                            }
                            className="min-w-0 flex-1 xl:pt-0"
                            compact
                        />
                    </div>
                    {onDeleteProject && (
                        <div className="mb-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowDeleteProjectConfirm(true)}
                                className="btn btn-ghost btn-sm min-h-[44px] gap-2 text-error hover:bg-error/10 sm:min-h-0"
                                aria-label={`Excluir projeto ${currentProject.name}`}
                            >
                                <Trash2 className="h-4 w-4" aria-hidden />
                                Excluir projeto
                            </button>
                        </div>
                    )}
                    <div className="relative border-b border-base-200/50 pb-2">
                    {/* Indicadores de Scroll para Mobile */}
                    {canScrollLeft && (
                        <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-base-100 to-transparent pointer-events-none z-10" />
                    )}
                    {canScrollRight && (
                        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-base-100 to-transparent pointer-events-none z-10" />
                    )}

                    <nav
                        ref={tabsRef}
                        className="tabs tabs-boxed overflow-x-auto w-full flex-nowrap scroll-smooth no-scrollbar snap-x snap-mandatory"
                        aria-label="Navegação de abas"
                        role="tablist"
                    >
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabClick(tab.id)}
                                onKeyDown={handleTabKeyDown}
                                className={`tab whitespace-nowrap flex-shrink-0 snap-start min-h-[44px] sm:min-h-0 ${activeTab === tab.id ? 'tab-active' : ''}`}
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
                                    onNavigateToTasksWithExecutionStatuses={handleNavigateToTasksWithExecutionStatuses}
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
                                    onTaskDetailsOpenChange={handleTaskDetailsOpenChange}
                                    tasksExecutionNavKey={tasksExecutionNavKey}
                                    tasksExecutionNavStatuses={tasksExecutionNavStatuses}
                                />
                            </Suspense>
                            </section>
                        )}
                        {activeTab === 'documents' && (
                            <section id="tab-panel-documents" role="tabpanel" aria-labelledby="tab-documents">
                            <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
                                <DocumentsView project={currentProject} onUpdateProject={onUpdateProject} onNavigateToTab={handleTabClick} />
                            </Suspense>
                            </section>
                        )}
                        {activeTab === 'businessRules' && (
                            <section id="tab-panel-business-rules" role="tabpanel" aria-labelledby="tab-businessRules">
                                <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                                    <BusinessRulesManager project={currentProject} onUpdateProject={onUpdateProject} />
                                </Suspense>
                            </section>
                        )}
                    </PageTransition>
                </div>
            </div>
            {onDeleteProject && (
                <ConfirmDialog
                    isOpen={showDeleteProjectConfirm}
                    onClose={() => setShowDeleteProjectConfirm(false)}
                    onConfirm={async () => {
                        setIsDeletingProject(true);
                        try {
                            await onDeleteProject(currentProject.id);
                            setShowDeleteProjectConfirm(false);
                        } finally {
                            setIsDeletingProject(false);
                        }
                    }}
                    title={`Excluir "${currentProject.name}"`}
                    message="Você tem certeza que deseja excluir este projeto? Todos os dados associados (tarefas, documentos, análises) serão perdidos permanentemente. Esta ação não pode ser desfeita."
                    confirmText="Sim, Excluir"
                    cancelText="Cancelar"
                    variant="danger"
                    isLoading={isDeletingProject}
                />
            )}
            {isPrinting && <PrintableReport project={currentProject} metrics={metrics} />}
        </>
    );
};
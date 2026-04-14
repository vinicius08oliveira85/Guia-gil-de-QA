import React, { useMemo, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '../types';
import { ConfirmDialog } from './common/ConfirmDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, Search, AlertTriangle, Bug, Loader2 } from 'lucide-react';
import { ProjectCard } from './common/ProjectCard';
import { ConsolidatedMetrics } from './common/ConsolidatedMetrics';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useProjectsStore } from '../store/projectsStore';
import { EmptyState } from './common/EmptyState';
import { isSupabaseAvailable } from '../services/supabaseService';
import { CreateProjectModal } from './CreateProjectModal';
import { calculateProjectMetrics } from '../hooks/useProjectMetrics';
import { cn } from '../utils/cn';
import {
  computeWorkspaceTestMetrics,
  computeTaskWorkflowBuckets,
  computeTaskDonePercent,
  computeProjectsWithTestExecutionAlerts,
} from '../utils/workspaceAnalytics';
import { WorkspaceDaisyStats } from './projectsDashboard/WorkspaceDaisyStats';
import { TaskStatusDistributionBar } from './projectsDashboard/TaskStatusDistributionBar';
import { ProjectsTestHealthWidget } from './projectsDashboard/ProjectsTestHealthWidget';

type QuickFilter = 'all' | 'withBugs' | 'needsAttention';

/** Projeto precisa de atenção: 2+ bugs abertos ou taxa de sucesso < 70% (com testes executados). */
function projectNeedsAttention(project: Project): boolean {
  const m = calculateProjectMetrics(project);
  return m.openVsClosedBugs.open >= 2 || (m.executedTestCases > 0 && m.testPassRate < 70);
}

/** Projeto tem pelo menos 1 bug aberto. */
function projectHasOpenBugs(project: Project): boolean {
  return calculateProjectMetrics(project).openVsClosedBugs.open > 0;
}

export const ProjectsDashboard: React.FC<{
    projects: Project[];
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string, description: string, templateId?: string) => Promise<void>;
    onDeleteProject: (id: string) => Promise<void>;
    onOpenSettings?: () => void;
}> = ({ projects, onSelectProject, onCreateProject, onDeleteProject, onOpenSettings }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [retryCooldownUntil, setRetryCooldownUntil] = useState<number | null>(null);
    const [syncBannerDismissed, setSyncBannerDismissed] = useState(false);
    const [sortBy, setSortBy] = useLocalStorage<'name' | 'updatedAt'>('projectsSortBy', 'name');
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
    // Visualização sempre em grade - removido viewMode
    // Ordenação fixa por nome - removido sortBy
    // Filtros removidos - removido selectedTags e showTagFilter
    // Esquema API removido - removido showSchemaModal
    
    const isMobile = useIsMobile();
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; project: Project | null }>({
        isOpen: false,
        project: null,
    });
    const [isDeletingProject, setIsDeletingProject] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();
    const { supabaseLoadFailed, supabaseLoadError, loadProjects, isLoading, lastSaveToSupabase } = useProjectsStore();

    // Função para navegar para uma tarefa específica
    const handleNavigateToTask = useCallback((projectId: string, taskId: string) => {
        // Armazenar taskId no sessionStorage para ser lido pelo ProjectView
        sessionStorage.setItem('taskIdToFocus', taskId);
        // Selecionar o projeto (isso abrirá o ProjectView)
        onSelectProject(projectId);
    }, [onSelectProject]);

    // Escutar eventos para abrir modal de criação
    React.useEffect(() => {
        const handleOpenModal = () => setIsCreating(true);
        window.addEventListener('open-create-project-modal', handleOpenModal);
        return () => {
            window.removeEventListener('open-create-project-modal', handleOpenModal);
        };
    }, []);

    // Quando a sincronização concluir com sucesso, limpar o "dismiss" do banner para que ele volte a aparecer se falhar de novo
    React.useEffect(() => {
        if (!supabaseLoadFailed) setSyncBannerDismissed(false);
    }, [supabaseLoadFailed, isLoading]);

    const handleDelete = async () => {
        if (!deleteModalState.project) return;
        setIsDeletingProject(true);
        try {
            await onDeleteProject(deleteModalState.project.id);
            setDeleteModalState({ isOpen: false, project: null });
        } finally {
            setIsDeletingProject(false);
        }
    };
    
    const openDeleteModal = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card's onClick from firing
        setDeleteModalState({ isOpen: true, project });
    };


    /** Erros que merecem destaque vermelho: 5xx, timeout e cold start (mensagem local-first). */
    const isSyncServerError = Boolean(
        supabaseLoadError &&
            (/\b(500|502|503|504|522|Erro HTTP)\b/i.test(supabaseLoadError) ||
                /timeout|expirou|demorou demais|cold start|plano gratuito|banco de dados está iniciando|service unavailable|indisponível/i.test(
                    supabaseLoadError
                ))
    );
    const retryButtonDisabled = isLoading || (retryCooldownUntil != null && Date.now() < retryCooldownUntil);

    const handleRetrySync = useCallback(() => {
        setRetryCooldownUntil(Date.now() + 2500);
        loadProjects();
    }, [loadProjects]);

    const handleSortByChange = useCallback((value: 'name' | 'updatedAt') => {
        setSortBy(value);
    }, [setSortBy]);

    const sortedProjects = useMemo(() => {
        const list = [...projects];
        if (sortBy === 'name') {
            return list.sort((a, b) => a.name.localeCompare(b.name));
        }
        return list.sort((a, b) => {
            const aDate = a.updatedAt || a.createdAt || '';
            const bDate = b.updatedAt || b.createdAt || '';
            return bDate.localeCompare(aDate);
        });
    }, [projects, sortBy]);

    const filteredProjects = useMemo(() => {
        if (quickFilter === 'withBugs') return sortedProjects.filter(projectHasOpenBugs);
        if (quickFilter === 'needsAttention') return sortedProjects.filter(projectNeedsAttention);
        return sortedProjects;
    }, [sortedProjects, quickFilter]);

    const lastActivity = useMemo(() => {
        if (projects.length === 0) return null;
        const dates = projects.map(p => new Date(p.updatedAt || p.createdAt || 0).getTime());
        return new Date(Math.max(...dates));
    }, [projects]);

    const lastActivityText = useMemo(() => {
        if (!lastActivity) return null;
        try {
            return formatDistanceToNow(lastActivity, { addSuffix: true, locale: ptBR });
        } catch {
            return null;
        }
    }, [lastActivity]);

    const projectsNeedingAttention = useMemo(
        () => projects.filter(projectNeedsAttention),
        [projects]
    );
    const projectsWithBugs = useMemo(() => projects.filter(projectHasOpenBugs), [projects]);

    const workspaceTestMetrics = useMemo(() => computeWorkspaceTestMetrics(projects), [projects]);
    const taskWorkflowBuckets = useMemo(() => computeTaskWorkflowBuckets(projects), [projects]);
    const taskDonePercentGlobal = useMemo(() => computeTaskDonePercent(projects), [projects]);
    const projectsTestAlertList = useMemo(() => computeProjectsWithTestExecutionAlerts(projects), [projects]);

    return (
        <>
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-base-100 to-base-200/60">
            <div className="w-full max-w-full mx-auto px-4 sm:px-8 py-4 sm:py-6">
                {/* Header */}
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 flex-wrap">
                            <span className="badge badge-outline badge-sm border-primary/30 text-primary bg-primary/10">
                                Workspace
                            </span>
                            <span className="text-sm text-base-content/60 hidden sm:inline">
                                {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}
                            </span>
                            {projects.length > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-base-content/60">Ordenar:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => handleSortByChange(e.target.value as 'name' | 'updatedAt')}
                                        className="select select-bordered select-sm py-1 min-h-[44px] sm:min-h-8 sm:h-8 text-xs rounded-lg"
                                        aria-label="Ordenar projetos por"
                                    >
                                        <option value="name">Nome</option>
                                        <option value="updatedAt">Última atualização</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-base-content">
                                Meus Projetos
                            </h1>
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
                                className="btn btn-ghost btn-sm btn-circle min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                                aria-label="Abrir busca (Ctrl+K)"
                            >
                                <Search className="w-4 h-4" aria-hidden />
                            </button>
                        </div>
                        <p className="text-sm text-base-content/70 max-w-full">
                            Crie, organize e acompanhe o QA por projeto — templates, métricas e integrações opcionais quando fizer sentido.
                        </p>
                        {/* Indicadores: última atividade + projetos com atenção */}
                        {projects.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                                {lastActivityText && (
                                    <span className="text-base-content/60" title="Última alteração em qualquer projeto">
                                        Última atividade: {lastActivityText}
                                    </span>
                                )}
                                {projectsNeedingAttention.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setQuickFilter(quickFilter === 'needsAttention' ? 'all' : 'needsAttention')}
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors',
                                            quickFilter === 'needsAttention'
                                                ? 'bg-warning/20 text-warning border border-warning/40'
                                                : 'bg-warning/10 text-warning-content border border-warning/20 hover:bg-warning/20'
                                        )}
                                        aria-pressed={quickFilter === 'needsAttention'}
                                        aria-label={`${projectsNeedingAttention.length} projetos precisam de atenção. Clique para filtrar.`}
                                    >
                                        <AlertTriangle className="w-4 h-4" aria-hidden />
                                        {projectsNeedingAttention.length} {projectsNeedingAttention.length === 1 ? 'projeto com atenção' : 'projetos com atenção'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                        <button
                            type="button"
                            onClick={() => setIsCreating(true)}
                            className="btn btn-primary btn-sm gap-1.5 rounded-full"
                        >
                            <Plus className="w-4 h-4" aria-hidden />
                            Novo Projeto
                        </button>
                    </div>
                </div>

                {projects.length > 0 && (
                    <div className="space-y-4 mb-6">
                        <WorkspaceDaisyStats
                            projectCount={projects.length}
                            testSuccessPercent={workspaceTestMetrics.testSuccessPercent}
                            taskDonePercent={taskDonePercentGlobal}
                            lastSaveToSupabase={lastSaveToSupabase}
                            supabaseAvailable={isSupabaseAvailable()}
                            supabaseLoadFailed={supabaseLoadFailed}
                        />
                        <p className="text-xs text-base-content/60 -mt-1 px-1">
                            Eficiência de execução (casos com status ≠ Não executado):{' '}
                            <strong className="text-base-content">
                                {workspaceTestMetrics.executionEfficiencyPercent}%
                            </strong>
                            {workspaceTestMetrics.totalTestCases > 0 && (
                                <span className="text-base-content/50">
                                    {' '}
                                    · {workspaceTestMetrics.executedTestCases}/{workspaceTestMetrics.totalTestCases}{' '}
                                    casos
                                </span>
                            )}
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <TaskStatusDistributionBar buckets={taskWorkflowBuckets} />
                            <ProjectsTestHealthWidget
                                alertProjects={projectsTestAlertList}
                                onSelectProject={onSelectProject}
                            />
                        </div>
                    </div>
                )}

                {projects.length > 0 && <ConsolidatedMetrics projects={projects} />}

                {/* Filtros rápidos */}
                {projects.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Filtrar projetos">
                        <button
                            type="button"
                            onClick={() => setQuickFilter('all')}
                            className={cn(
                                'btn btn-sm rounded-lg min-h-[44px] sm:min-h-8',
                                quickFilter === 'all' ? 'btn-primary' : 'btn-ghost btn-outline'
                            )}
                            aria-pressed={quickFilter === 'all'}
                        >
                            Todos
                        </button>
                        {projectsWithBugs.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setQuickFilter(quickFilter === 'withBugs' ? 'all' : 'withBugs')}
                                className={cn(
                                    'btn btn-sm rounded-lg inline-flex items-center gap-1 min-h-[44px] sm:min-h-8',
                                    quickFilter === 'withBugs' ? 'btn-primary' : 'btn-ghost btn-outline'
                                )}
                                aria-pressed={quickFilter === 'withBugs'}
                            >
                                <Bug className="w-3.5 h-3.5" aria-hidden />
                                Com bugs ({projectsWithBugs.length})
                            </button>
                        )}
                        {projectsNeedingAttention.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setQuickFilter(quickFilter === 'needsAttention' ? 'all' : 'needsAttention')}
                                className={cn(
                                    'btn btn-sm rounded-lg inline-flex items-center gap-1 min-h-[44px] sm:min-h-8',
                                    quickFilter === 'needsAttention' ? 'btn-primary' : 'btn-ghost btn-outline'
                                )}
                                aria-pressed={quickFilter === 'needsAttention'}
                            >
                                <AlertTriangle className="w-3.5 h-3.5" aria-hidden />
                                Precisa de atenção ({projectsNeedingAttention.length})
                            </button>
                        )}
                    </div>
                )}

                {/* Card Precisa de atenção: lista de projetos em risco */}
                {projects.length > 0 && projectsNeedingAttention.length > 0 && (
                    <section
                        className="mb-6 p-4 rounded-2xl bg-warning/10 border border-warning/30"
                        aria-labelledby="needs-attention-heading"
                    >
                        <h2 id="needs-attention-heading" className="text-sm font-bold text-warning-content/90 uppercase tracking-widest flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4" aria-hidden />
                            Precisa de atenção
                        </h2>
                        <p className="text-sm text-base-content/80 mb-3">
                            {projectsNeedingAttention.length === 1
                                ? '1 projeto com bugs em destaque ou taxa de sucesso baixa.'
                                : `${projectsNeedingAttention.length} projetos com bugs em destaque ou taxa de sucesso baixa.`}
                        </p>
                        <ul className="flex flex-wrap gap-2">
                            {projectsNeedingAttention.map(p => (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelectProject(p.id)}
                                        className="text-left px-3 py-2 rounded-xl bg-base-100 border border-warning/20 hover:border-warning/50 hover:bg-warning/5 transition-colors text-sm font-medium text-base-content"
                                    >
                                        {p.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Com projetos no workspace: banner não depende do filtro (evita sumir quando o filtro zera a lista) */}
                {supabaseLoadFailed && projects.length > 0 && !syncBannerDismissed && (
                    <div
                        className={`mb-4 p-3 rounded-lg text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isSyncServerError ? 'bg-error/10 text-error-content border border-error/30' : 'bg-warning/10 text-warning-content border border-warning/30'}`}
                        role="alert"
                    >
                        <div className="flex flex-col gap-1 min-w-0">
                            {supabaseLoadError ? (
                                <>
                                    <span className="font-medium">Sincronização indisponível:</span>
                                    <span className="break-words">{supabaseLoadError}</span>
                                </>
                            ) : (
                                <span>Sincronização com a nuvem indisponível no momento.</span>
                            )}
                            <span className="text-base-content/80 text-xs mt-0.5">
                                Seus projetos locais continuam disponíveis. Tente novamente mais tarde ou verifique em Configurações.
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setSyncBannerDismissed(true)}
                                className="px-2 py-1 rounded text-xs font-medium opacity-80 hover:opacity-100"
                            >
                                Dispensar
                            </button>
                            <button
                                type="button"
                                onClick={handleRetrySync}
                                disabled={retryButtonDisabled}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${isSyncServerError ? 'bg-error/20 hover:bg-error/30 border border-error/40 text-error-content' : 'bg-warning/20 hover:bg-warning/30 border border-warning/40 text-warning-content'}`}
                            >
                                {retryButtonDisabled ? 'Aguarde…' : 'Tentar novamente'}
                            </button>
                        </div>
                    </div>
                )}

            <CreateProjectModal
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                onCreateProject={onCreateProject}
                onOpenSettings={onOpenSettings}
                onProjectImported={(project) => onSelectProject(project.id)}
            />

<ConfirmDialog
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ isOpen: false, project: null })}
                onConfirm={handleDelete}
                title={`Excluir "${deleteModalState.project?.name}"`}
                message="Você tem certeza que deseja excluir este projeto? Todos os dados associados (tarefas, documentos, análises) serão perdidos permanentemente. Esta ação não pode ser desfeita."
                confirmText="Sim, Excluir"
                cancelText="Cancelar"
                variant="danger"
                isLoading={isDeletingProject}
            />

            <div className="mt-8">
                {filteredProjects.length > 0 ? (
                    <div className="space-y-4" role="list" aria-label="Lista de projetos">
                        {filteredProjects.map((p, index) => (
                            <div
                                key={p.id}
                                role="listitem"
                                aria-posinset={index + 1}
                                aria-setsize={filteredProjects.length}
                            >
                                <ProjectCard
                                    project={p}
                                    onSelect={() => onSelectProject(p.id)}
                                    onDelete={() => setDeleteModalState({ isOpen: true, project: p })}
                                    onTaskClick={(taskId) => handleNavigateToTask(p.id, taskId)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Sem projetos no workspace: aviso de sync aqui (com lista vazia não há banner no topo) */}
                        {supabaseLoadFailed && projects.length === 0 && (
                            <div
                                className={`mb-4 p-3 rounded-lg text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isSyncServerError ? 'bg-error/10 text-error-content border border-error/30' : 'bg-warning/10 text-warning-content border border-warning/30'}`}
                                role="alert"
                            >
                                <div className="flex flex-col gap-1 min-w-0">
                                    {supabaseLoadError ? (
                                        <>
                                            <span className="font-medium">Sincronização indisponível:</span>
                                            <span className="break-words">{supabaseLoadError}</span>
                                        </>
                                    ) : (
                                        <span>Sincronização com a nuvem indisponível no momento. Se você já tinha projetos, tente novamente ou verifique a conexão.</span>
                                    )}
                                    <span className="text-base-content/80 text-xs mt-0.5">
                                        Seus projetos locais continuam disponíveis. Tente novamente mais tarde ou verifique em Configurações.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRetrySync}
                                    disabled={retryButtonDisabled}
                                    className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${isSyncServerError ? 'bg-error/20 hover:bg-error/30 border border-error/40 text-error-content' : 'bg-warning/20 hover:bg-warning/30 border border-warning/40 text-warning-content'}`}
                                >
                                    {retryButtonDisabled ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin inline-block mr-1" aria-hidden />
                                        {isLoading ? 'Carregando…' : 'Aguarde…'}
                                    </>
                                ) : 'Tentar novamente'}
                                </button>
                            </div>
                        )}
                        {projects.length === 0 ? (
                        <EmptyState
                            icon="🚀"
                            title="Nenhum projeto ainda"
                            description="Crie um projeto para organizar tarefas, testes, documentos e métricas em um fluxo único."
                            action={{
                                label: "Criar Primeiro Projeto",
                                onClick: () => setIsCreating(true),
                                variant: 'primary'
                            }}
                            tip="Você pode criar um projeto do zero, usar um template ou importar do Jira se estiver configurado."
                        />
                        ) : (
                            <div
                                className="rounded-2xl border border-base-300/80 bg-base-100 p-4 sm:p-5 text-center"
                                role="status"
                                aria-live="polite"
                            >
                                <p className="text-sm text-base-content/80 mb-4 max-w-full mx-auto">
                                    {quickFilter === 'withBugs'
                                        ? 'Nenhum projeto com bugs abertos corresponde a este filtro.'
                                        : 'Nenhum projeto corresponde a "Precisa de atenção" com os critérios atuais.'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setQuickFilter('all')}
                                    className="btn btn-outline btn-sm rounded-lg"
                                >
                                    Mostrar todos os projetos
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            </div>
        </div>

</>
    );
};
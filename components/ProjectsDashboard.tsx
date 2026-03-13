import React, { useMemo, useState, useCallback } from 'react';
import { Project } from '../types';
import { ConfirmDialog } from './common/ConfirmDialog';
import { useIsMobile } from '../hooks/useIsMobile';
import { Badge } from './common/Badge';
import { ProgressIndicator } from './common/ProgressIndicator';
import { Plus, Search } from 'lucide-react';
import { ProjectCard } from './common/ProjectCard';
import { ConsolidatedMetrics } from './common/ConsolidatedMetrics';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useProjectsStore } from '../store/projectsStore';
import { EmptyState } from './common/EmptyState';
import { isSupabaseAvailable } from '../services/supabaseService';
import { CreateProjectModal } from './CreateProjectModal';

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
    const [sortBy, setSortBy] = useState<'name' | 'updatedAt'>(() => {
        const v = localStorage.getItem('projectsSortBy');
        return v === 'updatedAt' ? 'updatedAt' : 'name';
    });
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
    const { supabaseLoadFailed, supabaseLoadError, loadProjects, isLoading } = useProjectsStore();

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


    const isSyncServerError = Boolean(
        supabaseLoadError && /\b(500|502|503|504|Erro HTTP)/i.test(supabaseLoadError)
    );
    const retryButtonDisabled = isLoading || (retryCooldownUntil != null && Date.now() < retryCooldownUntil);

    const handleRetrySync = useCallback(() => {
        setRetryCooldownUntil(Date.now() + 2500);
        loadProjects();
    }, [loadProjects]);

    const handleSortByChange = useCallback((value: 'name' | 'updatedAt') => {
        setSortBy(value);
        localStorage.setItem('projectsSortBy', value);
    }, []);

    const filteredProjects = useMemo(() => {
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


    return (
        <>
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-base-100 to-base-200/60">
            <div className="container mx-auto w-full max-w-7xl px-4 py-4 sm:py-6">
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
                                        className="select select-bordered select-sm py-1 h-8 min-h-8 text-xs rounded-lg"
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
                                className="btn btn-ghost btn-sm btn-circle"
                                aria-label="Abrir busca (Ctrl+K)"
                            >
                                <Search className="w-4 h-4" aria-hidden />
                            </button>
                        </div>
                        <p className="text-sm text-base-content/70 max-w-2xl">
                            Crie, organize e acompanhe o QA por projeto — templates, métricas e integrações opcionais quando fizer sentido.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                        {/* Botões movidos para o Header */}
                    </div>
                </div>

                {projects.length > 0 && <ConsolidatedMetrics projects={projects} />}

                {supabaseLoadFailed && filteredProjects.length > 0 && !syncBannerDismissed && (
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
                        {supabaseLoadFailed && (
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
                                    {retryButtonDisabled ? (isLoading ? 'Carregando…' : 'Aguarde…') : 'Tentar novamente'}
                                </button>
                            </div>
                        )}
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
                    </>
                )}
            </div>
            </div>
        </div>

</>
    );
};
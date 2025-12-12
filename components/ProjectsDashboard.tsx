import React, { useMemo, useState } from 'react';
import { Project, JiraTask } from '../types';
import { Modal } from './common/Modal';
import { Card } from './common/Card';
import { ConfirmDialog } from './common/ConfirmDialog';
import { ProjectTemplateSelector } from './common/ProjectTemplateSelector';
import { TrashIcon } from './common/Icons';
import { useIsMobile } from '../hooks/useIsMobile';
import { Badge } from './common/Badge';
import { ProgressIndicator } from './common/ProgressIndicator';
import { ArrowRight, Plus, LayoutGrid, Cloud } from 'lucide-react';

export const ProjectsDashboard: React.FC<{
    projects: Project[];
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string, description: string, templateId?: string) => Promise<void>;
    onDeleteProject: (id: string) => Promise<void>;
    onComparisonClick?: () => void;
    onSyncSupabase?: () => Promise<void>;
}> = ({ projects, onSelectProject, onCreateProject, onDeleteProject, onComparisonClick, onSyncSupabase }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
    const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
    const [showMobileActions, setShowMobileActions] = useState(false);
    // Visualização sempre em grade - removido viewMode
    // Ordenação fixa por nome - removido sortBy
    // Filtros removidos - removido selectedTags e showTagFilter
    // Esquema API removido - removido showSchemaModal
    
    const isMobile = useIsMobile();
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; project: Project | null }>({
        isOpen: false,
        project: null,
    });

    // Filtros por tags removidos

    const handleCreate = async () => {
        if (newName.trim()) {
            await onCreateProject(newName.trim(), newDesc.trim(), selectedTemplate);
            setIsCreating(false);
            setNewName('');
            setNewDesc('');
            setSelectedTemplate(undefined);
        }
    };

    const handleDelete = async () => {
        if (deleteModalState.project) {
            await onDeleteProject(deleteModalState.project.id);
            setDeleteModalState({ isOpen: false, project: null });
        }
    };
    
    const openDeleteModal = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card's onClick from firing
        setDeleteModalState({ isOpen: true, project });
    };

    const handleSyncSupabase = async () => {
        if (!onSyncSupabase) return;
        setIsSyncingSupabase(true);
        try {
            await onSyncSupabase();
        } finally {
            setIsSyncingSupabase(false);
        }
    };

    const calculateProgress = (tasks: JiraTask[]) => {
        if (!tasks || tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.status === 'Done').length;
        return completed;
    };

    // Projetos ordenados por nome (fixo)
    const filteredProjects = useMemo(() => {
        return [...projects].sort((a, b) => a.name.localeCompare(b.name));
    }, [projects]);

    // Quick actions simplificadas - apenas Comparar e Sync Supabase
    const quickActions = useMemo(() => {
        const actions: Array<{ id: string; label: string; icon: string; onClick: () => void | Promise<void> }> = [];

        if (onComparisonClick && projects.length > 1) {
            actions.push({
                id: 'compare',
                label: 'Comparar Projetos',
                icon: '📊',
                onClick: onComparisonClick
            });
        }

        if (onSyncSupabase) {
            actions.push({
                id: 'supabase',
                label: 'Carregar do Supabase',
                icon: '☁️',
                onClick: handleSyncSupabase
            });
        }

        return actions;
    }, [handleSyncSupabase, onComparisonClick, onSyncSupabase, projects.length]);

    const handleMobileAction = (action: () => void | Promise<void>) => {
        setShowMobileActions(false);
        setTimeout(() => action(), 150);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-base-100 to-base-200/60">
            <div className="container mx-auto w-full max-w-7xl px-4 py-8 sm:py-10">
                {/* Header (sem hero, mas com padrão visual da Landing) */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2">
                            <span className="badge badge-outline px-4 py-3 border-primary/30 text-primary bg-primary/10">
                                Workspace
                            </span>
                            <span className="text-sm text-base-content/60 hidden sm:inline">
                                {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Meus Projetos
                        </h1>
                        <p className="text-base-content/70 max-w-2xl">
                            Crie, organize e acompanhe o progresso do QA por projeto — com templates, métricas e integrações opcionais.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('show-landing'))}
                            className="btn btn-ghost btn-sm rounded-full"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>Ver Landing</span>
                        </button>

                        {isMobile ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(true)}
                                    className="btn btn-primary btn-sm rounded-full"
                                    data-onboarding="create-project"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Novo</span>
                                </button>

                                {quickActions.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowMobileActions(true)}
                                        className="btn btn-outline btn-sm rounded-full"
                                        aria-label="Abrir ações rápidas"
                                        aria-expanded={showMobileActions}
                                    >
                                        Ações
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(true)}
                                    className="btn btn-primary btn-sm rounded-full"
                                    data-onboarding="create-project"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Novo Projeto</span>
                                </button>

                                {onComparisonClick && projects.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={onComparisonClick}
                                        className="btn btn-outline btn-sm rounded-full"
                                    >
                                        Comparar
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSyncSupabase}
                                    className="btn btn-outline btn-sm rounded-full"
                                    disabled={isSyncingSupabase || !onSyncSupabase}
                                    title={!onSyncSupabase ? 'Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.' : 'Sincronizar projetos do Supabase'}
                                >
                                    <Cloud className="w-4 h-4" />
                                    <span>{isSyncingSupabase ? 'Sincronizando…' : 'Sync Supabase'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

            <Modal
                isOpen={showMobileActions}
                onClose={() => setShowMobileActions(false)}
                title="Ações rápidas"
                size="sm"
            >
                <div className="space-y-2">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleMobileAction(action.onClick)}
                            type="button"
                            className="btn btn-outline w-full justify-start gap-3"
                        >
                            <span className="text-lg" aria-hidden="true">{action.icon}</span>
                            <span>{action.label}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => handleMobileAction(() => setIsCreating(true))}
                        type="button"
                        className="btn btn-primary w-full"
                    >
                        Criar Projeto
                    </button>
                </div>
            </Modal>


            <Modal isOpen={isCreating} onClose={() => {
                setIsCreating(false);
                setSelectedTemplate(undefined);
                setShowTemplates(false);
            }} title="Criar Novo Projeto">
                 <div className="space-y-4">
                    {!showTemplates ? (
                        <>
                            <div>
                                <button
                                    onClick={() => setShowTemplates(true)}
                                    type="button"
                                    className="w-full rounded-[var(--rounded-box)] border-2 border-dashed border-base-300 p-4 text-left transition-colors hover:border-primary/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl" aria-hidden="true">📋</span>
                                        <div className="space-y-0.5">
                                            <p className="font-semibold">Usar Template</p>
                                            <p className="text-sm text-base-content/70">
                                                Recomendado para começar mais rápido com um checklist inicial.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="grid gap-4">
                                <label className="form-control w-full">
                                    <div className="label">
                                        <span className="label-text">Nome do Projeto</span>
                                    </div>
                                    <input
                                        id="proj-name"
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="input input-bordered w-full"
                                        placeholder="Ex: E-commerce App"
                                    />
                                </label>

                                <label className="form-control w-full">
                                    <div className="label">
                                        <span className="label-text">Descrição</span>
                                    </div>
                                    <textarea
                                        id="proj-desc"
                                        value={newDesc}
                                        onChange={e => setNewDesc(e.target.value)}
                                        rows={3}
                                        className="textarea textarea-bordered w-full"
                                        placeholder="Breve descrição do projeto..."
                                    />
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="btn btn-ghost"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    className="btn btn-primary"
                                    disabled={!newName.trim()}
                                >
                                    Criar
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={() => setShowTemplates(false)}
                                className="btn btn-ghost btn-sm self-start"
                            >
                                ← Voltar
                            </button>
                            <ProjectTemplateSelector
                                onSelectTemplate={(templateId) => {
                                    setSelectedTemplate(templateId);
                                    setShowTemplates(false);
                                }}
                                onClose={() => setShowTemplates(false)}
                            />
                            {selectedTemplate && (
                                <div className="alert alert-success">
                                    <span>Template selecionado! Preencha os dados abaixo.</span>
                                </div>
                            )}

                            <div className="grid gap-4">
                                <label className="form-control w-full">
                                    <div className="label">
                                        <span className="label-text">Nome do Projeto</span>
                                    </div>
                                    <input
                                        id="proj-name-template"
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="input input-bordered w-full"
                                    />
                                </label>

                                <label className="form-control w-full">
                                    <div className="label">
                                        <span className="label-text">Descrição</span>
                                    </div>
                                    <textarea
                                        id="proj-desc-template"
                                        value={newDesc}
                                        onChange={e => setNewDesc(e.target.value)}
                                        rows={3}
                                        className="textarea textarea-bordered w-full"
                                    />
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setSelectedTemplate(undefined);
                                        setShowTemplates(false);
                                    }}
                                    className="btn btn-ghost"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    className="btn btn-primary"
                                    disabled={!newName.trim()}
                                >
                                    Criar com Template
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
            
             <ConfirmDialog
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ isOpen: false, project: null })}
                onConfirm={handleDelete}
                title={`Excluir "${deleteModalState.project?.name}"`}
                message="Você tem certeza que deseja excluir este projeto? Todos os dados associados (tarefas, documentos, análises) serão perdidos permanentemente. Esta ação não pode ser desfeita."
                confirmText="Sim, Excluir"
                cancelText="Cancelar"
                variant="danger"
            />

            <div className="mt-8">
                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {filteredProjects.map(p => {
                            const completedTasks = calculateProgress(p.tasks || []);
                            const totalTasks = p.tasks?.length || 0;
                            const tags = p.tags || [];

                            return (
                                <Card
                                    key={p.id}
                                    variant="elevated"
                                    hoverable={true}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.closest('button, a')) {
                                            return;
                                        }
                                        onSelectProject(p.id);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onSelectProject(p.id);
                                        }
                                    }}
                                    className="group cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 flex flex-col h-full"
                                >
                                    <div className="flex-1 space-y-3">
                                        <h3 className="text-lg font-semibold leading-snug line-clamp-2 pr-10 text-balance">
                                            {p.name}
                                        </h3>

                                        <p className="text-sm text-base-content/70 line-clamp-2 min-h-[2.5em]">
                                            {p.description || 'Sem descrição.'}
                                        </p>

                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {tags.slice(0, 3).map(tag => (
                                                    <Badge key={tag} variant="default" size="sm">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {tags.length > 3 && (
                                                    <Badge variant="default" size="sm">
                                                        +{tags.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-base-300 space-y-2">
                                        <ProgressIndicator
                                            value={completedTasks}
                                            max={totalTasks}
                                            label="Progresso"
                                            size="sm"
                                            color="blue"
                                            showPercentage={true}
                                        />
                                        <div className="flex justify-between items-center text-xs text-base-content/60">
                                            <span>
                                                {totalTasks} {totalTasks === 1 ? 'tarefa' : 'tarefas'}
                                            </span>
                                            {p.settings?.jiraProjectKey && (
                                                <span className="badge badge-outline badge-sm">
                                                    JIRA: {p.settings.jiraProjectKey}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            openDeleteModal(p, e);
                                        }}
                                        className="btn btn-ghost btn-sm btn-circle absolute top-3 right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-base-content/60 hover:text-error hover:bg-error/10 transition-all active:scale-95 z-10"
                                        aria-label={`Excluir projeto ${p.name}`}
                                    >
                                        <TrashIcon />
                                    </button>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-8 rounded-[var(--rounded-box)] border border-base-300 bg-base-100 p-10 sm:p-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-base-200 flex items-center justify-center text-2xl" aria-hidden="true">
                            🚀
                        </div>
                        <h3 className="text-xl font-semibold">Nenhum projeto ainda</h3>
                        <p className="mt-2 text-base-content/70 max-w-md mx-auto">
                            Crie um projeto para organizar tarefas, testes, documentos e métricas em um fluxo único.
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setIsCreating(true)}
                                className="btn btn-primary rounded-full"
                            >
                                Criar Projeto
                            </button>
                        </div>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
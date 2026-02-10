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
import { ArrowRight, Plus, Cloud } from 'lucide-react';
import { getTaskStatusCategory } from '../utils/jiraStatusCategorizer';
import { motion } from 'framer-motion';
import { ProjectActivityCard } from './common/ProjectActivityCard';

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
        // Usar categoria do Jira para determinar se está concluído
        const completed = tasks.filter(t => {
            const category = getTaskStatusCategory(t);
            return category === 'Concluído';
        }).length;
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
            <div className="container mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2">
                            <span className="badge badge-outline badge-sm sm:badge-md border-primary/30 text-primary bg-primary/10">
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
                            Crie, organize e acompanhe o QA por projeto — templates, métricas e integrações opcionais quando fizer sentido.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
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
                                    data-tour="create-project"
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
                                    className={`btn btn-outline btn-sm rounded-full ${isSyncingSupabase ? 'loading' : ''}`}
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
                footer={
                    <button
                        onClick={() => handleMobileAction(() => setIsCreating(true))}
                        type="button"
                        className="btn btn-primary w-full"
                    >
                        Criar Projeto
                    </button>
                }
            >
                <div className="space-y-2">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleMobileAction(action.onClick)}
                            type="button"
                            className="btn btn-outline w-full justify-start gap-3 text-left"
                        >
                            <span className="text-lg flex-shrink-0" aria-hidden="true">{action.icon}</span>
                            <span className="flex-1 text-base-content">{action.label}</span>
                        </button>
                    ))}
                </div>
            </Modal>


            <Modal isOpen={isCreating} onClose={() => {
                setIsCreating(false);
                setSelectedTemplate(undefined);
                setShowTemplates(false);
            }} title="Criar Novo Projeto" size="xl"
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreating(false);
                                setSelectedTemplate(undefined);
                                setShowTemplates(false);
                            }}
                            className="btn btn-ghost rounded-full"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="btn btn-primary rounded-full"
                            disabled={!newName.trim()}
                        >
                            {showTemplates ? 'Criar com Template' : 'Criar'}
                        </button>
                    </div>
                }
            >
                 <div className="space-y-4">
                    {!showTemplates ? (
                        <>
                            <div>
                                <button
                                    onClick={() => setShowTemplates(true)}
                                    type="button"
                                    className="w-full rounded-2xl border-2 border-dashed border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/40 hover:bg-base-200/40"
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
                        </>
                    ) : (
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={() => setShowTemplates(false)}
                                className="btn btn-ghost btn-sm rounded-full self-start"
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
                    <motion.div 
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" 
                        data-tour="project-list"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: {
                                transition: {
                                    staggerChildren: 0.08,
                                },
                            },
                        }}
                    >
                        {filteredProjects.map((p, index) => {
                            const completedTasks = calculateProgress(p.tasks || []);
                            const totalTasks = p.tasks?.length || 0;
                            const tags = p.tags || [];
                            const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                            const jiraKey = p.settings?.jiraProjectKey;
                            const desc = (p.description || '').trim();

                            return (
                                <motion.div
                                    key={p.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20, scale: 0.95 },
                                        visible: { 
                                            opacity: 1, 
                                            y: 0, 
                                            scale: 1,
                                            transition: {
                                                duration: 0.3,
                                                ease: 'easeOut',
                                            },
                                        },
                                    }}
                                >
                                    <ProjectActivityCard
                                        project={p}
                                        onSelect={() => onSelectProject(p.id)}
                                        onDelete={() => {
                                            setDeleteModalState({ isOpen: true, project: p });
                                        }}
                                        className="group"
                                    />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <div className="mt-8 rounded-2xl border border-base-300 bg-base-100 p-10 sm:p-12 text-center shadow-sm">
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
};
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

export const ProjectsDashboard: React.FC<{
    projects: Project[];
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string, description: string, templateId?: string) => Promise<void>;
    onDeleteProject: (id: string) => Promise<void>;
    onSearchClick: () => void;
    onAdvancedSearchClick?: () => void;
    onComparisonClick?: () => void;
    onSyncSupabase?: () => Promise<void>;
}> = ({ projects, onSelectProject, onCreateProject, onDeleteProject, onSearchClick, onAdvancedSearchClick, onComparisonClick, onSyncSupabase }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
    const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
    const [showMobileActions, setShowMobileActions] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'tasks' | 'progress'>('name');
    const isMobile = useIsMobile();
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; project: Project | null }>({
        isOpen: false,
        project: null,
    });

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

    const sortedProjects = useMemo(() => {
        return [...projects].sort((a, b) => {
            const tasksA = a.tasks || [];
            const tasksB = b.tasks || [];
            
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'tasks') {
                return tasksB.length - tasksA.length;
            } else if (sortBy === 'progress') {
                const progressA = tasksA.length > 0 ? calculateProgress(tasksA) / tasksA.length : 0;
                const progressB = tasksB.length > 0 ? calculateProgress(tasksB) / tasksB.length : 0;
                return progressB - progressA;
            }
            return 0;
        });
    }, [projects, sortBy]);

    const quickActions = useMemo(() => {
        const actions: Array<{ id: string; label: string; icon: string; onClick: () => void | Promise<void> }> = [
            {
                id: 'search',
                label: 'Buscar Projetos',
                icon: '🔍',
                onClick: onSearchClick
            }
        ];

        if (onAdvancedSearchClick) {
            actions.push({
                id: 'advanced-search',
                label: 'Busca Avançada',
                icon: '🧭',
                onClick: onAdvancedSearchClick
            });
        }

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
    }, [handleSyncSupabase, onAdvancedSearchClick, onComparisonClick, onSearchClick, onSyncSupabase, projects.length]);

    const handleMobileAction = (action: () => void | Promise<void>) => {
        setShowMobileActions(false);
        setTimeout(() => action(), 150);
    };

    return (
        <div className="container mx-auto max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10 2xl:px-16 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 w-full">
                <div className="flex flex-col gap-1">
                     <h1 className="text-2xl sm:text-3xl font-bold text-text-primary line-clamp-2 text-balance w-full">
                        Meus Projetos
                    </h1>
                    <p className="text-text-secondary text-sm hidden sm:block">
                        Gerencie e acompanhe o progresso dos seus projetos de QA
                    </p>
                </div>
               
                {isMobile ? (
                    <div className="w-full space-y-2">
                         <div className="flex justify-end mb-2">
                             <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-surface-input border border-surface-border rounded-lg px-3 py-1 text-sm text-text-primary focus:ring-2 focus:ring-accent/50 outline-none"
                            >
                                <option value="name">Nome (A-Z)</option>
                                <option value="tasks">Mais Tarefas</option>
                                <option value="progress">Maior Progresso</option>
                            </select>
                        </div>
                        <div className="mobile-actions-inline" role="group" aria-label="Ações principais">
                            <button 
                                onClick={() => setIsCreating(true)} 
                                className="btn btn-primary flex-shrink-0"
                                data-onboarding="create-project"
                            >
                                ➕ Novo
                            </button>
                            <button onClick={onSearchClick} className="btn btn-secondary flex-shrink-0">
                                🔍 Buscar
                            </button>
                            {quickActions.length > 1 && (
                                <button 
                                    onClick={() => setShowMobileActions(true)} 
                                    className="btn btn-secondary flex-shrink-0"
                                    aria-label="Abrir menu de ações rápidas"
                                >
                                    ⋯
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto items-center">
                        <div className="mr-2">
                             <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/50 outline-none hover:border-accent/50 transition-colors cursor-pointer"
                                aria-label="Ordenar projetos"
                            >
                                <option value="name">🔤 Nome</option>
                                <option value="tasks">📝 Tarefas</option>
                                <option value="progress">📈 Progresso</option>
                            </select>
                        </div>
                        {onComparisonClick && projects.length > 1 && (
                            <button onClick={onComparisonClick} className="btn btn-secondary">
                                📊 Comparar
                            </button>
                        )}
                        {onAdvancedSearchClick && (
                            <button onClick={onAdvancedSearchClick} className="btn btn-secondary">
                                🧭 Avançado
                            </button>
                        )}
                        {onSyncSupabase && (
                            <button
                                onClick={handleSyncSupabase}
                                className="btn btn-secondary"
                                disabled={isSyncingSupabase}
                            >
                                {isSyncingSupabase ? 'Sincronizando...' : '☁️ Supabase'}
                            </button>
                        )}
                        <button onClick={onSearchClick} className="btn btn-secondary">
                            🔍 Buscar
                        </button>
                        <button 
                            onClick={() => setIsCreating(true)} 
                            className="btn btn-primary"
                            data-onboarding="create-project"
                        >
                            ➕ Novo Projeto
                        </button>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showMobileActions}
                onClose={() => setShowMobileActions(false)}
                title="Ações rápidas"
                size="sm"
            >
                <div className="space-y-3 mobile-action-shadow">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleMobileAction(action.onClick)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-surface-border text-left hover:border-accent hover:text-accent transition-colors active:scale-95"
                        >
                            <span className="text-xl">{action.icon}</span>
                            <span className="font-semibold">{action.label}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => handleMobileAction(() => setIsCreating(true))}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-accent/20 text-accent font-semibold justify-center"
                    >
                        ➕ Criar Projeto
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isCreating} onClose={() => {
                setIsCreating(false);
                setSelectedTemplate(undefined);
            }} title="Criar Novo Projeto">
                 <div className="space-y-4">
                    {!showTemplates ? (
                        <>
                            <div className="mb-4">
                                <button
                                    onClick={() => setShowTemplates(true)}
                                    className="w-full p-4 border-2 border-dashed border-surface-border rounded-lg hover:border-accent transition-colors text-text-secondary hover:text-text-primary"
                                >
                                    📋 Usar Template (Recomendado)
                                </button>
                            </div>
                            <div>
                                <label htmlFor="proj-name" className="block text-sm font-medium text-text-secondary mb-1">Nome do Projeto</label>
                                <input id="proj-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 bg-surface-input border border-surface-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-primary" placeholder="Ex: E-commerce App" />
                            </div>
                            <div>
                                <label htmlFor="proj-desc" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                                <textarea id="proj-desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="w-full px-3 py-2 bg-surface-input border border-surface-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-primary" placeholder="Breve descrição do projeto..."></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setIsCreating(false)} className="btn btn-secondary">Cancelar</button>
                                <button onClick={handleCreate} className="btn btn-primary" disabled={!newName.trim()}>Criar</button>
                            </div>
                        </>
                    ) : (
                        <div>
                            <button
                                onClick={() => setShowTemplates(false)}
                                className="mb-4 text-text-secondary hover:text-text-primary flex items-center gap-2"
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
                                <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                                    <p className="text-sm text-text-primary">Template selecionado! Preencha os dados abaixo.</p>
                                </div>
                            )}
                            <div className="mt-4">
                                <label htmlFor="proj-name-template" className="block text-sm font-medium text-text-secondary mb-1">Nome do Projeto</label>
                                <input id="proj-name-template" type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 bg-surface-input border border-surface-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-primary" />
                            </div>
                            <div className="mt-4">
                                <label htmlFor="proj-desc-template" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                                <textarea id="proj-desc-template" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="w-full px-3 py-2 bg-surface-input border border-surface-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-primary"></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => {
                                    setIsCreating(false);
                                    setSelectedTemplate(undefined);
                                }} className="btn btn-secondary">Cancelar</button>
                                <button onClick={handleCreate} className="btn btn-primary" disabled={!newName.trim()}>Criar com Template</button>
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

            {sortedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                    {sortedProjects.map(p => {
                        const completedTasks = calculateProgress(p.tasks || []);
                        const totalTasks = p.tasks?.length || 0;
                        const tags = p.tags || [];

                        return (
                            <Card
                                key={p.id}
                                onClick={() => onSelectProject(p.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSelectProject(p.id);
                                    }
                                }}
                                className="group cursor-pointer transition-all duration-300 hover:border-accent/70 hover:shadow-accent/20 hover:shadow-xl relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 flex flex-col h-full"
                            >
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-text-primary leading-snug line-clamp-2 text-balance pr-6">
                                            {p.name}
                                        </h3>
                                    </div>
                                    
                                    <p className="text-sm text-text-secondary line-clamp-2 min-h-[2.5em]">
                                        {p.description || 'Sem descrição.'}
                                    </p>

                                    {/* Tags */}
                                    {tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
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

                                <div className="mt-4 pt-3 border-t border-surface-border space-y-2">
                                    <ProgressIndicator 
                                        value={completedTasks} 
                                        max={totalTasks} 
                                        label="Progresso" 
                                        size="sm" 
                                        color="blue"
                                        showPercentage={true}
                                    />
                                    <div className="flex justify-between items-center text-xs text-text-tertiary mt-1">
                                        <span>{totalTasks} {totalTasks === 1 ? 'tarefa' : 'tarefas'}</span>
                                        {p.settings?.jiraProjectKey && (
                                            <span className="bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded text-[10px]">JIRA: {p.settings.jiraProjectKey}</span>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    onClick={(e) => openDeleteModal(p, e)} 
                                    className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full bg-surface-hover/60 text-text-secondary opacity-100 sm:opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                    aria-label={`Excluir projeto ${p.name}`}
                                >
                                    <TrashIcon />
                                </button>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-surface-border rounded-xl mt-8 bg-surface-card/30">
                    <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">🚀</span>
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">Nenhum projeto encontrado</h3>
                    <p className="text-text-secondary text-center max-w-md mb-6">
                        Comece criando seu primeiro projeto para gerenciar tarefas, testes e documentação.
                    </p>
                    <button onClick={() => setIsCreating(true)} className="btn btn-primary flex items-center gap-2 px-6 py-2.5 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
                        <span>➕</span> Criar Primeiro Projeto
                    </button>
                </div>
            )}
        </div>
    );
}
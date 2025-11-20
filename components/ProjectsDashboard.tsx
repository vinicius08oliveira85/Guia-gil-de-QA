
import React, { useMemo, useState } from 'react';
import { Project } from '../types';
import { Modal } from './common/Modal';
import { ConfirmDialog } from './common/ConfirmDialog';
import { ProjectTemplateSelector } from './common/ProjectTemplateSelector';
import { TrashIcon } from './common/Icons';
import { useIsMobile } from '../hooks/useIsMobile';

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
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Meus Projetos</h1>
                {isMobile ? (
                    <div className="flex flex-col w-full sm:w-auto gap-2">
                        <button 
                            onClick={() => setIsCreating(true)} 
                            className="btn btn-primary w-full"
                            data-onboarding="create-project"
                        >
                            ➕ Novo Projeto
                        </button>
                        {quickActions.length > 0 && (
                            <button 
                                onClick={() => setShowMobileActions(true)} 
                                className="btn btn-secondary w-full"
                                aria-label="Abrir menu de ações rápidas"
                            >
                                📱 Ações Rápidas
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {onComparisonClick && projects.length > 1 && (
                            <button onClick={onComparisonClick} className="btn btn-secondary">
                                📊 Comparar Projetos
                            </button>
                        )}
                        {onAdvancedSearchClick && (
                            <button onClick={onAdvancedSearchClick} className="btn btn-secondary">
                                🔍 Busca Avançada
                            </button>
                        )}
                        {onSyncSupabase && (
                            <button
                                onClick={handleSyncSupabase}
                                className="btn btn-secondary"
                                disabled={isSyncingSupabase}
                            >
                                {isSyncingSupabase ? 'Sincronizando...' : '☁️ Carregar Supabase'}
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
                                <input id="proj-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div>
                                <label htmlFor="proj-desc" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                                <textarea id="proj-desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3}></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setIsCreating(false)} className="btn btn-secondary">Cancelar</button>
                                <button onClick={handleCreate} className="btn btn-primary">Criar</button>
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
                                <input id="proj-name-template" type="text" value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div className="mt-4">
                                <label htmlFor="proj-desc-template" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                                <textarea id="proj-desc-template" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3}></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => {
                                    setIsCreating(false);
                                    setSelectedTemplate(undefined);
                                }} className="btn btn-secondary">Cancelar</button>
                                <button onClick={handleCreate} className="btn btn-primary">Criar com Template</button>
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

            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => (
                        <div key={p.id} onClick={() => onSelectProject(p.id)} className="group mica rounded-lg p-6 cursor-pointer transition-all duration-300 hover:border-accent/70 hover:shadow-accent/20 hover:shadow-2xl relative">
                            <h3 className="text-xl font-bold text-text-primary pr-8">{p.name}</h3>
                            <p className="text-text-secondary mt-2 min-h-[5rem] line-clamp-3 overflow-hidden text-ellipsis">{p.description}</p>
                             <button 
                                onClick={(e) => openDeleteModal(p, e)} 
                                className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-surface-hover/50 text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all active:scale-95 active:opacity-80"
                                aria-label={`Excluir projeto ${p.name}`}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-surface-border rounded-lg mt-8">
                    <h3 className="text-xl font-semibold text-text-primary">Nenhum projeto ainda</h3>
                    <p className="text-text-secondary mt-2">Crie seu primeiro projeto para começar.</p>
                    <button onClick={() => setIsCreating(true)} className="mt-6 btn btn-primary">Criar Projeto</button>
                </div>
            )}
        </div>
    );
}

import React, { useState } from 'react';
import { Project } from '../types';
import { Modal } from './common/Modal';
import { ConfirmDialog } from './common/ConfirmDialog';
import { ProjectTemplateSelector } from './common/ProjectTemplateSelector';
import { TrashIcon } from './common/Icons';

export const ProjectsDashboard: React.FC<{
    projects: Project[];
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string, description: string, templateId?: string) => Promise<void>;
    onDeleteProject: (id: string) => Promise<void>;
    onSearchClick: () => void;
    onAdvancedSearchClick?: () => void;
    onComparisonClick?: () => void;
}> = ({ projects, onSelectProject, onCreateProject, onDeleteProject, onSearchClick, onAdvancedSearchClick, onComparisonClick }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
    
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

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Meus Projetos</h1>
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
            </div>

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
                            <p className="text-text-secondary mt-2 h-20 overflow-hidden text-ellipsis">{p.description}</p>
                             <button 
                                onClick={(e) => openDeleteModal(p, e)} 
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover/50 text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
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
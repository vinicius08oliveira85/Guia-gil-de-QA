
import React, { useState } from 'react';
import { Project } from '../types';
import { Modal } from './common/Modal';
import { ConfirmDialog } from './common/ConfirmDialog';
import { TrashIcon } from './common/Icons';

export const ProjectsDashboard: React.FC<{
    projects: Project[];
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string, description: string) => Promise<void>;
    onDeleteProject: (id: string) => Promise<void>;
}> = ({ projects, onSelectProject, onCreateProject, onDeleteProject }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; project: Project | null }>({
        isOpen: false,
        project: null,
    });

    const handleCreate = async () => {
        if (newName.trim()) {
            await onCreateProject(newName.trim(), newDesc.trim());
            setIsCreating(false);
            setNewName('');
            setNewDesc('');
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">Dashboard de Projetos</h2>
                <button onClick={() => setIsCreating(true)} className="btn btn-primary shadow-lg shadow-accent/20">Novo Projeto</button>
            </div>

            <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="Criar Novo Projeto">
                 <div className="space-y-4">
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
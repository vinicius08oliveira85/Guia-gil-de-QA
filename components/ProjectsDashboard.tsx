
import React, { useState } from 'react';
import { Project } from '../types';
import { Modal } from './common/Modal';
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
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Dashboard de Projetos</h2>
                <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500">Novo Projeto</button>
            </div>

            <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="Criar Novo Projeto">
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="proj-name" className="block text-sm font-medium text-gray-400">Nome do Projeto</label>
                        <input id="proj-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
                    </div>
                     <div>
                        <label htmlFor="proj-desc" className="block text-sm font-medium text-gray-400">Descrição</label>
                        <textarea id="proj-desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                        <button onClick={handleCreate} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500">Criar</button>
                    </div>
                </div>
            </Modal>
            
             <Modal 
                isOpen={deleteModalState.isOpen} 
                onClose={() => setDeleteModalState({ isOpen: false, project: null })} 
                title={`Excluir "${deleteModalState.project?.name}"`}
            >
                <p>Você tem certeza que deseja excluir este projeto? Todos os dados associados (tarefas, documentos, análises) serão perdidos permanentemente. Esta ação não pode ser desfeita.</p>
                <div className="flex justify-end gap-3 pt-4 mt-4">
                    <button onClick={() => setDeleteModalState({ isOpen: false, project: null })} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500">Sim, Excluir</button>
                </div>
            </Modal>

            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => (
                        <div key={p.id} onClick={() => onSelectProject(p.id)} className="group bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-teal-500 cursor-pointer transition-colors relative">
                            <h3 className="text-xl font-bold text-white pr-8">{p.name}</h3>
                            <p className="text-gray-400 mt-2 h-20 overflow-hidden text-ellipsis">{p.description}</p>
                             <button 
                                onClick={(e) => openDeleteModal(p, e)} 
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-700/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/30 hover:text-red-400 transition-opacity"
                                aria-label={`Excluir projeto ${p.name}`}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg">
                    <h3 className="text-xl font-semibold text-white">Nenhum projeto ainda</h3>
                    <p className="text-gray-500 mt-2">Crie seu primeiro projeto para começar.</p>
                    <button onClick={() => setIsCreating(true)} className="mt-6 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500">Criar Projeto</button>
                </div>
            )}
        </div>
    );
}

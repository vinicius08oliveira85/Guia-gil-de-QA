
import React, { useState } from 'react';
import { BddScenario } from '../../types';
import { EditIcon, TrashIcon } from '../common/Icons';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export const BddScenarioForm: React.FC<{
    onSave: (scenario: Omit<BddScenario, 'id'>) => void;
    onCancel: () => void;
    existingScenario?: BddScenario;
}> = ({ onSave, onCancel, existingScenario }) => {
    const { handleWarning } = useErrorHandler();
    const [title, setTitle] = useState(existingScenario?.title || '');
    const [gherkin, setGherkin] = useState(existingScenario?.gherkin || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !gherkin.trim()) {
            handleWarning("Título e Cenário Gherkin são obrigatórios.");
            return;
        }
        onSave({ title, gherkin });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-base-100 rounded-xl my-2 border border-base-300">
            <div>
                <label className="label">
                    <span className="label-text text-sm font-medium text-base-content/70">Título do Cenário</span>
                </label>
                <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                    className="input input-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:border-primary"
                    placeholder="Ex: Login com credenciais válidas"
                />
            </div>
            <div>
                <label className="label">
                    <span className="label-text text-sm font-medium text-base-content/70">Cenário (Gherkin: Dado, Quando, Então)</span>
                </label>
                <textarea 
                    value={gherkin} 
                    onChange={e => setGherkin(e.target.value)} 
                    rows={5} 
                    required 
                    className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content font-mono text-sm focus:outline-none focus:border-primary" 
                    placeholder={`Dado que um usuário está na página de login
Quando ele insere credenciais válidas
Então ele deve ser redirecionado para o dashboard`}
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="btn btn-ghost btn-sm"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    className="btn btn-primary btn-sm"
                >
                    Salvar Cenário
                </button>
            </div>
        </form>
    );
};

export const BddScenarioItem: React.FC<{
    scenario: BddScenario;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ scenario, onEdit, onDelete }) => {
    return (
        <div className="bg-base-100 p-4 rounded-xl border border-base-300 hover:border-primary/30 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
                <h5 className="font-semibold text-base-content flex-1 pr-2">{scenario.title}</h5>
                <div className="flex gap-1 flex-shrink-0">
                    <button 
                        onClick={onEdit} 
                        className="btn btn-ghost btn-sm btn-square"
                        aria-label="Editar cenário BDD"
                    >
                        <EditIcon />
                    </button>
                    <button 
                        onClick={onDelete} 
                        className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                        aria-label="Excluir cenário BDD"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </div>
            <pre className="mt-3 text-base-content whitespace-pre-wrap font-mono text-sm bg-base-200 p-4 rounded-lg border border-base-300 leading-relaxed">
                {scenario.gherkin}
            </pre>
        </div>
    );
};


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
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-surface rounded-lg my-2 border border-surface-border">
            <div>
                <label className="block text-sm font-medium text-text-secondary">Título do Cenário</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full bg-surface-hover border border-surface-border rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-accent"/>
            </div>
            <div>
                 <label className="block text-sm font-medium text-text-secondary">Cenário (Gherkin: Dado, Quando, Então)</label>
                 <textarea value={gherkin} onChange={e => setGherkin(e.target.value)} rows={5} required className="mt-1 block w-full bg-surface-hover border border-surface-border rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-accent font-mono text-sm" placeholder={`Dado que um usuário está na página de login\nQuando ele insere credenciais válidas\nEntão ele deve ser redirecionado para o dashboard`}></textarea>
            </div>
             <div className="flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-surface-hover text-text-primary rounded-md hover:bg-surface border border-surface-border">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-light">Salvar Cenário</button>
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
        <div className="bg-surface p-4 rounded-md border border-surface-border">
            <div className="flex justify-between items-start">
                <h5 className="font-semibold text-white">{scenario.title}</h5>
                <div className="flex gap-2 flex-shrink-0 ml-2">
                    <button onClick={onEdit} className="text-gray-400 hover:text-white"><EditIcon /></button>
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-400"><TrashIcon /></button>
                </div>
            </div>
            <pre className="mt-2 text-gray-300 whitespace-pre-wrap font-mono text-sm bg-surface p-3 rounded-md border border-surface-border">
                {scenario.gherkin}
            </pre>
        </div>
    );
};

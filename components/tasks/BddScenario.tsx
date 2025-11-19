
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
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-900/50 rounded-lg my-2 border border-teal-500/50">
            <div>
                <label className="block text-sm font-medium text-gray-400">Título do Cenário</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500"/>
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-400">Cenário (Gherkin: Dado, Quando, Então)</label>
                 <textarea value={gherkin} onChange={e => setGherkin(e.target.value)} rows={5} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-teal-500 font-mono text-sm" placeholder={`Dado que um usuário está na página de login\nQuando ele insere credenciais válidas\nEntão ele deve ser redirecionado para o dashboard`}></textarea>
            </div>
             <div className="flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500">Salvar Cenário</button>
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
        <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
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

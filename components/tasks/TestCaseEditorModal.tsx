import React, { useEffect, useMemo, useState } from 'react';
import { TestCase } from '../../types';
import { Modal } from '../common/Modal';
import { ToolsSelector } from './ToolsSelector';
import { normalizeExecutedStrategy } from '../../utils/testCaseMigration';

interface TestCaseEditorModalProps {
    testCase: TestCase;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updated: TestCase) => void;
    onDelete?: () => void;
}

const ensureAtLeastOne = (items: string[]) => (items.length > 0 ? items : ['']);

export const TestCaseEditorModal: React.FC<TestCaseEditorModalProps> = ({
    testCase,
    isOpen,
    onClose,
    onSave,
    onDelete
}) => {
    const [description, setDescription] = useState(testCase.description);
    const [expectedResult, setExpectedResult] = useState(testCase.expectedResult);
    const [status, setStatus] = useState<TestCase['status']>(testCase.status);
    const [steps, setSteps] = useState<string[]>(ensureAtLeastOne(testCase.steps || ['']));
    const [strategies, setStrategies] = useState<string[]>(ensureAtLeastOne(testCase.strategies || []));
    const [executedStrategies, setExecutedStrategies] = useState<string[]>(ensureAtLeastOne(normalizeExecutedStrategy(testCase.executedStrategy)));
    const [observedResult, setObservedResult] = useState(testCase.observedResult || '');
    const [isAutomated, setIsAutomated] = useState<boolean>(!!testCase.isAutomated);
    const [toolsUsed, setToolsUsed] = useState<string[]>(testCase.toolsUsed || []);

    useEffect(() => {
        setDescription(testCase.description);
        setExpectedResult(testCase.expectedResult);
        setStatus(testCase.status);
        setSteps(ensureAtLeastOne(testCase.steps || ['']));
        setStrategies(ensureAtLeastOne(testCase.strategies || []));
        setExecutedStrategies(ensureAtLeastOne(normalizeExecutedStrategy(testCase.executedStrategy)));
        setObservedResult(testCase.observedResult || '');
        setIsAutomated(!!testCase.isAutomated);
        setToolsUsed(testCase.toolsUsed || []);
    }, [testCase]);

    const canRemoveStep = useMemo(() => steps.length > 1, [steps.length]);
    const canRemoveStrategy = useMemo(() => strategies.length > 1, [strategies.length]);

    const handleListChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (index: number, value: string) => {
        setter(prev => prev.map((item, idx) => (idx === index ? value : item)));
    };

    const handleListAdd = (setter: React.Dispatch<React.SetStateAction<string[]>>) => () => {
        setter(prev => [...prev, '']);
    };

    const handleListRemove = (
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        allowRemoval: boolean
    ) => (index: number) => {
        setter(prev => {
            if (!allowRemoval) {
                return prev;
            }
            const next = prev.filter((_, idx) => idx !== index);
            return next.length > 0 ? next : [''];
        });
    };

    const handleExecutedStrategyChange = (index: number, value: string) => {
        setExecutedStrategies(prev => prev.map((item, idx) => (idx === index ? value : item)));
    };

    const handleAddExecutedStrategy = () => setExecutedStrategies(prev => [...prev, '']);
    const handleRemoveExecutedStrategy = (index: number) =>
        setExecutedStrategies(prev => {
            const next = prev.filter((_, idx) => idx !== index);
            return next.length > 0 ? next : [''];
        });

    const sanitizeList = (items: string[]) =>
        items
            .map(item => item.trim())
            .filter(item => item.length > 0);

    const handleSubmit = () => {
        const sanitizedSteps = sanitizeList(steps);
        const sanitizedStrategies = sanitizeList(strategies);
        const sanitizedExecuted = sanitizeList(executedStrategies);
        const sanitizedTools = sanitizeList(toolsUsed);

        onSave({
            ...testCase,
            description: description.trim(),
            expectedResult: expectedResult.trim(),
            status,
            steps: sanitizedSteps.length > 0 ? sanitizedSteps : ['Passo 1'],
            strategies: sanitizedStrategies.length > 0 ? sanitizedStrategies : undefined,
            executedStrategy: sanitizedExecuted.length > 0 ? sanitizedExecuted : undefined,
            observedResult: observedResult.trim() || undefined,
            isAutomated,
            toolsUsed: sanitizedTools.length > 0 ? sanitizedTools : undefined,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar caso de teste: ${testCase.description}`} size="xl">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Descrição</label>
                        <input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-surface-hover border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Status</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as TestCase['status'])}
                            className="w-full bg-surface-hover border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                        >
                            <option value="Not Run">Não Executado</option>
                            <option value="Passed">Aprovado</option>
                            <option value="Failed">Reprovado</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2">Passos</label>
                    <div className="space-y-2">
                        {steps.map((step, index) => (
                            <div key={`step-${index}`} className="flex gap-2">
                                <input
                                    value={step}
                                    onChange={e => handleListChange(setSteps)(index, e.target.value)}
                                    className="flex-1 bg-surface-hover border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/40"
                                    placeholder={`Passo ${index + 1}`}
                                />
                                <button
                                    type="button"
                                    className="px-3 py-2 text-sm text-red-300 border border-red-400/60 rounded-md hover:bg-red-400/10 disabled:opacity-40"
                                    disabled={!canRemoveStep}
                                    onClick={() => handleListRemove(setSteps, canRemoveStep)(index)}
                                >
                                    Remover
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleListAdd(setSteps)}
                        className="mt-3 text-sm text-accent hover:text-accent-light"
                    >
                        + Adicionar passo
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-2">Estratégias Recomendadas</label>
                        <div className="space-y-2">
                            {strategies.map((strategy, index) => (
                                <div key={`strategy-${index}`} className="flex gap-2">
                                    <input
                                        value={strategy}
                                        onChange={e => handleListChange(setStrategies)(index, e.target.value)}
                                        className="flex-1 bg-surface-hover border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/40"
                                        placeholder={`Estratégia ${index + 1}`}
                                    />
                                    <button
                                        type="button"
                                        className="px-3 py-2 text-sm text-red-300 border border-red-400/60 rounded-md hover:bg-red-400/10 disabled:opacity-40"
                                        disabled={!canRemoveStrategy}
                                        onClick={() => handleListRemove(setStrategies, canRemoveStrategy)(index)}
                                    >
                                        Remover
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={handleListAdd(setStrategies)}
                            className="mt-3 text-sm text-accent hover:text-accent-light"
                        >
                            + Adicionar estratégia
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-2">Testes executados</label>
                        <div className="space-y-2">
                            {executedStrategies.map((strategy, index) => (
                                <div key={`executed-${index}`} className="flex gap-2">
                                    <input
                                        value={strategy}
                                        onChange={e => handleExecutedStrategyChange(index, e.target.value)}
                                        className="flex-1 bg-surface-hover border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/40"
                                        placeholder={`Execução ${index + 1}`}
                                    />
                                    <button
                                        type="button"
                                        className="px-3 py-2 text-sm text-red-300 border border-red-400/60 rounded-md hover:bg-red-400/10 disabled:opacity-40"
                                        onClick={() => handleRemoveExecutedStrategy(index)}
                                    >
                                        Remover
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={handleAddExecutedStrategy}
                            className="mt-3 text-sm text-accent hover:text-accent-light"
                        >
                            + Adicionar execução
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Resultado esperado</label>
                    <textarea
                        value={expectedResult}
                        onChange={e => setExpectedResult(e.target.value)}
                        className="w-full bg-surface-hover border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 min-h-[80px]"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Resultado observado</label>
                    <textarea
                        value={observedResult}
                        onChange={e => setObservedResult(e.target.value)}
                        className="w-full bg-surface-hover border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 min-h-[80px]"
                        placeholder="Preencha apenas se o teste falhou"
                    />
                </div>

                <div className="flex items-center justify-between bg-surface-hover rounded-lg border border-surface-border px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-text-primary">Automatizado</p>
                        <p className="text-xs text-text-secondary">Marque se este caso possui automação</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isAutomated}
                            onChange={e => setIsAutomated(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                </div>

                <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
                    <ToolsSelector
                        selectedTools={toolsUsed}
                        onToolsChange={setToolsUsed}
                        label="Ferramentas utilizadas"
                        compact={false}
                    />
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-surface-border">
                    {onDelete && (
                        <button
                            type="button"
                            className="btn btn-secondary text-red-300 border-red-400/60 hover:bg-red-400/10"
                            onClick={onDelete}
                        >
                            Excluir caso
                        </button>
                    )}
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                        Salvar alterações
                    </button>
                </div>
            </div>
        </Modal>
    );
};


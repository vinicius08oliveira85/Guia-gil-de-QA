import React, { useEffect, useState } from 'react';
import { TestCase } from '../../types';
import { CheckIcon, EditIcon, TrashIcon } from '../common/Icons';
import { normalizeExecutedStrategy } from '../../utils/testCaseMigration';
import { ToolsSelector } from './ToolsSelector';
import { TestTypeBadge } from '../common/TestTypeBadge';

import { Badge } from '../common/Badge';

const getPriorityVariant = (priority: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    if (priority === 'Urgente' || priority === 'Crítica') return 'error';
    if (priority === 'Alta') return 'warning';
    if (priority === 'Média') return 'info';
    if (priority === 'Baixa') return 'success';
    return 'default';
};

export const TestCaseItem: React.FC<{ 
    testCase: TestCase; 
    onStatusChange: (status: 'Passed' | 'Failed') => void;
    onToggleAutomated: (isAutomated: boolean) => void;
    onExecutedStrategyChange: (strategies: string[]) => void;
    onToolsChange?: (tools: string[]) => void;
    onEdit?: () => void;
    onDelete?: () => void;
}> = ({ testCase, onStatusChange, onToggleAutomated, onExecutedStrategyChange, onToolsChange, onEdit, onDelete }) => {
    const statusBadgeClassName: Record<TestCase['status'], string> = {
        'Not Run': 'badge badge-ghost badge-sm',
        Passed: 'badge badge-success badge-sm',
        Failed: 'badge badge-error badge-sm',
        Blocked: 'badge badge-warning badge-sm',
    };
    const statusLabel: Record<TestCase['status'], string> = {
        'Not Run': 'Não Executado',
        'Passed': 'Aprovado',
        'Failed': 'Reprovado',
        'Blocked': 'Bloqueado',
    };
    const recommendedStrategies = testCase.strategies || [];
    const selectedStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
    const customStrategies = selectedStrategies.filter(s => !recommendedStrategies.includes(s));
    const customStrategyValue = customStrategies.join(', ');
    const showExecutedStrategySummary = selectedStrategies.length > 0;
    const [customStrategyDraft, setCustomStrategyDraft] = useState(customStrategyValue);
    const [detailsOpen, setDetailsOpen] = useState(() => testCase.status === 'Failed');

    useEffect(() => {
        setCustomStrategyDraft(customStrategyValue);
    }, [customStrategyValue]);

    useEffect(() => {
        if (testCase.status === 'Failed') {
            setDetailsOpen(true);
        }
    }, [testCase.status]);

    const handleStrategyToggle = (strategy: string) => {
        const currentStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
        const isSelected = currentStrategies.includes(strategy);
        
        if (isSelected) {
            // Remove da seleção
            const newStrategies = currentStrategies.filter(s => s !== strategy);
            onExecutedStrategyChange(newStrategies);
        } else {
            // Adiciona à seleção
            const newStrategies = [...currentStrategies, strategy];
            onExecutedStrategyChange(newStrategies);
        }
    };

    const handleCustomStrategyBlur = (value: string) => {
        if (value.trim() === '') {
            // Se campo vazio, mantém apenas as estratégias recomendadas selecionadas
            const recommendedSelected = selectedStrategies.filter(s => recommendedStrategies.includes(s));
            onExecutedStrategyChange(recommendedSelected);
            return;
        }
        
        // Separa por vírgula e adiciona estratégias customizadas
        const customStrategiesList = value.split(',').map(s => s.trim()).filter(s => s !== '');
        const recommendedSelected = selectedStrategies.filter(s => recommendedStrategies.includes(s));
        const allStrategies = [...recommendedSelected, ...customStrategiesList];
        onExecutedStrategyChange(allStrategies);
    };

    return (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary/30">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {recommendedStrategies.map((strategy) => (
                            <TestTypeBadge key={strategy} testType={strategy} size="sm" />
                        ))}
                    </div>

                    <p className="text-sm font-semibold text-base-content break-words">{testCase.description}</p>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className={statusBadgeClassName[testCase.status]}>
                            {statusLabel[testCase.status]}
                        </span>
                        {testCase.priority && (
                            <Badge variant={getPriorityVariant(testCase.priority)} size="sm">
                                {testCase.priority}
                            </Badge>
                        )}
                        {testCase.isAutomated && (
                            <Badge variant="default" size="sm">Automatizado</Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={!!testCase.isAutomated}
                            onChange={(e) => onToggleAutomated(e.target.checked)}
                            className="toggle toggle-primary toggle-sm"
                            aria-label="Marcar caso como automatizado"
                        />
                        <span className="hidden sm:inline text-xs font-semibold text-base-content/70">
                            Automatizado
                        </span>
                    </label>

                    {(onEdit || onDelete) && (
                        <div className="flex items-center gap-1">
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={onEdit}
                                    className="btn btn-ghost btn-sm btn-circle"
                                    aria-label="Editar caso de teste"
                                >
                                    <EditIcon className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="btn btn-ghost btn-sm btn-circle text-error"
                                    aria-label="Excluir caso de teste"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {recommendedStrategies.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-semibold text-base-content/70">
                        Selecione os testes executados
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {recommendedStrategies.map((strategy) => {
                            const isSelected = selectedStrategies.includes(strategy);
                            return (
                                <button
                                    key={strategy}
                                    type="button"
                                    onClick={() => handleStrategyToggle(strategy)}
                                    className={`btn btn-xs rounded-full gap-1 ${
                                        isSelected ? 'btn-primary' : 'btn-outline'
                                    }`}
                                >
                                    {isSelected && <CheckIcon className="w-3 h-3" />}
                                    {strategy}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-4">
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Ou descreva o teste executado
                </label>
                <input
                    type="text"
                    value={customStrategyDraft}
                    onChange={(e) => setCustomStrategyDraft(e.target.value)}
                    onBlur={(e) => handleCustomStrategyBlur(e.target.value)}
                    placeholder="Ex: Teste Exploratório, Teste de Acessibilidade (separados por vírgula)"
                    className="input input-bordered input-sm w-full"
                />
                <p className="mt-1 text-xs text-base-content/70">
                    Use esta opção se executou testes diferentes das recomendações acima. Separe múltiplos testes por vírgula.
                </p>
                {showExecutedStrategySummary && (
                    <div className="mt-2">
                        <p className="text-xs font-semibold text-base-content/70 mb-1">
                            Testes registrados ({selectedStrategies.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedStrategies.map((strategy, idx) => (
                                <span key={idx} className="badge badge-outline badge-sm">
                                    {strategy}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {onToolsChange && (
                <div className="mt-4 rounded-2xl border border-base-300 bg-base-100 p-3">
                    <ToolsSelector
                        selectedTools={testCase.toolsUsed || []}
                        onToolsChange={onToolsChange}
                        label="Ferramentas (caso de teste)"
                        compact
                    />
                </div>
            )}

            <details
                className="collapse collapse-arrow mt-4 rounded-2xl border border-base-300 bg-base-100"
                open={detailsOpen}
                onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
            >
                <summary className="collapse-title text-sm font-semibold">
                    Detalhes do caso de teste
                </summary>
                <div className="collapse-content space-y-4">
                    {testCase.preconditions && (
                        <div>
                            <p className="text-xs font-semibold text-base-content/70">Pré-condições</p>
                            <p className="mt-1 text-sm text-base-content">{testCase.preconditions}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-semibold text-base-content/70">Passos</p>
                        <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-base-content">
                            {testCase.steps.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-base-content/70">Resultado esperado</p>
                        <p className="mt-1 text-sm text-base-content">{testCase.expectedResult}</p>
                    </div>

                    {testCase.status === 'Failed' && testCase.observedResult && (
                        <div className="alert alert-error">
                            <div>
                                <p className="text-xs font-semibold">Resultado encontrado</p>
                                <p className="text-sm">{testCase.observedResult}</p>
                            </div>
                        </div>
                    )}

                    {(testCase.testSuite || testCase.testEnvironment) && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {testCase.testSuite && (
                                <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                                    <p className="text-xs font-semibold text-base-content/70">Suite de teste</p>
                                    <p className="mt-1 text-sm text-base-content">{testCase.testSuite}</p>
                                </div>
                            )}
                            {testCase.testEnvironment && (
                                <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                                    <p className="text-xs font-semibold text-base-content/70">Ambiente de teste</p>
                                    <p className="mt-1 text-sm text-base-content">{testCase.testEnvironment}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </details>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className={statusBadgeClassName[testCase.status]}>
                    {statusLabel[testCase.status]}
                </span>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onStatusChange('Passed')} className="btn btn-success btn-sm">
                        Aprovar
                    </button>
                    <button type="button" onClick={() => onStatusChange('Failed')} className="btn btn-error btn-sm">
                        Reprovar
                    </button>
                </div>
            </div>
        </div>
    );
};
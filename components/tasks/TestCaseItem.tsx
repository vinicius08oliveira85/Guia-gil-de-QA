import React, { useEffect, useState } from 'react';
import { TestCase } from '../../types';
import { CheckIcon, ChevronDownIcon, EditIcon, ListIcon, TrashIcon } from '../common/Icons';
import { normalizeExecutedStrategy } from '../../utils/testCaseMigration';
import { getPriorityVariant } from '../../utils/taskHelpers';
import { ToolsSelector } from './ToolsSelector';
import { TestTypeBadge } from '../common/TestTypeBadge';
import { Badge } from '../common/Badge';

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
        <div className="rounded-2xl border border-base-300 bg-base-100 p-3 transition-colors hover:border-primary/30 space-y-2">
            {/* 1. Cabeçalho: pills de tipo + toggle + editar/excluir */}
            <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    {recommendedStrategies.map((strategy) => (
                        <TestTypeBadge
                            key={strategy}
                            testType={strategy}
                            size="sm"
                            selected={selectedStrategies.includes(strategy)}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5">
                        <input
                            type="checkbox"
                            checked={!!testCase.isAutomated}
                            onChange={(e) => onToggleAutomated(e.target.checked)}
                            className="toggle toggle-primary toggle-sm"
                            aria-label="Marcar caso como automatizado"
                        />
                        <span className="hidden sm:inline text-xs font-medium text-base-content/70">Automatizado</span>
                    </label>
                    {(onEdit || onDelete) && (
                        <div className="flex items-center gap-1">
                            {onEdit && (
                                <button type="button" onClick={onEdit} className="btn btn-ghost btn-sm btn-circle" aria-label="Editar caso de teste">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button type="button" onClick={onDelete} className="btn btn-ghost btn-sm btn-circle text-error" aria-label="Excluir caso de teste">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Tags de status/prioridade + título */}
            <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`${statusBadgeClassName[testCase.status]} text-xs font-bold uppercase tracking-wider`}>
                        {statusLabel[testCase.status]}
                    </span>
                    {testCase.priority && (
                        <Badge appearance="pill" variant={getPriorityVariant(testCase.priority)} size="sm" className="shrink-0">
                            {testCase.priority}
                        </Badge>
                    )}
                    {testCase.isAutomated && (
                        <span className="badge badge-ghost badge-sm text-xs font-bold uppercase tracking-wider">Automatizado</span>
                    )}
                </div>
                <p className="text-base font-bold text-base-content leading-tight break-words min-w-0">{testCase.description}</p>
            </div>

            {/* 3. Card "Selecione os testes executados" */}
            <div className="bg-base-100 border border-base-300 rounded-lg p-3 shadow-sm">
                {recommendedStrategies.length > 0 && (
                    <>
                        <p className="text-[10px] font-bold text-base-content/70 uppercase tracking-widest mb-2">
                            Selecione os testes executados
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {recommendedStrategies.map((strategy) => {
                                const isSelected = selectedStrategies.includes(strategy);
                                return (
                                    <button
                                        key={strategy}
                                        type="button"
                                        onClick={() => handleStrategyToggle(strategy)}
                                        className={`btn btn-xs rounded-xl flex items-center gap-1.5 transition-all ${
                                            isSelected ? 'btn-primary' : 'btn-outline border-base-300 bg-base-100'
                                        }`}
                                    >
                                        {isSelected && <CheckIcon className="w-3 h-3" />}
                                        {strategy}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
                <div className="space-y-1">
                    <label className="block text-xs font-medium text-base-content/70">Ou descreva outro teste executado</label>
                    <input
                        type="text"
                        value={customStrategyDraft}
                        onChange={(e) => setCustomStrategyDraft(e.target.value)}
                        onBlur={(e) => handleCustomStrategyBlur(e.target.value)}
                        placeholder="Ex: Teste Exploratório, Acessibilidade (separados por vírgula)"
                        className="input input-bordered input-sm w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-base-content/70 italic">Use esta opção se executou testes diferentes das recomendações acima.</p>
                </div>
                {showExecutedStrategySummary && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {selectedStrategies.map((strategy, idx) => (
                            <TestTypeBadge key={idx} testType={strategy} size="sm" variantStyle="pastel" />
                        ))}
                    </div>
                )}
            </div>

            {/* 4. Card "Ferramentas (caso de teste)" com cabeçalho */}
            {onToolsChange && (
                <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-3 py-1.5 border-b border-base-200 bg-base-200/50">
                        <h3 className="text-[10px] font-bold text-base-content/70 uppercase tracking-widest">Ferramentas (caso de teste)</h3>
                    </div>
                    <div className="p-2.5">
                        <ToolsSelector
                            selectedTools={testCase.toolsUsed || []}
                            onToolsChange={onToolsChange}
                            label=""
                            compact
                        />
                    </div>
                </div>
            )}

            {/* 5. Detalhes do caso de teste (colapsável) */}
            <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden shadow-sm">
                <button
                    type="button"
                    onClick={() => setDetailsOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-base-200/50 transition-colors text-left"
                    aria-expanded={detailsOpen}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <ListIcon className="w-4 h-4 text-base-content/70 flex-shrink-0" />
                        <span className="text-xs font-semibold text-base-content">Detalhes do caso de teste</span>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 text-base-content/70 flex-shrink-0 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
                </button>
                {detailsOpen && (
                    <div className="px-3 pb-3 pt-0 space-y-3 border-t border-base-200">
                        {testCase.preconditions && (
                            <div>
                                <h3 className="text-[10px] font-bold text-base-content/70 uppercase tracking-widest mb-1">Pré-condições</h3>
                                <p className="text-xs text-base-content bg-base-200/50 p-2.5 rounded border-l-4 border-primary">{testCase.preconditions}</p>
                            </div>
                        )}
                        <div>
                            <h3 className="text-[10px] font-bold text-base-content/70 uppercase tracking-widest mb-1">Passos</h3>
                            <ol className="space-y-1.5">
                                {testCase.steps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="text-xs text-base-content min-w-0">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-bold text-base-content/70 uppercase tracking-widest mb-1">Resultado esperado</h3>
                            <p className="text-xs text-base-content bg-base-200/50 p-2.5 rounded">{testCase.expectedResult}</p>
                        </div>
                        {testCase.status === 'Failed' && testCase.observedResult && (
                            <div className="alert alert-error text-xs">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Resultado encontrado</p>
                                    <p>{testCase.observedResult}</p>
                                </div>
                            </div>
                        )}
                        {(testCase.testSuite || testCase.testEnvironment) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-base-200">
                                {testCase.testSuite && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-base-content/70 uppercase tracking-widest">Suíte de teste</label>
                                        <div className="p-2 bg-base-200 rounded text-xs border border-base-300 text-base-content">{testCase.testSuite}</div>
                                    </div>
                                )}
                                {testCase.testEnvironment && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-base-content/70 uppercase tracking-widest">Ambiente de teste</label>
                                        <div className="p-2 bg-base-200 rounded text-xs border border-base-300 text-base-content">{testCase.testEnvironment}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 6. Footer: Aprovar / Reprovar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className={`${statusBadgeClassName[testCase.status]} text-xs font-bold uppercase tracking-wider`}>
                    {statusLabel[testCase.status]}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => onStatusChange('Passed')} className="btn btn-success btn-xs rounded-xl">
                        Aprovar
                    </button>
                    <button type="button" onClick={() => onStatusChange('Failed')} className="btn btn-error btn-xs rounded-xl">
                        Reprovar
                    </button>
                </div>
            </div>
        </div>
    );
};
import React from 'react';
import { TestCase } from '../../types';
import { CheckIcon, EditIcon, TrashIcon } from '../common/Icons';
import { normalizeExecutedStrategy } from '../../utils/testCaseMigration';
import { ToolsSelector } from './ToolsSelector';

const strategyColorMap: { [key: string]: string } = {
    'Teste Funcional': 'bg-blue-500/30 text-blue-300',
    'Teste de Integração': 'bg-purple-500/30 text-purple-300',
    'Teste de Usabilidade': 'bg-green-500/30 text-green-300',
    'Teste de Desempenho': 'bg-yellow-500/30 text-yellow-300',
    'Teste de Segurança': 'bg-red-500/30 text-red-300',
    'Teste de Regressão': 'bg-indigo-500/30 text-indigo-300',
    'Teste Caixa Branca': 'bg-slate-500/30 text-slate-300',
};
const defaultStrategyColor = 'bg-accent/30 text-accent-light';

export const TestCaseItem: React.FC<{ 
    testCase: TestCase; 
    onStatusChange: (status: 'Passed' | 'Failed') => void;
    onToggleAutomated: (isAutomated: boolean) => void;
    onExecutedStrategyChange: (strategies: string[]) => void;
    onToolsChange?: (tools: string[]) => void;
    onEdit?: () => void;
    onDelete?: () => void;
}> = ({ testCase, onStatusChange, onToggleAutomated, onExecutedStrategyChange, onToolsChange, onEdit, onDelete }) => {
    const statusColor = {
        'Not Run': 'bg-slate-600',
        'Passed': 'bg-green-600',
        'Failed': 'bg-red-600',
    };
    const recommendedStrategies = testCase.strategies || [];
    const selectedStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
    const customStrategies = selectedStrategies.filter(s => !recommendedStrategies.includes(s));
    const customStrategyValue = customStrategies.join(', ');
    const showExecutedStrategySummary = selectedStrategies.length > 0;

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

    const iconButtonClass = `
        p-2 rounded-full border border-surface-border text-text-secondary hover:text-white
        hover:border-accent hover:bg-accent/20 transition-colors
    `;

    return (
        <div className="bg-surface p-4 rounded-md border border-surface-border">
            <div className="flex flex-wrap gap-4 mb-3 items-center">
                <div className="flex flex-wrap gap-2 items-center flex-1">
                    {testCase.strategies && testCase.strategies.map(strategy => (
                        <span key={strategy} className={`px-2 py-0.5 text-xs font-medium rounded-full ${strategyColorMap[strategy] || defaultStrategyColor}`}>
                            {strategy}
                        </span>
                    ))}
                </div>

                {(onEdit || onDelete) && (
                    <div className="flex items-center gap-2 ml-auto">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className={iconButtonClass}
                                aria-label="Editar caso de teste"
                            >
                                <EditIcon className="w-4 h-4" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className={`${iconButtonClass} hover:text-red-300 hover:border-red-400`}
                                aria-label="Excluir caso de teste"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                <label className="relative inline-flex items-center cursor-pointer ml-auto">
                    <input 
                        type="checkbox" 
                        checked={!!testCase.isAutomated}
                        onChange={e => onToggleAutomated(e.target.checked)}
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    <span className="ml-3 text-sm font-medium text-text-primary">Automatizado</span>
                </label>
            </div>
            {recommendedStrategies.length > 0 && (
                <div className="mt-2">
                    <p className="text-[0.65rem] uppercase tracking-wide text-text-secondary">
                        Selecione os testes executados
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {recommendedStrategies.map(strategy => {
                            const isSelected = selectedStrategies.includes(strategy);
                            return (
                                <button
                                    key={strategy}
                                    type="button"
                                    onClick={() => handleStrategyToggle(strategy)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1 ${
                                        isSelected
                                            ? 'bg-accent text-white border-accent'
                                            : 'bg-surface-hover text-text-primary border-surface-border hover:border-accent'
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
            <div className="mt-3">
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Ou descreva o teste executado
                </label>
                <input
                    type="text"
                    value={customStrategyValue}
                    onChange={(e) => {
                        // Permite edição livre, mas só salva no blur
                    }}
                    onBlur={(e) => handleCustomStrategyBlur(e.target.value)}
                    placeholder="Ex: Teste Exploratório, Teste de Acessibilidade (separados por vírgula)"
                    className="w-full bg-surface-hover border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <p className="text-[0.65rem] text-text-secondary mt-1">
                    Use esta opção se executou testes diferentes das recomendações acima. Separe múltiplos testes por vírgula.
                </p>
                {showExecutedStrategySummary && (
                    <div className="mt-2">
                        <p className="text-xs text-accent mb-1">
                            Testes registrados ({selectedStrategies.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {selectedStrategies.map((strategy, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent/20 text-accent-light border border-accent/30"
                                >
                                    {strategy}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <p className="font-semibold text-text-primary mt-4">{testCase.description}</p>
            <div className="mt-2 pl-4 border-l-2 border-slate-700">
                {testCase.preconditions && (
                    <>
                        <p className="font-medium text-text-secondary">Précondições:</p>
                        <p className="text-text-primary mt-1">{testCase.preconditions}</p>
                    </>
                )}
                <p className="font-medium text-text-secondary mt-2">Passos:</p>
                <ul className="list-disc list-inside text-text-primary space-y-1 mt-1">
                    {testCase.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ul>
                <p className="font-medium text-text-secondary mt-2">Resultado Esperado:</p>
                <p className="text-text-primary mt-1">{testCase.expectedResult}</p>
                 {testCase.status === 'Failed' && testCase.observedResult && (
                    <>
                        <p className="font-medium text-red-400 mt-2">Resultado Encontrado:</p>
                        <p className="text-red-300 mt-1">{testCase.observedResult}</p>
                    </>
                )}
                {(testCase.testSuite || testCase.testEnvironment) && (
                    <div className="mt-2 flex flex-wrap gap-4">
                        {testCase.testSuite && (
                            <div>
                                <p className="font-medium text-text-secondary text-xs">Suite de teste:</p>
                                <p className="text-text-primary text-sm mt-1">{testCase.testSuite}</p>
                            </div>
                        )}
                        {testCase.testEnvironment && (
                            <div>
                                <p className="font-medium text-text-secondary text-xs">Ambiente de teste:</p>
                                <p className="text-text-primary text-sm mt-1">{testCase.testEnvironment}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-4 flex items-center justify-between">
                <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${statusColor[testCase.status]}`}>{testCase.status === 'Not Run' ? 'Não Executado' : testCase.status === 'Passed' ? 'Aprovado' : 'Reprovado'}</span>
                <div className="flex gap-2">
                    <button onClick={() => onStatusChange('Passed')} className="btn btn-approve text-sm">Aprovar</button>
                    <button onClick={() => onStatusChange('Failed')} className="btn btn-reject text-sm">Reprovar</button>
                </div>
            </div>
        </div>
    );
};
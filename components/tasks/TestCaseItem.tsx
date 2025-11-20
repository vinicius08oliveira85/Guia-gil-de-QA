import React from 'react';
import { TestCase } from '../../types';
import { CheckIcon } from '../common/Icons';

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
    onExecutedStrategyChange: (strategy: string | null) => void;
}> = ({ testCase, onStatusChange, onToggleAutomated, onExecutedStrategyChange }) => {
    const statusColor = {
        'Not Run': 'bg-slate-600',
        'Passed': 'bg-green-600',
        'Failed': 'bg-red-600',
    };
    const recommendedStrategies = testCase.strategies || [];
    const selectedStrategy = testCase.executedStrategy || '';
    const hasSelectedRecommended = Boolean(selectedStrategy && recommendedStrategies.includes(selectedStrategy));
    const customStrategyValue = hasSelectedRecommended ? '' : selectedStrategy;
    const showExecutedStrategySummary = Boolean(testCase.executedStrategy && testCase.executedStrategy.trim() !== '');

    const handleCustomStrategyBlur = (value: string) => {
        if (value.trim() === '') {
            onExecutedStrategyChange(null);
            return;
        }
        onExecutedStrategyChange(value);
    };

    return (
        <div className="bg-surface p-4 rounded-md border border-surface-border">
            <div className="flex flex-wrap gap-4 mb-3 items-center">
                <div className="flex flex-wrap gap-2 items-center">
                    {testCase.strategies && testCase.strategies.map(strategy => (
                        <span key={strategy} className={`px-2 py-0.5 text-xs font-medium rounded-full ${strategyColorMap[strategy] || defaultStrategyColor}`}>
                            {strategy}
                        </span>
                    ))}
                </div>
                
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
                        Selecione o teste executado
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {recommendedStrategies.map(strategy => {
                            const isSelected = testCase.executedStrategy === strategy;
                            return (
                                <button
                                    key={strategy}
                                    type="button"
                                    onClick={() => onExecutedStrategyChange(isSelected ? null : strategy)}
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
                    onChange={(e) => onExecutedStrategyChange(e.target.value)}
                    onBlur={(e) => handleCustomStrategyBlur(e.target.value)}
                    placeholder="Ex: Teste Exploratório do fluxo de pagamento"
                    className="w-full bg-surface-hover border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <p className="text-[0.65rem] text-text-secondary mt-1">
                    Use esta opção se executou um teste diferente das recomendações acima.
                </p>
                {showExecutedStrategySummary && (
                    <p className="text-xs text-accent mt-2">
                        Teste registrado: <span className="text-text-primary font-semibold">{testCase.executedStrategy}</span>
                    </p>
                )}
            </div>
            <p className="font-semibold text-text-primary mt-4">{testCase.description}</p>
            <div className="mt-2 pl-4 border-l-2 border-slate-700">
                <p className="font-medium text-text-secondary">Passos:</p>
                <ul className="list-disc list-inside text-text-primary space-y-1 mt-1">
                    {testCase.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ul>
                <p className="font-medium text-text-secondary mt-2">Resultado Esperado:</p>
                <p className="text-text-primary mt-1">{testCase.expectedResult}</p>
                 {testCase.status === 'Failed' && testCase.observedResult && (
                    <>
                        <p className="font-medium text-red-400 mt-2">Resultado Observado:</p>
                        <p className="text-red-300 mt-1">{testCase.observedResult}</p>
                    </>
                )}
            </div>
            <div className="mt-4 flex items-center justify-between">
                <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${statusColor[testCase.status]}`}>{testCase.status === 'Not Run' ? 'Não Executado' : testCase.status === 'Passed' ? 'Aprovado' : 'Reprovado'}</span>
                <div className="flex gap-2">
                    <button onClick={() => onStatusChange('Passed')} className="btn !text-sm !py-1 bg-green-500/20 text-green-300 hover:bg-green-500/40">Aprovar</button>
                    <button onClick={() => onStatusChange('Failed')} className="btn !text-sm !py-1 bg-red-500/20 text-red-300 hover:bg-red-500/40">Reprovar</button>
                </div>
            </div>
        </div>
    );
};
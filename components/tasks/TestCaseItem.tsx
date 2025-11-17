
import React from 'react';
import { TestCase } from '../../types';

const strategyColorMap: { [key: string]: string } = {
    'Teste Funcional': 'bg-blue-600/50 text-blue-300',
    'Teste de Integração': 'bg-purple-600/50 text-purple-300',
    'Teste de Usabilidade': 'bg-green-600/50 text-green-300',
    'Teste de Desempenho': 'bg-yellow-600/50 text-yellow-300',
    'Teste de Segurança': 'bg-red-600/50 text-red-300',
    'Teste de Regressão': 'bg-indigo-600/50 text-indigo-300',
    'Teste Caixa Branca': 'bg-gray-500/50 text-gray-300',
};
const defaultStrategyColor = 'bg-teal-600/50 text-teal-300';

export const TestCaseItem: React.FC<{ testCase: TestCase; onStatusChange: (status: 'Passed' | 'Failed') => void }> = ({ testCase, onStatusChange }) => {
    const statusColor = {
        'Not Run': 'bg-gray-600',
        'Passed': 'bg-green-600',
        'Failed': 'bg-red-600',
    };
    return (
        <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
            <div className="flex flex-wrap gap-2 mb-3 items-center">
                {testCase.strategies && testCase.strategies.map(strategy => (
                    <span key={strategy} className={`px-2 py-0.5 text-xs font-medium rounded-full ${strategyColorMap[strategy] || defaultStrategyColor}`}>
                        {strategy}
                    </span>
                ))}
                {testCase.isAutomated && (
                     <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-600/50 text-cyan-300 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 20.5c.5-.5.8-1.2.8-2 0-1.4-1.2-2.5-2.6-2.5-.9 0-1.7.5-2.2 1.3"/><path d="m14 16.5-4-4"/><path d="M16 14c-2-2-3-2-4 0"/><path d="M18 11.5c-1.5-1.5-1.5-2-1-4C17.5 6 18 5 18 5c-1 0-1.5 0-2.5 1-1.5 1.5-2.5 2.5-4 4C10 11.5 9.5 12 9 13c-1.5 1-3 2-3 4 0 1 .5 2.5 2 3.5C9.5 22 11 22 12 22c1.5 0 2.5-1.5 3.5-3 1-1 1-1.5 1.5-3 .5-.5 1-1.5 1-2.5 0-1-.5-1.5-1-2.5-1-1-2-2.5-3.5-4.5"/></svg>
                        Automatizado
                    </span>
                )}
            </div>
            <p className="font-semibold text-white">{testCase.description}</p>
            <div className="mt-2 pl-4 border-l-2 border-gray-600">
                <p className="font-medium text-gray-400">Passos:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mt-1">
                    {testCase.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ul>
                <p className="font-medium text-gray-400 mt-2">Resultado Esperado:</p>
                <p className="text-gray-300 mt-1">{testCase.expectedResult}</p>
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
                    <button onClick={() => onStatusChange('Passed')} className="px-3 py-1 bg-green-600/50 text-green-300 rounded-md hover:bg-green-600/80 text-sm">Aprovar</button>
                    <button onClick={() => onStatusChange('Failed')} className="px-3 py-1 bg-red-600/50 text-red-300 rounded-md hover:bg-red-600/80 text-sm">Reprovar</button>
                </div>
            </div>
        </div>
    );
};

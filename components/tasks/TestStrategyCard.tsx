
import React from 'react';
import { TestStrategy } from '../../types';
import { ToolsSelector } from './ToolsSelector';

interface TestStrategyCardProps {
    strategy: TestStrategy;
    strategyIndex: number;
    isExecuted?: boolean;
    onToggleExecuted?: (index: number, executed: boolean) => void;
    toolsUsed?: string[];
    onToolsChange?: (index: number, tools: string[]) => void;
}

export const TestStrategyCard: React.FC<TestStrategyCardProps> = ({ 
    strategy, 
    strategyIndex,
    isExecuted = false,
    onToggleExecuted,
    toolsUsed = [],
    onToolsChange
}) => {
    // Validação de segurança
    if (!strategy || !strategy.testType) {
        return null;
    }

    const handleToggleExecuted = () => {
        if (onToggleExecuted) {
            onToggleExecuted(strategyIndex, !isExecuted);
        }
    };

    const handleToolsChange = (tools: string[]) => {
        if (onToolsChange) {
            onToolsChange(strategyIndex, tools);
        }
    };

    return (
        <div className={`
            bg-base-100 p-4 rounded-xl border border-base-300
            ${isExecuted ? 'border-primary/30 bg-primary/5' : ''}
            transition-all
        `}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <h4 className="font-bold text-primary">{strategy.testType}</h4>
                    <p className="text-sm text-base-content/70 mt-1">{strategy.description}</p>
                </div>
                {onToggleExecuted && (
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                            type="checkbox"
                            checked={isExecuted}
                            onChange={handleToggleExecuted}
                            className="sr-only peer"
                        />
                        <div className={`
                            w-11 h-6 rounded-full transition-colors
                            ${isExecuted 
                                ? 'bg-green-500 peer-checked:bg-green-500' 
                                : 'bg-yellow-500 peer-checked:bg-yellow-500'
                            }
                            peer peer-focus:ring-2 peer-focus:ring-primary/20
                            peer-checked:after:translate-x-full
                            after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                            after:bg-white after:border after:rounded-full
                            after:h-5 after:w-5 after:transition-all
                        `}></div>
                        <span className="ml-3 text-sm font-medium text-base-content">
                            {isExecuted ? 'Concluir Teste' : 'Iniciar Teste'}
                        </span>
                    </label>
                )}
            </div>

            {strategy.howToExecute && strategy.howToExecute.length > 0 && (
                <div className="mt-3">
                    <h5 className="font-semibold text-base-content/70">Como Executar:</h5>
                    <ul className="space-y-2 mt-2">
                        {strategy.howToExecute.map((step, i) => (
                            <li key={i} className="flex items-start text-sm text-base-content">
                                <svg className="w-4 h-4 mr-2.5 mt-0.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path></svg>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {strategy.tools && (
                <div className="mt-3">
                    <h5 className="font-semibold text-base-content/70">Ferramentas Sugeridas:</h5>
                    <p className="text-sm text-base-content mt-1">{strategy.tools}</p>
                </div>
            )}

            {/* Ferramentas Utilizadas (apenas se estratégia foi executada) */}
            {isExecuted && onToolsChange && (
                <div className="mt-4 p-3 bg-base-200 rounded-lg border border-base-300">
                    <ToolsSelector
                        selectedTools={toolsUsed}
                        onToolsChange={handleToolsChange}
                        label="Ferramentas Utilizadas"
                        compact={true}
                    />
                </div>
            )}
        </div>
    );
};

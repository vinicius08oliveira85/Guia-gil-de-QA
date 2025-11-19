
import React from 'react';
import { TestStrategy } from '../../types';

export const TestStrategyCard: React.FC<{ strategy: TestStrategy }> = ({ strategy }) => (
    <div className="bg-surface p-4 rounded-lg border border-surface-border">
        <h4 className="font-bold text-accent">{strategy.testType}</h4>
        <p className="text-sm text-text-secondary mt-1">{strategy.description}</p>
        <div className="mt-3">
            <h5 className="font-semibold text-text-secondary">Como Executar:</h5>
            <ul className="space-y-2 mt-2">
                {strategy.howToExecute.map((step, i) => (
                    <li key={i} className="flex items-start text-sm text-text-primary">
                        <svg className="w-4 h-4 mr-2.5 mt-0.5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        <span>{step}</span>
                    </li>
                ))}
            </ul>
        </div>
         <div className="mt-3">
            <h5 className="font-semibold text-text-secondary">Ferramentas Sugeridas:</h5>
            <p className="text-sm text-text-primary mt-1">{strategy.tools}</p>
        </div>
    </div>
);

import React, { useMemo } from 'react';
import { Project } from '../../types';
import { Card } from '../common/Card';
import { CheckCircleIcon, InfoIcon } from '../common/Icons';

export const ShiftLeftCard: React.FC<{ project: Project; }> = ({ project }) => {
    const shiftLeftBenefits = [
        "Detecção precoce de defeito",
        "Melhoria da qualidade do software",
        "Redução de custos",
        "Aceleração do tempo de lançamento",
        "Maior colaboração entre equipes",
        "Feedback mais rápido"
    ];

    // FIX: Explicitly typing `recommendationsByPhase` ensures that `Object.entries` correctly infers the type of `recs` as `string[]`, resolving the error.
    const recommendationsByPhase: Record<string, string[]> = useMemo(() => {
        if (!project.shiftLeftAnalysis) {
            return {};
        }
        return project.shiftLeftAnalysis.recommendations.reduce((acc: Record<string, string[]>, rec) => {
            const phase = rec.phase;
            if (!acc[phase]) {
                acc[phase] = [];
            }
            acc[phase].push(rec.recommendation);
            return acc;
        }, {} as Record<string, string[]>);
    }, [project.shiftLeftAnalysis]);

    return (
        <Card className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl font-bold text-white">Análise de Shift Left Testing</h3>
                <div className="tooltip-container">
                    <InfoIcon />
                    <span className="tooltip-text">
                       O Shift Left Testing antecipa atividades de teste para o início do ciclo de desenvolvimento, focando em fases como design e codificação para encontrar defeitos mais cedo.
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-bold text-teal-400 mb-2">Ganhos Principais</h4>
                    <ul className="space-y-2">
                        {shiftLeftBenefits.map((benefit, i) => (
                             <li key={i} className="flex items-start">
                                <CheckCircleIcon className="w-5 h-5 mr-2 text-teal-400 flex-shrink-0" />
                                <span className="text-gray-300 text-sm">{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div>
                    <h4 className="font-bold text-teal-400 mb-2">Recomendações da IA</h4>
                    {project.shiftLeftAnalysis ? (
                        <div className="space-y-4">
                            {Object.entries(recommendationsByPhase).map(([phase, recs]) => (
                                <div key={phase}>
                                    <h5 className="font-semibold text-white">{phase}</h5>
                                    <ul className="list-disc list-inside text-gray-400 text-sm mt-1 space-y-1">
                                        {recs.map((rec, i) => <li key={i}>{rec}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-900/50 rounded-lg">
                           <p className="text-gray-500">Análise da IA pendente...</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
import React, { useState } from 'react';
import { Project, PhaseName, PhaseStatus } from '../../types';
import { Card } from '../common/Card';
import { InfoIcon } from '../common/Icons';
import { AnalysisModal } from './AnalysisModal';
import { TestTypeBadge } from '../common/TestTypeBadge';

const phaseNamesInOrder: PhaseName[] = ['Request', 'Analysis', 'Design', 'Analysis and Code', 'Build', 'Test', 'Release', 'Deploy', 'Operate', 'Monitor'];

export const ProjectLifecycleCard: React.FC<{ project: Project; }> = ({ project }) => {
    const [selectedPhase, setSelectedPhase] = useState<PhaseName | null>(null);
    const phaseExplanations: Record<PhaseName, string> = {
        'Request': 'Solicitação da demanda pelo time de atendimento ou produto.',
        'Analysis': 'Análise do time de produto e levantamento dos requisitos.',
        'Design': 'Design pelo time de UX/UI com base nas necessidades levantadas.',
        'Analysis and Code': 'Análise e codificação pelo time de desenvolvimento.',
        'Build': 'Código fonte compilado e construído em um pacote executável.',
        'Test': 'Etapa onde o software é testado para garantir seu correto funcionamento.',
        'Release': 'Preparo para o software ser instalado em ambiente produtivo.',
        'Deploy': 'O software é implantado em ambiente produtivo para os usuários finais.',
        'Operate': 'Software em execução, monitorado pela equipe de operações.',
        'Monitor': 'Coleta de métricas e logs para avaliar o desempenho e a saúde da aplicação.'
    };

    
    const getStatusStyles = (status: PhaseStatus) => {
        switch (status) {
            case 'Concluído': return {
                bar: 'bg-green-500',
                text: 'text-green-300',
                border: 'border-surface-border',
                bg: 'bg-green-500/20',
            };
            case 'Em Andamento': return {
                bar: 'bg-yellow-500',
                text: 'text-yellow-300',
                border: 'border-yellow-500/50 ring-1 ring-yellow-500/30',
                bg: 'bg-yellow-500/20',
            };
            default: return { // Não Iniciado
                bar: 'bg-slate-600',
                text: 'text-slate-400',
                border: 'border-surface-border',
                bg: 'bg-slate-700/60',
            };
        }
    };

    const selectedPhaseData = selectedPhase ? project.phases.find(p => p.name === selectedPhase) : null;

    return (
        <>
            <Card className="mb-8">
                <h3 className="text-xl font-bold text-text-primary mb-4">Ciclo de Vida do Projeto (SDLC & DevOps)</h3>
                <div className="space-y-2">
                     {phaseNamesInOrder.map(phaseName => {
                        const phase = project.phases.find(p => p.name === phaseName);
                        if (!phase) return null;
                        
                        const { bar, text, border, bg } = getStatusStyles(phase.status);
                        const hasDetails = phase.summary || (phase.testTypes && phase.testTypes.length > 0);

                        return (
                            <div 
                                key={phase.name} 
                                className={`bg-black/20 p-3 rounded-lg border flex gap-3 ${border} ${hasDetails ? 'cursor-pointer hover:bg-black/30 transition-colors' : ''}`}
                                onClick={() => hasDetails && setSelectedPhase(phaseName)}
                            >
                                <div className="flex flex-col items-center pt-1">
                                   <div className={`w-1.5 h-full rounded-full ${bar}`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h4 className={`font-bold text-base text-text-primary truncate`}>{phase.name}</h4>
                                            <div className="tooltip-container flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <InfoIcon />
                                                <span className="tooltip-text">{phaseExplanations[phase.name]}</span>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-semibold py-1 px-2 rounded-full ${bg} ${text} flex-shrink-0`}>
                                            {phase.status}
                                        </span>
                                    </div>
                                    {phase.summary && (
                                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{phase.summary}</p>
                                    )}
                                    {phase.testTypes && phase.testTypes.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {phase.testTypes.slice(0, 3).map(type => (
                                                <TestTypeBadge key={type} testType={type} size="sm" />
                                            ))}
                                            {phase.testTypes.length > 3 && (
                                                <span className="px-1.5 py-0.5 text-xs text-text-secondary">
                                                    +{phase.testTypes.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {hasDetails && (
                                        <p className="text-xs text-accent mt-1">Clique para ver detalhes completos</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <AnalysisModal
                isOpen={selectedPhase !== null}
                onClose={() => setSelectedPhase(null)}
                title={selectedPhaseData ? `${selectedPhaseData.name} - Detalhes Completos` : ''}
            >
                {selectedPhaseData && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-lg text-text-primary mb-2">Status</h4>
                            <span className={`text-sm font-semibold py-1 px-3 rounded-full ${getStatusStyles(selectedPhaseData.status).bg} ${getStatusStyles(selectedPhaseData.status).text}`}>
                                {selectedPhaseData.status}
                            </span>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-text-primary mb-2">Descrição</h4>
                            <p className="text-sm text-text-secondary">{phaseExplanations[selectedPhaseData.name]}</p>
                        </div>
                        {selectedPhaseData.summary && (
                            <div>
                                <h4 className="font-bold text-lg text-text-primary mb-2">Resumo da Análise IA</h4>
                                <p className="text-sm text-text-secondary whitespace-pre-wrap">{selectedPhaseData.summary}</p>
                            </div>
                        )}
                        {selectedPhaseData.testTypes && selectedPhaseData.testTypes.length > 0 && (
                            <div>
                                <h4 className="font-bold text-lg text-text-primary mb-2">Testes Recomendados</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPhaseData.testTypes.map(type => (
                                        <TestTypeBadge key={type} testType={type} size="md" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </AnalysisModal>
        </>
    );
};

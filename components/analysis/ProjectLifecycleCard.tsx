import React, { useState } from 'react';
import { Project, PhaseName, PhaseStatus } from '../../types';
import { Card } from '../common/Card';
import { InfoIcon } from '../common/Icons';
import { AnalysisModal } from './AnalysisModal';

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

    const testTypeColorMap: { [key: string]: string } = {
        'Unitário': 'bg-blue-500/30 text-blue-300',
        'Integração': 'bg-purple-500/30 text-purple-300',
        'Sistema': 'bg-teal-500/30 text-teal-300',
        'Aceitação': 'bg-emerald-500/30 text-emerald-300',
        'Desempenho': 'bg-orange-500/30 text-orange-300',
        'Segurança': 'bg-red-500/30 text-red-300',
        'API': 'bg-pink-500/30 text-pink-300',
        'Usabilidade': 'bg-green-500/30 text-green-300',
        'Regressão': 'bg-indigo-500/30 text-indigo-300',
    };
    const defaultTestTypeColor = 'bg-slate-500/30 text-slate-300';
    
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

    return (
        <Card className="mb-8">
            <h3 className="text-2xl font-bold text-text-primary mb-4">Ciclo de Vida do Projeto (SDLC & DevOps)</h3>
            <div className="space-y-4">
                 {phaseNamesInOrder.map(phaseName => {
                    const phase = project.phases.find(p => p.name === phaseName);
                    if (!phase) return null;
                    
                    const { bar, text, border, bg } = getStatusStyles(phase.status);

                    return (
                        <div key={phase.name} className={`bg-black/20 p-4 rounded-lg border flex gap-4 ${border}`}>
                            <div className="flex flex-col items-center pt-1">
                               <div className={`w-1.5 h-full rounded-full ${bar}`}></div>
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-bold text-lg text-text-primary`}>{phase.name}</h4>
                                        <div className="tooltip-container">
                                            <InfoIcon />
                                            <span className="tooltip-text">{phaseExplanations[phase.name]}</span>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-semibold py-1 px-3 rounded-full ${bg} ${text}`}>
                                        {phase.status}
                                    </span>
                                </div>
                                {phase.summary ? <p className="text-sm text-text-secondary">{phase.summary}</p> : <p className="text-sm text-slate-500 italic">Análise da IA pendente...</p>}
                                {phase.testTypes && phase.testTypes.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-surface-border/50">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Testes Recomendados</h5>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {phase.testTypes.map(type => (
                                                <span key={type} className={`px-2 py-1 text-xs font-medium rounded-full ${testTypeColorMap[type] || defaultTestTypeColor}`}>
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

import React from 'react';
import { Project, PhaseName, PhaseStatus } from '../../types';
import { Card } from '../common/Card';
import { InfoIcon } from '../common/Icons';

const phaseNamesInOrder: PhaseName[] = ['Request', 'Analysis', 'Design', 'Analysis and Code', 'Build', 'Test', 'Release', 'Deploy', 'Operate', 'Monitor'];

export const ProjectLifecycleCard: React.FC<{ project: Project; }> = ({ project }) => {
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
        'Unitário': 'bg-blue-600/50 text-blue-300',
        'Integração': 'bg-purple-600/50 text-purple-300',
        'Sistema': 'bg-teal-600/50 text-teal-300',
        'Aceitação': 'bg-emerald-600/50 text-emerald-300',
        'Desempenho': 'bg-orange-600/50 text-orange-300',
        'Segurança': 'bg-red-600/50 text-red-300',
        'API': 'bg-pink-600/50 text-pink-300',
        'Usabilidade': 'bg-green-600/50 text-green-300',
        'Regressão': 'bg-indigo-600/50 text-indigo-300',
    };
    const defaultTestTypeColor = 'bg-gray-600/50 text-gray-300';
    
    const getStatusStyles = (status: PhaseStatus) => {
        switch (status) {
            case 'Concluído': return {
                bar: 'bg-green-500',
                text: 'text-green-300',
                border: 'border-gray-700'
            };
            case 'Em Andamento': return {
                bar: 'bg-yellow-500',
                text: 'text-yellow-300',
                border: 'border-yellow-500 ring-1 ring-yellow-500'
            };
            default: return {
                bar: 'bg-gray-600',
                text: 'text-gray-400',
                border: 'border-gray-700'
            };
        }
    };

    return (
        <Card className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Ciclo de Vida do Projeto (SDLC & DevOps)</h3>
            <div className="space-y-4">
                 {phaseNamesInOrder.map(phaseName => {
                    const phase = project.phases.find(p => p.name === phaseName);
                    if (!phase) return null;
                    
                    const { bar, text, border } = getStatusStyles(phase.status);

                    return (
                        <div key={phase.name} className={`bg-gray-900/50 p-4 rounded-lg border flex gap-4 ${border}`}>
                            <div className="flex flex-col items-center">
                               <div className={`w-1.5 h-full rounded-full ${bar}`}></div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className={`font-bold text-lg ${text}`}>{phase.name}</h4>
                                    <div className="tooltip-container">
                                        <InfoIcon />
                                        <span className="tooltip-text">{phaseExplanations[phase.name]}</span>
                                    </div>
                                    <span className={`ml-auto text-sm font-semibold ${text}`}>
                                        {phase.status}
                                    </span>
                                </div>
                                {phase.summary ? <p className="text-sm text-gray-400">{phase.summary}</p> : <p className="text-sm text-gray-600 italic">Análise da IA pendente...</p>}
                                {phase.testTypes && phase.testTypes.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Testes Recomendados</h5>
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

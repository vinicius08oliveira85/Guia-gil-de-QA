import React from 'react';
import { Project, PhaseName } from '../../types';
import { Card } from '../common/Card';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';

const timelineData: {
    phase: PhaseName;
    duration: string;
    dependencies: string;
    exitCriteria: string;
    milestone: string;
    checklist: { label: string; check: (metrics: any) => boolean; }[];
}[] = [
    {
        phase: 'Request',
        duration: 'Contínuo',
        dependencies: 'Ideia de Negócio',
        exitCriteria: 'Pelo menos uma tarefa ou documento existe.',
        milestone: 'Kick-off de QA',
        checklist: [
            { label: 'Definir escopo inicial', check: (m) => m.totalTasks > 0 || m.project.documents.length > 0 },
            { label: 'Criar Plano de Testes (conceitual)', check: (m) => m.project.documents.length > 0 },
            { label: 'Identificar stakeholders', check: () => true },
        ]
    },
    {
        phase: 'Analysis',
        duration: '1-2 Sprints',
        dependencies: 'Requisitos de alto nível',
        exitCriteria: 'Cenários BDD criados para as histórias.',
        milestone: 'Revisão de Requisitos Concluída',
        checklist: [
            { label: 'Revisar Histórias de Usuário', check: (m) => m.totalTasks > 0 },
            { label: 'Criar cenários BDD', check: (m) => m.project.tasks.some((t:any) => t.bddScenarios && t.bddScenarios.length > 0) },
            { label: 'Identificar ambiguidades', check: () => true },
        ]
    },
    {
        phase: 'Design',
        duration: '1 Sprint',
        dependencies: 'Cenários BDD aprovados',
        exitCriteria: 'Casos de teste gerados para as histórias.',
        milestone: 'Suíte de Testes Pronta',
        checklist: [
            { label: 'Gerar casos de teste', check: (m) => m.totalTestCases > 0 },
            { label: 'Identificar candidatos à automação', check: (m) => m.automatedTestCases > 0 },
            { label: 'Planejar dados de teste', check: () => true },
        ]
    },
    {
        phase: 'Analysis and Code',
        duration: '2-3 Sprints',
        dependencies: 'Casos de Teste',
        exitCriteria: 'Todas as tarefas (não-bugs) concluídas.',
        milestone: 'Feature Complete',
        checklist: [
            { label: 'Desenvolvimento concluído', check: (m) => m.totalTasks > 0 && m.project.tasks.filter((t:any) => t.type !== 'Bug').every((t:any) => t.status === 'Done') },
            { label: 'Testes unitários implementados', check: () => true },
            { label: 'Code Review realizado', check: () => true },
        ]
    },
    {
        phase: 'Test',
        duration: '1-2 Sprints',
        dependencies: 'Build estável em ambiente de QA',
        exitCriteria: 'Todos os casos de teste executados.',
        milestone: 'Ciclo de Testes Funcionais Concluído',
        checklist: [
            { label: 'Executar testes funcionais', check: (m) => m.executedTestCases > 0 },
            { label: 'Executar testes de regressão', check: (m) => m.executedTestCases === m.totalTestCases },
            { label: 'Reportar e triar bugs', check: (m) => m.openVsClosedBugs.open > 0 || m.openVsClosedBugs.closed > 0 },
        ]
    },
    {
        phase: 'Release',
        duration: '1 Sprint',
        dependencies: 'Ciclo de Testes concluído',
        exitCriteria: 'Nenhum bug crítico/alto em aberto.',
        milestone: 'Go/No-Go para Produção',
        checklist: [
            { label: 'Validar correções de bugs', check: (m) => m.executedTestCases === m.totalTestCases },
            { label: 'Executar testes de fumaça (smoke tests)', check: () => true },
            { label: 'Obter aprovação (Sign-off) do UAT', check: (m) => m.bugsBySeverity['Crítico'] === 0 && m.bugsBySeverity['Alto'] === 0 },
        ]
    },
    // Deploy, Operate, Monitor can be added here if needed
];


const Checkbox: React.FC<{ checked: boolean }> = ({ checked }) => (
    <div className={`w-4 h-4 rounded border-2 ${checked ? 'bg-teal-500 border-teal-500' : 'border-gray-500'} flex items-center justify-center flex-shrink-0`}>
        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 14 11"><path d="M1 5.25L5.028 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
);

export const TimelineView: React.FC<{ project: Project, currentPhaseName: PhaseName | 'N/A' }> = ({ project, currentPhaseName }) => {
    const metrics = useProjectMetrics(project);
    const metricsWithProject = { ...metrics, project };

    return (
        <Card>
            <h3 className="text-2xl font-bold text-white mb-2">Timeline Completa do Projeto</h3>
            <p className="text-gray-400 mb-8">Um cronograma detalhado do fluxo de trabalho de QA, com dependências, marcos e entregáveis de cada fase.</p>

            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[1000px] text-left text-sm">
                    <thead className="border-b-2 border-gray-600 text-gray-400">
                        <tr>
                            <th className="p-3 w-1/12">Fase</th>
                            <th className="p-3 w-1/12">Duração</th>
                            <th className="p-3 w-2/12">Dependências</th>
                            <th className="p-3 w-2/12">Critérios de Transição</th>
                            <th className="p-3 w-2/12">Marco</th>
                            <th className="p-3 w-4/12">Checklist</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {timelineData.map(row => {
                            const isCurrent = row.phase === currentPhaseName;
                            const isDone = metrics.newPhases.find(p => p.name === row.phase)?.status === 'Concluído';
                            
                            return (
                                <tr key={row.phase} className={`${isCurrent ? 'bg-teal-500/10' : ''} ${isDone ? 'text-gray-500' : ''} transition-colors`}>
                                    <td className={`p-3 font-semibold align-top ${isDone ? 'text-gray-500' : 'text-teal-400'}`}>{row.phase}</td>
                                    <td className={`p-3 align-top ${isDone ? 'text-gray-500' : 'text-gray-300'}`}>{row.duration}</td>
                                    <td className={`p-3 align-top ${isDone ? 'text-gray-500' : 'text-gray-300'}`}>{row.dependencies}</td>
                                    <td className={`p-3 align-top ${isDone ? 'text-gray-500' : 'text-gray-300'}`}>{row.exitCriteria}</td>
                                    <td className={`p-3 align-top ${isDone ? 'text-gray-500' : 'text-gray-300'}`}>{row.milestone}</td>
                                    <td className={`p-3 align-top ${isDone ? 'text-gray-500' : 'text-gray-300'}`}>
                                        <ul className="space-y-2">
                                            {row.checklist.map(item => (
                                                <li key={item.label} className="flex items-center gap-2">
                                                    <Checkbox checked={item.check(metricsWithProject)} />
                                                    <span>{item.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
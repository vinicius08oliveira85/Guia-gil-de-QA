import React, { useState, useMemo } from 'react';
import { Project, PhaseName } from '../../types';
import { Card } from '../common/Card';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { Badge } from '../common/Badge';
import { ProgressIndicator } from '../common/ProgressIndicator';
import { Modal } from '../common/Modal';
import { Tooltip } from '../common/Tooltip';

interface TimelinePhase {
    phase: PhaseName;
    duration: string;
    dependencies: string;
    exitCriteria: string;
    milestone: string;
    checklist: { label: string; check: (metrics: any) => boolean; description?: string; };
    qaActivities?: string[];
    deliverables?: string[];
    risks?: string[];
}

const timelineData: TimelinePhase[] = [
    {
        phase: 'Request',
        duration: 'Contínuo',
        dependencies: 'Ideia de Negócio',
        exitCriteria: 'Pelo menos uma tarefa ou documento existe.',
        milestone: 'Kick-off de QA',
        checklist: [
            { 
                label: 'Definir escopo inicial', 
                check: (m) => m.totalTasks > 0 || m.project.documents.length > 0,
                description: 'Ter pelo menos uma tarefa ou documento criado no projeto'
            },
            { 
                label: 'Criar Plano de Testes (conceitual)', 
                check: (m) => m.project.documents.length > 0,
                description: 'Documentar estratégia inicial de testes'
            },
            { 
                label: 'Identificar stakeholders', 
                check: () => true,
                description: 'Mapear pessoas envolvidas no projeto'
            },
        ],
        qaActivities: [
            'Participar do kickoff',
            'Revisar requisitos iniciais',
            'Identificar riscos de qualidade',
            'Definir estratégia de teste'
        ],
        deliverables: [
            'Plano de Testes conceitual',
            'Lista de stakeholders',
            'Riscos identificados'
        ],
        risks: [
            'Requisitos ambíguos',
            'Falta de clareza no escopo',
            'Stakeholders não identificados'
        ]
    },
    {
        phase: 'Analysis',
        duration: '1-2 Sprints',
        dependencies: 'Requisitos de alto nível',
        exitCriteria: 'Cenários BDD criados para as histórias.',
        milestone: 'Revisão de Requisitos Concluída',
        checklist: [
            { 
                label: 'Revisar Histórias de Usuário', 
                check: (m) => m.totalTasks > 0,
                description: 'Validar clareza e completude das histórias'
            },
            { 
                label: 'Criar cenários BDD', 
                check: (m) => m.project.tasks.some((t:any) => t.bddScenarios && t.bddScenarios.length > 0),
                description: 'Escrever cenários Given-When-Then para cada história'
            },
            { 
                label: 'Identificar ambiguidades', 
                check: () => true,
                description: 'Documentar pontos que precisam esclarecimento'
            },
        ],
        qaActivities: [
            'Revisão de requisitos (Shift Left)',
            'Criação de cenários BDD',
            'Identificação de casos de teste',
            'Análise de riscos'
        ],
        deliverables: [
            'Cenários BDD aprovados',
            'Lista de ambiguidades',
            'Casos de teste iniciais'
        ],
        risks: [
            'Requisitos incompletos',
            'Falta de cenários BDD',
            'Ambiguidades não resolvidas'
        ]
    },
    {
        phase: 'Design',
        duration: '1 Sprint',
        dependencies: 'Cenários BDD aprovados',
        exitCriteria: 'Casos de teste gerados para as histórias.',
        milestone: 'Suíte de Testes Pronta',
        checklist: [
            { 
                label: 'Gerar casos de teste', 
                check: (m) => m.totalTestCases > 0,
                description: 'Criar casos de teste baseados nos cenários BDD'
            },
            { 
                label: 'Identificar candidatos à automação', 
                check: (m) => m.automatedTestCases > 0,
                description: 'Marcar casos de teste para automação'
            },
            { 
                label: 'Planejar dados de teste', 
                check: () => true,
                description: 'Preparar dados necessários para execução'
            },
        ],
        qaActivities: [
            'Revisão de design (Shift Left)',
            'Geração de casos de teste',
            'Planejamento de automação',
            'Validação de testabilidade'
        ],
        deliverables: [
            'Casos de teste documentados',
            'Plano de automação',
            'Dados de teste preparados'
        ],
        risks: [
            'Casos de teste incompletos',
            'Design não testável',
            'Falta de dados de teste'
        ]
    },
    {
        phase: 'Analysis and Code',
        duration: '2-3 Sprints',
        dependencies: 'Casos de Teste',
        exitCriteria: 'Todas as tarefas (não-bugs) concluídas.',
        milestone: 'Feature Complete',
        checklist: [
            { 
                label: 'Desenvolvimento concluído', 
                check: (m) => m.totalTasks > 0 && m.project.tasks.filter((t:any) => t.type !== 'Bug').every((t:any) => t.status === 'Done'),
                description: 'Todas as tarefas de desenvolvimento finalizadas'
            },
            { 
                label: 'Testes unitários implementados', 
                check: () => true,
                description: 'Cobertura mínima de testes unitários atingida'
            },
            { 
                label: 'Code Review realizado', 
                check: () => true,
                description: 'Revisão de código concluída'
            },
        ],
        qaActivities: [
            'Testes unitários (Shift Left)',
            'Code review',
            'Testes de integração',
            'Validação contínua'
        ],
        deliverables: [
            'Features implementadas',
            'Testes unitários',
            'Código revisado'
        ],
        risks: [
            'Cobertura de testes baixa',
            'Bugs não detectados',
            'Code review insuficiente'
        ]
    },
    {
        phase: 'Test',
        duration: '1-2 Sprints',
        dependencies: 'Build estável em ambiente de QA',
        exitCriteria: 'Todos os casos de teste executados.',
        milestone: 'Ciclo de Testes Funcionais Concluído',
        checklist: [
            { 
                label: 'Executar testes funcionais', 
                check: (m) => m.executedTestCases > 0,
                description: 'Executar todos os casos de teste funcionais'
            },
            { 
                label: 'Executar testes de regressão', 
                check: (m) => m.executedTestCases === m.totalTestCases,
                description: 'Garantir que todos os testes foram executados'
            },
            { 
                label: 'Reportar e triar bugs', 
                check: (m) => m.openVsClosedBugs.open > 0 || m.openVsClosedBugs.closed > 0,
                description: 'Documentar e priorizar bugs encontrados'
            },
        ],
        qaActivities: [
            'Execução de testes funcionais',
            'Testes de regressão',
            'Testes exploratórios',
            'Reporte de bugs',
            'Validação de correções'
        ],
        deliverables: [
            'Relatórios de teste',
            'Bugs reportados',
            'Métricas de qualidade',
            'Evidências de teste'
        ],
        risks: [
            'Testes não executados',
            'Bugs críticos não corrigidos',
            'Cobertura insuficiente'
        ]
    },
    {
        phase: 'Release',
        duration: '1 Sprint',
        dependencies: 'Ciclo de Testes concluído',
        exitCriteria: 'Nenhum bug crítico/alto em aberto.',
        milestone: 'Go/No-Go para Produção',
        checklist: [
            { 
                label: 'Validar correções de bugs', 
                check: (m) => m.executedTestCases === m.totalTestCases,
                description: 'Confirmar que bugs foram corrigidos'
            },
            { 
                label: 'Executar testes de fumaça (smoke tests)', 
                check: () => true,
                description: 'Validar funcionalidades críticas'
            },
            { 
                label: 'Obter aprovação (Sign-off) do UAT', 
                check: (m) => m.bugsBySeverity['Crítico'] === 0 && m.bugsBySeverity['Alto'] === 0,
                description: 'Aprovação formal dos stakeholders'
            },
        ],
        qaActivities: [
            'Testes de sanidade',
            'Validação final',
            'Preparação de release notes',
            'Aprovação de UAT'
        ],
        deliverables: [
            'Release notes',
            'Aprovação formal',
            'Plano de rollback',
            'Documentação atualizada'
        ],
        risks: [
            'Bugs críticos pendentes',
            'Falta de aprovação',
            'Documentação incompleta'
        ]
    },
    {
        phase: 'Deploy',
        duration: 'Imediato',
        dependencies: 'Aprovação de Release',
        exitCriteria: 'Deploy realizado com sucesso.',
        milestone: 'Software em Produção',
        checklist: [
            { 
                label: 'Deploy em produção', 
                check: () => true,
                description: 'Deploy realizado com sucesso'
            },
            { 
                label: 'Smoke tests pós-deploy', 
                check: () => true,
                description: 'Validar que sistema está funcionando'
            },
            { 
                label: 'Monitoramento ativo', 
                check: () => true,
                description: 'Acompanhar métricas e logs'
            },
        ],
        qaActivities: [
            'Validação em produção',
            'Smoke tests',
            'Monitoramento',
            'Coleta de feedback'
        ],
        deliverables: [
            'Sistema em produção',
            'Relatório de deploy',
            'Métricas iniciais'
        ],
        risks: [
            'Falhas no deploy',
            'Problemas em produção',
            'Monitoramento insuficiente'
        ]
    },
    {
        phase: 'Operate',
        duration: 'Contínuo',
        dependencies: 'Sistema em Produção',
        exitCriteria: 'Sistema operacional e estável.',
        milestone: 'Operação Estável',
        checklist: [
            { 
                label: 'Monitoramento contínuo', 
                check: () => true,
                description: 'Acompanhar saúde do sistema'
            },
            { 
                label: 'Suporte ativo', 
                check: () => true,
                description: 'Responder a incidentes'
            },
            { 
                label: 'Coleta de feedback', 
                check: () => true,
                description: 'Gather user feedback'
            },
        ],
        qaActivities: [
            'Monitoramento de qualidade',
            'Análise de incidentes',
            'Coleta de feedback',
            'Planejamento de melhorias'
        ],
        deliverables: [
            'Relatórios de operação',
            'Feedback coletado',
            'Melhorias identificadas'
        ],
        risks: [
            'Incidentes não tratados',
            'Falta de monitoramento',
            'Feedback não coletado'
        ]
    },
    {
        phase: 'Monitor',
        duration: 'Contínuo',
        dependencies: 'Sistema Operacional',
        exitCriteria: 'Métricas coletadas e analisadas.',
        milestone: 'Visibilidade Completa',
        checklist: [
            { 
                label: 'Coleta de métricas', 
                check: () => true,
                description: 'Métricas de performance e qualidade'
            },
            { 
                label: 'Análise de tendências', 
                check: () => true,
                description: 'Identificar padrões e tendências'
            },
            { 
                label: 'Otimizações contínuas', 
                check: () => true,
                description: 'Melhorias baseadas em dados'
            },
        ],
        qaActivities: [
            'Análise de métricas',
            'Identificação de melhorias',
            'Otimização contínua',
            'Relatórios de qualidade'
        ],
        deliverables: [
            'Dashboards de métricas',
            'Relatórios de análise',
            'Recomendações de melhoria'
        ],
        risks: [
            'Métricas não coletadas',
            'Análise insuficiente',
            'Falta de ação'
        ]
    }
];

const Checkbox: React.FC<{ checked: boolean; description?: string }> = ({ checked, description }) => (
    <Tooltip content={description || ''}>
        <div className={`w-5 h-5 rounded border-2 ${checked ? 'bg-green-500 border-green-500' : 'border-surface-border'} flex items-center justify-center flex-shrink-0 cursor-help transition-all`}>
        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 14 11"><path d="M1 5.25L5.028 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
    </Tooltip>
);

export const TimelineView: React.FC<{ project: Project, currentPhaseName: PhaseName | 'N/A' }> = ({ project, currentPhaseName }) => {
    const metrics = useProjectMetrics(project);
    const metricsWithProject = { ...metrics, project };
    const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null);
    const [expandedPhases, setExpandedPhases] = useState<Set<PhaseName>>(new Set());
    const [viewMode, setViewMode] = useState<'table' | 'timeline'>('timeline');

    const togglePhase = (phase: PhaseName) => {
        setExpandedPhases(prev => {
            const newSet = new Set(prev);
            if (newSet.has(phase)) {
                newSet.delete(phase);
            } else {
                newSet.add(phase);
            }
            return newSet;
        });
    };

    const getPhaseProgress = (phase: TimelinePhase): number => {
        const checked = phase.checklist.filter(item => item.check(metricsWithProject)).length;
        return phase.checklist.length > 0 ? (checked / phase.checklist.length) * 100 : 0;
    };

    const getPhaseStatus = (phase: PhaseName): 'completed' | 'current' | 'upcoming' => {
        const phaseStatus = metrics.newPhases.find(p => p.name === phase)?.status;
        if (phaseStatus === 'Concluído') return 'completed';
        if (phaseStatus === 'Em Andamento') return 'current';
        return 'upcoming';
    };

    const completedPhases = metrics.newPhases.filter(p => p.status === 'Concluído').length;
    const totalPhases = timelineData.length;
    const overallProgress = (completedPhases / totalPhases) * 100;

    return (
        <div className="space-y-6">
        <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-text-primary mb-2">Timeline Completa do Projeto</h3>
                        <p className="text-text-secondary">Cronograma detalhado do fluxo de trabalho de QA com dependências, marcos e entregáveis.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'timeline'
                                    ? 'bg-accent text-white'
                                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            Timeline
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'table'
                                    ? 'bg-accent text-white'
                                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            Tabela
                        </button>
                    </div>
                </div>

                {/* Progresso Geral */}
                <div className="p-4 bg-surface border border-surface-border rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-text-secondary font-semibold">Progresso Geral do Projeto</span>
                        <span className="text-text-primary font-bold">{Math.round(overallProgress)}%</span>
                    </div>
                    <ProgressIndicator
                        value={completedPhases}
                        max={totalPhases}
                        color="green"
                        size="lg"
                    />
                    <div className="flex items-center justify-between mt-2 text-sm text-text-secondary">
                        <span>{completedPhases} de {totalPhases} fases concluídas</span>
                        <span>Fase atual: {currentPhaseName}</span>
                    </div>
                </div>

                {viewMode === 'timeline' ? (
                    /* Visualização Timeline */
                    <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-1 bg-surface-border"></div>
                        
                        <div className="space-y-8">
                            {timelineData.map((phase, index) => {
                                const status = getPhaseStatus(phase.phase);
                                const progress = getPhaseProgress(phase);
                                const isExpanded = expandedPhases.has(phase.phase);
                                const isCurrent = phase.phase === currentPhaseName;
                                
                                const statusColors = {
                                    completed: 'bg-green-500',
                                    current: 'bg-blue-500 animate-pulse',
                                    upcoming: 'bg-gray-500'
                                };

                                return (
                                    <div key={phase.phase} className="relative flex items-start gap-6">
                                        {/* Indicador de fase */}
                                        <div className={`relative z-10 w-16 h-16 rounded-full ${statusColors[status]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                            {index + 1}
                                        </div>

                                        {/* Conteúdo da fase */}
                                        <div className="flex-1 pb-8">
                                            <div className={`p-6 bg-surface border ${isCurrent ? 'border-accent' : 'border-surface-border'} rounded-lg hover:shadow-lg transition-all`}>
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className="text-xl font-bold text-text-primary">{phase.phase}</h4>
                                                            <Badge variant={status === 'completed' ? 'success' : status === 'current' ? 'info' : 'default'}>
                                                                {status === 'completed' ? '✅ Concluída' : status === 'current' ? '🔄 Atual' : '⏳ Próxima'}
                                                            </Badge>
                                                            <span className="text-sm text-text-secondary">⏱️ {phase.duration}</span>
                                                        </div>
                                                        <p className="text-text-secondary mb-3">{phase.milestone}</p>
                                                        
                                                        {/* Progresso da fase */}
                                                        <div className="mb-4">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs text-text-secondary">Progresso da fase</span>
                                                                <span className="text-xs font-semibold text-text-primary">{Math.round(progress)}%</span>
                                                            </div>
                                                            <ProgressIndicator
                                                                value={phase.checklist.filter(item => item.check(metricsWithProject)).length}
                                                                max={phase.checklist.length}
                                                                color="blue"
                                                                size="sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => togglePhase(phase.phase)}
                                                        className="text-accent hover:text-accent-light text-sm font-semibold ml-4"
                                                    >
                                                        {isExpanded ? 'Ocultar' : 'Expandir'} ↓
                                                    </button>
                                                </div>

                                                {/* Informações básicas */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-text-secondary mb-1">Dependências</h5>
                                                        <p className="text-sm text-text-primary">{phase.dependencies}</p>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-text-secondary mb-1">Critério de Saída</h5>
                                                        <p className="text-sm text-text-primary">{phase.exitCriteria}</p>
                                                    </div>
                                                </div>

                                                {/* Checklist */}
                                                <div className="mb-4">
                                                    <h5 className="text-sm font-semibold text-text-secondary mb-2">✅ Checklist</h5>
                                                    <div className="space-y-2">
                                                        {phase.checklist.map((item, idx) => {
                                                            const checked = item.check(metricsWithProject);
                                                            return (
                                                                <div key={idx} className={`flex items-start gap-2 p-2 rounded ${checked ? 'bg-green-500/20' : 'bg-surface-hover'}`}>
                                                                    <Checkbox checked={checked} description={item.description} />
                                                                    <span className={`text-sm flex-1 ${checked ? 'text-green-400 line-through' : 'text-text-primary'}`}>
                                                                        {item.label}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Informações expandidas */}
                                                {isExpanded && (
                                                    <div className="mt-4 pt-4 border-t border-surface-border space-y-4">
                                                        {phase.qaActivities && (
                                                            <div>
                                                                <h5 className="text-sm font-semibold text-text-secondary mb-2">🧪 Atividades de QA</h5>
                                                                <ul className="space-y-1">
                                                                    {phase.qaActivities.map((activity, idx) => (
                                                                        <li key={idx} className="flex items-start text-sm text-text-primary">
                                                                            <span className="mr-2 text-blue-400">•</span>
                                                                            <span>{activity}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {phase.deliverables && (
                                                            <div>
                                                                <h5 className="text-sm font-semibold text-text-secondary mb-2">📦 Entregas</h5>
                                                                <ul className="space-y-1">
                                                                    {phase.deliverables.map((deliverable, idx) => (
                                                                        <li key={idx} className="flex items-start text-sm text-text-primary">
                                                                            <span className="mr-2 text-green-400">✓</span>
                                                                            <span>{deliverable}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {phase.risks && (
                                                            <div>
                                                                <h5 className="text-sm font-semibold text-text-secondary mb-2">⚠️ Riscos</h5>
                                                                <ul className="space-y-1">
                                                                    {phase.risks.map((risk, idx) => (
                                                                        <li key={idx} className="flex items-start text-sm text-text-primary">
                                                                            <span className="mr-2 text-orange-400">⚠</span>
                                                                            <span>{risk}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => setSelectedPhase(phase)}
                                                    className="mt-4 text-accent hover:text-accent-light text-sm font-semibold"
                                                >
                                                    Ver Detalhes Completos →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Visualização Tabela */
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead className="border-b-2 border-surface-border text-text-secondary">
                        <tr>
                            <th className="p-3 w-1/12">Fase</th>
                                    <th className="p-3 w-1/12">Status</th>
                            <th className="p-3 w-1/12">Duração</th>
                            <th className="p-3 w-2/12">Dependências</th>
                            <th className="p-3 w-2/12">Critérios de Transição</th>
                            <th className="p-3 w-2/12">Marco</th>
                                    <th className="p-3 w-3/12">Checklist</th>
                        </tr>
                    </thead>
                            <tbody className="divide-y divide-surface-border">
                                {timelineData.map(phase => {
                                    const isCurrent = phase.phase === currentPhaseName;
                                    const isDone = getPhaseStatus(phase.phase) === 'completed';
                                    const progress = getPhaseProgress(phase);
                            
                            return (
                                        <tr 
                                            key={phase.phase} 
                                            className={`${isCurrent ? 'bg-accent/10' : ''} ${isDone ? 'opacity-60' : ''} transition-colors hover:bg-surface-hover cursor-pointer`}
                                            onClick={() => setSelectedPhase(phase)}
                                        >
                                            <td className={`p-3 font-semibold align-top ${isDone ? 'text-text-secondary' : 'text-accent'}`}>
                                                {phase.phase}
                                            </td>
                                            <td className="p-3 align-top">
                                                <Badge variant={isDone ? 'success' : isCurrent ? 'info' : 'default'} size="sm">
                                                    {isDone ? '✅' : isCurrent ? '🔄' : '⏳'}
                                                </Badge>
                                            </td>
                                            <td className={`p-3 align-top ${isDone ? 'text-text-secondary' : 'text-text-primary'}`}>
                                                {phase.duration}
                                            </td>
                                            <td className={`p-3 align-top ${isDone ? 'text-text-secondary' : 'text-text-primary'}`}>
                                                {phase.dependencies}
                                            </td>
                                            <td className={`p-3 align-top ${isDone ? 'text-text-secondary' : 'text-text-primary'}`}>
                                                {phase.exitCriteria}
                                            </td>
                                            <td className={`p-3 align-top ${isDone ? 'text-text-secondary' : 'text-text-primary'}`}>
                                                {phase.milestone}
                                            </td>
                                            <td className="p-3 align-top">
                                                <div className="space-y-2">
                                                    {phase.checklist.map((item, idx) => {
                                                        const checked = item.check(metricsWithProject);
                                                        return (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <Checkbox checked={checked} description={item.description} />
                                                                <span className={`text-xs ${checked ? 'text-green-400 line-through' : 'text-text-primary'}`}>
                                                                    {item.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                    <div className="mt-2">
                                                        <ProgressIndicator
                                                            value={phase.checklist.filter(item => item.check(metricsWithProject)).length}
                                                            max={phase.checklist.length}
                                                            color="blue"
                                                            size="sm"
                                                        />
                                                    </div>
                                                </div>
                                    </td>
                                </tr>
                                    );
                        })}
                    </tbody>
                </table>
            </div>
                )}
        </Card>

            {/* Modal de Detalhes */}
            {selectedPhase && (
                <Modal
                    isOpen={!!selectedPhase}
                    onClose={() => setSelectedPhase(null)}
                    title={`Fase: ${selectedPhase.phase}`}
                >
                    <div className="space-y-6">
                        <div>
                            <Badge variant={getPhaseStatus(selectedPhase.phase) === 'completed' ? 'success' : getPhaseStatus(selectedPhase.phase) === 'current' ? 'info' : 'default'}>
                                {getPhaseStatus(selectedPhase.phase) === 'completed' ? '✅ Concluída' : getPhaseStatus(selectedPhase.phase) === 'current' ? '🔄 Atual' : '⏳ Próxima'}
                            </Badge>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2">Marco</h4>
                            <p className="text-text-primary">{selectedPhase.milestone}</p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2">Duração</h4>
                            <p className="text-text-primary">⏱️ {selectedPhase.duration}</p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2">Dependências</h4>
                            <p className="text-text-primary">{selectedPhase.dependencies}</p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2">Critério de Saída</h4>
                            <p className="text-text-primary">{selectedPhase.exitCriteria}</p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-3">✅ Checklist</h4>
                            <div className="space-y-2">
                                {selectedPhase.checklist.map((item, idx) => {
                                    const checked = item.check(metricsWithProject);
                                    return (
                                        <div key={idx} className={`p-3 rounded-lg ${checked ? 'bg-green-500/20 border border-green-500/30' : 'bg-surface-hover border border-surface-border'}`}>
                                            <div className="flex items-start gap-2">
                                                <Checkbox checked={checked} description={item.description} />
                                                <div className="flex-1">
                                                    <span className={`text-sm font-medium ${checked ? 'text-green-400 line-through' : 'text-text-primary'}`}>
                                                        {item.label}
                                                    </span>
                                                    {item.description && (
                                                        <p className="text-xs text-text-secondary mt-1">{item.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-3">
                                <ProgressIndicator
                                    value={selectedPhase.checklist.filter(item => item.check(metricsWithProject)).length}
                                    max={selectedPhase.checklist.length}
                                    label={`${selectedPhase.checklist.filter(item => item.check(metricsWithProject)).length} de ${selectedPhase.checklist.length} concluídos`}
                                    color="green"
                                />
                            </div>
                        </div>

                        {selectedPhase.qaActivities && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3">🧪 Atividades de QA</h4>
                                <ul className="space-y-2">
                                    {selectedPhase.qaActivities.map((activity, idx) => (
                                        <li key={idx} className="flex items-start text-text-primary">
                                            <span className="mr-2 text-blue-400">•</span>
                                            <span>{activity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedPhase.deliverables && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3">📦 Entregas</h4>
                                <ul className="space-y-2">
                                    {selectedPhase.deliverables.map((deliverable, idx) => (
                                        <li key={idx} className="flex items-start text-text-primary">
                                            <span className="mr-2 text-green-400">✓</span>
                                            <span>{deliverable}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedPhase.risks && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3">⚠️ Riscos</h4>
                                <ul className="space-y-2">
                                    {selectedPhase.risks.map((risk, idx) => (
                                        <li key={idx} className="flex items-start text-text-primary">
                                            <span className="mr-2 text-orange-400">⚠</span>
                                            <span>{risk}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

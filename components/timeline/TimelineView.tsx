import React, { useState } from 'react';
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
    checklist: { label: string; check: (metrics: any) => boolean; description?: string; }[];
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
        <div
            className={`w-4 h-4 rounded-md border ${checked ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]' : 'border-surface-border bg-transparent'} flex items-center justify-center flex-shrink-0 cursor-help transition-all`}
        >
            {checked && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 14 11">
                    <path d="M1 5.25L5.028 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </div>
    </Tooltip>
);

const PhaseMetaField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">{label}</p>
        <p className="text-sm text-text-primary mt-1 leading-snug">{value}</p>
    </div>
);

const ChecklistItem: React.FC<{ item: TimelinePhase['checklist'][number]; checked: boolean }> = ({ item, checked }) => (
    <div
        className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm transition-colors ${
            checked ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-white/5 bg-white/5 text-text-primary'
        }`}
    >
        <Checkbox checked={checked} description={item.description} />
        <span className={`flex-1 leading-snug ${checked ? 'line-through opacity-80' : 'opacity-90'}`}>{item.label}</span>
    </div>
);

interface PhaseCardProps {
    phase: TimelinePhase;
    index: number;
    status: 'completed' | 'current' | 'upcoming';
    isExpanded: boolean;
    isCurrent: boolean;
    onToggle: () => void;
    onSelect: () => void;
    checklistProgress: { value: number; total: number };
    metricsWithProject: any;
}

const detailSectionsConfig = [
    { key: 'qaActivities', title: 'Atividades de QA', icon: '🧪', bullet: 'text-blue-300' },
    { key: 'deliverables', title: 'Entregas', icon: '📦', bullet: 'text-emerald-300' },
    { key: 'risks', title: 'Riscos', icon: '⚠️', bullet: 'text-amber-300' },
] as const;

const statusCircleStyles: Record<'completed' | 'current' | 'upcoming', string> = {
    completed: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50',
    current: 'bg-accent/30 text-accent border-accent/60',
    upcoming: 'bg-white/10 text-text-secondary border-white/20',
};

const PhaseCard: React.FC<PhaseCardProps> = ({
    phase,
    index,
    status,
    isExpanded,
    isCurrent,
    onToggle,
    onSelect,
    checklistProgress,
    metricsWithProject,
}) => {
    const percent = checklistProgress.total ? Math.round((checklistProgress.value / checklistProgress.total) * 100) : 0;
    const statusBadges = {
        completed: { label: '✅ Concluída', variant: 'success' as const },
        current: { label: '🔄 Atual', variant: 'info' as const },
        upcoming: { label: '⏳ Próxima', variant: 'default' as const },
    };

    const detailSections = detailSectionsConfig
        .map((section) => {
            const data = (phase as any)[section.key] as string[] | undefined;
            if (!data || data.length === 0) return null;
            return { ...section, items: data };
        })
        .filter(Boolean) as Array<{ title: string; icon: string; bullet: string; items: string[] }>;

    return (
        <div className="relative flex gap-4 sm:gap-6">
            <div className="relative z-10 flex-shrink-0">
                <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border backdrop-blur-md flex items-center justify-center text-xs font-semibold shadow-lg ${statusCircleStyles[status]}`}
                >
                    {index + 1}
                </div>
            </div>

            <div
                className={`flex-1 rounded-2xl border ${isCurrent ? 'border-accent/70 shadow-[0_18px_40px_-20px_rgba(14,165,233,0.7)]' : 'border-white/5 shadow-[0_18px_40px_-25px_rgba(0,0,0,0.8)]'} bg-surface bg-opacity-80 backdrop-blur-xl p-4 sm:p-5 transition-all`}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[clamp(1rem,2.4vw,1.2rem)] font-semibold text-text-primary">{phase.phase}</h4>
                    <Badge variant={statusBadges[status].variant}>{statusBadges[status].label}</Badge>
                    <span className="text-xs font-medium text-text-secondary">⏱ {phase.duration}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                    <span className="font-medium text-text-primary">{phase.milestone}</span>
                    <span className="hidden sm:inline opacity-40">•</span>
                    <span className="text-text-secondary opacity-80">Progresso {percent}%</span>
                </div>

                <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-accent via-accent to-emerald-400 transition-all"
                        style={{ width: `${percent}%` }}
                    />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <PhaseMetaField label="Dependências" value={phase.dependencies} />
                    <PhaseMetaField label="Critério de Saída" value={phase.exitCriteria} />
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between">
                        <h5 className="text-sm font-semibold text-text-secondary">Checklist</h5>
                        <span className="text-xs text-text-secondary">
                            {checklistProgress.value}/{checklistProgress.total}
                        </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-1.5 max-h-56 overflow-auto pr-1">
                        {phase.checklist.map((item, idx) => {
                            const checked = item.check(metricsWithProject);
                            return <ChecklistItem key={idx} item={item} checked={checked} />;
                        })}
                    </div>
                </div>

                {isExpanded && detailSections.length > 0 && (
                    <div className="mt-4 border-t border-white/5 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {detailSections.map((section) => (
                                <div key={section.title}>
                                    <h5 className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
                                        <span>{section.icon}</span>
                                        {section.title}
                                    </h5>
                                    <ul className="mt-2 space-y-1.5">
                                        {section.items.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-text-primary">
                                                <span className={`mr-2 ${section.bullet}`}>•</span>
                                                <span className="leading-snug">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <button
                        onClick={onToggle}
                        className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary hover:text-accent transition-colors"
                    >
                        {isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                    </button>
                    <button
                        onClick={onSelect}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-light transition-colors"
                    >
                        Ver detalhes completos
                        <span aria-hidden>→</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

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
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 className="text-[clamp(1.4rem,2.5vw,1.75rem)] font-semibold text-text-primary">
                                Timeline Completa do Projeto
                            </h3>
                            <p className="text-sm text-text-secondary">
                                Acompanhe fases, dependências e checklists com layout fluido inspirado no Windows 12.
                            </p>
                        </div>
                        <div className="inline-flex items-center rounded-full border border-white/5 bg-white/5 p-1">
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                    viewMode === 'timeline'
                                        ? 'bg-accent text-white shadow-[0_8px_20px_rgba(14,165,233,0.35)]'
                                        : 'text-text-secondary'
                                }`}
                            >
                                Timeline
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                    viewMode === 'table'
                                        ? 'bg-accent text-white shadow-[0_8px_20px_rgba(14,165,233,0.35)]'
                                        : 'text-text-secondary'
                                }`}
                            >
                                Tabela
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 sm:p-5 backdrop-blur-xl shadow-[0_25px_60px_-35px_rgba(0,0,0,0.9)]">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                                Progresso Geral do Projeto
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                                <span className="font-semibold text-text-primary">
                                    {completedPhases} de {totalPhases} fases
                                </span>
                                <span className="opacity-60">•</span>
                                <span className="font-semibold text-text-primary">{Math.round(overallProgress)}%</span>
                                <span className="opacity-60">•</span>
                                <span>
                                    Fase atual:{' '}
                                    <span className="font-semibold text-text-primary">{currentPhaseName}</span>
                                </span>
                            </div>
                            <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-accent via-accent to-emerald-400 transition-all"
                                    style={{ width: `${overallProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {viewMode === 'timeline' ? (
                        <div className="relative pl-9 sm:pl-16">
                            <div className="absolute inset-y-4 left-4 sm:left-6 w-px bg-gradient-to-b from-white/30 via-surface-border to-transparent"></div>
                            <div className="flex flex-col gap-5 sm:gap-7">
                                {timelineData.map((phase, index) => {
                                    const status = getPhaseStatus(phase.phase);
                                    const isExpanded = expandedPhases.has(phase.phase);
                                    const isCurrent = phase.phase === currentPhaseName;
                                    const checkedCount = phase.checklist.filter(item => item.check(metricsWithProject)).length;

                                    return (
                                        <PhaseCard
                                            key={phase.phase}
                                            phase={phase}
                                            index={index}
                                            status={status}
                                            isExpanded={isExpanded}
                                            isCurrent={isCurrent}
                                            onToggle={() => togglePhase(phase.phase)}
                                            onSelect={() => setSelectedPhase(phase)}
                                            checklistProgress={{ value: checkedCount, total: phase.checklist.length }}
                                            metricsWithProject={metricsWithProject}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto scrollbar-hide rounded-2xl border border-white/5 bg-white/5 p-4">
                            <table className="w-full min-w-[1000px] text-left text-sm">
                                <thead className="border-b border-white/10 text-text-secondary opacity-80">
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
                                <tbody className="divide-y divide-white/5">
                                    {timelineData.map(phase => {
                                        const isCurrent = phase.phase === currentPhaseName;
                                        const isDone = getPhaseStatus(phase.phase) === 'completed';
                                        const progress = getPhaseProgress(phase);

                                        return (
                                            <tr
                                                key={phase.phase}
                                                className={`${isCurrent ? 'bg-accent/10' : ''} ${isDone ? 'opacity-70' : ''} transition-colors hover:bg-white/5 cursor-pointer`}
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
                                                            <p className="text-[11px] text-text-secondary mt-1">{Math.round(progress)}%</p>
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
                </div>
            </Card>

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

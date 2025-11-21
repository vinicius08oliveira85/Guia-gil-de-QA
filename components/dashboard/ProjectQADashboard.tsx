
import React, { useMemo, useState } from 'react';
import { Project, TaskPriority } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { StatCard } from './StatCard';
import { DonutChart } from './DonutChart';
import { BarChartWidget } from './BarChartWidget';
import { LineChartWidget } from './LineChartWidget';
import { RadarChartWidget } from './RadarChartWidget';
import { ProgressIndicator } from '../common/ProgressIndicator';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { CompassIcon, CheckCircleIcon } from '../common/Icons';

export const ProjectQADashboard: React.FC<{ project: Project }> = ({ project }) => {
    const metrics = useProjectMetrics(project);
    const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month'>('all');

    const bugSeverityData = [
        { label: 'Crítico', value: metrics.bugsBySeverity['Crítico'], color: 'bg-red-500' },
        { label: 'Alto', value: metrics.bugsBySeverity['Alto'], color: 'bg-orange-400' },
        { label: 'Médio', value: metrics.bugsBySeverity['Médio'], color: 'bg-yellow-400' },
        { label: 'Baixo', value: metrics.bugsBySeverity['Baixo'], color: 'bg-blue-500' },
    ];

    const testExecutionData = [
        { label: 'Criados', value: metrics.totalTestCases, color: 'bg-slate-500' },
        { label: 'Executados', value: metrics.executedTestCases, color: 'bg-blue-500' },
        { label: 'Aprovados', value: metrics.passedTestCases, color: 'bg-emerald-500' },
    ];

    const maxExecutionValue = Math.max(...testExecutionData.map((d) => d.value), 1);
    const normalizedTestExecutionData = testExecutionData.map((d) => ({
        ...d,
        value: (d.value / maxExecutionValue) * 100,
    }));

    const maxBugsValue = Math.max(...bugSeverityData.map((d) => d.value), 1);
    const normalizedBugSeverityData = bugSeverityData.map((d) => ({ ...d, value: (d.value / maxBugsValue) * 100 }));

    const statusOrder = ['To Do', 'In Progress', 'Done'] as const;
    const priorityRanking: Record<TaskPriority, number> = { Urgente: 0, Alta: 1, Média: 2, Baixa: 3 };
    const periodWindowMs =
        selectedPeriod === 'week'
            ? 7 * 24 * 60 * 60 * 1000
            : selectedPeriod === 'month'
              ? 30 * 24 * 60 * 60 * 1000
              : null;

    const tasksInPeriod = useMemo(() => {
        if (!periodWindowMs) {
            return project.tasks;
        }
        const now = Date.now();
        return project.tasks.filter((task) => {
            if (!task.createdAt) {
                return true;
            }
            const createdAt = new Date(task.createdAt).getTime();
            return now - createdAt <= periodWindowMs;
        });
    }, [project.tasks, periodWindowMs]);

    const totalVisibleTasks = tasksInPeriod.filter((task) => task.type !== 'Bug').length || 1;

    const statusBuckets = useMemo(
        () =>
            statusOrder.map((status) => {
                const list = tasksInPeriod.filter((task) => task.status === status && task.type !== 'Bug');
                return {
                    status,
                    count: list.length,
                    percentage: Math.round((list.length / totalVisibleTasks) * 100),
                };
            }),
        [tasksInPeriod, totalVisibleTasks]
    );

    const highlightTasks = useMemo(() => {
        return tasksInPeriod
            .filter((task) => task.type !== 'Bug')
            .sort((a, b) => {
                const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
                if (statusDiff !== 0) {
                    return statusDiff;
                }
                const aPriority = priorityRanking[a.priority || 'Média'] ?? 2;
                const bPriority = priorityRanking[b.priority || 'Média'] ?? 2;
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }
                return (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            })
            .slice(0, 4);
    }, [tasksInPeriod]);

    const missingTestCases = useMemo(
        () => project.tasks.filter((task) => task.type !== 'Bug' && (!task.testCases || task.testCases.length === 0)),
        [project.tasks]
    );
    const missingBddScenarios = useMemo(
        () => project.tasks.filter((task) => task.type !== 'Bug' && (!task.bddScenarios || task.bddScenarios.length === 0)),
        [project.tasks]
    );
    const unexecutedTestTasks = useMemo(
        () =>
            project.tasks.filter(
                (task) => task.type !== 'Bug' && (task.testCases || []).some((testCase) => testCase.status === 'Not Run')
            ),
        [project.tasks]
    );

    const qaAlerts = useMemo(
        () => [
            {
                label: 'Bugs críticos abertos',
                value: metrics.bugsBySeverity['Crítico'],
                variant: metrics.bugsBySeverity['Crítico'] > 0 ? 'error' : 'success',
                hint: 'Resolva antes da próxima liberação',
            },
            {
                label: 'Tarefas sem casos de teste',
                value: missingTestCases.length,
                variant: missingTestCases.length > 0 ? 'warning' : 'success',
                hint: 'Gere testes com IA ou templates',
            },
            {
                label: 'Cenários BDD pendentes',
                value: missingBddScenarios.length,
                variant: missingBddScenarios.length > 0 ? 'info' : 'success',
                hint: 'Mantenha a documentação viva',
            },
            {
                label: 'Casos aguardando execução',
                value: unexecutedTestTasks.length,
                variant: unexecutedTestTasks.length > 0 ? 'warning' : 'success',
                hint: 'Garanta execução completa do sprint',
            },
        ],
        [metrics.bugsBySeverity, missingTestCases.length, missingBddScenarios.length, unexecutedTestTasks.length]
    );

    if (project.tasks.length === 0) {
        return (
            <EmptyState icon="📊" title="Nenhuma métrica disponível" description="Adicione tarefas ao projeto para ver métricas e análises." />
        );
    }

    const periodLabels = {
        all: 'Tudo',
        week: 'Últimos 7 dias',
        month: 'Últimos 30 dias',
    };

    const statusColors: Record<(typeof statusOrder)[number], string> = {
        'To Do': 'bg-slate-500',
        'In Progress': 'bg-amber-400',
        Done: 'bg-emerald-500',
    };

    return (
        <div className="space-y-6">
            <div className="win-toolbar flex flex-col gap-4 rounded-[26px] border border-surface-border/60 bg-gradient-to-br from-white/8 via-white/2 to-transparent px-4 py-4 sm:px-6 sm:py-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Dashboard sincronizado</p>
                    <h2 className="text-[clamp(1.3rem,3vw,2rem)] font-semibold text-text-primary">
                        Qualidade de QA • {project.name}
                    </h2>
                    <p className="text-sm text-text-secondary">
                        Visual unificado com tarefas, sugestões inteligentes e indicadores do fluxo de QA.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {(['all', 'week', 'month'] as const).map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                                selectedPeriod === period
                                    ? 'border-accent/40 bg-accent/20 text-text-primary shadow-[0_10px_40px_rgba(14,109,253,0.2)]'
                                    : 'border-white/10 bg-white/5 text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {periodLabels[period]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Fase atual"
                        value={metrics.currentPhase}
                        description="Etapa com mais impacto agora"
                        icon={<CompassIcon className="h-6 w-6 text-accent" />}
                        accent="accent"
                    />
                    <StatCard
                        title="Cobertura de testes"
                        value={`${metrics.testCoverage}%`}
                        description={`${metrics.tasksWithTestCases}/${metrics.totalTasks} tarefas com casos`}
                        trend={metrics.testCoverage >= 80 ? 5 : -8}
                        trendLabel="variação estimada"
                        accent="success"
                    />
                    <StatCard
                        title="Automação"
                        value={`${metrics.automationRatio}%`}
                        description={`${metrics.automatedTestCases}/${metrics.totalTestCases || 1} casos automatizados`}
                        accent="accent"
                    />
                    <StatCard
                        title="Bugs críticos"
                        value={metrics.bugsBySeverity['Crítico']}
                        description="Monitoramento contínuo"
                        statusColor={metrics.bugsBySeverity['Crítico'] > 0 ? 'text-red-400' : 'text-emerald-400'}
                        accent="danger"
                    />
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(280px,0.9fr)]">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <DonutChart
                                title="Cobertura consolidada"
                                percentage={metrics.testCoverage}
                                color="text-emerald-400"
                                note={`${metrics.tasksWithTestCases} tarefas com QA de ${metrics.totalTasks}`}
                            />
                            <DonutChart
                                title="Automação x Manual"
                                percentage={metrics.automationRatio}
                                color="text-blue-400"
                                note={`${metrics.automatedTestCases} automatizados (${metrics.totalTestCases} totais)`}
                            />
                        </div>

                        <div className="win-panel space-y-5">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-lg font-semibold text-text-primary">Progresso geral</h3>
                                <Badge
                                    variant={
                                        metrics.testPassRate >= 80 ? 'success' : metrics.testPassRate >= 60 ? 'warning' : 'error'
                                    }
                                >
                                    {metrics.testPassRate}% de aprovação
                                </Badge>
                            </div>
                            <div className="space-y-4">
                                <ProgressIndicator
                                    value={metrics.tasksWithTestCases}
                                    max={metrics.totalTasks}
                                    label="Tarefas com casos de teste"
                                    color="blue"
                                />
                                <ProgressIndicator
                                    value={metrics.executedTestCases}
                                    max={metrics.totalTestCases}
                                    label="Casos executados"
                                    color="green"
                                />
                                <ProgressIndicator
                                    value={metrics.passedTestCases}
                                    max={metrics.executedTestCases || 1}
                                    label="Casos aprovados"
                                    color="green"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <BarChartWidget
                                title="Testes criados / executados / aprovados"
                                data={normalizedTestExecutionData}
                                rawData={testExecutionData}
                            />
                            <BarChartWidget
                                title="Bugs abertos por severidade"
                                data={normalizedBugSeverityData}
                                rawData={bugSeverityData}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <StatCard
                                title="Bugs abertos / fechados"
                                value={`${metrics.openVsClosedBugs.open} / ${metrics.openVsClosedBugs.closed}`}
                                description="Saúde do backlog"
                                accent="neutral"
                            />
                            <DonutChart
                                title="Taxa de aprovação"
                                percentage={metrics.testPassRate}
                                color="text-emerald-400"
                                note={`${metrics.passedTestCases} de ${metrics.executedTestCases} casos passaram`}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <RadarChartWidget title="Qualidade por módulo (Epics)" data={metrics.qualityByModule} />
                            <LineChartWidget
                                title="Progresso cumulativo de tarefas"
                                data={metrics.cumulativeProgress}
                                series={[
                                    { name: 'Criadas', color: 'stroke-blue-500' },
                                    { name: 'Concluídas', color: 'stroke-emerald-400' },
                                ]}
                            />
                        </div>
                    </div>
                    <aside className="space-y-4">
                        <div className="win-panel space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-text-primary">Fluxo das tarefas de QA</h3>
                                <Badge variant="info" size="sm">
                                    {periodLabels[selectedPeriod]}
                                </Badge>
                            </div>
                            <div className="space-y-4">
                                {statusBuckets.map((bucket) => (
                                    <div key={bucket.status}>
                                        <div className="flex items-center justify-between text-sm text-text-secondary">
                                            <span>{bucket.status}</span>
                                            <span className="font-semibold text-text-primary">{bucket.count}</span>
                                        </div>
                                        <div className="mt-1 h-2 rounded-full bg-white/5">
                                            <div
                                                className={`h-2 rounded-full ${statusColors[bucket.status]}`}
                                                style={{ width: `${bucket.percentage}%` }}
                                                aria-label={`Status ${bucket.status}`}
                                                role="progressbar"
                                                aria-valuenow={bucket.percentage}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="win-panel space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-text-primary">Alertas imediatos</h3>
                                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="space-y-3">
                                {qaAlerts.map((alert) => (
                                    <div
                                        key={alert.label}
                                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-3 py-2"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">{alert.label}</p>
                                            <p className="text-xs text-text-secondary">{alert.hint}</p>
                                        </div>
                                        <Badge variant={alert.variant as 'default' | 'success' | 'warning' | 'error' | 'info'}>
                                            {alert.value}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="win-panel space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-text-primary">Próximas ações de QA</h3>
                                <Badge variant="default" size="sm">
                                    {highlightTasks.length} itens
                                </Badge>
                            </div>
                            {highlightTasks.length === 0 ? (
                                <p className="text-sm text-text-secondary">Sem pendências críticas neste período.</p>
                            ) : (
                                <div className="space-y-3">
                                    {highlightTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/6 to-transparent px-3 py-2"
                                        >
                                            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-secondary">
                                                <span className="truncate">{task.id}</span>
                                                <Badge
                                                    variant={
                                                        task.status === 'Done'
                                                            ? 'success'
                                                            : task.status === 'In Progress'
                                                              ? 'warning'
                                                              : 'default'
                                                    }
                                                    size="sm"
                                                >
                                                    {task.status}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm font-semibold text-text-primary line-clamp-2">{task.title}</p>
                                            <p className="text-xs text-text-secondary">
                                                {task.priority || 'Prioridade indefinida'} •{' '}
                                                {task.testCases?.length ? `${task.testCases.length} casos` : 'Sem testes'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
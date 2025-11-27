import React from 'react';
import { Card } from '../common/Card';
import { LineChartWidget } from './LineChartWidget';
import { useQualityMetrics } from '../../hooks/useQualityMetrics';
import { Project } from '../../types';
import { logger } from '../../utils/logger';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const integerFormatter = new Intl.NumberFormat('pt-BR');
const decimalFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatDateRange = (start: number, end: number) => {
    return `${dateFormatter.format(new Date(start))} – ${dateFormatter.format(new Date(end))}`;
};

const sumByKey = (list: { [key: string]: number }[], key: string) =>
    list.reduce((total, item) => total + (item?.[key] ?? 0), 0);

const getDeltaPercent = (current: number, previous: number) => {
    if (previous === 0) {
        return current === 0 ? 0 : 100;
    }
    return ((current - previous) / previous) * 100;
};

const formatDeltaLabel = (value: number) => {
    if (!Number.isFinite(value)) {
        return '0%';
    }
    if (value === 0) {
        return '0%';
    }
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
};

interface QualityTrendSectionProps {
    project: Project;
}

export const QualityTrendSection: React.FC<QualityTrendSectionProps> = ({ project }) => {
    const metrics = useQualityMetrics(project);
    
    // Preparar dados para o gráfico de tendência de defeitos
    const defectTrendData = metrics.defectTrend.map(day => ({
        date: day.date,
        series: [day.created, day.closed],
    }));
    
    const totalCreated = sumByKey(metrics.defectTrend, 'created');
    const totalClosed = sumByKey(metrics.defectTrend, 'closed');
    const averageCreatedPerDay = metrics.defectTrend.length > 0 
        ? totalCreated / metrics.defectTrend.length 
        : 0;
    const averageClosedPerDay = metrics.defectTrend.length > 0 
        ? totalClosed / metrics.defectTrend.length 
        : 0;

    const lastWeekSlice = metrics.defectTrend.slice(-7);
    const previousWeekSlice = metrics.defectTrend.slice(-14, -7);
    const weeklyCreated = sumByKey(lastWeekSlice, 'created');
    const previousWeeklyCreated = sumByKey(previousWeekSlice, 'created');
    const weeklyClosed = sumByKey(lastWeekSlice, 'closed');
    const previousWeeklyClosed = sumByKey(previousWeekSlice, 'closed');

    const createdDelta = getDeltaPercent(weeklyCreated, previousWeeklyCreated);
    const closedDelta = getDeltaPercent(weeklyClosed, previousWeeklyClosed);

    const highestDensityModule = metrics.topDefectiveModules[0];
    const highRiskModules = metrics.topDefectiveModules.filter(module => module.defectDensity >= 35).slice(0, 3);
    const topModulesPreview = metrics.topDefectiveModules.slice(0, 4);
    const hasModules = metrics.topDefectiveModules.length > 0;

    const totalOpenBugs = metrics.topDefectiveModules.reduce((sum, module) => sum + module.openBugs, 0);
    const stabilityScore = Math.max(
        0,
        Math.min(
            100,
            Math.round((totalClosed / Math.max(totalCreated, 1)) * 50 + Math.max(0, 50 - totalOpenBugs * 4)),
        ),
    );
    const stabilityStatus = stabilityScore >= 75 ? 'Saudável' : stabilityScore >= 50 ? 'Atenção' : 'Crítico';
    const stabilityAccent =
        stabilityStatus === 'Saudável'
            ? 'text-emerald-400'
            : stabilityStatus === 'Atenção'
            ? 'text-amber-400'
            : 'text-rose-400';

    const periodLabel =
        metrics.defectTrend.length > 0
            ? formatDateRange(metrics.defectTrend[0].date, metrics.defectTrend[metrics.defectTrend.length - 1].date)
            : 'Últimos 30 dias';

    const highlightMetrics = [
        {
            id: 'created',
            title: 'Bugs criados',
            primary: integerFormatter.format(totalCreated),
            caption: 'Acumulado dos últimos 30 dias',
            delta: formatDeltaLabel(createdDelta),
            deltaContext: 'vs. última semana',
            deltaPositive: createdDelta <= 0,
        },
        {
            id: 'closed',
            title: 'Bugs fechados',
            primary: integerFormatter.format(totalClosed),
            caption: totalClosed >= totalCreated ? 'Encerramentos superaram criações' : 'Abaixo do volume criado',
            delta: formatDeltaLabel(closedDelta),
            deltaContext: 'vs. última semana',
            deltaPositive: closedDelta >= 0,
        },
        {
            id: 'density',
            title: highestDensityModule ? 'Módulo mais crítico' : 'Sem módulos críticos',
            primary: highestDensityModule ? `${highestDensityModule.defectDensity}%` : '0%',
            caption: highestDensityModule ? highestDensityModule.module : 'Pronto para escalar QA',
            delta: highestDensityModule
                ? `${highestDensityModule.openBugs} bugs abertos`
                : 'Nenhum bug aberto detectado',
            deltaContext: highestDensityModule ? 'Densidade atual' : '',
            deltaPositive: !highestDensityModule || highestDensityModule.defectDensity < 25,
        },
    ];

    const handleModuleFocus = (moduleName: string, density: number) => {
        logger.info('quality-trend:module-focus', {
            module: moduleName,
            density,
            projectId: project.id,
        });
    };

    const trendBalance = weeklyClosed - weeklyCreated;
    const balanceStatus =
        trendBalance > 0 ? 'Fechamentos à frente' : trendBalance < 0 ? 'Criação acima do fechamento' : 'Fluxo equilibrado';
    
    return (
        <div className="space-y-6">
            <Card className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-slate-800/40 text-white shadow-[0_15px_45px_rgba(15,23,42,0.35)]">
                <div className="absolute inset-x-0 -top-20 h-40 bg-[radial-gradient(circle,_rgba(248,113,113,0.25)_0%,_transparent_65%)] blur-3xl" aria-hidden />
                <div className="relative grid gap-8 lg:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-3">
                        <p className="eyebrow text-white/60">Análise de Risco</p>
                        <h2 className="heading-section text-3xl font-semibold tracking-tight text-white">
                            Tendência de Qualidade
                        </h2>
                        <p className="text-sm text-white/70">
                            Monitoramento contínuo de defeitos, densidade por módulo e equilíbrio entre entradas e saídas de bugs.
                        </p>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">{periodLabel}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {(highRiskModules.length > 0 ? highRiskModules : metrics.topDefectiveModules.slice(0, 3)).map(
                                (module) => (
                                    <span
                                        key={module.module}
                                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
                                        {module.module}
                                        <span className="text-white/60">{module.defectDensity}%</span>
                                    </span>
                                ),
                            )}
                            {metrics.topDefectiveModules.length === 0 && (
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                    Nenhum módulo com alerta
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Saúde Geral</p>
                                <p className="mt-3 text-4xl font-semibold tracking-tight">{stabilityScore}%</p>
                                <p className={`text-sm font-semibold ${stabilityAccent}`}>{stabilityStatus}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-white/60">Bugs abertos</p>
                                <p className="text-lg font-semibold text-white">{integerFormatter.format(totalOpenBugs)}</p>
                            </div>
                        </div>
                        <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-400 transition-all"
                                style={{ width: `${stabilityScore}%` }}
                                aria-label={`Saúde geral em ${stabilityScore}%`}
                            />
                        </div>
                        <p className="mt-4 text-xs text-white/70">
                            {balanceStatus}. Últimos 7 dias tiveram {integerFormatter.format(weeklyCreated)} bugs criados e{' '}
                            {integerFormatter.format(weeklyClosed)} resolvidos.
                        </p>
                    </div>
                </div>

                <div className="relative mt-6 grid gap-4 md:grid-cols-3">
                    {highlightMetrics.map((metric) => (
                        <div
                            key={metric.id}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur transition hover:border-white/30"
                        >
                            <p className="text-xs uppercase tracking-[0.3em] text-white/60">{metric.title}</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{metric.primary}</p>
                            <p className="text-xs text-white/70">{metric.caption}</p>
                            {metric.delta && (
                                <p
                                    className={`mt-3 inline-flex items-center gap-2 text-xs font-semibold ${
                                        metric.deltaPositive ? 'text-emerald-300' : 'text-rose-300'
                                    }`}
                                >
                                    {metric.delta}
                                    {metric.deltaContext && (
                                        <span className="text-white/60">{metric.deltaContext}</span>
                                    )}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
            
            <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                <div className="space-y-4">
                    <LineChartWidget
                        title="Tendência de Defeitos (Últimos 30 dias)"
                        data={defectTrendData}
                        series={[
                            { name: 'Criados', color: 'stroke-rose-500' },
                            { name: 'Fechados', color: 'stroke-emerald-400' },
                        ]}
                        className="!p-5 sm:!p-6 border border-surface-border/60 bg-white/80 backdrop-blur shadow-[0_18px_30px_rgba(15,23,42,0.06)]"
                    />

                    <div className="rounded-3xl border border-surface-border/60 bg-white/90 p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-text-primary">Fluxo da última semana</p>
                                <p className="text-xs text-text-secondary">Atualizado automaticamente</p>
                            </div>
                            <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700">
                                {balanceStatus}
                            </span>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-surface-border/60 bg-white px-3 py-3">
                                <p className="text-xs text-text-secondary">Criados (7d)</p>
                                <p className="text-xl font-semibold text-text-primary">
                                    {integerFormatter.format(weeklyCreated)}
                                </p>
                                <p className="text-[11px] text-rose-500">{formatDeltaLabel(createdDelta)}</p>
                            </div>
                            <div className="rounded-2xl border border-surface-border/60 bg-white px-3 py-3">
                                <p className="text-xs text-text-secondary">Fechados (7d)</p>
                                <p className="text-xl font-semibold text-text-primary">
                                    {integerFormatter.format(weeklyClosed)}
                                </p>
                                <p className="text-[11px] text-emerald-600">{formatDeltaLabel(closedDelta)}</p>
                            </div>
                            <div className="rounded-2xl border border-surface-border/60 bg-white px-3 py-3">
                                <p className="text-xs text-text-secondary">Média diária</p>
                                <p className="text-xl font-semibold text-text-primary">
                                    {decimalFormatter.format(averageCreatedPerDay)} / {decimalFormatter.format(averageClosedPerDay)}
                                </p>
                                <p className="text-[11px] text-text-secondary">Criados • Fechados</p>
                            </div>
                        </div>
                    </div>
                </div>

                {hasModules ? (
                    <Card className="flex flex-col gap-6 !p-5 sm:!p-6 border border-surface-border/70 shadow-[0_12px_25px_rgba(15,23,42,0.08)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="eyebrow text-text-secondary/80">Top Módulos Defeituosos</p>
                                <h4 className="heading-card text-text-primary">Densidade de defeitos</h4>
                            </div>
                            <div className="text-right text-xs text-text-secondary">
                                <p>{periodLabel}</p>
                                <p className="text-emerald-600">Atualizado automaticamente</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {topModulesPreview.map((module, index) => {
                                const width = Math.min(module.defectDensity, 100);
                                const riskLabel =
                                    module.defectDensity >= 40
                                        ? 'Risco alto'
                                        : module.defectDensity >= 25
                                        ? 'Atenção'
                                        : 'Estável';
                                const riskTone =
                                    module.defectDensity >= 40
                                        ? 'text-rose-500 bg-rose-50'
                                        : module.defectDensity >= 25
                                        ? 'text-amber-600 bg-amber-50'
                                        : 'text-emerald-600 bg-emerald-50';

                                return (
                                    <button
                                        key={module.module}
                                        type="button"
                                        onClick={() => handleModuleFocus(module.module, module.defectDensity)}
                                        className="group w-full text-left"
                                    >
                                        <div className="flex flex-col gap-3 rounded-3xl border border-transparent bg-white/70 px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/5 text-sm font-semibold text-text-primary">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-text-primary">{module.module}</p>
                                                            <p className="text-xs text-text-secondary">
                                                                {module.openBugs} bugs abertos • {module.totalTasks} tarefas
                                                            </p>
                                                        </div>
                                                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${riskTone}`}>
                                                            {riskLabel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-text-secondary">
                                                    <span>Densidade</span>
                                                    <span className="font-semibold text-text-primary">{module.defectDensity}%</span>
                                                </div>
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border/60">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300 transition-all"
                                                        style={{ width: `${width}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                ) : (
                    <Card className="flex h-full flex-col items-center justify-center text-center !p-8 border border-dashed border-surface-border/80 text-text-secondary">
                        <h4 className="heading-card text-text-primary mb-2">Top Módulos Defeituosos</h4>
                        <p className="text-sm">
                            Nenhum módulo com bugs abertos encontrado. Mantenha o monitoramento para detectar tendências precocemente.
                        </p>
                    </Card>
                )}
            </div>
            
            {/* Resumo dos Módulos */}
            {hasModules && (
                <Card className="!p-0 overflow-hidden border border-surface-border/70">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border/60 px-6 py-5">
                        <div>
                            <p className="eyebrow text-text-secondary/80">Detalhes dos Módulos</p>
                            <h4 className="heading-card text-text-primary">Raio-X dos 5 principais módulos</h4>
                        </div>
                        <div className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-text-secondary">
                            {metrics.topDefectiveModules.length} módulos monitorados
                        </div>
                    </div>
                    <div className="divide-y divide-surface-border/60">
                        {metrics.topDefectiveModules.slice(0, 5).map((module, index) => {
                            const width = Math.min(module.defectDensity, 100);
                            const badge =
                                module.defectDensity >= 40
                                    ? { label: 'Prioridade imediata', tone: 'text-rose-500 bg-rose-50' }
                                    : module.defectDensity >= 25
                                    ? { label: 'Plano de ação', tone: 'text-amber-600 bg-amber-50' }
                                    : { label: 'Sob controle', tone: 'text-emerald-600 bg-emerald-50' };

                            return (
                                <div
                                    key={module.module}
                                    className="grid gap-4 px-6 py-4 md:grid-cols-[minmax(200px,1.5fr)_1fr_auto]"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/5 text-sm font-semibold text-text-primary">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-text-primary">{module.module}</p>
                                            <p className="text-xs text-text-secondary">
                                                {module.openBugs} bugs abertos • {module.totalTasks} tarefas
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="flex items-center justify-between text-xs text-text-secondary">
                                            <span>Densidade</span>
                                            <span>{module.defectDensity}%</span>
                                        </div>
                                        <div className="mt-2 h-1.5 rounded-full bg-surface-border/60">
                                            <div
                                                className={`h-full rounded-full ${
                                                    module.defectDensity >= 40
                                                        ? 'bg-gradient-to-r from-rose-500 to-orange-400'
                                                        : module.defectDensity >= 25
                                                        ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                                                        : 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                                                }`}
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-center text-right">
                                        <span className="text-lg font-semibold text-text-primary">
                                            {module.defectDensity}%
                                        </span>
                                        <span className={`mt-1 rounded-full px-2 py-1 text-[11px] font-semibold ${badge.tone}`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
};


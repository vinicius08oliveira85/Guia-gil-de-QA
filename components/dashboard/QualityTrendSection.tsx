import React from 'react';
import { Card } from '../common/Card';
import { LineChartWidget } from './LineChartWidget';
import { useQualityMetrics } from '../../hooks/useQualityMetrics';
import { Project } from '../../types';
import { logger } from '../../utils/logger';
import { cn } from '../../utils/windows12Styles';

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

/**
 * Seção de tendência de qualidade com design Windows 12
 * Exibe métricas de defeitos, densidade por módulo e saúde geral
 */
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
            gradient: 'from-rose-950/30 to-red-950/20',
            borderColor: 'border-rose-500/30',
        },
        {
            id: 'closed',
            title: 'Bugs fechados',
            primary: integerFormatter.format(totalClosed),
            caption: totalClosed >= totalCreated ? 'Encerramentos superaram criações' : 'Abaixo do volume criado',
            delta: formatDeltaLabel(closedDelta),
            deltaContext: 'vs. última semana',
            deltaPositive: closedDelta >= 0,
            gradient: 'from-emerald-950/30 to-green-950/20',
            borderColor: 'border-emerald-500/30',
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
            gradient: 'from-amber-950/30 to-orange-950/20',
            borderColor: 'border-amber-500/30',
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
            {/* Hero Card */}
            <Card className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/20 via-slate-900/95 to-slate-800/90 text-slate-100 shadow-xl shadow-rose-500/5 backdrop-blur-xl">
                {/* Glow Effect */}
                <div className="absolute inset-x-0 -top-20 h-40 bg-[radial-gradient(circle,_rgba(244,63,94,0.25)_0%,_transparent_65%)] blur-3xl" aria-hidden />
                <div className="absolute inset-y-0 -right-20 w-40 bg-[radial-gradient(circle,_rgba(139,92,246,0.15)_0%,_transparent_65%)] blur-3xl" aria-hidden />
                
                <div className="relative grid gap-8 lg:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-rose-400/70 font-medium">Análise de Risco</p>
                        <h2 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-slate-100 via-rose-200 to-slate-100 bg-clip-text text-transparent">
                            Tendência de Qualidade
                        </h2>
                        <p className="text-sm text-slate-400">
                            Monitoramento contínuo de defeitos, densidade por módulo e equilíbrio entre entradas e saídas de bugs.
                        </p>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{periodLabel}</p>

                        {/* Module Tags */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {(highRiskModules.length > 0 ? highRiskModules : metrics.topDefectiveModules.slice(0, 3)).map(
                                (module) => (
                                    <span
                                        key={module.module}
                                        className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-rose-400 to-red-500 shadow-sm shadow-rose-500/50" />
                                        {module.module}
                                        <span className="text-rose-400/70">{module.defectDensity}%</span>
                                    </span>
                                ),
                            )}
                            {metrics.topDefectiveModules.length === 0 && (
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500" />
                                    Nenhum módulo com alerta
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Health Score Card */}
                    <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-800/80 p-5 backdrop-blur-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-medium">Saúde Geral</p>
                                <p className={cn(
                                    'mt-3 text-5xl font-bold tracking-tight',
                                    stabilityScore >= 75 ? 'text-emerald-400' : stabilityScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                                )}>
                                    {stabilityScore}%
                                </p>
                                <p className={`text-sm font-semibold ${stabilityAccent}`}>{stabilityStatus}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Bugs abertos</p>
                                <p className="text-2xl font-bold text-slate-200">{integerFormatter.format(totalOpenBugs)}</p>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-slate-700/50">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    stabilityScore >= 75 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                                    stabilityScore >= 50 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                    'bg-gradient-to-r from-rose-400 to-red-500'
                                )}
                                style={{ width: `${stabilityScore}%` }}
                                aria-label={`Saúde geral em ${stabilityScore}%`}
                            />
                        </div>
                        <p className="mt-4 text-xs text-slate-400">
                            {balanceStatus}. Últimos 7 dias tiveram {integerFormatter.format(weeklyCreated)} bugs criados e{' '}
                            {integerFormatter.format(weeklyClosed)} resolvidos.
                        </p>
                    </div>
                </div>

                {/* Highlight Metrics */}
                <div className="relative mt-6 grid gap-4 md:grid-cols-3">
                    {highlightMetrics.map((metric) => (
                        <div
                            key={metric.id}
                            className={cn(
                                'rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]',
                                metric.gradient,
                                metric.borderColor
                            )}
                        >
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">{metric.title}</p>
                            <p className="mt-2 text-2xl font-bold text-slate-100">{metric.primary}</p>
                            <p className="text-xs text-slate-400">{metric.caption}</p>
                            {metric.delta && (
                                <p
                                    className={cn(
                                        'mt-3 inline-flex items-center gap-2 text-xs font-semibold',
                                        metric.deltaPositive ? 'text-emerald-400' : 'text-rose-400'
                                    )}
                                >
                                    {metric.delta}
                                    {metric.deltaContext && (
                                        <span className="text-slate-500">{metric.deltaContext}</span>
                                    )}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
            
            {/* Charts and Modules Grid */}
            <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                <div className="space-y-4">
                    <LineChartWidget
                        title="Tendência de Defeitos (Últimos 30 dias)"
                        data={defectTrendData}
                        series={[
                            { name: 'Criados', color: 'stroke-rose-500' },
                            { name: 'Fechados', color: 'stroke-emerald-400' },
                        ]}
                        className="!p-5 sm:!p-6 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl shadow-xl"
                    />

                    {/* Weekly Flow Card */}
                    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-slate-900/95 to-slate-800/90 p-5 shadow-lg shadow-cyan-500/5 backdrop-blur-xl">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-200">Fluxo da última semana</p>
                                <p className="text-xs text-slate-400">Atualizado automaticamente</p>
                            </div>
                            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                {balanceStatus}
                            </span>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 px-3 py-3">
                                <p className="text-xs text-slate-400">Criados (7d)</p>
                                <p className="text-xl font-bold text-rose-300">
                                    {integerFormatter.format(weeklyCreated)}
                                </p>
                                <p className="text-[11px] text-rose-400">{formatDeltaLabel(createdDelta)}</p>
                            </div>
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-3">
                                <p className="text-xs text-slate-400">Fechados (7d)</p>
                                <p className="text-xl font-bold text-emerald-300">
                                    {integerFormatter.format(weeklyClosed)}
                                </p>
                                <p className="text-[11px] text-emerald-400">{formatDeltaLabel(closedDelta)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-600/30 bg-slate-800/50 px-3 py-3">
                                <p className="text-xs text-slate-400">Média diária</p>
                                <p className="text-xl font-bold text-slate-200">
                                    {decimalFormatter.format(averageCreatedPerDay)} / {decimalFormatter.format(averageClosedPerDay)}
                                </p>
                                <p className="text-[11px] text-slate-500">Criados • Fechados</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Defective Modules */}
                {hasModules ? (
                    <Card className="flex flex-col gap-6 !p-5 sm:!p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-slate-900/95 to-slate-800/90 shadow-lg shadow-violet-500/5 backdrop-blur-xl">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-violet-400/70 font-medium">Top Módulos Defeituosos</p>
                                <h4 className="text-lg font-semibold text-slate-200">Densidade de defeitos</h4>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                <p>{periodLabel}</p>
                                <p className="text-emerald-400">Atualizado automaticamente</p>
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
                                        ? 'text-rose-300 bg-rose-500/15 border-rose-500/30'
                                        : module.defectDensity >= 25
                                        ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                                        : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';

                                return (
                                    <button
                                        key={module.module}
                                        type="button"
                                        onClick={() => handleModuleFocus(module.module, module.defectDensity)}
                                        className="group w-full text-left"
                                    >
                                        <div className="flex flex-col gap-3 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-slate-800/70">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-sm font-bold text-violet-300">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-slate-200">{module.module}</p>
                                                            <p className="text-xs text-slate-400">
                                                                {module.openBugs} bugs abertos • {module.totalTasks} tarefas
                                                            </p>
                                                        </div>
                                                        <span className={cn('rounded-full border px-2 py-1 text-[11px] font-semibold', riskTone)}>
                                                            {riskLabel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-slate-400">
                                                    <span>Densidade</span>
                                                    <span className="font-semibold text-slate-200">{module.defectDensity}%</span>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all duration-500',
                                                            module.defectDensity >= 40 ? 'bg-gradient-to-r from-rose-400 to-red-500' :
                                                            module.defectDensity >= 25 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                                            'bg-gradient-to-r from-emerald-400 to-green-500'
                                                        )}
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
                    <Card className="flex h-full flex-col items-center justify-center text-center !p-8 rounded-2xl border border-dashed border-slate-600/50 bg-slate-900/50 backdrop-blur-sm">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                            <span className="text-3xl">📊</span>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-200 mb-2">Top Módulos Defeituosos</h4>
                        <p className="text-sm text-slate-400">
                            Nenhum módulo com bugs abertos encontrado. Mantenha o monitoramento para detectar tendências precocemente.
                        </p>
                    </Card>
                )}
            </div>
            
            {/* Module Details Table */}
            {hasModules && (
                <Card className="!p-0 overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 px-6 py-5 bg-slate-800/30">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/70 font-medium">Detalhes dos Módulos</p>
                            <h4 className="text-lg font-semibold text-slate-200">Raio-X dos 5 principais módulos</h4>
                        </div>
                        <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                            {metrics.topDefectiveModules.length} módulos monitorados
                        </div>
                    </div>
                    <div className="divide-y divide-slate-700/30">
                        {metrics.topDefectiveModules.slice(0, 5).map((module, index) => {
                            const width = Math.min(module.defectDensity, 100);
                            const badge =
                                module.defectDensity >= 40
                                    ? { label: 'Prioridade imediata', tone: 'text-rose-300 bg-rose-500/15 border-rose-500/30' }
                                    : module.defectDensity >= 25
                                    ? { label: 'Plano de ação', tone: 'text-amber-300 bg-amber-500/15 border-amber-500/30' }
                                    : { label: 'Sob controle', tone: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' };

                            return (
                                <div
                                    key={module.module}
                                    className="grid gap-4 px-6 py-4 md:grid-cols-[minmax(200px,1.5fr)_1fr_auto] hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-sm font-bold text-cyan-300">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-slate-200">{module.module}</p>
                                            <p className="text-xs text-slate-400">
                                                {module.openBugs} bugs abertos • {module.totalTasks} tarefas
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span>Densidade</span>
                                            <span>{module.defectDensity}%</span>
                                        </div>
                                        <div className="mt-2 h-2 rounded-full bg-slate-700/50">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all duration-500',
                                                    module.defectDensity >= 40 ? 'bg-gradient-to-r from-rose-400 to-red-500' :
                                                    module.defectDensity >= 25 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                                    'bg-gradient-to-r from-emerald-400 to-green-500'
                                                )}
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-center text-right">
                                        <span className={cn(
                                            'text-2xl font-bold',
                                            module.defectDensity >= 40 ? 'text-rose-400' :
                                            module.defectDensity >= 25 ? 'text-amber-400' : 'text-emerald-400'
                                        )}>
                                            {module.defectDensity}%
                                        </span>
                                        <span className={cn('mt-1 rounded-full border px-2 py-1 text-[11px] font-semibold', badge.tone)}>
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

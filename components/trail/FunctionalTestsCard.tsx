import React, { useMemo } from 'react';
import { JiraTask } from '../../types';
import { windows12Styles, cn } from '../../utils/windows12Styles';

interface FunctionalTestsCardProps {
    versionLabel: string;
    tasks: JiraTask[];
    totalTestCases: number;
    executedTestCases: number;
    passedTestCases: number;
}

type StatusTone = 'success' | 'warn' | 'danger' | 'info' | 'accent' | 'cyan' | 'violet';

interface MetricCardConfig {
    label: string;
    value: number;
    subtitle?: string;
    progress?: number;
    tone?: StatusTone;
}

const formatPercent = (value: number) => `${Math.round(value)}%`;

/**
 * Card de visão geral dos testes funcionais do projeto,
 * exibindo métricas de execução, aprovação e cobertura.
 * Design Windows 12 com cores vibrantes (cyan/violet/fuchsia)
 */
export const FunctionalTestsCard: React.FC<FunctionalTestsCardProps> = ({
    versionLabel,
    tasks,
    totalTestCases,
    executedTestCases,
    passedTestCases
}) => {
    const failedTestCases = Math.max(executedTestCases - passedTestCases, 0);
    const notRunTestCases = Math.max(totalTestCases - executedTestCases, 0);

    const executionRate = totalTestCases > 0 ? (executedTestCases / totalTestCases) * 100 : 0;
    const passRate = executedTestCases > 0 ? (passedTestCases / executedTestCases) * 100 : 0;
    const failureRate = executedTestCases > 0 ? (failedTestCases / executedTestCases) * 100 : 0;
    const pendingRate = totalTestCases > 0 ? (notRunTestCases / totalTestCases) * 100 : 0;
    const healthScore = Math.round(passRate * 0.65 + executionRate * 0.35);
    const healthDescriptor = getHealthDescriptor(healthScore);

    const tasksWithoutTests = useMemo(() => {
        return tasks
            .filter(task => task.type !== 'Bug' && (!task.testCases || task.testCases.length === 0))
            .slice(0, 3);
    }, [tasks]);

    const tasksWithFailures = useMemo(() => {
        return tasks
            .filter(task => (task.testCases || []).some(test => test.status === 'Failed'))
            .slice(0, 3);
    }, [tasks]);

    const insightCards = [
        {
            title: 'Execução planejada',
            value: formatPercent(executionRate),
            description: executionRate >= 60 ? 'Ritmo dentro do sprint' : 'Abaixo do plano semanal',
            tone: executionRate >= 60 ? 'success' : 'warn'
        },
        {
            title: 'Estabilidade dos testes',
            value: formatPercent(passRate),
            description: failureRate > 25 ? 'Falhas concentradas em regressivos' : 'Falhas sob controle',
            tone: failureRate > 25 ? 'danger' : 'success'
        },
        {
            title: 'Cobertura funcional',
            value: tasksWithoutTests.length === 0 ? 'Completa' : 'Pendências',
            description:
                tasksWithoutTests.length === 0
                    ? 'Todas as histórias possuem casos mapeados'
                    : `${tasksWithoutTests.length} histórias aguardam casos`,
            tone: tasksWithoutTests.length === 0 ? 'success' : 'warn'
        }
    ] as const;

    const metricCards: MetricCardConfig[] = [
        {
            label: 'Casos mapeados',
            value: totalTestCases,
            subtitle: 'Backlog funcional',
            tone: 'info'
        },
        {
            label: 'Executados',
            value: executedTestCases,
            subtitle: `${formatPercent(executionRate)} da suíte`,
            progress: executionRate,
            tone: 'cyan'
        },
        {
            label: 'Falhas',
            value: failedTestCases,
            subtitle:
                failedTestCases > 0 ? `${Math.round(failureRate)}% dos executados` : 'Tudo passando',
            progress: failureRate,
            tone: failedTestCases > 0 ? 'danger' : 'success'
        },
        {
            label: 'Pendentes',
            value: notRunTestCases,
            subtitle: notRunTestCases > 0 ? 'Ainda não executados' : 'Execução completa',
            progress: pendingRate,
            tone: notRunTestCases > 0 ? 'warn' : 'success'
        }
    ];

    return (
        <section className={cn(windows12Styles.card, windows12Styles.spacing.lg, 'space-y-6 min-w-0')}>
            {/* Header com gradiente */}
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/70 font-medium">Bloco 3</p>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-slate-100 via-cyan-200 to-slate-100 bg-clip-text text-transparent">
                        Testes Funcionais
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 break-words">
                        Execução e qualidade dos testes funcionais para {versionLabel}.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <StatusBadge tone={healthDescriptor.tone}>{healthDescriptor.label}</StatusBadge>
                        <StatusBadge tone="cyan">
                            {executionRate >= 80 ? 'Próximo do OKR' : 'Atenção ao plano'}
                        </StatusBadge>
                    </div>
                </div>

                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    {/* Health Score Card */}
                    <div className={cn(
                        'rounded-2xl border px-5 py-4 backdrop-blur-xl',
                        'bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-800/80',
                        healthDescriptor.tone === 'success' ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/10' :
                        healthDescriptor.tone === 'warn' ? 'border-amber-500/30 shadow-lg shadow-amber-500/10' :
                        'border-rose-500/30 shadow-lg shadow-rose-500/10'
                    )}>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Health score</p>
                        <div className="mt-2 flex items-end gap-2">
                            <p className={cn(
                                'text-4xl font-bold',
                                healthDescriptor.tone === 'success' ? 'text-emerald-400' :
                                healthDescriptor.tone === 'warn' ? 'text-amber-400' : 'text-rose-400'
                            )}>
                                {Math.min(healthScore, 100)}
                            </p>
                            <span className="text-sm text-slate-500">/100</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 max-w-[12rem]">{healthDescriptor.copy}</p>
                    </div>
                    
                    {/* Circular Gauge */}
                    <CircularGauge value={passRate} label="Aprovação" caption="Testes aprovados" />
                </div>
            </header>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 min-w-0">
                {metricCards.map(card => (
                    <MetricCard key={card.label} {...card} />
                ))}
            </div>

            {/* Progress Panel & Insights */}
            <div className="grid gap-4 xl:grid-cols-3 min-w-0">
                {/* Progress Panel */}
                <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-slate-900/95 to-violet-950/20 p-5 xl:col-span-2 min-w-0 backdrop-blur-xl shadow-lg shadow-cyan-500/5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/70">
                                Painel de aprovação
                            </p>
                            <h4 className="text-lg font-semibold text-slate-100 break-words">Fluxo de execução</h4>
                        </div>
                        <StatusBadge tone={passRate >= 80 ? 'success' : 'warn'}>
                            {passRate >= 80 ? 'Confortável' : 'Ajustar cenários'}
                        </StatusBadge>
                    </div>
                    <div className="mt-6 space-y-5">
                        <ProgressLine label="Progresso" value={executionRate} color="from-cyan-400 to-blue-500" />
                        <ProgressLine label="Aprovação" value={passRate} color="from-emerald-400 to-green-500" />
                        <ProgressLine
                            label="Falhas"
                            value={failureRate}
                            color="from-amber-400 to-rose-500"
                            invert
                        />
                    </div>
                </div>

                {/* Insights Panel */}
                <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-slate-900/95 to-fuchsia-950/20 p-5 min-w-0 backdrop-blur-xl shadow-lg shadow-violet-500/5">
                    <p className="text-xs uppercase tracking-[0.35em] text-violet-400/70">Insights rápidos</p>
                    <div className="mt-4 space-y-3">
                        {insightCards.map(card => (
                            <div
                                key={card.title}
                                className="flex items-start justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 hover:border-slate-600/60 transition-colors"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-200 break-words">{card.title}</p>
                                    <p className="text-xs text-slate-400 mt-1 break-words">{card.description}</p>
                                </div>
                                <StatusBadge tone={card.tone}>{card.value}</StatusBadge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Coverage & Failures Lists */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 min-w-0 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-amber-400/70 mb-3 font-medium">Cobertura pendente</p>
                    {tasksWithoutTests.length === 0 ? (
                        <EmptyState message="Todas as histórias possuem casos de teste." tone="success" />
                    ) : (
                        <ul className="space-y-3 text-sm text-slate-300 leading-relaxed break-words">
                            {tasksWithoutTests.map(task => (
                                <li key={task.id} className="flex items-start gap-2 break-words">
                                    <span className="mt-1.5 inline-flex size-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm shadow-amber-500/50" />
                                    <span>{task.title}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 min-w-0 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-rose-400/70 mb-3 font-medium">Falhas em atenção</p>
                    {tasksWithFailures.length === 0 ? (
                        <EmptyState message="Nenhuma falha registrada nos testes executados." tone="success" />
                    ) : (
                        <ul className="space-y-3 text-sm text-slate-300 leading-relaxed break-words">
                            {tasksWithFailures.map(task => (
                                <li key={task.id} className="flex items-start gap-2 break-words">
                                    <span className="mt-0.5 text-rose-400">⚠️</span>
                                    <span>{task.title}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
};

// Mapeamento de cores por tom
const toneClasses: Record<StatusTone, string> = {
    success: 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20',
    warn: 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20',
    danger: 'bg-gradient-to-r from-rose-500/20 to-red-500/10 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20',
    info: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/20',
    accent: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20',
    cyan: 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20',
    violet: 'bg-gradient-to-r from-violet-500/20 to-purple-500/10 text-violet-300 border-violet-500/40 shadow-sm shadow-violet-500/20'
};

const StatusBadge: React.FC<{ tone?: StatusTone; children: React.ReactNode }> = ({
    tone = 'info',
    children
}) => (
    <span
        className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
            toneClasses[tone]
        )}
    >
        {children}
    </span>
);

const MetricCard: React.FC<MetricCardConfig> = ({ label, value, subtitle, progress, tone = 'info' }) => {
    const toneGradients: Record<StatusTone, string> = {
        success: 'from-emerald-950/30 to-green-950/20 border-emerald-500/30',
        warn: 'from-amber-950/30 to-orange-950/20 border-amber-500/30',
        danger: 'from-rose-950/30 to-red-950/20 border-rose-500/30',
        info: 'from-blue-950/30 to-indigo-950/20 border-blue-500/30',
        accent: 'from-cyan-950/30 to-blue-950/20 border-cyan-500/30',
        cyan: 'from-cyan-950/30 to-teal-950/20 border-cyan-500/30',
        violet: 'from-violet-950/30 to-purple-950/20 border-violet-500/30'
    };

    const valueColors: Record<StatusTone, string> = {
        success: 'text-emerald-300',
        warn: 'text-amber-300',
        danger: 'text-rose-300',
        info: 'text-blue-300',
        accent: 'text-cyan-300',
        cyan: 'text-cyan-300',
        violet: 'text-violet-300'
    };

    return (
        <div className={cn(
            'rounded-2xl border bg-gradient-to-br backdrop-blur-sm p-4',
            toneGradients[tone]
        )}>
            <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">{label}</p>
            </div>
            <p className={cn('mt-2 text-3xl font-bold leading-tight', valueColors[tone])}>{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            {typeof progress === 'number' ? (
                <LinearProgress value={progress} tone={tone} className="mt-3" />
            ) : null}
        </div>
    );
};

const LinearProgress: React.FC<{ value: number; tone?: StatusTone; className?: string }> = ({
    value,
    tone = 'info',
    className
}) => {
    const gradientMap: Record<StatusTone, string> = {
        success: 'from-emerald-400 to-green-500',
        warn: 'from-amber-400 to-orange-500',
        danger: 'from-rose-400 to-red-500',
        info: 'from-blue-400 to-indigo-500',
        accent: 'from-cyan-400 to-blue-500',
        cyan: 'from-cyan-400 to-teal-500',
        violet: 'from-violet-400 to-purple-500'
    };

    return (
        <div className={className}>
            <div className="h-2 w-full rounded-full bg-slate-700/50">
                <div
                    className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', gradientMap[tone])}
                    style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
                />
            </div>
        </div>
    );
};

const ProgressLine: React.FC<{
    label: string;
    value: number;
    color: string;
    invert?: boolean;
}> = ({ label, value, color, invert = false }) => (
    <div>
        <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">{label}</span>
            <span className="font-semibold text-slate-300">{formatPercent(value)}</span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-slate-700/50 overflow-hidden">
            <div
                className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700 shadow-sm', color)}
                style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
            />
        </div>
        {invert && (
            <p className="text-[11px] text-slate-500 mt-1">
                Quanto menor, melhor — representa falhas registradas.
            </p>
        )}
    </div>
);

const CircularGauge: React.FC<{ value: number; label: string; caption?: string }> = ({
    value,
    label,
    caption
}) => {
    const clamped = Math.min(Math.max(value, 0), 100);
    const color = clamped >= 80 ? '#10b981' : clamped >= 60 ? '#22d3ee' : clamped >= 40 ? '#f59e0b' : '#ef4444';
    
    return (
        <div className="relative flex flex-col items-center gap-2">
            <div className="relative h-24 w-24">
                <div
                    className="absolute inset-0 rounded-full border border-slate-700/50"
                    style={{
                        background: `conic-gradient(${color} ${clamped}%, rgba(51, 65, 85, 0.5) ${clamped}% 100%)`
                    }}
                    aria-hidden
                />
                <div className="absolute inset-2 rounded-full bg-slate-900/90 backdrop-blur-sm" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-400 font-medium">{label}</span>
                    <span className="text-2xl font-bold" style={{ color }}>{Math.round(clamped)}%</span>
                </div>
            </div>
            {caption && <p className="text-xs text-slate-400 text-center max-w-[7rem]">{caption}</p>}
        </div>
    );
};

const EmptyState: React.FC<{ message: string; tone?: 'success' | 'neutral' }> = ({ message, tone = 'neutral' }) => (
    <div className={cn(
        'rounded-xl border border-dashed p-4 text-sm',
        tone === 'success' 
            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' 
            : 'border-slate-600/50 bg-slate-800/30 text-slate-400'
    )}>
        {message}
    </div>
);

const getHealthDescriptor = (value: number) => {
    if (value >= 85) {
        return { label: 'Saudável', copy: 'Execução consistente e falhas sob controle.', tone: 'success' as StatusTone };
    }
    if (value >= 65) {
        return {
            label: 'Em observação',
            copy: 'Monitorar regressivos críticos e acelerar pendências.',
            tone: 'warn' as StatusTone
        };
    }
    return {
        label: 'Crítico',
        copy: 'Planejar reforço para conter falhas e acelerar execução.',
        tone: 'danger' as StatusTone
    };
};

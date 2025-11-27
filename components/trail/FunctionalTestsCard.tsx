import React, { useMemo } from 'react';
import { JiraTask } from '../../types';
import { windows12Styles } from '../../utils/windows12Styles';

interface FunctionalTestsCardProps {
    versionLabel: string;
    tasks: JiraTask[];
    totalTestCases: number;
    executedTestCases: number;
    passedTestCases: number;
}

type StatusTone = 'success' | 'warn' | 'danger' | 'info' | 'accent';

interface MetricCardConfig {
    label: string;
    value: number;
    subtitle?: string;
    progress?: number;
    tone?: StatusTone;
}

const formatPercent = (value: number) => `${Math.round(value)}%`;

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
            tone: 'accent'
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
        <section className={`${windows12Styles.card} ${windows12Styles.spacing.lg} space-y-6`}>
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Bloco 3</p>
                    <h3 className="text-xl font-semibold text-text-primary">Testes Funcionais</h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Execução e qualidade dos testes funcionais para {versionLabel}.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <StatusBadge tone={healthDescriptor.tone}>{healthDescriptor.label}</StatusBadge>
                        <StatusBadge tone="info">
                            {executionRate >= 80 ? 'Próximo do OKR' : 'Atenção ao plano'}
                        </StatusBadge>
                    </div>
                </div>

                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Health score</p>
                        <div className="mt-2 flex items-end gap-2">
                            <p className="text-4xl font-semibold text-text-primary">{Math.min(healthScore, 100)}</p>
                            <span className="text-sm text-text-secondary">/100</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-2 max-w-[12rem]">{healthDescriptor.copy}</p>
                    </div>
                    <CircularGauge value={passRate} label="Aprovação" caption="Testes aprovados" />
                </div>
            </header>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {metricCards.map(card => (
                    <MetricCard key={card.label} {...card} />
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-3xl glass-surface glass-surface--tint p-5 xl:col-span-2">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">
                                Painel de aprovação
                            </p>
                            <h4 className="text-lg font-semibold text-text-primary">Fluxo de execução</h4>
                        </div>
                        <StatusBadge tone={passRate >= 80 ? 'success' : 'warn'}>
                            {passRate >= 80 ? 'Confortável' : 'Ajustar cenários'}
                        </StatusBadge>
                    </div>
                    <div className="mt-6 space-y-5">
                        <ProgressLine label="Progresso" value={executionRate} color="from-sky-400 to-cyan-300" />
                        <ProgressLine label="Aprovação" value={passRate} color="from-emerald-400 to-green-500" />
                        <ProgressLine
                            label="Falhas"
                            value={failureRate}
                            color="from-amber-400 to-red-500"
                            invert
                        />
                    </div>
                </div>

                <div className="rounded-3xl glass-surface p-5">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Insights rápidos</p>
                    <div className="mt-4 space-y-3">
                        {insightCards.map(card => (
                            <div
                                key={card.title}
                                className="flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-white/5 p-3"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">{card.title}</p>
                                    <p className="text-xs text-text-secondary mt-1">{card.description}</p>
                                </div>
                                <StatusBadge tone={card.tone}>{card.value}</StatusBadge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl glass-surface p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary mb-3">Cobertura pendente</p>
                    {tasksWithoutTests.length === 0 ? (
                        <EmptyState message="Todas as histórias possuem casos de teste." />
                    ) : (
                        <ul className="space-y-3 text-sm text-text-primary">
                            {tasksWithoutTests.map(task => (
                                <li key={task.id} className="flex items-start gap-2">
                                    <span className="mt-1 inline-flex size-1.5 rounded-full bg-amber-300" />
                                    <span>{task.title}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="rounded-2xl glass-surface p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary mb-3">Falhas em atenção</p>
                    {tasksWithFailures.length === 0 ? (
                        <EmptyState message="Nenhuma falha registrada nos testes executados." />
                    ) : (
                        <ul className="space-y-3 text-sm text-text-primary">
                            {tasksWithFailures.map(task => (
                                <li key={task.id} className="flex items-start gap-2">
                                    <span role="img" aria-label="alerta" className="mt-0.5">
                                        ⚠️
                                    </span>
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

const toneClasses: Record<StatusTone, string> = {
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warn: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-200 border-sky-500/30',
    accent: 'bg-accent/10 text-accent border-accent/30'
};

const StatusBadge: React.FC<{ tone?: StatusTone; children: React.ReactNode }> = ({
    tone = 'info',
    children
}) => (
    <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${
            toneClasses[tone]
        }`}
    >
        {children}
    </span>
);

const MetricCard: React.FC<MetricCardConfig> = ({ label, value, subtitle, progress, tone = 'info' }) => (
    <div className="rounded-2xl glass-surface p-4">
        <div className="flex items-center justify-between">
            <p className="data-label">{label}</p>
            {subtitle ? <StatusBadge tone={tone}>{subtitle.split(' ')[0]}</StatusBadge> : null}
        </div>
        <p className="data-value mt-2 text-3xl leading-tight text-text-primary">{value}</p>
        {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
        {typeof progress === 'number' ? (
            <LinearProgress value={progress} tone={tone} className="mt-3" />
        ) : null}
    </div>
);

const LinearProgress: React.FC<{ value: number; tone?: StatusTone; className?: string }> = ({
    value,
    tone = 'info',
    className
}) => {
    const gradientMap: Record<StatusTone, string> = {
        success: 'from-emerald-400 to-green-500',
        warn: 'from-amber-400 to-amber-500',
        danger: 'from-rose-400 to-rose-500',
        info: 'from-sky-400 to-cyan-300',
        accent: 'from-accent to-emerald-400'
    };

    return (
        <div className={className}>
            <div className="h-2 w-full rounded-full bg-surface-contrast">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradientMap[tone]}`}
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
        <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{label}</span>
            <span>{formatPercent(value)}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-surface-contrast">
            <div
                className={`h-full rounded-full bg-gradient-to-r ${color}`}
                style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
            />
        </div>
        {invert && (
            <p className="text-[11px] text-text-secondary mt-1">
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
    return (
        <div className="relative flex flex-col items-center gap-2">
            <div className="relative h-24 w-24">
                <div
                    className="absolute inset-0 rounded-full border border-white/10"
                    style={{
                        background: `conic-gradient(#10b981 ${clamped}%, rgba(255,255,255,0.08) ${clamped}% 100%)`
                    }}
                    aria-hidden
                />
                <div className="absolute inset-2 rounded-full bg-surface-contrast/70 backdrop-blur" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm text-text-secondary">{label}</span>
                    <span className="text-2xl font-semibold text-text-primary">{Math.round(clamped)}%</span>
                </div>
            </div>
            {caption && <p className="text-xs text-text-secondary text-center max-w-[7rem]">{caption}</p>}
        </div>
    );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-text-secondary">
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


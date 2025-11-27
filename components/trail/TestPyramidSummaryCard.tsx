import React, { useMemo, useState } from 'react';
import { Project, TestPyramidLevel } from '../../types';
import { cn, windows12Styles } from '../../utils/windows12Styles';

interface TestPyramidSummaryCardProps {
    project: Project;
    versionLabel: string;
}

const pyramidLevels: TestPyramidLevel['level'][] = ['Unitário', 'Integração', 'E2E'];
const defaultDistribution: Record<TestPyramidLevel['level'], number> = {
    Unitário: 65,
    Integração: 25,
    E2E: 10
};

const insightsByLevel: Record<TestPyramidLevel['level'], string[]> = {
    Unitário: [
        'Feedback rápido para regressões',
        'Protege regras de negócio críticas'
    ],
    Integração: [
        'Valida fluxos entre serviços',
        'Evita falhas em contratos e APIs'
    ],
    E2E: [
        'Garante jornadas-chave em produção',
        'Replica cenários reais do usuário'
    ]
};

const levelStyles: Record<TestPyramidLevel['level'], { gradient: string; accent: string; chip: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>; }> = {
    Unitário: {
        gradient: 'from-blue-500 via-blue-400 to-blue-300',
        accent: 'text-blue-200',
        chip: 'border-blue-400/40 bg-blue-500/10 text-blue-100',
        Icon: UnitIcon
    },
    Integração: {
        gradient: 'from-amber-400 via-amber-300 to-yellow-200',
        accent: 'text-amber-900/70',
        chip: 'border-amber-400/40 bg-amber-500/10 text-amber-900/70',
        Icon: IntegracaoIcon
    },
    E2E: {
        gradient: 'from-rose-500 via-rose-400 to-rose-300',
        accent: 'text-rose-50',
        chip: 'border-rose-400/40 bg-rose-500/10 text-rose-50',
        Icon: E2EIcon
    }
};

const extractPercentage = (value?: string): number | undefined => {
    if (!value) return undefined;
    const normalized = value.replace(',', '.');
    const match = normalized.match(/(\d{1,3})(?:\.\d+)?/);
    if (!match) return undefined;
    const parsed = Number(match[1]);
    if (Number.isNaN(parsed) || parsed > 100) return undefined;
    return parsed;
};

export const TestPyramidSummaryCard: React.FC<TestPyramidSummaryCardProps> = ({ project, versionLabel }) => {
    const [expandedLevel, setExpandedLevel] = useState<TestPyramidLevel['level'] | null>('Unitário');
    const [showDetailedView, setShowDetailedView] = useState(false);

    const analysisMap = useMemo(() => {
        if (!project.testPyramidAnalysis) {
            return null;
        }
        return new Map(project.testPyramidAnalysis.distribution.map(level => [level.level, level]));
    }, [project.testPyramidAnalysis]);

    const layers = useMemo(() => {
        return pyramidLevels.map(level => {
            const data = analysisMap?.get(level);
            const pct = extractPercentage(data?.effort) ?? defaultDistribution[level];
            return {
                id: level.toLowerCase(),
                level,
                pct,
                focus: data?.effort || 'Equilíbrio recomendado',
                recommendations: data?.examples ?? []
            };
        });
    }, [analysisMap]);

    const totalRecommendations = useMemo(() => {
        return layers.reduce((acc, layer) => acc + layer.recommendations.length, 0);
    }, [layers]);

    const hasAnalysis = Boolean(project.testPyramidAnalysis);

    const toggleLevel = (level: TestPyramidLevel['level']) => {
        setExpandedLevel(prev => (prev === level ? null : level));
    };

    return (
        <section className={`${windows12Styles.card} ${windows12Styles.spacing.lg} space-y-6`}>
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Bloco 2</p>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <h3 className="text-2xl font-semibold text-text-primary break-words">Pirâmide de Testes</h3>
                        <p className="text-sm text-text-secondary break-words">
                            Distribuição ideal de esforços de teste para {versionLabel}.
                        </p>
                    </div>
                    {hasAnalysis && (
                        <div className="flex flex-wrap gap-2 text-[11px] text-text-secondary">
                            <span className="rounded-full border border-surface-border px-3 py-1">
                                {totalRecommendations} recomendações curadas pela IA
                            </span>
                            <span className="rounded-full border border-surface-border px-3 py-1">
                                Última medição baseada em tarefas ativas
                            </span>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex flex-col gap-6 lg:flex-row">
                <aside className="space-y-4 lg:w-1/3">
                    <div className="rounded-2xl bg-white/5 p-5 shadow-inner">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-text-secondary">Painel rápido</p>
                                <p className="text-base font-semibold text-text-primary">Distribuição visual</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDetailedView(prev => !prev)}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                    showDetailedView
                                        ? 'border-accent/40 bg-accent/10 text-accent-light'
                                        : 'border-surface-border text-text-secondary hover:text-text-primary'
                                )}
                                aria-pressed={showDetailedView}
                            >
                                {showDetailedView ? 'Ver resumo' : 'Ver detalhado'}
                            </button>
                        </div>

                        <div className="relative flex flex-col items-center gap-3 py-4">
                            {layers.slice().reverse().map(layer => {
                                const { gradient, Icon } = levelStyles[layer.level];
                                return (
                                    <div key={layer.level} className="flex w-full justify-center">
                                        <div
                                            style={{ width: `${layer.pct}%` }}
                                            className={cn(
                                                'rounded-xl px-3 py-2 text-center text-sm font-semibold text-text-primary shadow-lg shadow-black/10 transition-all',
                                                'bg-gradient-to-r',
                                                gradient
                                            )}
                                        >
                                            <span className="inline-flex items-center justify-center gap-2">
                                                <span
                                                    className={`flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 ${levelStyles[layer.level].accent}`}
                                                >
                                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                                </span>
                                                {layer.level}
                                                <span className="text-xs opacity-80">({layer.pct}%)</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 grid grid-cols-2 text-[11px] text-text-secondary">
                            <div>
                                Mais lento<br />Mais caro
                            </div>
                            <div className="text-right">
                                Mais rápido<br />Mais barato
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/3 p-4 shadow-inner text-sm text-text-secondary">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-primary">
                            Legenda e percentuais
                        </p>
                        <div className="space-y-2">
                            {layers.map(layer => (
                                <div key={`legend-${layer.level}`} className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            'h-3 w-3 rounded-sm bg-gradient-to-r',
                                            levelStyles[layer.level].gradient
                                        )}
                                    />
                                    <div className="flex-1 font-medium text-text-primary">{layer.level}</div>
                                    <span className="text-xs text-text-secondary">{layer.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="flex-1 space-y-4">
                    {hasAnalysis ? (
                        layers.map(layer => {
                            const { Icon, gradient, chip } = levelStyles[layer.level];
                            const isExpanded = showDetailedView || expandedLevel === layer.level;
                            return (
                                <section
                                    key={`card-${layer.level}`}
                                    className="rounded-2xl border border-surface-border/50 bg-white/5 p-5 shadow-lg shadow-black/5"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex flex-1 items-center gap-4">
                                            <span
                                                className={cn(
                                                    'inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-text-primary shadow-md shadow-black/10',
                                                    gradient
                                                )}
                                            >
                                                <Icon className="h-6 w-6" aria-hidden="true" />
                                            </span>
                                            <div>
                                                <p className="text-lg font-semibold text-text-primary">
                                                    {layer.level}{' '}
                                                    <span className="text-xs text-text-secondary">• foco {layer.focus}</span>
                                                </p>
                                                <p className="text-xs text-text-secondary">
                                                    {layer.recommendations.length} recomendações priorizadas
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', chip)}>
                                                Cobertura ideal {layer.pct}%
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => toggleLevel(layer.level)}
                                                className="text-xs text-text-secondary underline-offset-2 hover:text-text-primary"
                                                aria-expanded={isExpanded}
                                            >
                                                {isExpanded ? 'Recolher' : 'Expandir'}
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded ? (
                                        <div className="mt-4 space-y-3">
                                            {layer.recommendations.map((example, idx) => (
                                                <div
                                                    key={`${layer.level}-example-${idx}`}
                                                    className="flex flex-col gap-2 rounded-xl bg-surface/40 px-4 py-3 text-sm text-text-primary sm:flex-row sm:items-start sm:justify-between"
                                                >
                                                    <p className="flex-1 leading-relaxed">• {example}</p>
                                                    <div className="text-xs text-text-secondary">
                                                        Prioridade baseada em impacto
                                                    </div>
                                                </div>
                                            ))}
                                            {layer.recommendations.length === 0 && (
                                                <p className="text-sm text-text-secondary">
                                                    Sem recomendações para este nível ainda. Gere uma nova análise para preencher.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm text-text-secondary">
                                            Clique em &quot;Expandir&quot; para visualizar recomendações específicas da IA.
                                        </p>
                                    )}

                                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-secondary">
                                        {insightsByLevel[layer.level].map(insight => (
                                            <span
                                                key={`${layer.level}-${insight}`}
                                                className="flex items-center gap-1 rounded-full border border-surface-border px-3 py-1"
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                                {insight}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            );
                        })
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border/70 p-8 text-center text-sm text-text-secondary">
                            <p className="text-base font-semibold text-text-primary">Sem dados de pirâmide ainda</p>
                            <p className="mt-2 max-w-md">
                                Gere uma análise com IA para destravar recomendações táticas por camada de teste e visualizar a distribuição ideal.
                            </p>
                        </div>
                    )}
                </main>
            </div>

            <footer className="rounded-2xl bg-surface-hover/70 p-4 text-xs text-text-secondary">
                <strong className="text-text-primary">Guia rápido:</strong>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                    <li>Converta porcentagens em largura real para reforçar o formato de pirâmide.</li>
                    <li>Use dados da IA armazenados no projeto para calibrar foco e recomendações.</li>
                    <li>Expanda apenas o nível necessário para reduzir ruído visual e manter contexto.</li>
                </ul>
            </footer>
        </section>
    );
};

function UnitIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IntegracaoIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3 8h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3 16h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function E2EIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20 9l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}


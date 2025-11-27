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

// Estilos Windows 12 Bold para cada nível da pirâmide
const levelStyles: Record<TestPyramidLevel['level'], { 
    gradient: string; 
    gradientBg: string;
    accent: string; 
    chip: string; 
    glow: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>; 
}> = {
    Unitário: {
        gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
        gradientBg: 'from-cyan-950/30 via-blue-950/20 to-indigo-950/30',
        accent: 'text-cyan-300',
        chip: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
        glow: 'shadow-cyan-500/20',
        Icon: UnitIcon
    },
    Integração: {
        gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
        gradientBg: 'from-violet-950/30 via-purple-950/20 to-fuchsia-950/30',
        accent: 'text-violet-300',
        chip: 'border-violet-500/40 bg-violet-500/15 text-violet-300',
        glow: 'shadow-violet-500/20',
        Icon: IntegracaoIcon
    },
    E2E: {
        gradient: 'from-rose-400 via-pink-500 to-fuchsia-500',
        gradientBg: 'from-rose-950/30 via-pink-950/20 to-fuchsia-950/30',
        accent: 'text-rose-300',
        chip: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
        glow: 'shadow-rose-500/20',
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

/**
 * Card de resumo da Pirâmide de Testes com design Windows 12
 * Exibe distribuição visual e recomendações por nível
 */
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
        <section className={cn(windows12Styles.card, windows12Styles.spacing.lg, 'space-y-6')}>
            {/* Header */}
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-violet-400/70 font-medium">Bloco 2</p>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">

                            Distribuição ideal de esforços de teste para {versionLabel}.
                        </p>
                    </div>
                    {hasAnalysis && (
                        <div className="flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 px-3 py-1 font-medium">
                                {totalRecommendations} recomendações curadas pela IA
                            </span>
                            <span className="rounded-full border border-slate-600/50 bg-slate-800/50 text-slate-400 px-3 py-1">
                                Última medição baseada em tarefas ativas
                            </span>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Sidebar - Visualização da Pirâmide */}
                <aside className="space-y-4 lg:w-1/3">
                    {/* Painel de Distribuição Visual */}
                    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-slate-900/95 to-fuchsia-950/20 p-5 shadow-lg shadow-violet-500/5 backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-violet-400/70 font-medium">Painel rápido</p>
                                <p className="text-base font-semibold text-slate-100">Distribuição visual</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDetailedView(prev => !prev)}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200',
                                    showDetailedView
                                        ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/20'
                                        : 'border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500/60'
                                )}
                                aria-pressed={showDetailedView}
                            >
                                {showDetailedView ? 'Ver resumo' : 'Ver detalhado'}
                            </button>
                        </div>

                        {/* Pirâmide Visual */}
                        <div className="relative flex flex-col items-center gap-3 py-4">
                            {layers.slice().reverse().map(layer => {
                                const { gradient, Icon, glow } = levelStyles[layer.level];
                                return (
                                    <div key={layer.level} className="flex w-full justify-center">
                                        <div
                                            style={{ width: `${layer.pct}%` }}
                                            className={cn(
                                                'rounded-xl px-3 py-2.5 text-center text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02]',
                                                'bg-gradient-to-r text-white',
                                                gradient,
                                                glow
                                            )}
                                        >
                                            <span className="inline-flex items-center justify-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                                </span>
                                                <span className="drop-shadow-sm">{layer.level}</span>
                                                <span className="text-xs opacity-80">({layer.pct}%)</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 grid grid-cols-2 text-[11px] text-slate-500">
                            <div>
                                Mais lento<br />Mais caro
                            </div>
                            <div className="text-right">
                                Mais rápido<br />Mais barato
                            </div>
                        </div>
                    </div>

                    {/* Legenda */}
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-inner text-sm backdrop-blur-sm">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-300">
                            Legenda e percentuais
                        </p>
                        <div className="space-y-2">
                            {layers.map(layer => (
                                <div key={`legend-${layer.level}`} className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            'h-3 w-3 rounded-sm bg-gradient-to-r shadow-sm',
                                            levelStyles[layer.level].gradient,
                                            levelStyles[layer.level].glow
                                        )}
                                    />
                                    <div className={cn('flex-1 font-medium', levelStyles[layer.level].accent)}>
                                        {layer.level}
                                    </div>
                                    <span className="text-xs text-slate-400">{layer.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content - Cards por Nível */}
                <main className="flex-1 space-y-4">
                    {hasAnalysis ? (
                        layers.map(layer => {
                            const { Icon, gradient, gradientBg, chip, accent, glow } = levelStyles[layer.level];
                            const isExpanded = showDetailedView || expandedLevel === layer.level;
                            return (
                                <section
                                    key={`card-${layer.level}`}
                                    className={cn(
                                        'rounded-2xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-sm transition-all duration-300',
                                        gradientBg,
                                        'border-slate-700/50 hover:border-slate-600/60'
                                    )}
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex flex-1 items-center gap-4">
                                            <span
                                                className={cn(
                                                    'inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg text-white',
                                                    gradient,
                                                    glow
                                                )}
                                            >
                                                <Icon className="h-6 w-6 drop-shadow-sm" aria-hidden="true" />
                                            </span>
                                            <div>
                                                <p className={cn('text-lg font-semibold', accent)}>
                                                    {layer.level}{' '}
                                                    <span className="text-xs text-slate-400">• foco {layer.focus}</span>
                                                </p>
                                                <p className="text-xs text-slate-400">
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
                                                className="text-xs text-slate-400 underline-offset-2 hover:text-slate-200 transition-colors"
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
                                                    className="flex flex-col gap-2 rounded-xl border border-slate-700/40 bg-slate-800/50 px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between"
                                                >
                                                    <p className="flex-1 leading-relaxed text-slate-300">• {example}</p>
                                                    <div className="text-xs text-slate-500">
                                                        Prioridade baseada em impacto
                                                    </div>
                                                </div>
                                            ))}
                                            {layer.recommendations.length === 0 && (
                                                <p className="text-sm text-slate-500">
                                                    Sem recomendações para este nível ainda. Gere uma nova análise para preencher.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm text-slate-500">
                                            Clique em &quot;Expandir&quot; para visualizar recomendações específicas da IA.
                                        </p>
                                    )}

                                    <div className="mt-4 flex flex-wrap gap-3 text-xs">
                                        {insightsByLevel[layer.level].map(insight => (
                                            <span
                                                key={`${layer.level}-${insight}`}
                                                className="flex items-center gap-1.5 rounded-full border border-slate-600/40 bg-slate-800/40 px-3 py-1 text-slate-400"
                                            >
                                                <span className={cn('h-1.5 w-1.5 rounded-full bg-gradient-to-r', gradient)} />
                                                {insight}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            );
                        })
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-violet-500/30 bg-violet-950/10 p-8 text-center text-sm backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                                <span className="text-3xl">📊</span>
                            </div>
                            <p className="text-base font-semibold text-slate-200">Sem dados de pirâmide ainda</p>
                            <p className="mt-2 max-w-md text-slate-400">
                                Gere uma análise com IA para destravar recomendações táticas por camada de teste e visualizar a distribuição ideal.
                            </p>
                        </div>
                    )}
                </main>
            </div>

            {/* Footer */}
            <footer className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 text-xs text-slate-400 backdrop-blur-sm">
                <strong className="text-slate-300">Guia rápido:</strong>
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

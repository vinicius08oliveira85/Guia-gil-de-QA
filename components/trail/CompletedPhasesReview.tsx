import React, { useMemo } from 'react';
import { GeneralIAAnalysis, Phase } from '../../types';
import { windows12Styles } from '../../utils/windows12Styles';
import { Badge } from '../common/Badge';
import { Spinner } from '../common/Spinner';

interface MetricsSummary {
    coverage: number;
    passRate: number;
    automation: number;
}

interface CompletedPhasesReviewProps {
    completedPhases: Phase[];
    metricsSummary: MetricsSummary;
    generalAnalysis?: GeneralIAAnalysis;
    onRefreshAnalysis: () => void;
    isRefreshing: boolean;
    analysisOutdated: boolean;
    onOpenDetailedAnalysis?: () => void;
}

const formatList = (items: string[], emptyMessage: string) => {
    if (!items || items.length === 0) {
        return [emptyMessage];
    }
    return items;
};

export const CompletedPhasesReview: React.FC<CompletedPhasesReviewProps> = ({
    completedPhases,
    metricsSummary,
    generalAnalysis,
    onRefreshAnalysis,
    isRefreshing,
    analysisOutdated,
    onOpenDetailedAnalysis
}) => {
    const summaryLists = useMemo(() => {
        const strengths = [
            `Cobertura de testes em ${metricsSummary.coverage}%`,
            `Taxa de aprovação em ${metricsSummary.passRate}%`,
            `Automação disponível em ${metricsSummary.automation}%`
        ].filter(item => !item.includes('NaN'));

        if (generalAnalysis?.riskCalculation?.overallRisk) {
            strengths.push(`Risco geral: ${generalAnalysis.riskCalculation.overallRisk}`);
        }

        const improvements = formatList(
            generalAnalysis?.detectedProblems || [],
            'Nenhum ponto crítico identificado pela IA.'
        );

        const quickWins = formatList(
            generalAnalysis?.qaImprovements?.slice(0, 4) ||
                generalAnalysis?.missingItems?.slice(0, 4) ||
                [],
            'Adicione tarefas ou execute a IA para recomendações rápidas.'
        );

        return {
            strengths,
            improvements,
            quickWins
        };
    }, [generalAnalysis, metricsSummary]);

    return (
        <section className={`${windows12Styles.card} ${windows12Styles.spacing.lg} space-y-6`}>
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Bloco 3</p>
                    <h3 className="text-xl font-semibold text-text-primary">
                        Fases concluídas & insights da IA
                    </h3>
                    <p className="text-sm text-text-secondary">
                        Histórico do que já foi entregue + oportunidades de melhoria.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={onRefreshAnalysis}
                        disabled={isRefreshing}
                        className={`
                            ${windows12Styles.buttonSecondary}
                            flex items-center justify-center gap-2 text-sm
                        `}
                    >
                        {isRefreshing ? <Spinner small /> : '🔁'}
                        Atualizar IA
                    </button>
                    {onOpenDetailedAnalysis && (
                        <button
                            onClick={onOpenDetailedAnalysis}
                            className={`
                                ${windows12Styles.buttonPrimary}
                                flex items-center justify-center gap-2 text-sm
                            `}
                        >
                            🔎
                            Ver análise detalhada
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr,1fr]">
                <div className="rounded-2xl glass-surface p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary mb-3">
                        Fases concluídas
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {completedPhases.length === 0 && (
                            <p className="text-sm text-text-secondary">
                                Nenhuma fase finalizada ainda. Continue avançando na trilha.
                            </p>
                        )}
                        {completedPhases.map(phase => (
                            <div
                                key={phase.name}
                                className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50 shadow-[0_5px_20px_rgba(16,185,129,0.15)]"
                            >
                                <p className="font-semibold">{phase.name}</p>
                                {phase.summary && (
                                    <p className="text-emerald-100/80 text-xs mt-1 line-clamp-2">
                                        {phase.summary}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className={`
                        rounded-2xl glass-surface p-4
                        ${analysisOutdated ? 'glass-surface--warning' : ''}
                    `}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Saúde da trilha</p>
                        <Badge variant={analysisOutdated ? 'warning' : 'success'}>
                            {analysisOutdated ? 'Revisar IA' : 'Em dia'}
                        </Badge>
                    </div>
                    <p className="text-sm text-text-secondary mt-2">
                        {analysisOutdated
                            ? 'A IA detectou mudanças recentes. Gere novas recomendações para manter seu histórico alinhado.'
                            : 'A trilha está alinhada com a última análise da IA.'}
                    </p>
                    <p className="text-xs text-text-secondary mt-4">
                        Última atualização: {generalAnalysis?.generatedAt
                            ? new Date(generalAnalysis.generatedAt).toLocaleDateString('pt-BR')
                            : 'não executada'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl glass-surface p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary mb-3">
                        Pontos fortes
                    </p>
                    <ul className="space-y-2 text-sm text-emerald-100">
                        {summaryLists.strengths.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span>✨</span>
                                <span className="text-text-primary">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-2xl glass-surface p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary mb-3">
                        Pontos de melhoria
                    </p>
                    <ul className="space-y-2 text-sm text-amber-100">
                        {summaryLists.improvements.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span>⚠️</span>
                                <span className="text-text-primary">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-2xl glass-surface p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary mb-3">
                        Recomendações rápidas
                    </p>
                    <ul className="space-y-2 text-sm text-sky-100">
                        {summaryLists.quickWins.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span>⚡</span>
                                <span className="text-text-primary">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};


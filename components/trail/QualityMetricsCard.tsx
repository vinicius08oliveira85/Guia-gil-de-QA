import React from 'react';
import { BugSeverity, GeneralIAAnalysis } from '../../types';
import { windows12Styles, getRiskStyle } from '../../utils/windows12Styles';
import { ContextualHelp } from '../common/ContextualHelp';

interface QualityMetricsCardProps {
    versionLabel: string;
    passRate: number;
    openVsClosedBugs: { open: number; closed: number };
    bugsBySeverity: Record<BugSeverity, number>;
    qualityByModule: { module: string; quality: number }[];
    generalAnalysis?: GeneralIAAnalysis;
    analysisOutdated: boolean;
    onOpenDetailedAnalysis: () => void;
}

const severityOrder: BugSeverity[] = ['Crítico', 'Alto', 'Médio', 'Baixo'];

export const QualityMetricsCard: React.FC<QualityMetricsCardProps> = ({
    versionLabel,
    passRate,
    openVsClosedBugs,
    bugsBySeverity,
    qualityByModule,
    generalAnalysis,
    analysisOutdated,
    onOpenDetailedAnalysis
}) => {
    const totalBugs = severityOrder.reduce((acc, severity) => acc + (bugsBySeverity[severity] || 0), 0);
    const riskLevel = generalAnalysis?.riskCalculation?.overallRisk;

    return (
        <section className={`${windows12Styles.card} ${windows12Styles.spacing.lg} space-y-5`}>
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Bloco 5</p>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-text-primary">Métricas de Qualidade</h3>
                        <ContextualHelp
                            title="Métricas de Qualidade"
                            content="As métricas de qualidade incluem taxa de aprovação de testes, bugs abertos por severidade e análise de risco. Use a análise IA para obter recomendações personalizadas baseadas no estado atual do projeto."
                            variant="tooltip"
                        />
                    </div>
                    <p className="text-sm text-text-secondary mt-1">
                        Indicadores de estabilidade para {versionLabel}.
                    </p>
                </div>
                <button
                    className={`
                        ${windows12Styles.buttonPrimary}
                        text-sm px-4 py-2
                    `}
                    onClick={onOpenDetailedAnalysis}
                >
                    🔎 Ver análise IA
                </button>
            </header>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl glass-surface p-4">
                    <p className="data-label">Pass rate</p>
                    <p className="data-value mt-1 text-2xl text-emerald-300">{passRate}%</p>
                    <p className="text-xs text-text-secondary mt-1">Casos aprovados / executados</p>
                </div>
                <div className={`rounded-2xl glass-surface p-4 ${analysisOutdated ? 'glass-surface--warning' : ''}`}>
                    <p className="data-label">Bugs Abertos</p>
                    <p className="data-value mt-1 text-2xl text-amber-300">{openVsClosedBugs.open}</p>
                    <p className="text-xs text-text-secondary mt-1">
                        {openVsClosedBugs.open} abertos • {openVsClosedBugs.closed} fechados
                    </p>
                </div>
                <div className="rounded-2xl glass-surface p-4">
                    <p className="data-label">Risco geral</p>
                    {riskLevel ? (
                        <span className={`${getRiskStyle(riskLevel)} inline-block mt-2`}>
                            Risco {riskLevel}
                        </span>
                    ) : (
                        <p className="data-value mt-1 text-2xl text-text-secondary">—</p>
                    )}
                    <p className="text-xs text-text-secondary mt-1">
                        {analysisOutdated ? 'Execute a IA para atualizar o status.' : 'Dados alinhados com a última análise IA.'}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl glass-surface glass-surface--tint p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-text-secondary mb-2">Bugs por severidade</p>
                {totalBugs === 0 ? (
                    <p className="text-sm text-text-secondary">Nenhum bug registrado nesta versão.</p>
                ) : (
                    <ul className="space-y-2 text-sm text-text-primary">
                        {severityOrder.map(severity => {
                            const amount = bugsBySeverity[severity] || 0;
                            const percentage = totalBugs > 0 ? Math.round((amount / totalBugs) * 100) : 0;
                            return (
                                <li key={severity} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span>{severity}</span>
                                        <span className="text-text-secondary">{amount} • {percentage}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-surface-contrast">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-amber-300 to-red-400"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <div className="rounded-2xl glass-surface p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-text-secondary mb-3">Qualidade por módulo</p>
                <div className="space-y-3 text-sm text-text-primary">
                    {qualityByModule.slice(0, 4).map(module => (
                        <div key={module.module}>
                            <div className="flex items-center justify-between">
                                <span>{module.module}</span>
                                <span className="text-text-secondary">{module.quality}%</span>
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-surface-contrast">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                                    style={{ width: `${module.quality}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {qualityByModule.length === 0 && (
                        <p className="text-sm text-text-secondary">Adicione épicos para visualizar a qualidade por domínio.</p>
                    )}
                </div>
            </div>
        </section>
    );
};


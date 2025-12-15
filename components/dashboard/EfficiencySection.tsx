import React, { useState } from 'react';
import { Card } from '../common/Card';
import { StatCard } from './StatCard';
import { DonutChart } from './DonutChart';
import { BarChartWidget } from './BarChartWidget';
import { useQualityMetrics } from '../../hooks/useQualityMetrics';
import { Project } from '../../types';
import { Badge } from '../common/Badge';
import { logger } from '../../utils/logger';

interface EfficiencySectionProps {
    project: Project;
}

export const EfficiencySection: React.FC<EfficiencySectionProps> = ({ project }) => {
    const metrics = useQualityMetrics(project);
    const [expandedEscapedDefects, setExpandedEscapedDefects] = useState(false);
    
    // Preparar dados para o gráfico de distribuição de Cycle Time
    const cycleTimeDistributionData = metrics.cycleTime.distribution.map(dist => ({
        label: dist.range,
        value: dist.count,
        color: 'bg-blue-500',
    }));
    
    const maxDistribution = Math.max(...cycleTimeDistributionData.map(d => d.value), 1);
    const normalizedDistributionData = cycleTimeDistributionData.map(d => ({
        ...d,
        value: (d.value / maxDistribution) * 100,
    }));
    
    // Calcular percentual de estabilidade (inverso de flaky)
    const stabilityPercentage = 100 - metrics.flakyTests.percentage;
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[var(--rounded-box)] border border-base-300 bg-gradient-to-br from-base-100 to-base-200 px-4 py-4 sm:px-6 sm:py-6">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">Melhoria Contínua</p>
                    <h2 className="text-2xl font-semibold tracking-tight text-base-content">
                        Eficiência & Processo
                    </h2>
                    <p className="text-sm text-base-content/70 sm:text-base">
                        Métricas de eficiência, estabilidade e qualidade do processo de QA.
                    </p>
                </div>
            </div>
            
            <div className="grid gap-5 lg:grid-cols-3">
                {/* Cycle Time - Média e Mediana */}
                <StatCard
                    title="Cycle Time (Média)"
                    value={`${metrics.cycleTime.average.toFixed(1)} dias`}
                    description={`Mediana: ${metrics.cycleTime.median.toFixed(1)} dias`}
                    accent="accent"
                />
                
                <StatCard
                    title="Estabilidade da Automação"
                    value={`${stabilityPercentage.toFixed(1)}%`}
                    description={`${metrics.flakyTests.count} testes flaky de ${metrics.flakyTests.totalAutomated} automatizados`}
                    accent={stabilityPercentage >= 95 ? 'success' : stabilityPercentage >= 80 ? 'warning' : 'danger'}
                />
                
                <StatCard
                    title="Defeitos Vazados"
                    value={metrics.escapedDefects.count}
                    description="Bugs que chegaram à produção"
                    accent={metrics.escapedDefects.count === 0 ? 'success' : 'danger'}
                />
            </div>
            
            <div className="grid gap-5 lg:grid-cols-2">
                {/* Distribuição de Cycle Time */}
                <BarChartWidget
                    title="Distribuição de Cycle Time"
                    data={normalizedDistributionData}
                    rawData={cycleTimeDistributionData}
                    interactive={true}
                    onBarClick={(label, value) => {
                        logger.debug(`${label}: ${value} bugs`, 'EfficiencySection');
                    }}
                />
                
                {/* Estabilidade da Automação (Donut Chart) */}
                <DonutChart
                    title="Estabilidade da Automação"
                    percentage={stabilityPercentage}
                    color="text-emerald-700 dark:text-emerald-400"
                    note={`${metrics.flakyTests.totalAutomated - metrics.flakyTests.count} de ${metrics.flakyTests.totalAutomated} testes estáveis`}
                    interactive={true}
                    onClick={() => {
                        logger.debug('Detalhes de flaky tests', 'EfficiencySection');
                    }}
                />
            </div>
            
            {/* Lista de Defeitos Vazados */}
            {metrics.escapedDefects.count > 0 && (
                <Card className="!p-4 sm:!p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="heading-card text-text-primary">
                            Defeitos Vazados para Produção ({metrics.escapedDefects.count})
                        </h4>
                        <button
                            onClick={() => setExpandedEscapedDefects(!expandedEscapedDefects)}
                            className="text-sm text-accent hover:text-accent/80 transition-colors"
                        >
                            {expandedEscapedDefects ? 'Ocultar' : 'Mostrar'}
                        </button>
                    </div>
                    
                    {expandedEscapedDefects && (
                        <div className="space-y-3">
                            {metrics.escapedDefects.bugs.map(bug => (
                                <div
                                    key={bug.id}
                                    className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-mono text-text-secondary">{bug.id}</span>
                                                <Badge variant="error" size="sm">
                                                    {bug.severity || 'N/A'}
                                                </Badge>
                                                {bug.status !== 'Done' && (
                                                    <Badge variant="warning" size="sm">
                                                        Aberto
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="font-semibold text-text-primary">{bug.title}</p>
                                            {bug.description && (
                                                <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                                                    {bug.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};


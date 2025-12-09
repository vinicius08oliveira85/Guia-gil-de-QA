import React from 'react';
import { Card } from '../common/Card';
import { LineChartWidget } from './LineChartWidget';
import { BarChartWidget } from './BarChartWidget';
import { useQualityMetrics } from '../../hooks/useQualityMetrics';
import { Project } from '../../types';
import { logger } from '../../utils/logger';

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
    
    // Preparar dados para o gráfico de top módulos defeituosos
    const topModulesData = metrics.topDefectiveModules.map(module => ({
        label: module.module,
        value: module.defectDensity,
        color: 'bg-rose-500',
    }));
    
    // Normalizar valores para o gráfico de barras (0-100%)
    const maxDensity = Math.max(...topModulesData.map(d => d.value), 1);
    const normalizedModulesData = topModulesData.map(d => ({
        ...d,
        value: (d.value / maxDensity) * 100,
    }));
    
    return (
        <div className="space-y-6">
            <div className="win-toolbar flex flex-col gap-4 rounded-[26px] border border-surface-border/60 bg-gradient-to-br from-white/8 via-white/2 to-transparent px-4 py-4 sm:px-6 sm:py-6">
                <div className="space-y-2">
                    <p className="eyebrow text-text-secondary/80">Análise de Risco</p>
                    <h2 className="heading-section text-text-primary">
                        Tendência de Qualidade
                    </h2>
                    <p className="text-lead text-sm sm:text-base">
                        Acompanhamento de defeitos e identificação de módulos com maior densidade de problemas.
                    </p>
                </div>
            </div>
            
            <div className="grid gap-5 lg:grid-cols-2">
                {/* Gráfico de Tendência de Defeitos */}
                <LineChartWidget
                    title="Tendência de Defeitos (Últimos 30 dias)"
                    data={defectTrendData}
                    series={[
                        { name: 'Criados', color: 'stroke-rose-500' },
                        { name: 'Fechados', color: 'stroke-emerald-400' },
                    ]}
                />
                
                {/* Top Módulos Defeituosos */}
                {topModulesData.length > 0 ? (
                    <BarChartWidget
                        title="Top Módulos Defeituosos (Densidade de Defeitos)"
                        data={normalizedModulesData}
                        rawData={topModulesData}
                        interactive={true}
                        onBarClick={(label, value) => {
                            const module = metrics.topDefectiveModules.find(m => m.module === label);
                            if (module) {
                                logger.debug(`Módulo ${label}: ${module.openBugs} bugs abertos de ${module.totalTasks} tarefas (${value}% de densidade)`, 'QualityTrendSection');
                            }
                        }}
                    />
                ) : (
                    <Card className="!p-4 sm:!p-6">
                        <h4 className="heading-card text-text-primary mb-2">Top Módulos Defeituosos</h4>
                        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-surface-border text-text-secondary/70">
                            Nenhum módulo com bugs abertos encontrado.
                        </div>
                    </Card>
                )}
            </div>
            
            {/* Resumo dos Módulos */}
            {metrics.topDefectiveModules.length > 0 && (
                <Card className="!p-4 sm:!p-6">
                    <h4 className="heading-card text-text-primary mb-4">Detalhes dos Módulos</h4>
                    <div className="space-y-3">
                        {metrics.topDefectiveModules.slice(0, 5).map((module, index) => (
                            <div
                                key={module.module}
                                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-text-primary">{module.module}</p>
                                        <p className="text-xs text-text-secondary">
                                            {module.openBugs} bugs abertos • {module.totalTasks} tarefas
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-rose-400">{module.defectDensity}%</p>
                                    <p className="text-xs text-text-secondary">Densidade</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};


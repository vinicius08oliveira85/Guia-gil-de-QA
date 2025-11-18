
import React, { useState } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { StatCard } from './StatCard';
import { DonutChart } from './DonutChart';
import { BarChartWidget } from './BarChartWidget';
import { LineChartWidget } from './LineChartWidget';
import { RadarChartWidget } from './RadarChartWidget';
import { ProgressIndicator } from '../common/ProgressIndicator';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

export const ProjectQADashboard: React.FC<{ project: Project }> = ({ project }) => {
    const metrics = useProjectMetrics(project);
    const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month'>('all');

    const bugSeverityData = [
        { label: 'Crítico', value: metrics.bugsBySeverity['Crítico'], color: 'bg-red-500' },
        { label: 'Alto', value: metrics.bugsBySeverity['Alto'], color: 'bg-orange-500' },
        { label: 'Médio', value: metrics.bugsBySeverity['Médio'], color: 'bg-yellow-500' },
        { label: 'Baixo', value: metrics.bugsBySeverity['Baixo'], color: 'bg-blue-500' }
    ];

    const testExecutionData = [
        { label: 'Criados', value: metrics.totalTestCases, color: 'bg-gray-500' },
        { label: 'Executados', value: metrics.executedTestCases, color: 'bg-blue-500' },
        { label: 'Aprovados', value: metrics.passedTestCases, color: 'bg-green-500' },
    ];
    
    // Normalize for bar chart percentage
    const maxExecutionValue = Math.max(...testExecutionData.map(d => d.value), 1);
    const normalizedTestExecutionData = testExecutionData.map(d => ({ ...d, value: (d.value / maxExecutionValue) * 100 }));
    
    const maxBugsValue = Math.max(...bugSeverityData.map(d => d.value), 1);
    const normalizedBugSeverityData = bugSeverityData.map(d => ({ ...d, value: (d.value / maxBugsValue) * 100 }));


    if (project.tasks.length === 0) {
        return (
            <EmptyState
                icon="📊"
                title="Nenhuma métrica disponível"
                description="Adicione tarefas ao projeto para ver métricas e análises."
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Filtros de período */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-text-primary">Dashboard de Métricas</h2>
                <div className="flex gap-2">
                    {(['all', 'week', 'month'] as const).map(period => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                selectedPeriod === period
                                    ? 'bg-accent text-white'
                                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            {period === 'all' ? 'Tudo' : period === 'week' ? 'Semana' : 'Mês'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Fase Atual do Projeto" value={metrics.currentPhase} />
                <DonutChart title="% de Cobertura de Testes" percentage={metrics.testCoverage} color="text-teal-500" note={`${metrics.tasksWithTestCases} de ${metrics.totalTasks} tarefas cobertas`}/>
                <DonutChart title="Casos Automatizados vs. Manuais" percentage={metrics.automationRatio} color="text-blue-500" note={`${metrics.automatedTestCases} de ${metrics.totalTestCases} automatizados`} />
                <StatCard title="Bugs Críticos Abertos" value={String(metrics.bugsBySeverity['Crítico'])} statusColor={metrics.bugsBySeverity['Crítico'] > 0 ? 'text-red-400' : 'text-green-400'} />
            </div>

            {/* Indicadores de progresso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-surface border border-surface-border rounded-lg">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Progresso Geral</h3>
                    <div className="space-y-4">
                        <ProgressIndicator
                            value={metrics.tasksWithTestCases}
                            max={metrics.totalTasks}
                            label="Tarefas com Casos de Teste"
                            color="blue"
                        />
                        <ProgressIndicator
                            value={metrics.executedTestCases}
                            max={metrics.totalTestCases}
                            label="Casos de Teste Executados"
                            color="green"
                        />
                        <ProgressIndicator
                            value={metrics.passedTestCases}
                            max={metrics.executedTestCases || 1}
                            label="Casos de Teste Aprovados"
                            color="green"
                        />
                    </div>
                </div>

                <div className="p-4 bg-surface border border-surface-border rounded-lg">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Status do Projeto</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Bugs Críticos</span>
                            <Badge variant={metrics.bugsBySeverity['Crítico'] > 0 ? 'error' : 'success'}>
                                {metrics.bugsBySeverity['Crítico']}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Bugs Abertos</span>
                            <Badge variant={metrics.openVsClosedBugs.open > 0 ? 'warning' : 'success'}>
                                {metrics.openVsClosedBugs.open}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Taxa de Aprovação</span>
                            <Badge variant={metrics.testPassRate >= 80 ? 'success' : metrics.testPassRate >= 60 ? 'warning' : 'error'}>
                                {Math.round(metrics.testPassRate)}%
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <BarChartWidget title="Testes Criados / Executados / Aprovados" data={normalizedTestExecutionData} rawData={testExecutionData} />
                <BarChartWidget title="Quantidade de Bugs Abertos por Severidade" data={normalizedBugSeverityData} rawData={bugSeverityData}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <StatCard title="Bugs Abertos / Fechados" value={`${metrics.openVsClosedBugs.open} / ${metrics.openVsClosedBugs.closed}`} />
                <DonutChart title="Taxa de Aprovação de Testes" percentage={metrics.testPassRate} color="text-green-500" note={`${metrics.passedTestCases} de ${metrics.executedTestCases} aprovados`}/>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <RadarChartWidget title="Radar de Qualidade por Módulo" data={metrics.qualityByModule} />
                <LineChartWidget 
                    title="Progresso Cumulativo de Tarefas" 
                    data={metrics.cumulativeProgress} 
                    series={[{ name: "Criadas", color: "stroke-blue-500" }, { name: "Concluídas", color: "stroke-green-500" }]}
                />
            </div>
        </div>
    );
};
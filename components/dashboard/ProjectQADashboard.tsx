
import React from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { StatCard } from './StatCard';
import { DonutChart } from './DonutChart';
import { BarChartWidget } from './BarChartWidget';
import { LineChartWidget } from './LineChartWidget';
import { RadarChartWidget } from './RadarChartWidget';

export const ProjectQADashboard: React.FC<{ project: Project }> = ({ project }) => {
    const metrics = useProjectMetrics(project);

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


    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard title="Fase Atual do Projeto" value={metrics.currentPhase} />
            <DonutChart title="% de Cobertura de Testes" percentage={metrics.testCoverage} color="text-teal-500" note={`${metrics.tasksWithTestCases} de ${metrics.totalTasks} tarefas cobertas`}/>
            <DonutChart title="Casos Automatizados vs. Manuais" percentage={metrics.automationRatio} color="text-blue-500" note={`${metrics.automatedTestCases} de ${metrics.totalTestCases} automatizados`} />
            <StatCard title="Bugs Críticos Abertos" value={String(metrics.bugsBySeverity['Crítico'])} statusColor={metrics.bugsBySeverity['Crítico'] > 0 ? 'text-red-400' : 'text-green-400'} />
            
            <BarChartWidget title="Testes Criados / Executados / Aprovados" data={normalizedTestExecutionData} rawData={testExecutionData} />
            <BarChartWidget title="Quantidade de Bugs Abertos por Severidade" data={normalizedBugSeverityData} rawData={bugSeverityData}/>

            <StatCard title="Bugs Abertos / Fechados" value={`${metrics.openVsClosedBugs.open} / ${metrics.openVsClosedBugs.closed}`} />
            <DonutChart title="Taxa de Aprovação de Testes" percentage={metrics.testPassRate} color="text-green-500" note={`${metrics.passedTestCases} de ${metrics.executedTestCases} aprovados`}/>
            
            <RadarChartWidget title="Radar de Qualidade por Módulo" data={metrics.qualityByModule} />
            <LineChartWidget 
                title="Progresso Cumulativo de Tarefas" 
                data={metrics.cumulativeProgress} 
                series={[{ name: "Criadas", color: "stroke-blue-500" }, { name: "Concluídas", color: "stroke-green-500" }]}
            />
        </div>
    );
};
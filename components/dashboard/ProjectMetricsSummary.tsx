import React, { useMemo } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { ProjectTrailHeader } from '../trail/ProjectTrailHeader';
import { SDLCPhasesCard } from '../trail/SDLCPhasesCard';
import { TestPyramidSummaryCard } from '../trail/TestPyramidSummaryCard';
import { FunctionalTestsCard } from '../trail/FunctionalTestsCard';
import { CoverageMetricsCard } from '../trail/CoverageMetricsCard';
import { QualityMetricsCard } from '../trail/QualityMetricsCard';
import { QualityTrafficLight } from './QualityTrafficLight';
import { QualityTrendSection } from './QualityTrendSection';
import { EfficiencySection } from './EfficiencySection';
import { EmptyState } from '../common/EmptyState';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';

interface ProjectMetricsSummaryProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
    onNavigateToTask?: (taskId?: string) => void;
    onNavigateToTab?: (tabId: string) => void;
    onAskAI?: () => void;
    isAiLoading?: boolean;
    analysisOutdated?: boolean;
    selectedVersion?: string;
    versionOptions?: string[];
    onVersionChange?: (version: string) => void;
    onOpenDetailedAnalysis?: () => void;
}

const getVersionTags = (tasks: Project['tasks']): string[] => {
    const tags = tasks.flatMap(task => task.tags || []);
    const normalized = tags
        .map(tag => tag.trim().toUpperCase())
        .filter(tag => /^V\d+/.test(tag));
    return Array.from(new Set(normalized));
};

/**
 * Componente consolidado que exibe todas as métricas principais do projeto
 * em uma única visão unificada, eliminando duplicação entre diferentes abas.
 */
export const ProjectMetricsSummary: React.FC<ProjectMetricsSummaryProps> = ({
    project,
    onUpdateProject,
    onNavigateToTask,
    onNavigateToTab,
    onAskAI,
    isAiLoading = false,
    analysisOutdated = false,
    selectedVersion: externalSelectedVersion,
    versionOptions: externalVersionOptions,
    onVersionChange: externalOnVersionChange,
    onOpenDetailedAnalysis
}) => {
    const metrics = useProjectMetrics(project);
    
    // Gerenciar versões internamente se não fornecidas externamente
    const internalVersionOptions = useMemo(() => {
        const detectedVersions = getVersionTags(project.tasks);
        if (detectedVersions.length === 0) {
            return ['Todos', 'V1'];
        }
        return ['Todos', ...detectedVersions];
    }, [project.tasks]);
    
    const versionOptions = externalVersionOptions || internalVersionOptions;
    const [internalSelectedVersion, setInternalSelectedVersion] = React.useState<string>(versionOptions[0]);
    const selectedVersion = externalSelectedVersion || internalSelectedVersion;
    const onVersionChange = externalOnVersionChange || setInternalSelectedVersion;

    const versionTasks = useMemo(() => {
        if (selectedVersion === 'Todos') {
            return project.tasks;
        }
        return project.tasks.filter(task =>
            (task.tags || [])
                .map(tag => tag.toUpperCase())
                .includes(selectedVersion)
        );
    }, [project.tasks, selectedVersion]);

    const scopedMetrics = useMemo(() => {
        if (selectedVersion === 'Todos') {
            return metrics;
        }
        return calculateProjectMetrics({
            ...project,
            tasks: versionTasks
        });
    }, [selectedVersion, metrics, project, versionTasks]);

    const activeMetrics = scopedMetrics;
    const completedPhases = activeMetrics.newPhases.filter(phase => phase.status === 'Concluído');
    const remainingPhases = activeMetrics.newPhases.filter(phase => phase.status !== 'Concluído').length;
    const overallProgress = activeMetrics.newPhases.length
        ? Math.round((completedPhases.length / activeMetrics.newPhases.length) * 100)
        : 0;
    const currentPhase = activeMetrics.newPhases.find(phase => phase.status === 'Em Andamento')?.name ?? 'Planejamento';
    const upcomingPhase = activeMetrics.newPhases.find(phase => phase.status === 'Não Iniciado')?.name;
    const versionLabel = selectedVersion === 'Todos' ? 'Projeto completo' : `Versão ${selectedVersion}`;

    // Verificar se há dados suficientes
    const hasTasks = project.tasks && project.tasks.length > 0;
    
    if (!hasTasks) {
        return (
            <EmptyState
                icon="📊"
                title="Nenhuma métrica disponível"
                description="Adicione tarefas e bugs ao projeto para ver métricas de qualidade e análises."
            />
        );
    }

    return (
        <div className="space-y-8">
            {/* Header com informações principais e seletor de versão */}
            <ProjectTrailHeader
                projectName={project.name}
                versionOptions={versionOptions}
                selectedVersion={selectedVersion}
                onVersionChange={onVersionChange}
                currentPhase={currentPhase}
                nextPhase={upcomingPhase}
                overallProgress={overallProgress}
                remainingPhases={remainingPhases}
                onAskAI={onAskAI}
                isAiLoading={isAiLoading}
                analysisOutdated={analysisOutdated}
                lastAnalysisAt={project.generalIAAnalysis?.generatedAt}
            />

            {/* Semáforo de Qualidade - Status GO/NO-GO */}
            <QualityTrafficLight project={project} />

            {/* Fases SDLC */}
            <SDLCPhasesCard
                phases={activeMetrics.newPhases}
                versionLabel={versionLabel}
                overallProgress={overallProgress}
                onAskAI={onAskAI}
                isAiLoading={isAiLoading}
                analysisOutdated={analysisOutdated}
            />

            {/* Métricas de Testes - Pirâmide e Funcionais */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <TestPyramidSummaryCard project={project} versionLabel={versionLabel} />
                <FunctionalTestsCard
                    versionLabel={versionLabel}
                    tasks={versionTasks}
                    totalTestCases={activeMetrics.totalTestCases}
                    executedTestCases={activeMetrics.executedTestCases}
                    passedTestCases={activeMetrics.passedTestCases}
                />
            </div>

            {/* Métricas de Cobertura e Qualidade */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <CoverageMetricsCard
                    versionLabel={versionLabel}
                    testCoverage={activeMetrics.testCoverage}
                    automationRatio={activeMetrics.automationRatio}
                    tasksWithTestCases={activeMetrics.tasksWithTestCases}
                    totalTasks={activeMetrics.totalTasks}
                    totalTestCases={activeMetrics.totalTestCases}
                    automatedTestCases={activeMetrics.automatedTestCases}
                />
                <QualityMetricsCard
                    versionLabel={versionLabel}
                    passRate={activeMetrics.testPassRate}
                    openVsClosedBugs={activeMetrics.openVsClosedBugs}
                    bugsBySeverity={activeMetrics.bugsBySeverity}
                    qualityByModule={activeMetrics.qualityByModule}
                    generalAnalysis={project.generalIAAnalysis}
                    analysisOutdated={analysisOutdated}
                    onOpenDetailedAnalysis={onOpenDetailedAnalysis || (() => {
                        // Navegar para análise detalhada se necessário
                        onNavigateToTab?.('analysis');
                    })}
                />
            </div>

            {/* Tendência de Qualidade */}
            <QualityTrendSection project={project} />

            {/* Eficiência & Processo */}
            <EfficiencySection project={project} />
        </div>
    );
};


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { ProjectTrailHeader } from './ProjectTrailHeader';
import { NextSteps } from './NextSteps';
import { CompletedPhasesReview } from './CompletedPhasesReview';
import { TimelineRail } from './TimelineRail';
import { generateGeneralIAAnalysis } from '../../services/ai/generalAnalysisService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useAnalysisSync } from '../../hooks/useAnalysisSync';
import { AnalysisView } from '../analysis/AnalysisView';
import { Modal } from '../common/Modal';

interface ProjectTrailProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
    onNavigateToTask?: (taskId?: string) => void;
    onNavigateToTab?: (tabId: string) => void;
}

const getVersionTags = (tasks: Project['tasks']): string[] => {
    const tags = tasks.flatMap(task => task.tags || []);
    const normalized = tags
        .map(tag => tag.trim().toUpperCase())
        .filter(tag => /^V\d+/.test(tag));
    return Array.from(new Set(normalized));
};

export const ProjectTrail: React.FC<ProjectTrailProps> = ({
    project,
    onUpdateProject,
    onNavigateToTask,
    onNavigateToTab
}) => {
    const metrics = useProjectMetrics(project);
    const { handleError, handleSuccess } = useErrorHandler();
    const { needsGeneralReanalysis } = useAnalysisSync({
        project,
        onUpdateProject,
        autoMarkOutdated: true
    });

    const versionOptions = useMemo(() => {
        const detectedVersions = getVersionTags(project.tasks);
        if (detectedVersions.length === 0) {
            return ['Todos', 'V1'];
        }
        return ['Todos', ...detectedVersions];
    }, [project.tasks]);

    const [selectedVersion, setSelectedVersion] = useState<string>(versionOptions[0]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);

    useEffect(() => {
        if (!versionOptions.includes(selectedVersion)) {
            setSelectedVersion(versionOptions[0]);
        }
    }, [versionOptions, selectedVersion]);

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

    const completedPhases = metrics.newPhases.filter(phase => phase.status === 'Concluído');
    const remainingPhases = metrics.newPhases.filter(phase => phase.status !== 'Concluído').length;
    const overallProgress = metrics.newPhases.length
        ? Math.round((completedPhases.length / metrics.newPhases.length) * 100)
        : 0;
    const currentPhase = metrics.newPhases.find(phase => phase.status === 'Em Andamento')?.name ?? 'Planejamento';
    const upcomingPhase = metrics.newPhases.find(phase => phase.status === 'Não Iniciado')?.name;

    const handleAskAI = useCallback(async () => {
        setIsAnalyzing(true);
        try {
            const analysis = await generateGeneralIAAnalysis(project);

            const updatedTasks = project.tasks.map(task => {
                const taskAnalysis = analysis.taskAnalyses.find(ta => ta.taskId === task.id);
                if (!taskAnalysis) return task;

                return {
                    ...task,
                    iaAnalysis: {
                        ...taskAnalysis,
                        generatedAt: new Date().toISOString(),
                        isOutdated: false
                    }
                };
            });

            const updatedProject: Project = {
                ...project,
                tasks: updatedTasks,
                generalIAAnalysis: {
                    ...analysis,
                    isOutdated: false
                }
            };

            onUpdateProject(updatedProject);
            handleSuccess('Recomendações atualizadas pela IA!');
        } catch (error) {
            handleError(error, 'Gerar recomendações com IA');
        } finally {
            setIsAnalyzing(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    const analysisNeedsRefresh = needsGeneralReanalysis();

    const handleStartStep = useCallback(
        (taskId?: string) => {
            onNavigateToTab?.('tasks');
            if (taskId) {
                onNavigateToTask?.(taskId);
            }
        },
        [onNavigateToTab, onNavigateToTask]
    );

    return (
        <div className="space-y-6">
            <ProjectTrailHeader
                projectName={project.name}
                versionOptions={versionOptions}
                selectedVersion={selectedVersion}
                onVersionChange={setSelectedVersion}
                currentPhase={currentPhase}
                nextPhase={upcomingPhase}
                overallProgress={overallProgress}
                remainingPhases={remainingPhases}
                onAskAI={handleAskAI}
                isAiLoading={isAnalyzing}
                analysisOutdated={analysisNeedsRefresh}
                lastAnalysisAt={project.generalIAAnalysis?.generatedAt}
            />

            <NextSteps
                project={project}
                selectedVersion={selectedVersion}
                versionTasks={versionTasks}
                onStartStep={handleStartStep}
            />

            <CompletedPhasesReview
                completedPhases={completedPhases}
                metricsSummary={{
                    coverage: metrics.testCoverage,
                    passRate: metrics.testPassRate,
                    automation: metrics.automationRatio
                }}
                generalAnalysis={project.generalIAAnalysis}
                onRefreshAnalysis={handleAskAI}
                isRefreshing={isAnalyzing}
                analysisOutdated={analysisNeedsRefresh}
                onOpenDetailedAnalysis={() => setShowAnalysisModal(true)}
            />

            <TimelineRail
                project={project}
                phases={metrics.newPhases}
                selectedVersion={selectedVersion}
                versionTasks={versionTasks}
                overallProgress={overallProgress}
                onAskAI={handleAskAI}
                isAiLoading={isAnalyzing}
                analysisOutdated={analysisNeedsRefresh}
            />

            <Modal
                isOpen={showAnalysisModal}
                onClose={() => setShowAnalysisModal(false)}
                title="Análise IA detalhada"
            >
                <div className="max-h-[80vh] overflow-y-auto pr-2">
                    <AnalysisView
                        project={project}
                        onUpdateProject={onUpdateProject}
                        onNavigateToTask={(taskId) => {
                            setShowAnalysisModal(false);
                            handleStartStep(taskId);
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
};


import React, { useState, useCallback, useMemo } from 'react';
import { Project } from '../../types';
import { generateProjectLifecyclePlan, generateShiftLeftAnalysis, generateTestPyramidAnalysis } from '../../services/geminiService';
import { generateGeneralIAAnalysis } from '../../services/ai/generalAnalysisService';
import { Spinner } from '../common/Spinner';
import { ProjectLifecycleCard } from './ProjectLifecycleCard';
import { ShiftLeftCard } from './ShiftLeftCard';
import { TestPyramidCard } from './TestPyramidCard';
import { PhaseLogicGuideCard } from './PhaseLogicGuideCard';
import { GeneralAnalysisCard } from './GeneralAnalysisCard';
import { TaskAnalysisCard } from './TaskAnalysisCard';
import { TestAnalysisCard } from './TestAnalysisCard';
import { AnalysisSection } from './AnalysisSection';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useAnalysisSync } from '../../hooks/useAnalysisSync';

type ViewMode = 'list' | 'grid' | 'detailed';

export const AnalysisView: React.FC<{ 
    project: Project; 
    onUpdateProject: (project: Project) => void;
    onNavigateToTask?: (taskId: string) => void;
}> = ({ project, onUpdateProject, onNavigateToTask }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAnalyzingGeneral, setIsAnalyzingGeneral] = useState(false);
    const [taskViewMode, setTaskViewMode] = useState<ViewMode>('grid');
    const [testViewMode, setTestViewMode] = useState<ViewMode>('grid');
    const [riskFilter, setRiskFilter] = useState<string>('all');
    const { handleError, handleSuccess } = useErrorHandler();
    
    // Sincronização automática de análises
    const { needsGeneralReanalysis } = useAnalysisSync({
        project,
        onUpdateProject,
        autoMarkOutdated: true
    });

    const handleAnalyzeAndUpdateDashboard = useCallback(async () => {
        setIsAnalyzing(true);
        try {
            const [lifecyclePlan, shiftLeft, testPyramid] = await Promise.all([
                generateProjectLifecyclePlan(project.name, project.description, project.tasks, project),
                generateShiftLeftAnalysis(project.name, project.description, project.tasks, project),
                generateTestPyramidAnalysis(project.name, project.description, project.tasks, project)
            ]);
    
            const updatedPhases = project.phases.map(phase => ({
                ...phase, 
                summary: lifecyclePlan[phase.name]?.summary || phase.summary,
                testTypes: lifecyclePlan[phase.name]?.testTypes || phase.testTypes
            }));
    
            const updatedProject: Project = {
                ...project,
                phases: updatedPhases,
                shiftLeftAnalysis: shiftLeft,
                testPyramidAnalysis: testPyramid,
            };
    
            onUpdateProject(updatedProject);
            handleSuccess('Análise do projeto concluída com sucesso!');
    
        } catch (error) {
            handleError(error, 'Analisar dashboard');
        } finally {
            setIsAnalyzing(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    const handleRefreshGeneralAnalysis = useCallback(async () => {
        setIsAnalyzingGeneral(true);
        try {
            const analysis = await generateGeneralIAAnalysis(project);
            
            // Atualizar análises individuais nas tarefas
            const updatedTasks = project.tasks.map(task => {
                const taskAnalysis = analysis.taskAnalyses.find(ta => ta.taskId === task.id);
                if (taskAnalysis) {
                    return {
                        ...task,
                        iaAnalysis: {
                            ...taskAnalysis,
                            generatedAt: new Date().toISOString(),
                            isOutdated: false
                        }
                    };
                }
                return task;
            });

            const updatedProject = {
                ...project,
                tasks: updatedTasks,
                generalIAAnalysis: analysis
            };

            onUpdateProject(updatedProject);
            handleSuccess('Análise geral atualizada com sucesso!');
        } catch (error) {
            handleError(error, 'Atualizar análise geral');
        } finally {
            setIsAnalyzingGeneral(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    // Filtrar análises de tarefas por risco
    const filteredTaskAnalyses = useMemo(() => {
        if (!project.generalIAAnalysis?.taskAnalyses) return [];
        
        let analyses = project.generalIAAnalysis.taskAnalyses;
        
        if (riskFilter !== 'all') {
            analyses = analyses.filter(a => a && a.riskLevel === riskFilter);
        }
        
        // Ordenar por risco (Crítico > Alto > Médio > Baixo)
        const riskOrder: Record<string, number> = { 'Crítico': 4, 'Alto': 3, 'Médio': 2, 'Baixo': 1 };
        return analyses.filter(a => a).sort((a, b) => (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0));
    }, [project.generalIAAnalysis, riskFilter]);

    // Obter análises de testes
    const testAnalyses = useMemo(() => {
        return project.generalIAAnalysis?.testAnalyses || [];
    }, [project.generalIAAnalysis]);

    // Obter tarefas com análises
    const tasksWithAnalyses = useMemo(() => {
        return (project.tasks || []).filter(t => t && t.iaAnalysis);
    }, [project.tasks]);

    // Obter riscos automáticos (tarefas com risco alto ou crítico)
    const highRiskTasks = useMemo(() => {
        return filteredTaskAnalyses.filter(a => 
            a && (a.riskLevel === 'Crítico' || a.riskLevel === 'Alto')
        );
    }, [filteredTaskAnalyses]);

    // Obter tarefas sem análise
    const tasksWithoutAnalysis = useMemo(() => {
        return (project.tasks || []).filter(task => task && (!task.iaAnalysis || task.iaAnalysis.isOutdated));
    }, [project.tasks]);

    // Obter testes sem análise
    const testsWithoutAnalysis = useMemo(() => {
        if (!project.generalIAAnalysis?.testAnalyses) return [];
        const analyzedTestIds = new Set(project.generalIAAnalysis.testAnalyses.filter(ta => ta).map(ta => ta.testId));
        return (project.tasks || []).flatMap(task =>
            (task?.testCases || [])
                .filter(tc => tc && !analyzedTestIds.has(tc.id))
                .map(tc => ({ testCase: tc, task }))
        );
    }, [project.tasks, project.generalIAAnalysis]);

    return (
        <div className="space-y-6 pb-6">
            {/* Header v0-like */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-shrink-0">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                            Análise IA do Projeto
                        </h2>
                        <p className="text-base-content/70 text-sm max-w-2xl">
                            Análises estratégicas e consolidadas geradas por IA para seu projeto
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={handleAnalyzeAndUpdateDashboard}
                            disabled={isAnalyzing}
                            title="Gera plano de ciclo de vida (SDLC), análise Shift-Left e pirâmide de testes para o projeto."
                            className="btn btn-outline btn-sm rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            aria-label="Analisar projeto completo"
                        >
                            {isAnalyzing ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <span>Analisando...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Analisar Projeto</span>
                                </>
                            )}
                        </button>
                        {(!project.generalIAAnalysis || needsGeneralReanalysis()) && (
                            <button
                                type="button"
                                onClick={handleRefreshGeneralAnalysis}
                                disabled={isAnalyzingGeneral}
                                title="Executa análise de risco e recomendações por tarefa e teste (análise geral do projeto)."
                                className="btn btn-primary btn-sm rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-semibold"
                                aria-label="Executar análise geral IA"
                            >
                                {isAnalyzingGeneral ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Analisando...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <span>Análise Geral IA</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Análise Geral */}
            {project.generalIAAnalysis && (
                <GeneralAnalysisCard 
                    analysis={project.generalIAAnalysis}
                    onRefresh={handleRefreshGeneralAnalysis}
                />
            )}

            {/* Aviso se análise geral está desatualizada ou não existe */}
            {(!project.generalIAAnalysis || needsGeneralReanalysis()) && (
                <div className="p-5 bg-warning/10 border border-warning/30 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl animate-pulse">⚠️</span>
                        <div className="flex-1">
                            <h4 className="font-semibold text-base-content mb-1">
                                {!project.generalIAAnalysis 
                                    ? 'Nenhuma análise geral disponível'
                                    : 'Análise geral desatualizada'
                                }
                            </h4>
                            <p className="text-sm text-base-content/70 mb-3">
                                {!project.generalIAAnalysis
                                    ? 'Execute uma análise geral para obter insights consolidados sobre todas as tarefas e testes do projeto.'
                                    : 'A análise geral pode estar desatualizada devido a mudanças recentes no projeto. Execute uma nova análise para obter resultados atualizados.'
                                }
                            </p>
                            <button
                                type="button"
                                onClick={handleRefreshGeneralAnalysis}
                                disabled={isAnalyzingGeneral}
                                title="Executa análise de risco e recomendações por tarefa e teste (análise geral do projeto)."
                                className="btn btn-primary btn-sm rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isAnalyzingGeneral ? <Spinner small /> : '🧠'}
                                <span>Executar Análise Geral</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Análises Pendentes - NOVA SEÇÃO */}
            {(tasksWithoutAnalysis.length > 0 || testsWithoutAnalysis.length > 0) && (
                <AnalysisSection
                    title="Análises Pendentes"
                    icon="⏳"
                    count={tasksWithoutAnalysis.length + testsWithoutAnalysis.length}
                    defaultExpanded={true}
                    emptyState={{
                        icon: '✅',
                        title: 'Todas as análises estão atualizadas',
                        description: 'Não há tarefas ou testes pendentes de análise.'
                    }}
                >
                    {tasksWithoutAnalysis.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                                Tarefas sem análise ({tasksWithoutAnalysis.length})
                            </h4>
                            <div className="space-y-2">
                                {tasksWithoutAnalysis.slice(0, 5).map(task => (
                                    <div
                                        key={task.id}
                                        className="p-3 bg-warning/5 border border-warning/30 rounded-lg hover:border-warning/50 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h5 className="font-semibold text-base-content mb-1">
                                                    {task.title}
                                                </h5>
                                                <p className="text-xs text-base-content/70">
                                                    ID: {task.id} • Status: {task.status}
                                                </p>
                                                {task.iaAnalysis?.isOutdated && (
                                                    <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                                                        ⚠️ Análise desatualizada
                                                    </span>
                                                )}
                                            </div>
                                            {onNavigateToTask && (
                                                <button
                                                    type="button"
                                                    onClick={() => onNavigateToTask(task.id)}
                                                    className="btn btn-ghost btn-xs rounded-full ml-2"
                                                >
                                                    Ver →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {testsWithoutAnalysis.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                                Testes sem análise ({testsWithoutAnalysis.length})
                            </h4>
                            <div className="space-y-2">
                                {testsWithoutAnalysis.slice(0, 5).map(({ testCase, task }) => (
                                    <div
                                        key={testCase.id}
                                        className="p-3 bg-info/5 border border-info/30 rounded-lg hover:border-info/50 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h5 className="font-semibold text-base-content mb-1 line-clamp-1">
                                                    {testCase.description}
                                                </h5>
                                                <p className="text-xs text-base-content/70">
                                                    Tarefa: {task.title} • Status: {testCase.status}
                                                </p>
                                            </div>
                                            {onNavigateToTask && (
                                                <button
                                                    type="button"
                                                    onClick={() => onNavigateToTask(task.id)}
                                                    className="btn btn-ghost btn-xs rounded-full ml-2"
                                                >
                                                    Ver →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </AnalysisSection>
            )}

            {/* Análise Geral */}
            {project.generalIAAnalysis && (
                <GeneralAnalysisCard 
                    analysis={project.generalIAAnalysis}
                    onRefresh={handleRefreshGeneralAnalysis}
                />
            )}

            {/* Análises Recentes */}
            {tasksWithAnalyses.length > 0 && (
                <AnalysisSection
                    title="Análises Recentes"
                    icon="🕐"
                    count={tasksWithAnalyses.length}
                    defaultExpanded={true}
                    viewMode={taskViewMode}
                    onViewModeChange={setTaskViewMode}
                    emptyState={{
                        icon: '📊',
                        title: 'Nenhuma análise recente',
                        description: 'Execute uma análise geral para ver análises recentes de tarefas e testes.'
                    }}
                >
                    {tasksWithAnalyses.slice(0, 5).map(task => (
                        task.iaAnalysis && (
                            <TaskAnalysisCard
                                key={task.id}
                                analysis={task.iaAnalysis}
                                task={task}
                                onTaskClick={onNavigateToTask}
                                compact={taskViewMode === 'grid'}
                            />
                        )
                    ))}
                </AnalysisSection>
            )}

            {/* Análises por Tarefa */}
            {project.generalIAAnalysis && (
                <AnalysisSection
                    title="Análises por Tarefa"
                    icon="📝"
                    count={filteredTaskAnalyses.length}
                    defaultExpanded={true}
                    viewMode={taskViewMode}
                    onViewModeChange={setTaskViewMode}
                    filters={
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setRiskFilter('all')}
                                className={`btn btn-sm rounded-full transition-colors ${
                                    riskFilter === 'all' ? 'btn-primary' : 'btn-outline'
                                }`}
                            >
                                Todos
                            </button>
                            {['Crítico', 'Alto', 'Médio', 'Baixo'].map(risk => (
                                <button
                                    key={risk}
                                    type="button"
                                    onClick={() => setRiskFilter(risk)}
                                    className={`btn btn-sm rounded-full transition-colors ${
                                        riskFilter === risk ? 'btn-primary' : 'btn-outline'
                                    }`}
                                >
                                    {risk}
                                </button>
                            ))}
                        </div>
                    }
                    emptyState={{
                        icon: '📋',
                        title: 'Nenhuma análise de tarefa',
                        description: 'Execute uma análise geral para gerar análises detalhadas de cada tarefa.'
                    }}
                >
                    {filteredTaskAnalyses.map(analysis => {
                        const task = project.tasks.find(t => t.id === analysis.taskId);
                        return (
                            <TaskAnalysisCard
                                key={analysis.taskId}
                                analysis={analysis}
                                task={task}
                                onTaskClick={onNavigateToTask}
                                compact={taskViewMode === 'grid'}
                            />
                        );
                    })}
                </AnalysisSection>
            )}

            {/* Análises por Teste */}
            {project.generalIAAnalysis && testAnalyses.length > 0 && (
                <AnalysisSection
                    title="Análises por Teste"
                    icon="🧪"
                    count={testAnalyses.length}
                    defaultExpanded={false}
                    viewMode={testViewMode}
                    onViewModeChange={setTestViewMode}
                    emptyState={{
                        icon: '🧪',
                        title: 'Nenhuma análise de teste',
                        description: 'Execute uma análise geral para gerar análises detalhadas de cada teste.'
                    }}
                >
                    {testAnalyses.map(analysis => {
                        const task = project.tasks.find(t => t.id === analysis.taskId);
                        const testCase = task?.testCases?.find(tc => tc.id === analysis.testId);
                        return (
                            <TestAnalysisCard
                                key={analysis.testId}
                                analysis={analysis}
                                testCase={testCase}
                                task={task}
                                onTaskClick={onNavigateToTask}
                                compact={testViewMode === 'grid'}
                            />
                        );
                    })}
                </AnalysisSection>
            )}

            {/* Riscos Automáticos */}
            {highRiskTasks.length > 0 && (
                <AnalysisSection
                    title="Riscos Automáticos"
                    icon="⚠️"
                    count={highRiskTasks.length}
                    defaultExpanded={true}
                    emptyState={{
                        icon: '✅',
                        title: 'Nenhum risco alto detectado',
                        description: 'Todas as tarefas estão com risco controlado.'
                    }}
                >
                    {highRiskTasks.map(analysis => {
                        const task = project.tasks.find(t => t.id === analysis.taskId);
                        return (
                            <TaskAnalysisCard
                                key={analysis.taskId}
                                analysis={analysis}
                                task={task}
                                onTaskClick={onNavigateToTask}
                                compact={false}
                            />
                        );
                    })}
                </AnalysisSection>
            )}

            {/* Sugestões de Cenários BDD */}
            {project.generalIAAnalysis?.bddSuggestions && project.generalIAAnalysis.bddSuggestions.length > 0 && (
                <AnalysisSection
                    title="Sugestões de Cenários BDD"
                    icon="🧪"
                    count={project.generalIAAnalysis.bddSuggestions.length}
                    defaultExpanded={false}
                    emptyState={{
                        icon: '📝',
                        title: 'Nenhuma sugestão BDD',
                        description: 'Execute uma análise geral para receber sugestões de cenários BDD.'
                    }}
                >
                    <div className="space-y-4">
                        {project.generalIAAnalysis.bddSuggestions.map((suggestion, idx) => {
                            const task = project.tasks.find(t => t.id === suggestion.taskId);
                            return (
                                <div
                                    key={idx}
                                    className="p-5 bg-base-100 border border-base-300 rounded-xl hover:border-primary/30 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-base-content">
                                                {suggestion.taskTitle}
                                            </h4>
                                            {task && onNavigateToTask && (
                                                <button
                                                    type="button"
                                                    onClick={() => onNavigateToTask(task.id)}
                                                    className="text-xs text-primary hover:text-primary/80 mt-1 inline-flex"
                                                >
                                                    Ver tarefa →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {suggestion.scenarios.map((scenario, sIdx) => (
                                            <div
                                                key={sIdx}
                                                className="p-3 bg-base-200 rounded-lg border border-base-300 text-sm text-base-content/70 font-mono hover:border-primary/30 transition-all"
                                            >
                                                {scenario}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </AnalysisSection>
            )}

            {/* Análises Estratégicas (mantidas do original) */}
            <div className="space-y-6">
                {project.phases && <ProjectLifecycleCard project={project} />}
                <ShiftLeftCard project={project} />
                <TestPyramidCard project={project} />
                <PhaseLogicGuideCard />
            </div>
        </div>
    );
};

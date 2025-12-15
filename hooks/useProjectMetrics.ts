import { useMemo } from 'react';
import { Project, PhaseName, BugSeverity, PhaseStatus, TestCase } from '../types';
import { PHASE_NAMES } from '../utils/constants';

const phaseNamesInOrder: PhaseName[] = [...PHASE_NAMES];

export const calculateProjectMetrics = (project: Project) => {
    const tasks = project.tasks || [];
    const documents = project.documents || [];
    const phases = project.phases || [];

    // --- Basic Counts ---
    const allTestCases: TestCase[] = tasks.flatMap(t => t.testCases || []);
    const totalTestCases = allTestCases.length;
    const executedTestCases = allTestCases.filter(tc => tc.status !== 'Not Run').length;
    const passedTestCases = allTestCases.filter(tc => tc.status === 'Passed').length;
    const automatedTestCases = allTestCases.filter(tc => tc.isAutomated).length;

    // Apenas tarefas do tipo "Tarefa" devem ter casos de teste
    const totalTasks = tasks.filter(t => t.type === 'Tarefa').length;
    const tasksWithTestCases = tasks.filter(t => t.type === 'Tarefa' && t.testCases && t.testCases.length > 0).length;

    const bugs = tasks.filter(t => t.type === 'Bug');
    const openBugs = bugs.filter(t => t.status !== 'Done');
    
    // --- Phase Logic ---
    const hasDocumentsOrTasks = documents.length > 0 || tasks.length > 0;
    const hasBddScenarios = tasks.some(t => t.bddScenarios && t.bddScenarios.length > 0);
    const hasTestCases = totalTestCases > 0;
    const allTasksDone = totalTasks > 0 && tasks.filter(t => t.type !== 'Bug' && t.status === 'Done').length === totalTasks;
    const allTestsExecuted = totalTestCases > 0 && executedTestCases === totalTestCases;
    const noOpenBugs = openBugs.length === 0;

    const phaseCompletionConditions: Record<PhaseName, boolean> = {
        'Request': hasDocumentsOrTasks,
        'Analysis': hasBddScenarios,
        'Design': hasTestCases,
        'Analysis and Code': allTasksDone,
        'Build': allTasksDone, // Dependent
        'Test': allTestsExecuted,
        'Release': allTestsExecuted && noOpenBugs,
        'Deploy': allTestsExecuted && noOpenBugs, // Dependent
        'Operate': allTestsExecuted && noOpenBugs, // Dependent
        'Monitor': false, // Manual / Last phase
    };

    let previousPhaseCompleted = true;
    let inProgressSet = false;
    const newPhases = phaseNamesInOrder.map(name => {
        const originalPhase = phases.find(p => p.name === name) || { name, status: 'Não Iniciado' };
        let status: PhaseStatus = 'Não Iniciado';
        
        if (!inProgressSet && previousPhaseCompleted) {
            if (phaseCompletionConditions[name]) {
                status = 'Concluído';
            } else {
                status = 'Em Andamento';
                inProgressSet = true;
            }
        } else if (!inProgressSet && !previousPhaseCompleted) {
                status = 'Não Iniciado';
        } else if (inProgressSet) {
                status = 'Não Iniciado';
        }

        if (status !== 'Concluído') {
            previousPhaseCompleted = false;
        }
        
        return { ...originalPhase, status };
    });
    if (!inProgressSet) {
        // Fix: Replace findLastIndex with a more compatible alternative.
        const lastCompletedIndex = newPhases.map(p => p.status).lastIndexOf('Concluído');
        if (lastCompletedIndex < newPhases.length - 1) {
            newPhases[lastCompletedIndex + 1].status = 'Em Andamento';
        }
    }


    // --- Calculated Metrics ---
    const currentPhase = newPhases.find(p => p.status === 'Em Andamento')?.name || 'Concluído';
    const testCoverage = totalTasks > 0 ? Math.round((tasksWithTestCases / totalTasks) * 100) : 0;
    const automationRatio = totalTestCases > 0 ? Math.round((automatedTestCases / totalTestCases) * 100) : 0;
    const testPassRate = executedTestCases > 0 ? Math.round((passedTestCases / executedTestCases) * 100) : 0;

    const bugsBySeverity = openBugs.reduce((acc, bug) => {
        const severity = bug.severity || 'Médio';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
    }, {} as Record<BugSeverity, number>);
    
    const initialSeverityCount: Record<BugSeverity, number> = { 'Crítico': 0, 'Alto': 0, 'Médio': 0, 'Baixo': 0 };
    const finalBugsBySeverity = { ...initialSeverityCount, ...bugsBySeverity };

    const openVsClosedBugs = {
        open: openBugs.length,
        closed: bugs.length - openBugs.length,
    };

    const qualityByModule = tasks.filter(t => t.type === 'Epic').map(epic => {
        const childTasks = tasks.filter(t => t.parentId === epic.id);
        const moduleTestCases = childTasks.flatMap(t => t.testCases || []);
        const passed = moduleTestCases.filter(tc => tc.status === 'Passed').length;
        const total = moduleTestCases.length;
        return {
            module: epic.title.split(' ')[0],
            quality: total > 0 ? Math.round((passed / total) * 100) : 100
        };
    });

    const sortedTasks = [...tasks].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    let createdCount = 0;
    let completedCount = 0;
    const cumulativeProgress = sortedTasks.map(task => {
        createdCount++;
        if (task.status === 'Done' && task.completedAt) {
            completedCount++;
        }
        return {
            date: new Date(task.createdAt || 0).getTime(),
            created: createdCount,
            completed: completedCount
        };
    });
    // Group by day for cleaner graph
    const progressByDay = cumulativeProgress.reduce((acc, val) => {
        const day = new Date(val.date).setHours(0,0,0,0);
        acc[day] = { created: val.created, completed: val.completed };
        return acc;
    }, {} as Record<number, {created: number, completed: number}>);

    const cumulativeProgressData = Object.entries(progressByDay).map(([date, values]) => ({
        date: Number(date),
        series: [values.created, values.completed]
    })).sort((a,b) => a.date - b.date);

    // --- Document Metrics ---
    const totalDocuments = documents.length;
    const documentsWithAnalysis = documents.filter(doc => doc.analysis && doc.analysis.length > 0).length;
    
    // Categorizar documentos (baseado no nome e conteúdo)
    const detectCategory = (name: string, content: string): string => {
        const lowerName = name.toLowerCase();
        const lowerContent = content.toLowerCase();
        if (lowerName.includes('requisito') || lowerContent.includes('requisito') || lowerContent.includes('requirement')) {
            return 'requisitos';
        }
        if (lowerName.includes('teste') || lowerName.includes('test') || lowerContent.includes('caso de teste') || lowerContent.includes('test case')) {
            return 'testes';
        }
        if (lowerName.includes('arquitetura') || lowerName.includes('architecture') || lowerContent.includes('arquitetura')) {
            return 'arquitetura';
        }
        return 'outros';
    };

    const documentsByCategory = documents.reduce((acc, doc) => {
        const category = detectCategory(doc.name, doc.content);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Documentos recentes (últimos 7 dias) - assumindo que documentos mais recentes estão no final do array
    // Em produção, seria necessário ter um campo createdAt
    const recentDocuments = documents.length; // Por enquanto, todos são considerados recentes

    // Documentos vinculados a tarefas (verificar se o nome do documento aparece em descrições de tarefas)
    const documentsLinkedToTasks = documents.filter(doc => {
        return tasks.some(task => 
            task.description?.toLowerCase().includes(doc.name.toLowerCase()) ||
            task.title?.toLowerCase().includes(doc.name.toLowerCase())
        );
    }).length;

    // --- Task Status Metrics ---
    const taskStatus = {
        toDo: tasks.filter(t => t.type !== 'Bug' && t.status === 'To Do').length,
        inProgress: tasks.filter(t => t.type !== 'Bug' && t.status === 'In Progress').length,
        done: tasks.filter(t => t.type !== 'Bug' && t.status === 'Done').length,
        blocked: tasks.filter(t => t.type !== 'Bug' && t.status === 'Blocked').length,
    };

    const totalNonBugTasks = taskStatus.toDo + taskStatus.inProgress + taskStatus.done + taskStatus.blocked;
    const taskStatusDistribution = [
        { status: 'To Do', count: taskStatus.toDo, percentage: totalNonBugTasks > 0 ? Math.round((taskStatus.toDo / totalNonBugTasks) * 100) : 0 },
        { status: 'In Progress', count: taskStatus.inProgress, percentage: totalNonBugTasks > 0 ? Math.round((taskStatus.inProgress / totalNonBugTasks) * 100) : 0 },
        { status: 'Done', count: taskStatus.done, percentage: totalNonBugTasks > 0 ? Math.round((taskStatus.done / totalNonBugTasks) * 100) : 0 },
        { status: 'Blocked', count: taskStatus.blocked, percentage: totalNonBugTasks > 0 ? Math.round((taskStatus.blocked / totalNonBugTasks) * 100) : 0 },
    ];

    // --- Test Execution Status Metrics ---
    const failedTestCases = allTestCases.filter(tc => tc.status === 'Failed').length;
    const blockedTestCases = allTestCases.filter(tc => tc.status === 'Blocked').length;
    
    const testExecution = {
        passed: passedTestCases,
        failed: failedTestCases,
        notRun: allTestCases.filter(tc => tc.status === 'Not Run').length,
        blocked: blockedTestCases,
        passRate: executedTestCases > 0 ? Math.round((passedTestCases / executedTestCases) * 100) : 0,
    };

    const testExecutionDistribution = [
        { status: 'Passed', count: testExecution.passed, percentage: totalTestCases > 0 ? Math.round((testExecution.passed / totalTestCases) * 100) : 0 },
        { status: 'Failed', count: testExecution.failed, percentage: totalTestCases > 0 ? Math.round((testExecution.failed / totalTestCases) * 100) : 0 },
        { status: 'Not Run', count: testExecution.notRun, percentage: totalTestCases > 0 ? Math.round((testExecution.notRun / totalTestCases) * 100) : 0 },
        { status: 'Blocked', count: testExecution.blocked, percentage: totalTestCases > 0 ? Math.round((testExecution.blocked / totalTestCases) * 100) : 0 },
    ];

    // --- Quick Analysis Metrics ---
    // Calcular média de falhas por dia (últimos 30 dias)
    const now = new Date();
    
    // Contar falhas por tarefa (testes que falharam)
    const taskFailureCount = new Map<string, number>();
    tasks.forEach(task => {
        const failedInTask = task.testCases?.filter(tc => tc.status === 'Failed').length || 0;
        if (failedInTask > 0) {
            taskFailureCount.set(task.id, failedInTask);
        }
    });

    // Top 3 funcionalidades/tarefas mais problemáticas
    const topProblematicTasks = Array.from(taskFailureCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([taskId, count]) => {
            const task = tasks.find(t => t.id === taskId);
            return {
                taskId,
                taskTitle: task?.title || 'Tarefa desconhecida',
                failureCount: count,
            };
        });

    // Calcular retrabalho: testes que foram executados mais de uma vez (mudaram de status)
    // Para isso, precisamos verificar histórico ou assumir que testes que mudaram de status indicam retrabalho
    // Por enquanto, vamos contar testes que falharam e depois passaram (indicando retrabalho)
    // Como não temos histórico detalhado, vamos usar uma heurística: testes com observedResult indicam reexecução
    const reexecutedTests = allTestCases.filter(tc => 
        tc.observedResult && tc.status !== 'Not Run'
    ).length;

    // Média de falhas por dia (simplificado: total de falhas / 30)
    const averageFailuresPerDay = totalTestCases > 0 
        ? Math.round((failedTestCases / 30) * 10) / 10 
        : 0;

    // Bugs resolvidos recentemente (últimos 7 dias)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentlyResolvedBugs = bugs.filter(bug => {
        if (!bug.completedAt) return false;
        const completedDate = new Date(bug.completedAt);
        return completedDate >= sevenDaysAgo;
    }).length;

    return {
        newPhases,
        currentPhase,
        totalTestCases,
        executedTestCases,
        passedTestCases,
        failedTestCases,
        blockedTestCases,
        notRunTestCases: testExecution.notRun,
        automatedTestCases,
        totalTasks,
        tasksWithTestCases,
        testCoverage,
        automationRatio,
        testPassRate,
        bugsBySeverity: finalBugsBySeverity,
        openVsClosedBugs,
        qualityByModule: qualityByModule.length > 0 ? qualityByModule : [{ module: 'Geral', quality: 100 }],
        cumulativeProgress: cumulativeProgressData,
        // Document metrics
        documentMetrics: {
            total: totalDocuments,
            byCategory: documentsByCategory,
            withAnalysis: documentsWithAnalysis,
            recent: recentDocuments,
            linkedToTasks: documentsLinkedToTasks,
        },
        // Task status metrics
        taskStatus: {
            ...taskStatus,
            distribution: taskStatusDistribution,
        },
        // Test execution metrics
        testExecution: {
            ...testExecution,
            distribution: testExecutionDistribution,
        },
        // Quick analysis metrics
        quickAnalysis: {
            averageFailuresPerDay,
            topProblematicTasks,
            reexecutedTests,
            recentlyResolvedBugs,
        },
    };
};

export const useProjectMetrics = (project: Project) => {
    return useMemo(() => calculateProjectMetrics(project), [project]);
};

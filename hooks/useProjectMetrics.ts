import { useMemo } from 'react';
import { Project, JiraTask, Phase, PhaseName, BugSeverity, PhaseStatus, TestCase } from '../types';

const phaseNamesInOrder: PhaseName[] = ['Request', 'Analysis', 'Design', 'Analysis and Code', 'Build', 'Test', 'Release', 'Deploy', 'Operate', 'Monitor'];

export const useProjectMetrics = (project: Project) => {
    return useMemo(() => {
        const tasks = project.tasks || [];
        const documents = project.documents || [];
        const phases = project.phases || [];

        // --- Basic Counts ---
        const allTestCases: TestCase[] = tasks.flatMap(t => t.testCases || []);
        const totalTestCases = allTestCases.length;
        const executedTestCases = allTestCases.filter(tc => tc.status !== 'Not Run').length;
        const passedTestCases = allTestCases.filter(tc => tc.status === 'Passed').length;
        const automatedTestCases = allTestCases.filter(tc => tc.isAutomated).length;

        const totalTasks = tasks.filter(t => t.type !== 'Bug').length;
        const tasksWithTestCases = tasks.filter(t => t.type !== 'Bug' && t.testCases && t.testCases.length > 0).length;

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


        return {
            newPhases,
            currentPhase,
            totalTestCases,
            executedTestCases,
            passedTestCases,
            automatedTestCases,
            totalTasks,
            tasksWithTestCases,
            testCoverage,
            automationRatio,
            testPassRate,
            bugsBySeverity: finalBugsBySeverity,
            openVsClosedBugs,
            qualityByModule: qualityByModule.length > 0 ? qualityByModule : [{ module: 'Geral', quality: 100 }],
            cumulativeProgress: cumulativeProgressData
        };
    }, [project]);
};

import { useMemo } from 'react';
import { Project, JiraTask, BugSeverity, TestCase } from '../types';

export interface QualityMetrics {
    // Semáforo
    criticalBugsOpen: number;
    regressionStatus: 'Pass' | 'Fail';
    
    // Tendência de Qualidade
    defectTrend: {
        date: number;
        created: number;
        closed: number;
    }[];
    topDefectiveModules: {
        module: string;
        defectDensity: number;
        openBugs: number;
        totalTasks: number;
    }[];
    
    // Eficiência & Processo
    cycleTime: {
        average: number; // em dias
        median: number; // em dias
        distribution: { range: string; count: number }[];
    };
    flakyTests: {
        count: number;
        percentage: number;
        totalAutomated: number;
    };
    escapedDefects: {
        count: number;
        bugs: JiraTask[];
    };
}

/**
 * Identifica se um bug foi vazado para produção
 */
const isEscapedDefect = (bug: JiraTask): boolean => {
    // Verificar campo isEscapedDefect se existir
    if (bug.isEscapedDefect === true) {
        return true;
    }
    
    // Verificar tags
    const escapedTags = ['production-escape', 'escaped', 'vazado', 'production-bug', 'escaped-defect'];
    if (bug.tags && bug.tags.some(tag => 
        escapedTags.some(escapedTag => tag.toLowerCase().includes(escapedTag.toLowerCase()))
    )) {
        return true;
    }
    
    return false;
};

/**
 * Detecta testes flaky baseado em padrões de execução
 */
const isFlakyTest = (testCase: TestCase, allTestCases: TestCase[]): boolean => {
    // Apenas considerar testes automatizados
    if (!testCase.isAutomated) {
        return false;
    }
    
    // MVP: Identificar testes que têm observedResult indicando múltiplas execuções ou flaky
    if (testCase.observedResult) {
        const observedLower = testCase.observedResult.toLowerCase();
        if (observedLower.includes('flaky') || 
            observedLower.includes('intermitente') ||
            observedLower.includes('múltiplas execuções') ||
            observedLower.includes('multiple runs')) {
            return true;
        }
    }
    
    // Verificar se há outros testes com mesma descrição que tiveram resultados diferentes
    // Isso indica que o teste pode ser flaky (passou em uma execução, falhou em outra)
    const similarTests = allTestCases.filter(tc => 
        tc.id !== testCase.id && 
        tc.description === testCase.description &&
        tc.isAutomated
    );
    
    if (similarTests.length > 0) {
        const hasDifferentResults = similarTests.some(tc => tc.status !== testCase.status);
        if (hasDifferentResults) {
            return true;
        }
    }
    
    // Heurística adicional: Testes que falharam mas têm observedResult vazio ou genérico
    // podem indicar falhas intermitentes
    if (testCase.status === 'Failed' && 
        (!testCase.observedResult || testCase.observedResult.trim().length === 0)) {
        // Verificar se há histórico de passou/falhou
        const hasPassedBefore = similarTests.some(tc => tc.status === 'Passed');
        if (hasPassedBefore) {
            return true;
        }
    }
    
    return false;
};

/**
 * Calcula métricas de qualidade do projeto
 */
export const calculateQualityMetrics = (project: Project): QualityMetrics => {
    const tasks = project.tasks || [];
    const bugs = tasks.filter(t => t.type === 'Bug');
    const openBugs = bugs.filter(b => b.status !== 'Done');
    const criticalBugs = openBugs.filter(b => b.severity === 'Crítico');
    
    // Semáforo: Bugs Críticos
    const criticalBugsOpen = criticalBugs.length;
    
    // Semáforo: Status da Regressão Automática
    const allTestCases: TestCase[] = tasks.flatMap(t => t.testCases || []);
    const automatedTests = allTestCases.filter(tc => tc.isAutomated === true);
    const automatedPassed = automatedTests.filter(tc => tc.status === 'Passed');
    const automatedFailed = automatedTests.filter(tc => tc.status === 'Failed' || tc.status === 'Not Run');
    
    const regressionStatus: 'Pass' | 'Fail' = 
        automatedTests.length > 0 && automatedFailed.length === 0 ? 'Pass' : 'Fail';
    
    // Tendência de Defeitos (últimos 30 dias)
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const bugsInPeriod = bugs.filter(bug => {
        const createdAt = bug.createdAt ? new Date(bug.createdAt).getTime() : 0;
        return createdAt >= thirtyDaysAgo;
    });
    
    // Agrupar por dia
    const defectTrendMap = new Map<number, { created: number; closed: number }>();
    
    bugsInPeriod.forEach(bug => {
        const createdAt = bug.createdAt ? new Date(bug.createdAt).getTime() : now;
        const day = new Date(createdAt).setHours(0, 0, 0, 0);
        
        const current = defectTrendMap.get(day) || { created: 0, closed: 0 };
        current.created++;
        defectTrendMap.set(day, current);
        
        if (bug.status === 'Done' && bug.completedAt) {
            const completedAt = new Date(bug.completedAt).getTime();
            const completedDay = new Date(completedAt).setHours(0, 0, 0, 0);
            
            const completedCurrent = defectTrendMap.get(completedDay) || { created: 0, closed: 0 };
            completedCurrent.closed++;
            defectTrendMap.set(completedDay, completedCurrent);
        }
    });
    
    // Preencher dias faltantes nos últimos 30 dias
    const defectTrend: QualityMetrics['defectTrend'] = [];
    for (let i = 29; i >= 0; i--) {
        const day = new Date(now - (i * 24 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);
        const data = defectTrendMap.get(day) || { created: 0, closed: 0 };
        defectTrend.push({
            date: day,
            created: data.created,
            closed: data.closed,
        });
    }
    
    // Top Módulos Defeituosos
    const moduleMap = new Map<string, { bugs: JiraTask[]; tasks: JiraTask[] }>();
    
    tasks.forEach(task => {
        let moduleName = 'Geral';
        
        // Prioridade 1: Tags do Jira (ex: "module:auth", "module:payment")
        if (task.tags && task.tags.length > 0) {
            const moduleTag = task.tags.find(tag => 
                tag.toLowerCase().includes('module:') || 
                tag.toLowerCase().includes('módulo:')
            );
            if (moduleTag) {
                moduleName = moduleTag.split(':')[1]?.trim() || moduleTag;
            } else {
                // Usar primeira tag como módulo se não houver tag de módulo específica
                moduleName = task.tags[0];
            }
        } 
        // Prioridade 2: Epic (parentId)
        else if (task.parentId) {
            const epic = tasks.find(t => t.id === task.parentId && t.type === 'Epic');
            if (epic) {
                moduleName = epic.title;
            } else {
                moduleName = `Epic ${task.parentId}`;
            }
        }
        // Prioridade 3: Prefixo do ID (ex: "PROJ-123" → "PROJ")
        else if (task.id.includes('-')) {
            moduleName = task.id.split('-')[0];
        }
        
        const moduleData = moduleMap.get(moduleName) || { bugs: [], tasks: [] };
        if (task.type === 'Bug') {
            moduleData.bugs.push(task);
        }
        moduleData.tasks.push(task);
        moduleMap.set(moduleName, moduleData);
    });
    
    const topDefectiveModules = Array.from(moduleMap.entries())
        .map(([module, data]) => {
            const openBugsInModule = data.bugs.filter(b => b.status !== 'Done').length;
            const totalTasksInModule = data.tasks.length;
            const defectDensity = totalTasksInModule > 0 
                ? (openBugsInModule / totalTasksInModule) * 100 
                : 0;
            
            return {
                module,
                defectDensity: Math.round(defectDensity * 10) / 10, // 1 casa decimal
                openBugs: openBugsInModule,
                totalTasks: totalTasksInModule,
            };
        })
        .filter(m => m.openBugs > 0) // Apenas módulos com bugs abertos
        .sort((a, b) => b.defectDensity - a.defectDensity)
        .slice(0, 10); // Top 10
    
    // Cycle Time (Tempo de Resolução do Bug)
    const closedBugs = bugs.filter(b => b.status === 'Done' && b.completedAt && b.createdAt);
    const cycleTimes = closedBugs.map(bug => {
        const created = new Date(bug.createdAt!).getTime();
        const completed = new Date(bug.completedAt!).getTime();
        return (completed - created) / (1000 * 60 * 60 * 24); // Converter para dias
    });
    
    const averageCycleTime = cycleTimes.length > 0
        ? cycleTimes.reduce((sum, ct) => sum + ct, 0) / cycleTimes.length
        : 0;
    
    const sortedCycleTimes = [...cycleTimes].sort((a, b) => a - b);
    const medianCycleTime = sortedCycleTimes.length > 0
        ? sortedCycleTimes[Math.floor(sortedCycleTimes.length / 2)]
        : 0;
    
    // Distribuição de Cycle Time
    const distributionRanges = [
        { label: '0-1 dia', min: 0, max: 1 },
        { label: '1-3 dias', min: 1, max: 3 },
        { label: '3-7 dias', min: 3, max: 7 },
        { label: '7-15 dias', min: 7, max: 15 },
        { label: '15-30 dias', min: 15, max: 30 },
        { label: '30+ dias', min: 30, max: Infinity },
    ];
    
    const distribution = distributionRanges.map(range => ({
        range: range.label,
        count: cycleTimes.filter(ct => {
            if (range.max === Infinity) {
                return ct >= range.min;
            }
            return ct >= range.min && ct < range.max;
        }).length,
    }));
    
    // Flaky Tests
    const flakyTests = allTestCases.filter(tc => tc.isAutomated && isFlakyTest(tc, allTestCases));
    const flakyTestsPercentage = automatedTests.length > 0
        ? (flakyTests.length / automatedTests.length) * 100
        : 0;
    
    // Escaped Defects
    const escapedBugs = bugs.filter(isEscapedDefect);
    
    return {
        criticalBugsOpen,
        regressionStatus,
        defectTrend,
        topDefectiveModules,
        cycleTime: {
            average: Math.round(averageCycleTime * 10) / 10,
            median: Math.round(medianCycleTime * 10) / 10,
            distribution,
        },
        flakyTests: {
            count: flakyTests.length,
            percentage: Math.round(flakyTestsPercentage * 10) / 10,
            totalAutomated: automatedTests.length,
        },
        escapedDefects: {
            count: escapedBugs.length,
            bugs: escapedBugs,
        },
    };
};

export const useQualityMetrics = (project: Project): QualityMetrics => {
    return useMemo(() => calculateQualityMetrics(project), [project]);
};


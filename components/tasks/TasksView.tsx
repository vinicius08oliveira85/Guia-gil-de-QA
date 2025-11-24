import React, { useState, useCallback, useMemo } from 'react';
import { Project, JiraTask, BddScenario, TestCaseDetailLevel, BugSeverity, TeamRole, TestCase } from '../../types';
import { getAIService } from '../../services/ai/aiServiceFactory';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { FilterPanel } from '../common/FilterPanel';
import { TestCaseTemplateSelector } from './TestCaseTemplateSelector';
import { TaskForm } from './TaskForm';
import { TestCaseEditorModal } from './TestCaseEditorModal';

const TASK_ID_REGEX = /^([A-Z]+)-(\d+)/i;

const parseTaskId = (taskId: string) => {
    if (!taskId) {
        return { prefix: '', number: Number.MAX_SAFE_INTEGER };
    }
    const match = taskId.match(TASK_ID_REGEX);
    if (match) {
        return {
            prefix: match[1].toUpperCase(),
            number: parseInt(match[2], 10)
        };
    }
    return {
        prefix: taskId.toUpperCase(),
        number: Number.MAX_SAFE_INTEGER
    };
};

const compareTasksById = (a: JiraTask, b: JiraTask) => {
    const parsedA = parseTaskId(a.id);
    const parsedB = parseTaskId(b.id);

    if (parsedA.prefix !== parsedB.prefix) {
        return parsedA.prefix.localeCompare(parsedB.prefix);
    }

    if (parsedA.number !== parsedB.number) {
        return parsedA.number - parsedB.number;
    }

    return a.title.localeCompare(b.title);
};
import { JiraTaskItem, TaskWithChildren } from './JiraTaskItem';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useFilters, FilterOptions } from '../../hooks/useFilters';
import { getAllTagsFromProject } from '../../utils/tagService';
import { createBugFromFailedTest } from '../../utils/bugAutoCreation';
import { getTaskDependents, getReadyTasks } from '../../utils/dependencyService';
import { notifyTestFailed, notifyBugCreated, notifyCommentAdded, notifyDependencyResolved } from '../../utils/notificationService';
import { createTestCaseFromTemplate } from '../../utils/testCaseTemplates';
import { Comment } from '../../types';
import { BulkActions } from '../common/BulkActions';
import { TaskCreationWizard } from './TaskCreationWizard';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useSuggestions } from '../../hooks/useSuggestions';
import { SuggestionBanner } from '../common/SuggestionBanner';
import { EmptyState } from '../common/EmptyState';
import { addNewJiraTasks, getJiraConfig, getJiraProjects, JiraConfig } from '../../services/jiraService';
import { GeneralIAAnalysisButton } from './GeneralIAAnalysisButton';
import { generateGeneralIAAnalysis } from '../../services/ai/generalAnalysisService';

export const TasksView: React.FC<{ 
    project: Project, 
    onUpdateProject: (project: Project) => void,
    onNavigateToTab?: (tabId: string) => void
}> = ({ project, onUpdateProject, onNavigateToTab }) => {
    const [generatingTestsTaskId, setGeneratingTestsTaskId] = useState<string | null>(null);
    const [generatingBddTaskId, setGeneratingBddTaskId] = useState<string | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [selectedTaskForTemplate, setSelectedTaskForTemplate] = useState<string | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const { handleError, handleSuccess } = useErrorHandler();
    const { filters, filteredTasks, updateFilter, clearFilters, removeFilter, activeFiltersCount } = useFilters(project);
    const availableTags = getAllTagsFromProject(project);
    const availableTestTypes = useMemo(() => {
        const types = new Set<string>();
        project.tasks.forEach(task => {
            task.testStrategy?.forEach(strategy => {
                if (strategy?.testType) {
                    types.add(strategy.testType);
                }
            });
            task.testCases?.forEach(testCase => {
                testCase.strategies?.forEach(strategyName => {
                    if (strategyName) {
                        types.add(strategyName);
                    }
                });
            });
        });
        return Array.from(types).sort((a, b) => a.localeCompare(b));
    }, [project.tasks]);
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<JiraTask | undefined>(undefined);
    const [testCaseEditorRef, setTestCaseEditorRef] = useState<{ taskId: string; testCase: TestCase } | null>(null);
    const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined);
    const [showWizard, setShowWizard] = useState(false);
    const { isBeginnerMode } = useBeginnerMode();
    const [hasSeenWizard, setHasSeenWizard] = useLocalStorage<boolean>('task_creation_wizard_seen', false);
    const suggestions = useSuggestions(project);
    const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
    const currentSuggestion = suggestions.find(s => !dismissedSuggestions.has(s.id)) || null;
    const [showFilters, setShowFilters] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [isSyncingJira, setIsSyncingJira] = useState(false);
    const [showJiraProjectSelector, setShowJiraProjectSelector] = useState(false);
    const [availableJiraProjects, setAvailableJiraProjects] = useState<Array<{ key: string; name: string }>>([]);
    const [selectedJiraProjectKey, setSelectedJiraProjectKey] = useState<string>('');
    const [failModalState, setFailModalState] = useState<{
        isOpen: boolean;
        taskId: string | null;
        testCaseId: string | null;
        observedResult: string;
        createBug: boolean;
    }>({
        isOpen: false,
        taskId: null,
        testCaseId: null,
        observedResult: '',
        createBug: true,
    });
    const [isRunningGeneralAnalysis, setIsRunningGeneralAnalysis] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState<{
        current: number;
        total: number;
        message: string;
    } | null>(null);

    // Função helper para adicionar timeout às chamadas de IA
    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 60000): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) => 
                setTimeout(() => reject(new Error(`Timeout: operação excedeu ${timeoutMs / 1000} segundos`)), timeoutMs)
            )
        ]);
    };

    // Função helper para delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleTaskStatusChange = useCallback((taskId: string, status: 'To Do' | 'In Progress' | 'Done') => {
        const task = project.tasks.find(t => t.id === taskId);
        const previousStatus = task?.status;
        
        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? { 
                ...t, 
                status,
                completedAt: status === 'Done' ? new Date().toISOString() : t.completedAt 
            } : t)
        });

        // Se a tarefa foi concluída, verificar se alguma tarefa dependente ficou pronta
        if (status === 'Done' && previousStatus !== 'Done' && task) {
            const updatedProject = {
                ...project,
                tasks: project.tasks.map(t => t.id === taskId ? { 
                    ...t, 
                    status,
                    completedAt: status === 'Done' ? new Date().toISOString() : t.completedAt 
                } : t)
            };
            
            const dependents = getTaskDependents(taskId, updatedProject);
            const readyTasks = getReadyTasks(updatedProject);
            
            // Notificar tarefas que ficaram prontas
            dependents.forEach(dependent => {
                if (readyTasks.some(rt => rt.id === dependent.id)) {
                    notifyDependencyResolved(task, updatedProject, dependent);
                }
            });
        }
    }, [project, onUpdateProject]);
    
    const handleGenerateBddScenarios = useCallback(async (taskId: string) => {
        setGeneratingBddTaskId(taskId);
        try {
            const task = project.tasks.find(t => t.id === taskId);
            if (!task) throw new Error("Task not found");
            const aiService = getAIService();
            const scenarios = await aiService.generateBddScenarios(task.title, task.description);
            const updatedTask = { ...task, bddScenarios: [...(task.bddScenarios || []), ...scenarios] };
            const newTasks = project.tasks.map(t => t.id === taskId ? updatedTask : t);
            onUpdateProject({ ...project, tasks: newTasks });
            handleSuccess('Cenários BDD gerados com sucesso!');
        } catch (error) {
            handleError(error, 'Gerar cenários BDD');
        } finally {
            setGeneratingBddTaskId(null);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    const handleSaveBddScenario = useCallback((taskId: string, scenarioData: Omit<BddScenario, 'id'>, scenarioId?: string) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        let updatedScenarios: BddScenario[];
        if (scenarioId) {
            updatedScenarios = (task.bddScenarios || []).map(sc => sc.id === scenarioId ? { ...sc, ...scenarioData } : sc);
        } else {
            const newScenario: BddScenario = { ...scenarioData, id: `bdd-${Date.now()}` };
            updatedScenarios = [...(task.bddScenarios || []), newScenario];
        }

        const updatedTask = { ...task, bddScenarios: updatedScenarios };
        const newTasks = project.tasks.map(t => t.id === taskId ? updatedTask : t);
        onUpdateProject({ ...project, tasks: newTasks });

    }, [project, onUpdateProject]);

    const handleDeleteBddScenario = useCallback((taskId: string, scenarioId: string) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedScenarios = (task.bddScenarios || []).filter(sc => sc.id !== scenarioId);
        const updatedTask = { ...task, bddScenarios: updatedScenarios };
        const newTasks = project.tasks.map(t => t.id === taskId ? updatedTask : t);
        onUpdateProject({ ...project, tasks: newTasks });
    }, [project, onUpdateProject]);

    const handleGenerateTests = useCallback(async (taskId: string, detailLevel: TestCaseDetailLevel) => {
        setGeneratingTestsTaskId(taskId);
        try {
            const task = project.tasks.find(t => t.id === taskId);
            if (!task) throw new Error("Task not found");
            const aiService = getAIService();
            const { strategy, testCases } = await aiService.generateTestCasesForTask(task.title, task.description, task.bddScenarios, detailLevel);
            const updatedTask = { ...task, testStrategy: strategy, testCases };
            const newTasks = project.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
            onUpdateProject({ ...project, tasks: newTasks });
            handleSuccess('Casos de teste gerados com sucesso!');
        } catch (error) {
            handleError(error, 'Gerar casos de teste');
        } finally {
            setGeneratingTestsTaskId(null);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    const handleConfirmFail = useCallback(() => {
        const { taskId, testCaseId, observedResult, createBug } = failModalState;
        if (!taskId || !testCaseId) return;
    
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;
    
        const testCase = task.testCases.find(tc => tc.id === testCaseId);
        if (!testCase) return;
    
        const updatedTestCases = task.testCases.map(tc => tc.id === testCaseId ? { ...tc, status: 'Failed' as const, observedResult } : tc);
        const updatedTask = { ...task, testCases: updatedTestCases };
        
        let newTasks = project.tasks.map(t => t.id === taskId ? updatedTask : t);
    
        if (createBug) {
            const newBug = createBugFromFailedTest(testCase, task, observedResult);
            newTasks.push(newBug);
            
            // Notificações
            notifyTestFailed(testCase, task, project);
            notifyBugCreated(newBug, project);
            
            handleSuccess(`Bug ${newBug.id} criado automaticamente com severidade ${newBug.severity}`);
        } else {
            notifyTestFailed(testCase, task, project);
        }
        
        onUpdateProject({ ...project, tasks: newTasks });
        
        setFailModalState({ isOpen: false, taskId: null, testCaseId: null, observedResult: '', createBug: true });
    }, [failModalState, project, onUpdateProject, handleSuccess]);

    const handleTestCaseStatusChange = useCallback((taskId: string, testCaseId: string, status: 'Passed' | 'Failed') => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (status === 'Passed') {
            const updatedTestCases = task.testCases.map(tc => tc.id === testCaseId ? { ...tc, status } : tc);
            const updatedTask = { ...task, testCases: updatedTestCases };
            const newTasks = project.tasks.map(t => t.id === taskId ? updatedTask : t);
            onUpdateProject({ ...project, tasks: newTasks });
        } else { // status === 'Failed'
            setFailModalState({
                isOpen: true,
                taskId,
                testCaseId,
                observedResult: '',
                createBug: true,
            });
        }
    }, [project, onUpdateProject]);

    const handleToggleTestCaseAutomated = useCallback((taskId: string, testCaseId: string, isAutomated: boolean) => {
        onUpdateProject({
            ...project,
            tasks: project.tasks.map(task => {
                if (task.id === taskId) {
                    const originalTestCases = task.testCases || [];
                    const updatedTestCases = originalTestCases.map(tc => 
                        tc.id === testCaseId ? { ...tc, isAutomated } : tc
                    );
                    return { ...task, testCases: updatedTestCases };
                }
                return task;
            })
        });
    }, [project, onUpdateProject]);

    const handleExecutedStrategyChange = useCallback((taskId: string, testCaseId: string, strategies: string[]) => {
        onUpdateProject({
            ...project,
            tasks: project.tasks.map(task => {
                if (task.id === taskId) {
                    const originalTestCases = task.testCases || [];
                    const updatedTestCases = originalTestCases.map(tc => 
                        tc.id === testCaseId ? { ...tc, executedStrategy: strategies } : tc
                    );
                    return { ...task, testCases: updatedTestCases };
                }
                return task;
            })
        });
    }, [project, onUpdateProject]);

    const handleTaskToolsChange = useCallback((taskId: string, tools: string[]) => {
        onUpdateProject({
            ...project,
            tasks: project.tasks.map(task => 
                task.id === taskId ? { ...task, toolsUsed: tools } : task
            )
        });
    }, [project, onUpdateProject]);

    const handleTestCaseToolsChange = useCallback((taskId: string, testCaseId: string, tools: string[]) => {
        onUpdateProject({
            ...project,
            tasks: project.tasks.map(task => {
                if (task.id === taskId) {
                    const updatedTestCases = (task.testCases || []).map(tc =>
                        tc.id === testCaseId ? { ...tc, toolsUsed: tools } : tc
                    );
                    return { ...task, testCases: updatedTestCases };
                }
                return task;
            })
        });
    }, [project, onUpdateProject]);

    const handleOpenTestCaseEditor = useCallback((taskId: string, testCase: TestCase) => {
        setTestCaseEditorRef({ taskId, testCase });
    }, []);

    const handleSaveTestCase = useCallback((taskId: string, updatedTestCase: TestCase) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) {
            handleError(new Error('Tarefa não encontrada ao salvar o teste'), 'Salvar caso de teste');
            return;
        }

        const updatedTasks = project.tasks.map(t => {
            if (t.id !== taskId) return t;
            const updatedCases = (t.testCases || []).map(tc => tc.id === updatedTestCase.id ? updatedTestCase : tc);
            return { ...t, testCases: updatedCases };
        });

        onUpdateProject({ ...project, tasks: updatedTasks });
        handleSuccess('Caso de teste atualizado com sucesso!');
        setTestCaseEditorRef(null);
    }, [project, onUpdateProject, handleSuccess, handleError]);

    const handleDeleteTestCase = useCallback((taskId: string, testCaseId: string) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) {
            handleError(new Error('Tarefa não encontrada ao excluir o teste'), 'Excluir caso de teste');
            return;
        }

        const confirmed = window.confirm('Deseja realmente excluir este caso de teste? Esta ação não pode ser desfeita.');
        if (!confirmed) return;

        const updatedTasks = project.tasks.map(t => {
            if (t.id !== taskId) return t;
            const updatedCases = (t.testCases || []).filter(tc => tc.id !== testCaseId);
            return { ...t, testCases: updatedCases };
        });

        onUpdateProject({ ...project, tasks: updatedTasks });
        setTestCaseEditorRef(prev => {
            if (prev && prev.taskId === taskId && prev.testCase.id === testCaseId) {
                return null;
            }
            return prev;
        });
        handleSuccess('Caso de teste excluído.');
    }, [project, onUpdateProject, handleSuccess, handleError]);

    const handleStrategyExecutedChange = useCallback((taskId: string, strategyIndex: number, executed: boolean) => {
        onUpdateProject({
            ...project,
            tasks: project.tasks.map(task => {
                if (task.id === taskId) {
                    const currentExecuted = task.executedStrategies || [];
                    let newExecuted: number[];
                    
                    if (executed) {
                        // Adiciona o índice se não estiver presente
                        newExecuted = currentExecuted.includes(strategyIndex) 
                            ? currentExecuted 
                            : [...currentExecuted, strategyIndex];
                    } else {
                        // Remove o índice
                        newExecuted = currentExecuted.filter(idx => idx !== strategyIndex);
                        // Remove também as ferramentas dessa estratégia
                        const strategyTools = { ...(task.strategyTools || {}) };
                        delete strategyTools[strategyIndex];
                        return { 
                            ...task, 
                            executedStrategies: newExecuted,
                            strategyTools: Object.keys(strategyTools).length > 0 ? strategyTools : undefined
                        };
                    }
                    
                    return { ...task, executedStrategies: newExecuted };
                }
                return task;
            })
        });
    }, [project, onUpdateProject]);

    const handleStrategyToolsChange = useCallback((taskId: string, strategyIndex: number, tools: string[]) => {
        onUpdateProject({
            ...project,
            tasks: project.tasks.map(task => {
                if (task.id === taskId) {
                    const currentStrategyTools = task.strategyTools || {};
                    const newStrategyTools = {
                        ...currentStrategyTools,
                        [strategyIndex]: tools.length > 0 ? tools : undefined
                    };
                    // Remove entradas vazias
                    Object.keys(newStrategyTools).forEach(key => {
                        if (!newStrategyTools[Number(key)] || newStrategyTools[Number(key)].length === 0) {
                            delete newStrategyTools[Number(key)];
                        }
                    });
                    
                    return { 
                        ...task, 
                        strategyTools: Object.keys(newStrategyTools).length > 0 ? newStrategyTools : undefined
                    };
                }
                return task;
            })
        });
    }, [project, onUpdateProject]);

    const handleAddComment = useCallback((taskId: string, content: string) => {
        if (!content.trim()) return;
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newComment: Comment = {
            id: `comment-${Date.now()}`,
            author: 'Você',
            content,
            createdAt: new Date().toISOString(),
        };

        const updatedTask = {
            ...task,
            comments: [...(task.comments || []), newComment]
        };

        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? updatedTask : t)
        });

        // Notificar sobre o novo comentário
        notifyCommentAdded(updatedTask, project, 'Você');
    }, [project, onUpdateProject]);

    const handleEditComment = useCallback((taskId: string, commentId: string, content: string) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task || !task.comments) return;

        const updatedComments = task.comments.map(comment =>
            comment.id === commentId ? { ...comment, content, updatedAt: new Date().toISOString() } : comment
        );

        const updatedTask = { ...task, comments: updatedComments };

        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? updatedTask : t)
        });
    }, [project, onUpdateProject]);

    const handleDeleteComment = useCallback((taskId: string, commentId: string) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task || !task.comments) return;

        const updatedComments = task.comments.filter(comment => comment.id !== commentId);
        const updatedTask = { ...task, comments: updatedComments };

        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? updatedTask : t)
        });
    }, [project, onUpdateProject]);

    const handleGeneralIAAnalysis = useCallback(async () => {
        setIsRunningGeneralAnalysis(true);
        setAnalysisProgress({ current: 0, total: 0, message: 'Iniciando análise...' });
        
        try {
            // Passo 1: Gerar análise geral
            // Calcular timeout adaptativo baseado no número de tarefas
            const taskCount = project.tasks.length;
            const adaptiveTimeout = Math.min(120000 + (taskCount * 5000), 180000); // Base 120s + 5s por tarefa, máximo 180s
            setAnalysisProgress({ current: 1, total: 3, message: 'Gerando análise geral do projeto...' });
            const analysis = await withTimeout(generateGeneralIAAnalysis(project), adaptiveTimeout);
            const aiService = getAIService();
            
            // Atualizar análises individuais nas tarefas
            let updatedTasks = project.tasks.map(task => {
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

            // Identificar tarefas que precisam de BDDs e casos de teste
            const tasksNeedingBDD = updatedTasks.filter(task => {
                if (task.type === 'Bug') return false;
                const hasBDD = (task.bddScenarios?.length || 0) > 0;
                return !hasBDD;
            });

            const tasksNeedingTestCases = updatedTasks.filter(task => {
                if (task.type === 'Bug') return false;
                const hasTestCases = (task.testCases?.length || 0) > 0;
                return !hasTestCases;
            });

            // Limitar processamento (máximo 10 tarefas por tipo)
            const MAX_TASKS_TO_PROCESS = 10;
            const limitedBDDTasks = tasksNeedingBDD.slice(0, MAX_TASKS_TO_PROCESS);
            const limitedTestTasks = tasksNeedingTestCases.slice(0, MAX_TASKS_TO_PROCESS);
            
            const totalTasksToProcess = limitedBDDTasks.length + limitedTestTasks.length;
            let processedCount = 0;

            // Passo 2: Gerar BDDs automaticamente
            const bddGenerationResults: Array<{ taskId: string; success: boolean; error?: string }> = [];
            if (limitedBDDTasks.length > 0) {
                setAnalysisProgress({ 
                    current: 2, 
                    total: 3, 
                    message: `Gerando BDDs (0/${limitedBDDTasks.length})...` 
                });

                for (let i = 0; i < limitedBDDTasks.length; i++) {
                    const task = limitedBDDTasks[i];
                    processedCount++;
                    
                    setAnalysisProgress({ 
                        current: 2, 
                        total: 3, 
                        message: `Gerando BDDs para "${task.title.substring(0, 30)}..." (${i + 1}/${limitedBDDTasks.length})` 
                    });

                    try {
                        const scenarios = await withTimeout(
                            aiService.generateBddScenarios(task.title, task.description || ''),
                            60000
                        );
                        
                        const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
                        if (taskIndex !== -1) {
                            updatedTasks[taskIndex] = {
                                ...updatedTasks[taskIndex],
                                bddScenarios: [...(updatedTasks[taskIndex].bddScenarios || []), ...scenarios]
                            };
                        }
                        bddGenerationResults.push({ taskId: task.id, success: true });
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                        console.error(`Erro ao gerar BDDs para tarefa ${task.id}:`, error);
                        bddGenerationResults.push({ 
                            taskId: task.id, 
                            success: false, 
                            error: errorMessage.includes('Timeout') ? 'Timeout: operação demorou mais de 60 segundos' : errorMessage
                        });
                    }
                    
                    // Delay entre processamentos para evitar sobrecarga
                    if (i < limitedBDDTasks.length - 1) {
                        await delay(300);
                    }
                }
            }

            // Passo 3: Gerar casos de teste automaticamente
            const testCaseGenerationResults: Array<{ taskId: string; success: boolean; error?: string }> = [];
            if (limitedTestTasks.length > 0) {
                setAnalysisProgress({ 
                    current: 3, 
                    total: 3, 
                    message: `Gerando casos de teste (0/${limitedTestTasks.length})...` 
                });

                for (let i = 0; i < limitedTestTasks.length; i++) {
                    const task = limitedTestTasks[i];
                    processedCount++;
                    
                    setAnalysisProgress({ 
                        current: 3, 
                        total: 3, 
                        message: `Gerando testes para "${task.title.substring(0, 30)}..." (${i + 1}/${limitedTestTasks.length})` 
                    });

                    try {
                        const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
                        const currentTask = taskIndex !== -1 ? updatedTasks[taskIndex] : task;
                        
                        const { strategy, testCases } = await withTimeout(
                            aiService.generateTestCasesForTask(
                                currentTask.title, 
                                currentTask.description || '', 
                                currentTask.bddScenarios, 
                                'Padrão'
                            ),
                            60000
                        );
                        
                        if (taskIndex !== -1) {
                            const existingTestCases = updatedTasks[taskIndex].testCases || [];
                            updatedTasks[taskIndex] = {
                                ...updatedTasks[taskIndex],
                                testStrategy: existingTestCases.length > 0 
                                    ? [...(updatedTasks[taskIndex].testStrategy || []), ...strategy]
                                    : strategy,
                                testCases: existingTestCases.length > 0 
                                    ? [...existingTestCases, ...testCases]
                                    : testCases
                            };
                        }
                        testCaseGenerationResults.push({ taskId: task.id, success: true });
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                        console.error(`Erro ao gerar casos de teste para tarefa ${task.id}:`, error);
                        testCaseGenerationResults.push({ 
                            taskId: task.id, 
                            success: false, 
                            error: errorMessage.includes('Timeout') ? 'Timeout: operação demorou mais de 60 segundos' : errorMessage
                        });
                    }
                    
                    // Delay entre processamentos
                    if (i < limitedTestTasks.length - 1) {
                        await delay(300);
                    }
                }
            }

            const updatedProject = {
                ...project,
                tasks: updatedTasks,
                generalIAAnalysis: analysis
            };

            onUpdateProject(updatedProject);
            setAnalysisProgress(null);
            
            // Mensagem de sucesso com resumo detalhado
            const bddSuccessCount = bddGenerationResults.filter(r => r.success).length;
            const bddFailCount = bddGenerationResults.filter(r => !r.success).length;
            const testSuccessCount = testCaseGenerationResults.filter(r => r.success).length;
            const testFailCount = testCaseGenerationResults.filter(r => !r.success).length;
            
            const messages: string[] = [];
            const warnings: string[] = [];
            
            if (bddSuccessCount > 0) {
                messages.push(`${bddSuccessCount} cenário(s) BDD gerado(s)`);
            }
            if (bddFailCount > 0) {
                warnings.push(`${bddFailCount} falha(s) ao gerar BDDs`);
            }
            if (testSuccessCount > 0) {
                messages.push(`${testSuccessCount} caso(s) de teste gerado(s)`);
            }
            if (testFailCount > 0) {
                warnings.push(`${testFailCount} falha(s) ao gerar testes`);
            }
            
            if (tasksNeedingBDD.length > MAX_TASKS_TO_PROCESS) {
                warnings.push(`${tasksNeedingBDD.length - MAX_TASKS_TO_PROCESS} tarefa(s) com BDD pendente (limite de ${MAX_TASKS_TO_PROCESS} por execução)`);
            }
            if (tasksNeedingTestCases.length > MAX_TASKS_TO_PROCESS) {
                warnings.push(`${tasksNeedingTestCases.length - MAX_TASKS_TO_PROCESS} tarefa(s) com teste pendente (limite de ${MAX_TASKS_TO_PROCESS} por execução)`);
            }
            
            let successMessage = messages.length > 0 
                ? `Análise concluída! ${messages.join(' e ')}.`
                : 'Análise geral concluída com sucesso!';
            
            if (warnings.length > 0) {
                successMessage += ` Avisos: ${warnings.join(', ')}.`;
            }
            
            handleSuccess(successMessage);
            
            // Navegar para a aba de Análise IA
            if (onNavigateToTab) {
                setTimeout(() => {
                    onNavigateToTab('analysis');
                }, 500);
            }
        } catch (error) {
            setAnalysisProgress(null);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            if (errorMessage.includes('Timeout')) {
                handleError(new Error('A análise demorou muito tempo. Tente novamente com menos tarefas.'), 'Executar análise geral com IA');
            } else {
                handleError(error, 'Executar análise geral com IA');
            }
        } finally {
            setIsRunningGeneralAnalysis(false);
            setAnalysisProgress(null);
        }
    }, [project, onUpdateProject, handleError, handleSuccess, onNavigateToTab]);
    
    const handleSaveTask = (taskData: Omit<JiraTask, 'testCases' | 'status' | 'testStrategy' | 'bddScenarios' | 'createdAt' | 'completedAt'>) => {
        let newTasks: JiraTask[];
        if (editingTask) {
            // Preservar campos que não vêm do formulário
            const existingTask = project.tasks.find(t => t.id === editingTask.id);
            newTasks = project.tasks.map(t => {
                if (t.id === editingTask.id) {
                    return { 
                        ...t, 
                        ...taskData,
                        // Preservar campos que não são editados no formulário
                        testCases: existingTask?.testCases || t.testCases,
                        testStrategy: existingTask?.testStrategy || t.testStrategy,
                        bddScenarios: existingTask?.bddScenarios || t.bddScenarios,
                        executedStrategies: existingTask?.executedStrategies || t.executedStrategies,
                        strategyTools: existingTask?.strategyTools || t.strategyTools,
                        toolsUsed: existingTask?.toolsUsed || t.toolsUsed,
                        comments: existingTask?.comments || t.comments,
                        status: t.status,
                        createdAt: t.createdAt,
                        completedAt: t.completedAt
                    };
                }
                return t;
            });
        } else {
            const newTask: JiraTask = { ...taskData, status: 'To Do', testCases: [], bddScenarios: [], createdAt: new Date().toISOString() };
            newTasks = [...project.tasks, newTask];
        }
        onUpdateProject({ ...project, tasks: newTasks });
        setIsTaskFormOpen(false);
        setEditingTask(undefined);
    };

    const handleDeleteTask = useCallback((taskId: string) => {
        const taskToDelete = project.tasks.find(t => t.id === taskId);
        let tasksToKeep = project.tasks;
        
        if (taskToDelete?.type === 'Epic') {
            tasksToKeep = tasksToKeep.map(t => t.parentId === taskId ? { ...t, parentId: undefined } : t);
        }
        
        tasksToKeep = tasksToKeep.filter(t => t.id !== taskId);

        onUpdateProject({ ...project, tasks: tasksToKeep });
        handleSuccess('Tarefa excluída com sucesso!');
    }, [project, onUpdateProject, handleSuccess]);
    
    const openTaskFormForEdit = (task: JiraTask) => {
        setEditingTask(task);
        setIsTaskFormOpen(true);
    };
    
    const openTaskFormForNew = (parentId?: string) => {
        // Se é modo iniciante, não viu o wizard ainda, e não tem tarefas, mostrar wizard
        if (isBeginnerMode && !hasSeenWizard && project.tasks.length === 0) {
            setShowWizard(true);
            return;
        }
        setEditingTask(undefined);
        setDefaultParentId(parentId);
        setIsTaskFormOpen(true);
    };

    const handleWizardStart = () => {
        setHasSeenWizard(true);
        setDefaultParentId(undefined);
        setEditingTask(undefined);
        setIsTaskFormOpen(true);
    };

    const epics = useMemo(() => project.tasks.filter(t => t.type === 'Epic'), [project.tasks]);

    const stats = useMemo(() => {
        const total = project.tasks.length;
        const inProgress = project.tasks.filter(t => t.status === 'In Progress').length;
        const done = project.tasks.filter(t => t.status === 'Done').length;
        const bugsOpen = project.tasks.filter(t => t.type === 'Bug' && t.status !== 'Done').length;
        const totalTests = project.tasks.reduce((acc, t) => acc + (t.testCases?.length || 0), 0);
        const executedTests = project.tasks.reduce((acc, t) => acc + (t.testCases?.filter(tc => tc.status !== 'Not Run').length || 0), 0);
        const automatedTests = project.tasks.reduce((acc, t) => acc + (t.testCases?.filter(tc => tc.isAutomated).length || 0), 0);
        return { total, inProgress, done, bugsOpen, totalTests, executedTests, automatedTests };
    }, [project.tasks]);

    const testExecutionRate = stats.totalTests > 0 ? Math.round((stats.executedTests / stats.totalTests) * 100) : 0;
    const automationRate = stats.totalTests > 0 ? Math.round((stats.automatedTests / stats.totalTests) * 100) : 0;

    const filterChips = useMemo(() => {
        const chips: { key: keyof FilterOptions; label: string }[] = [];
        const pushArray = (key: keyof FilterOptions, values?: (string | number)[], prefix?: string) => {
            if (values && values.length > 0) {
                chips.push({ key, label: `${prefix || ''}${values.join(', ')}`.trim() });
            }
        };
        pushArray('status', filters.status, 'Status: ');
        pushArray('type', filters.type, 'Tipo: ');
        pushArray('tags', filters.tags, 'Tags: ');
        pushArray('priority', filters.priority, 'Prioridade: ');
        pushArray('severity', filters.severity, 'Severidade: ');
        pushArray('owner', filters.owner, 'Owner: ');
        pushArray('assignee', filters.assignee, 'Responsável: ');
        pushArray('testResultStatus', filters.testResultStatus, 'Testes: ');
        pushArray('requiredTestTypes', filters.requiredTestTypes, 'Tipos de teste: ');

        if (filters.dateRange?.start || filters.dateRange?.end) {
            const start = filters.dateRange.start ? filters.dateRange.start.toLocaleDateString() : 'Início';
            const end = filters.dateRange.end ? filters.dateRange.end.toLocaleDateString() : 'Hoje';
            chips.push({ key: 'dateRange', label: `Criadas entre ${start} e ${end}` });
        }
        if (filters.searchQuery) {
            chips.push({ key: 'searchQuery', label: `Busca: "${filters.searchQuery}"` });
        }
        if (filters.hasTestCases !== undefined) {
            chips.push({ key: 'hasTestCases', label: filters.hasTestCases ? 'Com casos de teste' : 'Sem casos de teste' });
        }
        if (filters.hasBddScenarios !== undefined) {
            chips.push({ key: 'hasBddScenarios', label: filters.hasBddScenarios ? 'Com BDD' : 'Sem BDD' });
        }
        if (filters.isAutomated !== undefined) {
            chips.push({ key: 'isAutomated', label: filters.isAutomated ? 'Com automação' : 'Sem automação' });
        }
        return chips;
    }, [filters]);

    const taskTree = useMemo(() => {
        const tasks = [...filteredTasks].sort(compareTasksById);
        const taskMap = new Map(tasks.map(t => [t.id, { ...t, children: [] as TaskWithChildren[] }]));
        const tree: TaskWithChildren[] = [];

        for (const task of taskMap.values()) {
            if (task.parentId && taskMap.has(task.parentId)) {
                taskMap.get(task.parentId)!.children.push(task);
            } else {
                tree.push(task);
            }
        }
        const sortChildrenRecursive = (nodes: TaskWithChildren[]) => {
            nodes.sort(compareTasksById);
            nodes.forEach(node => {
                if (node.children.length > 0) {
                    sortChildrenRecursive(node.children);
                }
            });
        };
        sortChildrenRecursive(tree);
        return tree;
    }, [filteredTasks]);

    const handleAddTestCaseFromTemplate = useCallback((taskId: string, templateId: string) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        try {
            const newTestCase = createTestCaseFromTemplate(templateId);
            const updatedTask = {
                ...task,
                testCases: [...(task.testCases || []), newTestCase]
            };
            const newTasks = project.tasks.map(t => t.id === taskId ? updatedTask : t);
            onUpdateProject({ ...project, tasks: newTasks });
            handleSuccess('Caso de teste adicionado do template');
        } catch (error) {
            handleError(error instanceof Error ? error : new Error('Erro ao adicionar template'));
        }
    }, [project, onUpdateProject, handleSuccess, handleError]);

    const toggleTaskSelection = (taskId: string) => {
        setSelectedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    // Extrair chave do projeto Jira a partir dos IDs das tarefas (ex: "GDPI-10" -> "GDPI")
    const extractJiraProjectKey = useCallback((): string | null => {
        if (project.tasks.length === 0) return null;
        
        // Tentar extrair a chave do primeiro ID de tarefa que parece ser do Jira (formato: KEY-123)
        const firstTaskId = project.tasks[0].id;
        const match = firstTaskId.match(/^([A-Z]+)-\d+/);
        if (match && match[1]) {
            return match[1];
        }
        return null;
    }, [project.tasks]);

    const handleSyncJira = useCallback(async () => {
        const config = getJiraConfig();
        if (!config) {
            handleError(new Error('Jira não configurado. Configure a conexão com Jira nas Configurações primeiro.'), 'Sincronizar com Jira');
            return;
        }

        // Tentar extrair a chave do projeto dos IDs das tarefas
        let jiraProjectKey = extractJiraProjectKey();
        
        // Se não conseguir extrair, mostrar seletor de projetos
        if (!jiraProjectKey) {
            try {
                setIsSyncingJira(true);
                const projects = await getJiraProjects(config);
                setAvailableJiraProjects(projects.map(p => ({ key: p.key, name: p.name })));
                setShowJiraProjectSelector(true);
            } catch (error) {
                handleError(error instanceof Error ? error : new Error('Erro ao buscar projetos do Jira'), 'Sincronizar com Jira');
            } finally {
                setIsSyncingJira(false);
            }
            return;
        }

        // Sincronizar com a chave extraída
        await performSync(config, jiraProjectKey);
    }, [extractJiraProjectKey, handleError]);

    const performSync = useCallback(async (config: JiraConfig, jiraProjectKey: string) => {
        setIsSyncingJira(true);
        try {
            const result = await addNewJiraTasks(
                config,
                project,
                jiraProjectKey,
                (current, total) => {
                    // Progress callback pode ser usado para mostrar progresso
                    console.log(`Sincronizando: ${current}${total ? ` de ${total}` : ''}`);
                }
            );
            
            onUpdateProject(result.project);
            
            // Montar mensagem de sucesso com informações detalhadas
            const messages: string[] = [];
            if (result.newTasksCount > 0) {
                messages.push(`${result.newTasksCount} nova(s) tarefa(s) adicionada(s)`);
            }
            if (result.updatedStatusCount > 0) {
                messages.push(`${result.updatedStatusCount} status atualizado(s)`);
            }
            
            if (messages.length > 0) {
                handleSuccess(`Sincronização concluída: ${messages.join(' e ')} do Jira!`);
            } else {
                handleSuccess('Sincronização concluída. Nenhuma alteração encontrada no Jira.');
            }
        } catch (error) {
            handleError(error instanceof Error ? error : new Error('Erro ao sincronizar com Jira'), 'Sincronizar com Jira');
        } finally {
            setIsSyncingJira(false);
        }
    }, [project, onUpdateProject, handleSuccess, handleError]);

    const handleConfirmJiraProject = useCallback(async () => {
        if (!selectedJiraProjectKey) {
            handleError(new Error('Selecione um projeto do Jira'), 'Sincronizar com Jira');
            return;
        }

        const config = getJiraConfig();
        if (!config) {
            handleError(new Error('Jira não configurado'), 'Sincronizar com Jira');
            return;
        }

        setShowJiraProjectSelector(false);
        await performSync(config, selectedJiraProjectKey);
        setSelectedJiraProjectKey('');
    }, [selectedJiraProjectKey, performSync, handleError]);

    const renderTaskTree = useCallback((tasks: TaskWithChildren[], level: number, startIndex: number = 0): React.ReactElement[] => {
        return tasks.map((task, index) => {
            const globalIndex = startIndex + index;
            return (
                <JiraTaskItem
                    key={task.id}
                    task={task}
                    isSelected={selectedTasks.has(task.id)}
                    onToggleSelect={() => toggleTaskSelection(task.id)}
                    onTestCaseStatusChange={(testCaseId, status) => handleTestCaseStatusChange(task.id, testCaseId, status)}
                    onToggleTestCaseAutomated={(testCaseId, isAutomated) => handleToggleTestCaseAutomated(task.id, testCaseId, isAutomated)}
                    onExecutedStrategyChange={(testCaseId, strategies) => handleExecutedStrategyChange(task.id, testCaseId, strategies)}
                    onTaskToolsChange={(tools) => handleTaskToolsChange(task.id, tools)}
                    onTestCaseToolsChange={(testCaseId, tools) => handleTestCaseToolsChange(task.id, testCaseId, tools)}
                    onStrategyExecutedChange={(strategyIndex, executed) => handleStrategyExecutedChange(task.id, strategyIndex, executed)}
                    onStrategyToolsChange={(strategyIndex, tools) => handleStrategyToolsChange(task.id, strategyIndex, tools)}
                    onDelete={handleDeleteTask}
                    onGenerateTests={handleGenerateTests}
                    isGenerating={generatingTestsTaskId === task.id}
                    onAddSubtask={openTaskFormForNew}
                    onEdit={openTaskFormForEdit}
                    onGenerateBddScenarios={handleGenerateBddScenarios}
                    isGeneratingBdd={generatingBddTaskId === task.id}
                    onSaveBddScenario={handleSaveBddScenario}
                    onDeleteBddScenario={handleDeleteBddScenario}
                    onTaskStatusChange={(status) => handleTaskStatusChange(task.id, status)}
                    level={level}
                    onAddTestCaseFromTemplate={(templateId) => {
                        setSelectedTaskForTemplate(task.id);
                        handleAddTestCaseFromTemplate(task.id, templateId);
                    }}
                    onAddComment={(content) => handleAddComment(task.id, content)}
                    onEditComment={(commentId, content) => handleEditComment(task.id, commentId, content)}
                    onDeleteComment={(commentId) => handleDeleteComment(task.id, commentId)}
                    onEditTestCase={handleOpenTestCaseEditor}
                    onDeleteTestCase={handleDeleteTestCase}
                    project={project}
                    onUpdateProject={onUpdateProject}
                >
                    {task.children.length > 0 && renderTaskTree(task.children, level + 1, globalIndex + 1)}
                </JiraTaskItem>
            );
        });
    }, [selectedTasks, generatingTestsTaskId, generatingBddTaskId, handleTestCaseStatusChange, handleToggleTestCaseAutomated, handleExecutedStrategyChange, handleTaskToolsChange, handleTestCaseToolsChange, handleStrategyExecutedChange, handleStrategyToolsChange, handleDeleteTask, handleGenerateTests, openTaskFormForNew, openTaskFormForEdit, handleGenerateBddScenarios, handleSaveBddScenario, handleDeleteBddScenario, handleTaskStatusChange, handleAddTestCaseFromTemplate, handleAddComment, handleEditComment, handleDeleteComment, project, onUpdateProject, toggleTaskSelection]);

    return (
        <>
        <Card>
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                    <div className="flex-shrink-0">
                        <h3 className="text-2xl font-bold text-text-primary mb-1">Tarefas & Casos de Teste</h3>
                        <p className="text-sm text-text-secondary">Acompanhe o progresso das atividades e resultados de QA.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                        {/* Grupo: Ações Principais */}
                        <div className="flex gap-2 flex-wrap">
                            <button 
                                onClick={() => openTaskFormForNew()} 
                                className="btn btn-primary flex items-center gap-2 px-4 py-2.5 font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Adicionar Tarefa
                            </button>
                            <GeneralIAAnalysisButton 
                                onAnalyze={handleGeneralIAAnalysis}
                                isAnalyzing={isRunningGeneralAnalysis}
                                progress={analysisProgress}
                            />
                        </div>
                        
                        {/* Grupo: Filtros e Templates */}
                        <div className="flex gap-2 flex-wrap">
                            <button 
                                onClick={() => setShowFilters(prev => !prev)} 
                                className="btn btn-secondary flex items-center gap-2 px-3 py-2.5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                {showFilters ? 'Ocultar Filtros' : `Filtros${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}
                            </button>
                            <button 
                                onClick={() => setShowTemplateSelector(true)} 
                                className="btn btn-secondary flex items-center gap-2 px-3 py-2.5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Templates
                            </button>
                        </div>
                        
                        {/* Grupo: Sincronização */}
                        <div className="flex gap-2 flex-wrap">
                            <button 
                                onClick={handleSyncJira} 
                                className="btn btn-secondary flex items-center gap-2 px-3 py-2.5"
                                disabled={isSyncingJira}
                            >
                                {isSyncingJira ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Sincronizando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Atualizar do Jira
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <label 
                        htmlFor="quick-task-search" 
                        className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Busca rápida por tarefa ou teste
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">🔍</span>
                        <input
                            id="quick-task-search"
                            type="search"
                            inputMode="search"
                            autoComplete="off"
                            value={filters.searchQuery || ''}
                            onChange={(e) => updateFilter('searchQuery', e.target.value)}
                            placeholder="Digite ID, título ou palavra-chave..."
                            className="w-full pl-10 pr-12 py-2.5 bg-surface border border-surface-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        />
                        {filters.searchQuery && (
                            <button
                                type="button"
                                onClick={() => updateFilter('searchQuery', '')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/40"
                                aria-label="Limpar busca rápida"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                        Filtre tarefas e casos instantaneamente sem precisar abrir o painel completo de filtros.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="mica rounded-xl p-4 border border-surface-border hover:border-accent/30 transition-all duration-200 hover:shadow-lg group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Total de Tarefas</p>
                        <p className="text-3xl font-bold text-text-primary">{stats.total}</p>
                    </div>
                    
                    <div className="mica rounded-xl p-4 border border-surface-border hover:border-accent/30 transition-all duration-200 hover:shadow-lg group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Em Andamento</p>
                        <p className="text-3xl font-bold text-accent">{stats.inProgress}</p>
                    </div>
                    
                    <div className="mica rounded-xl p-4 border border-surface-border hover:border-green-400/30 transition-all duration-200 hover:shadow-lg group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Concluídas</p>
                        <p className="text-3xl font-bold text-green-400">{stats.done}</p>
                    </div>
                    
                    <div className="mica rounded-xl p-4 border border-surface-border hover:border-red-400/30 transition-all duration-200 hover:shadow-lg group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Bugs Abertos</p>
                        <p className="text-3xl font-bold text-red-400">{stats.bugsOpen}</p>
                    </div>
                    
                    <div className="mica rounded-xl p-4 border border-surface-border hover:border-accent/30 transition-all duration-200 hover:shadow-lg col-span-1 md:col-span-2 lg:col-span-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-accent/10 rounded-lg">
                                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-text-primary">Execução de Testes</p>
                            </div>
                            <span className="text-lg font-bold text-accent">{testExecutionRate}%</span>
                        </div>
                        <div className="w-full bg-surface-hover/50 rounded-full h-3 mb-2 overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-accent via-accent-light to-accent rounded-full transition-all duration-500 relative overflow-hidden"
                                style={{ width: `${testExecutionRate}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <p className="text-text-secondary">
                                {stats.executedTests}/{stats.totalTests} casos executados
                            </p>
                            <p className="text-text-secondary">
                                Automação <span className="font-semibold text-accent">{automationRate}%</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {filterChips.length > 0 && (
                <div className="mb-6 p-4 mica rounded-xl border border-surface-border">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span className="text-sm font-semibold text-text-primary">Filtros Ativos</span>
                            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
                                {filterChips.length}
                            </span>
                        </div>
                        <button 
                            onClick={clearFilters} 
                            className="text-sm text-accent hover:text-accent-light transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpar todos
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                            {filterChips.map(chip => (
                                <span
                                    key={`${chip.key}-${chip.label}`}
                                    className="chip chip--neutral group flex items-center gap-2 text-xs font-semibold"
                                >
                                    <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    {chip.label}
                                    <button
                                        onClick={() => removeFilter(chip.key)}
                                        className="ml-1 text-text-secondary hover:text-red-400 transition-colors rounded-full hover:bg-red-400/10 p-0.5"
                                        aria-label={`Remover filtro ${chip.label}`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                    </div>
                </div>
            )}

            {showFilters && (
                <div className="mb-6">
                    <FilterPanel
                        filters={filters}
                        onFilterChange={updateFilter}
                        onClearFilters={clearFilters}
                        availableTags={availableTags}
                        availableTestTypes={availableTestTypes}
                        activeFiltersCount={activeFiltersCount}
                    />
                </div>
            )}

            <div className="flex flex-col gap-4 mb-6">
                {currentSuggestion && showSuggestions && (
                    <div className="mica rounded-xl border border-surface-border overflow-hidden shadow-lg">
                        <div className="flex items-center justify-between bg-surface-hover/50 px-4 py-3 border-b border-surface-border">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-accent/10 rounded-lg">
                                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-semibold text-text-primary">Sugestões inteligentes</span>
                            </div>
                            <button
                                onClick={() => setShowSuggestions(false)}
                                className="text-xs text-text-secondary hover:text-text-primary transition-colors p-1 rounded hover:bg-surface-hover"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 bg-surface/30">
                            <SuggestionBanner
                                suggestion={currentSuggestion}
                                onDismiss={() => setDismissedSuggestions(new Set([...dismissedSuggestions, currentSuggestion.id]))}
                                onClose={() => setShowSuggestions(false)}
                            />
                        </div>
                    </div>
                )}
                {selectedTasks.size > 0 && (
                    <BulkActions
                        selectedTasks={selectedTasks}
                        onClearSelection={() => setSelectedTasks(new Set())}
                        onDeleteSelected={() => {
                            selectedTasks.forEach(taskId => handleDeleteTask(taskId));
                            setSelectedTasks(new Set());
                        }}
                    />
                )}
                {(generatingTestsTaskId || generatingBddTaskId) && (
                    <div className="p-3 bg-accent/10 border border-accent/40 rounded-lg text-sm text-text-primary flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></span>
                        {generatingTestsTaskId && <span>Gerando casos de teste para {generatingTestsTaskId}...</span>}
                        {generatingBddTaskId && <span>Gerando cenários BDD para {generatingBddTaskId}...</span>}
                    </div>
                )}
            </div>

            {isTaskFormOpen && (
                <div className="mb-6 p-4 bg-surface rounded-lg border border-surface-border">
                    <TaskForm 
                        onSave={handleSaveTask} 
                        onCancel={() => { setIsTaskFormOpen(false); setEditingTask(undefined); }} 
                        existingTask={editingTask}
                        epics={epics}
                        parentId={defaultParentId}
                    />
                </div>
            )}

            <Modal 
                isOpen={showJiraProjectSelector} 
                onClose={() => {
                    setShowJiraProjectSelector(false);
                    setSelectedJiraProjectKey('');
                }}
                title="Selecionar Projeto do Jira"
            >
                <div className="space-y-4">
                    <p className="text-text-secondary text-sm">
                        Selecione o projeto do Jira para sincronizar apenas as novas tarefas:
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Projeto
                        </label>
                        <select
                            value={selectedJiraProjectKey}
                            onChange={(e) => setSelectedJiraProjectKey(e.target.value)}
                            className="w-full"
                        >
                            <option value="">Selecione um projeto...</option>
                            {availableJiraProjects.map(proj => (
                                <option key={proj.key} value={proj.key}>
                                    {proj.name} ({proj.key})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setShowJiraProjectSelector(false);
                                setSelectedJiraProjectKey('');
                            }}
                            className="btn btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmJiraProject}
                            disabled={!selectedJiraProjectKey || isSyncingJira}
                            className="btn btn-primary"
                        >
                            {isSyncingJira ? 'Sincronizando...' : 'Sincronizar'}
                        </button>
                    </div>
                </div>
            </Modal>
            {taskTree.length > 0 ? (
                <div>{renderTaskTree(taskTree, 0)}</div>
            ) : (
                <EmptyState
                    icon="📋"
                    title="Nenhuma tarefa criada ainda"
                    description="Comece criando sua primeira tarefa para organizar seu trabalho de QA."
                    action={{
                        label: "Adicionar Tarefa",
                        onClick: () => openTaskFormForNew(),
                        variant: 'primary'
                    }}
                    tip={isBeginnerMode ? "Clique em 'Adicionar Tarefa' para ver um guia passo a passo!" : undefined}
                    helpContent={isBeginnerMode ? {
                        title: 'Criar sua primeira tarefa',
                        content: 'Tarefas representam funcionalidades ou bugs que precisam ser testados. Use o wizard para aprender passo a passo como criar tarefas corretamente.'
                    } : undefined}
                />
            )}
        </Card>

        <Modal 
            isOpen={failModalState.isOpen} 
            onClose={() => setFailModalState({ ...failModalState, isOpen: false })} 
            title="Registrar Falha no Teste"
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="observed-result" className="block text-sm font-medium text-text-secondary mb-1">Resultado Observado (O que aconteceu de errado?)</label>
                    <textarea 
                        id="observed-result" 
                        value={failModalState.observedResult} 
                        onChange={e => setFailModalState({ ...failModalState, observedResult: e.target.value })} 
                        rows={4}
                    ></textarea>
                </div>
                <div className="flex items-center">
                    <input 
                        id="create-bug-task" 
                        type="checkbox" 
                        checked={failModalState.createBug} 
                        onChange={e => setFailModalState({ ...failModalState, createBug: e.target.checked })}
                        className="h-4 w-4 text-accent bg-slate-700 border-slate-600 rounded focus:ring-accent"
                    />
                    <label htmlFor="create-bug-task" className="ml-2 block text-sm text-text-primary">Criar tarefa de Bug automaticamente</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => setFailModalState({ ...failModalState, isOpen: false })} className="btn btn-secondary">Cancelar</button>
                    <button onClick={handleConfirmFail} className="btn bg-red-600 text-white hover:bg-red-500">Confirmar Reprovação</button>
                </div>
            </div>
        </Modal>

        <Modal
            isOpen={showTemplateSelector}
            onClose={() => {
                setShowTemplateSelector(false);
                setSelectedTaskForTemplate(null);
            }}
            title="Selecionar Template de Caso de Teste"
        >
            <div>
                {selectedTaskForTemplate ? (
                    <p className="mb-4 text-sm text-text-secondary">
                        Selecione um template para adicionar à tarefa <span className="font-semibold text-accent">{selectedTaskForTemplate}</span>.
                    </p>
                ) : (
                    <p className="mb-4 text-sm text-text-secondary">
                        Selecione uma tarefa e depois escolha um template de caso de teste para adicionar.
                    </p>
                )}
                <TestCaseTemplateSelector
                    onSelectTemplate={(templateId, taskId) => {
                        const targetTaskId = taskId || selectedTaskForTemplate;
                        if (targetTaskId) {
                            handleAddTestCaseFromTemplate(targetTaskId, templateId);
                            setShowTemplateSelector(false);
                            setSelectedTaskForTemplate(null);
                        }
                    }}
                    onClose={() => {
                        setShowTemplateSelector(false);
                        setSelectedTaskForTemplate(null);
                    }}
                    selectedTaskId={selectedTaskForTemplate}
                    availableTasks={project.tasks}
                    onSelectTask={(taskId) => {
                        if (taskId) {
                            setSelectedTaskForTemplate(taskId);
                        } else {
                            setSelectedTaskForTemplate(null);
                        }
                    }}
                />
            </div>
        </Modal>

        {testCaseEditorRef && (
            <TestCaseEditorModal
                testCase={testCaseEditorRef.testCase}
                isOpen={!!testCaseEditorRef}
                onClose={() => setTestCaseEditorRef(null)}
                onSave={(updated) => handleSaveTestCase(testCaseEditorRef.taskId, updated)}
                onDelete={() => handleDeleteTestCase(testCaseEditorRef.taskId, testCaseEditorRef.testCase.id)}
            />
        )}

        <TaskCreationWizard
            isOpen={showWizard}
            onClose={() => setShowWizard(false)}
            onStart={handleWizardStart}
        />
        </>
    );
};
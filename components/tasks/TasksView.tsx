import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Project, JiraTask, BddScenario, TestCaseDetailLevel, TestCase, Comment } from '../../types';
import { getAIService } from '../../services/ai/aiServiceFactory';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { FilterPanel } from '../common/FilterPanel';
import { QuickFilters } from '../common/QuickFilters';
import { TaskForm } from './TaskForm';
import { TestCaseEditorModal } from './TestCaseEditorModal';
import { Button } from '../common/Button';
import { Plus, Filter, RefreshCw, Loader2, Clipboard, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { logger } from '../../utils/logger';
import { useProjectsStore } from '../../store/projectsStore';
import { ModernIcons } from '../common/ModernIcons';
import { getFriendlyAIErrorMessage } from '../../utils/aiErrorMapper';

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
import { TaskDetailsModal } from './TaskDetailsModal';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useFilters } from '../../hooks/useFilters';
import { createBugFromFailedTest } from '../../utils/bugAutoCreation';
import { getTaskDependents, getReadyTasks } from '../../utils/dependencyService';
import { notifyTestFailed, notifyBugCreated, notifyCommentAdded, notifyDependencyResolved } from '../../utils/notificationService';
import { BulkActions } from '../common/BulkActions';
import { TaskCreationWizard } from './TaskCreationWizard';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { EmptyState } from '../common/EmptyState';
import { syncJiraProject, getJiraConfig, getJiraProjects, JiraConfig, syncTaskToJira } from '../../services/jiraService';
import { GeneralIAAnalysisButton } from './GeneralIAAnalysisButton';
import { generateGeneralIAAnalysis } from '../../services/ai/generalAnalysisService';
import { FailedTestsReportModal } from './FailedTestsReportModal';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { getTaskStatusCategory } from '../../utils/jiraStatusCategorizer';

export const TasksView: React.FC<{ 
    project: Project, 
    onUpdateProject: (project: Project) => void,
    onNavigateToTab?: (tabId: string) => void
}> = ({ project, onUpdateProject, onNavigateToTab }) => {
    const [generatingTestsTaskId, setGeneratingTestsTaskId] = useState<string | null>(null);
    const [generatingBddTaskId, setGeneratingBddTaskId] = useState<string | null>(null);
    const [generatingAllTaskId, setGeneratingAllTaskId] = useState<string | null>(null);
    const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const { handleError, handleSuccess } = useErrorHandler();
    const { filters, filteredTasks, updateFilter, clearFilters, removeFilter, activeFiltersCount } = useFilters(project);
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
    const [showFilters, setShowFilters] = useState(false);
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

    const notifyAiError = useCallback((error: unknown, context: string) => {
        const friendlyMessage = getFriendlyAIErrorMessage(error);
        handleError(new Error(friendlyMessage), context);
    }, [handleError]);
    const [isRunningGeneralAnalysis, setIsRunningGeneralAnalysis] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState<{
        current: number;
        total: number;
        message: string;
    } | null>(null);
    const [showFailedTestsReport, setShowFailedTestsReport] = useState(false);
    const [modalTask, setModalTask] = useState<JiraTask | null>(null);
    const metrics = useProjectMetrics(project);

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
            
            // BDD pode ser gerado para tarefas do tipo "Tarefa" ou "Bug"
            if (task.type !== 'Tarefa' && task.type !== 'Bug') {
                handleError(new Error('BDD só pode ser gerado para tarefas do tipo "Tarefa" ou "Bug"'), 'Gerar cenários BDD');
                return;
            }
            
            const aiService = getAIService();
            const scenarios = await aiService.generateBddScenarios(task.title, task.description, project);
            const updatedTask = { ...task, bddScenarios: [...(task.bddScenarios || []), ...scenarios] };
            const newTasks = project.tasks.map(t => t.id === taskId ? updatedTask : t);
            onUpdateProject({ ...project, tasks: newTasks });
            handleSuccess('Cenários BDD gerados com sucesso!');
        } catch (error) {
            notifyAiError(error, 'Gerar cenários BDD');
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
            
            // Casos de teste só podem ser gerados para tarefas do tipo "Tarefa"
            if (task.type !== 'Tarefa') {
                handleError(new Error('Casos de teste só podem ser gerados para tarefas do tipo "Tarefa"'), 'Gerar casos de teste');
                return;
            }
            
            const aiService = getAIService();
            const { strategy, testCases } = await aiService.generateTestCasesForTask(
                task.title,
                task.description,
                task.bddScenarios,
                detailLevel,
                task.type,
                project
            );
            const updatedTask = { ...task, testStrategy: strategy, testCases };
            const newTasks = project.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
            onUpdateProject({ ...project, tasks: newTasks });
            handleSuccess('Casos de teste gerados com sucesso!');
        } catch (error) {
            notifyAiError(error, 'Gerar casos de teste');
        } finally {
            setGeneratingTestsTaskId(null);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    const handleGenerateAll = useCallback(async (taskId: string, detailLevel: TestCaseDetailLevel = 'Padrão') => {
        setGeneratingAllTaskId(taskId);
        try {
            const task = project.tasks.find(t => t.id === taskId);
            if (!task) throw new Error("Task not found");
            
            // BDD e casos de teste podem ser gerados para tarefas do tipo "Tarefa" ou "Bug"
            if (task.type !== 'Tarefa' && task.type !== 'Bug') {
                handleError(new Error('BDD e casos de teste só podem ser gerados para tarefas do tipo "Tarefa" ou "Bug"'), 'Gerar BDD, estratégias e testes');
                return;
            }
            
            const aiService = getAIService();
            
            // Passo 1: Gerar BDD primeiro
            const bddScenarios = await aiService.generateBddScenarios(task.title, task.description, project);
            
            // Passo 2: Gerar estratégias e casos de teste usando os BDD recém-gerados
            const { strategy, testCases } = await aiService.generateTestCasesForTask(
                task.title,
                task.description,
                bddScenarios, // Usar os BDD recém-gerados
                detailLevel,
                task.type,
                project
            );
            
            // Atualizar a tarefa com todos os dados sincronizados (substituir, não adicionar)
            const updatedTask = {
                ...task,
                bddScenarios, // Substituir BDD
                testStrategy: strategy, // Substituir estratégias
                testCases // Substituir casos de teste
            };
            
            const newTasks = project.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
            onUpdateProject({ ...project, tasks: newTasks });
            handleSuccess('BDD, estratégias e casos de teste gerados com sucesso!');
        } catch (error) {
            notifyAiError(error, 'Gerar BDD, estratégias e testes');
        } finally {
            setGeneratingAllTaskId(null);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    const handleSyncTaskToJira = useCallback(async (taskId: string) => {
        setSyncingTaskId(taskId);
        try {
            const task = project.tasks.find(t => t.id === taskId);
            if (!task) throw new Error("Task not found");

            const config = getJiraConfig();
            if (!config) {
                throw new Error("Jira não configurado. Configure nas configurações primeiro.");
            }

            await syncTaskToJira(config, task);
            handleSuccess('Tarefa sincronizada com o Jira com sucesso!');
        } catch (error) {
            handleError(error, 'Sincronizar com Jira');
        } finally {
            setSyncingTaskId(null);
        }
    }, [project, handleError, handleSuccess]);

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
                    Object.keys(newStrategyTools).forEach((key) => {
                        const index = Number(key);
                        const toolsForIndex = newStrategyTools[index];
                        if (!toolsForIndex || toolsForIndex.length === 0) {
                            delete newStrategyTools[index];
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
        
        // Calcular timeout adaptativo baseado no número de tarefas (fora do try para usar no catch)
        const taskCount = project.tasks.length;
        const adaptiveTimeout = Math.min(120000 + (taskCount * 5000), 180000); // Base 120s + 5s por tarefa, máximo 180s
        
        try {
            // Passo 1: Gerar análise geral
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

            // Identificar tarefas que precisam de BDDs e casos de teste (apenas tipo "Tarefa")
            const tasksNeedingBDD = updatedTasks.filter(task => {
                // BDD só pode ser gerado para tarefas do tipo "Tarefa"
                if (task.type !== 'Tarefa') return false;
                const hasBDD = (task.bddScenarios?.length || 0) > 0;
                return !hasBDD;
            });

            const tasksNeedingTestCases = updatedTasks.filter(task => {
                // Casos de teste só podem ser gerados para tarefas do tipo "Tarefa"
                if (task.type !== 'Tarefa') return false;
                const hasTestCases = (task.testCases?.length || 0) > 0;
                return !hasTestCases;
            });

            // Limitar processamento (máximo 10 tarefas por tipo)
            const MAX_TASKS_TO_PROCESS = 10;
            const limitedBDDTasks = tasksNeedingBDD.slice(0, MAX_TASKS_TO_PROCESS);
            const limitedTestTasks = tasksNeedingTestCases.slice(0, MAX_TASKS_TO_PROCESS);
            
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
                            aiService.generateBddScenarios(task.title, task.description || '', project),
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
                        logger.error(`Erro ao gerar BDDs para tarefa ${task.id}`, 'TasksView', error);
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
                        // Usar a tarefa atualizada do array para garantir que BDDs recém-gerados sejam incluídos
                        const currentTask = taskIndex !== -1 ? updatedTasks[taskIndex] : task;
                        
                        const { strategy, testCases } = await withTimeout(
                            aiService.generateTestCasesForTask(
                                currentTask.title, 
                                currentTask.description || '', 
                                currentTask.bddScenarios || [], // Garantir que seja array
                                'Padrão',
                                currentTask.type,
                                project
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
                        logger.error(`Erro ao gerar casos de teste para tarefa ${task.id}`, 'TasksView', error);
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

            // Criar novo array de tarefas para garantir que React detecte a mudança
            const updatedProject = {
                ...project,
                tasks: [...updatedTasks], // Criar novo array
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
                const taskCount = project.tasks.length;
                const timeoutSeconds = Math.round(adaptiveTimeout / 1000);
                const suggestedMaxTasks = Math.max(5, Math.floor(taskCount * 0.7));
                const errorMsg = `A análise demorou mais de ${timeoutSeconds} segundos e foi interrompida. ` +
                    `O projeto possui ${taskCount} tarefa(s), o que pode ser muito para processar de uma vez. ` +
                    `Sugestão: Tente novamente com menos tarefas (recomendado: até ${suggestedMaxTasks} tarefas por vez) ` +
                    `ou processe em lotes menores. O timeout é adaptativo (${timeoutSeconds}s base + 5s por tarefa, máximo 180s).`;
                handleError(new Error(errorMsg), 'Executar análise geral com IA');
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
            onUpdateProject({ ...project, tasks: newTasks });
        }
        setIsTaskFormOpen(false);
        setEditingTask(undefined);
        setDefaultParentId(undefined);
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
        // Usar categorias do Jira para calcular status
        const inProgress = project.tasks.filter(t => {
            const category = getTaskStatusCategory(t);
            return category === 'Em Andamento';
        }).length;
        const done = project.tasks.filter(t => {
            const category = getTaskStatusCategory(t);
            return category === 'Concluído';
        }).length;
        const bugsOpen = project.tasks.filter(t => {
            if (t.type !== 'Bug') return false;
            const category = getTaskStatusCategory(t);
            return category !== 'Concluído';
        }).length;
        const totalTests = project.tasks.reduce((acc, t) => acc + (t.testCases?.length || 0), 0);
        const executedTests = project.tasks.reduce((acc, t) => acc + (t.testCases?.filter(tc => tc.status !== 'Not Run').length || 0), 0);
        const automatedTests = project.tasks.reduce((acc, t) => acc + (t.testCases?.filter(tc => tc.isAutomated).length || 0), 0);
        return { total, inProgress, done, bugsOpen, totalTests, executedTests, automatedTests };
    }, [project.tasks]);

    const testExecutionRate = stats.totalTests > 0 ? Math.round((stats.executedTests / stats.totalTests) * 100) : 0;
    const automationRate = stats.totalTests > 0 ? Math.round((stats.automatedTests / stats.totalTests) * 100) : 0;

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
            // IMPORTANTE: Buscar o projeto mais recente do store ANTES de qualquer operação
            // Isso garante que temos os status mais recentes, mesmo que não tenham sido salvos no Supabase
            const { projects, updateProject: saveProject } = useProjectsStore.getState();
            const latestProjectFromStore = projects.find(p => p.id === project.id);
            
            // Usar o projeto do store se disponível, caso contrário usar o prop
            let projectToSync = latestProjectFromStore || project;
            
            logger.debug('Buscando projeto mais recente do store antes de sincronizar', 'TasksView', {
                projectId: project.id,
                temProjetoNoStore: !!latestProjectFromStore,
                usandoStore: latestProjectFromStore !== undefined
            });
            
            // Tentar salvar no Supabase (mas não bloquear se falhar devido a timeout)
            try {
                await saveProject(projectToSync, { silent: true });
                logger.debug('Projeto salvo no Supabase antes de sincronizar', 'TasksView');
            } catch (error) {
                logger.warn('Erro ao salvar projeto no Supabase antes de sincronizar (continuando mesmo assim)', 'TasksView', { error });
                // Continuar mesmo se o salvamento falhar - usaremos o projeto do store que tem os status mais recentes
            }
            
            // Aguardar um pequeno delay para garantir que atualizações pendentes sejam processadas
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Buscar novamente o projeto mais recente do store após o delay
            // (pode ter sido atualizado durante o salvamento)
            const { projects: updatedProjects } = useProjectsStore.getState();
            const finalProjectFromStore = updatedProjects.find(p => p.id === project.id);
            if (finalProjectFromStore) {
                projectToSync = finalProjectFromStore;
                logger.debug('Usando projeto atualizado do store após delay', 'TasksView');
            }
            
            // Log detalhado dos status antes da sincronização
            const projectTestStatuses = projectToSync.tasks.flatMap(t => 
                (t.testCases || []).filter(tc => tc.status !== 'Not Run').map(tc => ({
                    taskId: t.id,
                    testCaseId: tc.id,
                    status: tc.status
                }))
            );
            
            logger.info('Iniciando sincronização com Jira usando projeto mais recente do store', 'TasksView', {
                projectId: projectToSync.id,
                testCasesComStatus: projectTestStatuses.length,
                statusDetalhes: projectTestStatuses.slice(0, 10), // Primeiros 10 para debug
                usandoStore: finalProjectFromStore !== undefined
            });
            
            // Usar syncJiraProject que atualiza tarefas existentes e adiciona novas
            // Isso garante que bugs e tarefas modificados no Jira sejam atualizados corretamente
            // IMPORTANTE: Passar o projeto mais recente para garantir que os status estão atualizados
            const updatedProject = await syncJiraProject(
                config,
                projectToSync,
                jiraProjectKey
            );
            
            // VALIDAÇÃO FINAL: Buscar projeto mais recente do store e comparar status
            // Isso garante que nenhum status foi perdido durante a sincronização
            logger.info('Iniciando validação final de status antes de atualizar projeto', 'TasksView', {
                projectId: project.id,
                totalStatusNoUpdatedProject: updatedProject.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length
            });
            
            const { projects: finalProjects } = useProjectsStore.getState();
            const latestProjectAfterSync = finalProjects.find(p => p.id === project.id);
            
            if (latestProjectAfterSync) {
                // Criar mapa de status executados do store (fonte de verdade)
                const storeStatusMap = new Map<string, TestCase['status']>();
                latestProjectAfterSync.tasks.forEach(task => {
                    (task.testCases || []).forEach(tc => {
                        if (tc.id && tc.status !== 'Not Run') {
                            storeStatusMap.set(`${task.id}-${tc.id}`, tc.status);
                        }
                    });
                });
                
                logger.debug('Mapa de status do store criado para validação final', 'TasksView', {
                    totalStatusNoStore: storeStatusMap.size,
                    totalStatusNoUpdatedProject: updatedProject.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length
                });
                
                // Verificar se algum status foi perdido no updatedProject
                let statusPerdidos = 0;
                const restoredTasks = updatedProject.tasks.map(task => {
                    const restoredTestCases = (task.testCases || []).map(tc => {
                        const storeStatus = storeStatusMap.get(`${task.id}-${tc.id}`);
                        if (storeStatus && tc.status === 'Not Run') {
                            // Status foi perdido - restaurar do store
                            statusPerdidos++;
                            logger.warn(`Status perdido detectado em TasksView: taskId=${task.id}, testCaseId=${tc.id}. Restaurando status "${storeStatus}" do store`, 'TasksView', {
                                taskId: task.id,
                                testCaseId: tc.id,
                                statusPerdido: 'Not Run',
                                statusRestaurado: storeStatus
                            });
                            return { ...tc, status: storeStatus };
                        }
                        return tc;
                    });
                    return { ...task, testCases: restoredTestCases };
                });
                
                if (statusPerdidos > 0) {
                    logger.warn(`VALIDAÇÃO FINAL EM TasksView: ${statusPerdidos} status foram perdidos e restaurados do store antes de atualizar`, 'TasksView', {
                        statusRestaurados: statusPerdidos,
                        totalStatusNoStore: storeStatusMap.size,
                        totalStatusNoUpdatedProject: updatedProject.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length,
                        totalStatusNoFinalProject: restoredTasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length
                    });
                    
                    // Usar projeto com status restaurados
                    const finalProject = { ...updatedProject, tasks: restoredTasks };
                    logger.info('Chamando onUpdateProject com projeto com status restaurados', 'TasksView', {
                        statusRestaurados: statusPerdidos
                    });
                    onUpdateProject(finalProject);
                } else {
                    // Nenhum status perdido - usar updatedProject normalmente
                    logger.info('VALIDAÇÃO FINAL EM TasksView: Todos os status foram preservados', 'TasksView', {
                        totalStatusNoStore: storeStatusMap.size,
                        totalStatusNoUpdatedProject: updatedProject.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length
                    });
                    logger.debug('Chamando onUpdateProject com updatedProject (sem perda de status)', 'TasksView');
                    onUpdateProject(updatedProject);
                }
            } else {
                // Store não tem projeto - usar updatedProject normalmente
                logger.warn('VALIDAÇÃO FINAL EM TasksView: Projeto não encontrado no store após sincronização, usando updatedProject', 'TasksView', {
                    projectId: project.id,
                    totalStatusNoUpdatedProject: updatedProject.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length
                });
                onUpdateProject(updatedProject);
            }
            
            // Contar quantas tarefas foram atualizadas/adicionadas
            const existingTaskIds = new Set(project.tasks.map(t => t.id));
            const newTasks = updatedProject.tasks.filter(t => !existingTaskIds.has(t.id));
            const updatedTasks = updatedProject.tasks.filter(t => {
                if (existingTaskIds.has(t.id)) {
                    const oldTask = project.tasks.find(ot => ot.id === t.id);
                    if (!oldTask) return false;
                    
                    // Comparar mais campos para detectar mudanças
                    const hasChanges = (
                        oldTask.title !== t.title ||
                        oldTask.description !== t.description ||
                        oldTask.status !== t.status ||
                        oldTask.jiraStatus !== t.jiraStatus ||
                        oldTask.priority !== t.priority ||
                        oldTask.severity !== t.severity ||
                        JSON.stringify(oldTask.tags || []) !== JSON.stringify(t.tags || []) ||
                        oldTask.completedAt !== t.completedAt ||
                        oldTask.dueDate !== t.dueDate ||
                        oldTask.parentId !== t.parentId ||
                        oldTask.epicKey !== t.epicKey
                    );
                    
                    if (hasChanges) {
                        logger.debug(`Tarefa ${t.id} foi atualizada`, 'TasksView', {
                            title: { old: oldTask.title, new: t.title },
                            status: { old: oldTask.status, new: t.status },
                            jiraStatus: { old: oldTask.jiraStatus, new: t.jiraStatus },
                            priority: { old: oldTask.priority, new: t.priority }
                        });
                    }
                    
                    return hasChanges;
                }
                return false;
            });
            
            // Montar mensagem de sucesso com informações detalhadas
            const messages: string[] = [];
            if (newTasks.length > 0) {
                messages.push(`${newTasks.length} nova(s) tarefa(s) adicionada(s)`);
            }
            if (updatedTasks.length > 0) {
                messages.push(`${updatedTasks.length} tarefa(s) atualizada(s)`);
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
                    onGenerateAll={handleGenerateAll}
                    isGeneratingAll={generatingAllTaskId === task.id}
                    onSyncToJira={handleSyncTaskToJira}
                    isSyncing={syncingTaskId === task.id}
                    onSaveBddScenario={handleSaveBddScenario}
                    onDeleteBddScenario={handleDeleteBddScenario}
                    onTaskStatusChange={(status) => handleTaskStatusChange(task.id, status)}
                    level={level}
                    onAddComment={(content) => handleAddComment(task.id, content)}
                    onEditComment={(commentId, content) => handleEditComment(task.id, commentId, content)}
                    onDeleteComment={(commentId) => handleDeleteComment(task.id, commentId)}
                    onEditTestCase={handleOpenTestCaseEditor}
                    onDeleteTestCase={handleDeleteTestCase}
                    project={project}
                    onUpdateProject={onUpdateProject}
                    onOpenModal={setModalTask}
                >
                    {task.children.length > 0 && renderTaskTree(task.children, level + 1, globalIndex + 1)}
                </JiraTaskItem>
            );
        });
    }, [selectedTasks, generatingTestsTaskId, generatingBddTaskId, generatingAllTaskId, syncingTaskId, handleTestCaseStatusChange, handleToggleTestCaseAutomated, handleExecutedStrategyChange, handleTaskToolsChange, handleTestCaseToolsChange, handleStrategyExecutedChange, handleStrategyToolsChange, handleDeleteTask, handleGenerateTests, openTaskFormForNew, openTaskFormForEdit, handleGenerateBddScenarios, handleGenerateAll, handleSyncTaskToJira, handleSaveBddScenario, handleDeleteBddScenario, handleTaskStatusChange, handleAddComment, handleEditComment, handleDeleteComment, project, onUpdateProject, toggleTaskSelection]);

    return (
        <>
        <Card hoverable={false} className="p-5">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-shrink-0">
                        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Tarefas & Casos de Teste</h3>
                        <p className="text-base-content/70 text-sm max-w-2xl">Acompanhe o progresso das atividades e resultados de QA.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Botão Principal */}
                        <Button 
                            variant="default"
                            size="sm"
                            onClick={() => openTaskFormForNew()} 
                            className="btn btn-primary btn-sm rounded-full flex items-center gap-1.5 font-semibold flex-shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Adicionar Tarefa</span>
                        </Button>
                        
                        {/* Botão de Análise IA */}
                        <div className="flex-shrink-0">
                            <GeneralIAAnalysisButton 
                                onAnalyze={handleGeneralIAAnalysis}
                                isAnalyzing={isRunningGeneralAnalysis}
                                progress={analysisProgress}
                            />
                        </div>
                        
                        {/* Separador visual */}
                        <div className="w-px h-5 bg-base-300 flex-shrink-0" />
                        
                        {/* Botão de Relatório de Testes Reprovados */}
                        {metrics.failedTestCases > 0 && (
                            <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFailedTestsReport(true)} 
                                className="btn btn-error btn-sm rounded-full flex items-center gap-1.5 flex-shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Testes Reprovados ({metrics.failedTestCases})</span>
                            </Button>
                        )}
                        
                        {/* Botões Secundários */}
                        <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(prev => !prev)} 
                            className="btn btn-outline btn-sm rounded-full flex items-center gap-1.5 flex-shrink-0"
                        >
                            <Filter className="w-4 h-4" />
                            <span>{showFilters ? 'Ocultar Filtros' : `Filtros${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}</span>
                        </Button>
                        
                        <Button 
                            variant="outline"
                            size="sm"
                            onClick={handleSyncJira} 
                            disabled={isSyncingJira}
                            className="btn btn-outline btn-sm rounded-full flex items-center gap-1.5 flex-shrink-0"
                        >
                            {isSyncingJira ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Sincronizando...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Atualizar do Jira</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="mb-4">
                    <label 
                        htmlFor="quick-task-search" 
                        className="text-sm font-semibold text-base-content mb-2 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Busca rápida por tarefa ou teste
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60">🔍</span>
                        <input
                            id="quick-task-search"
                            type="search"
                            inputMode="search"
                            autoComplete="off"
                            value={filters.searchQuery || ''}
                            onChange={(e) => updateFilter('searchQuery', e.target.value)}
                            placeholder="Digite ID, título ou palavra-chave..."
                            className="input input-bordered w-full pl-10 pr-12 py-2.5 bg-base-100 border-base-300 text-base-content placeholder:text-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        {filters.searchQuery && (
                            <button
                                type="button"
                                onClick={() => updateFilter('searchQuery', '')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content p-2 rounded-full hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                aria-label="Limpar busca rápida"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-base-content/70 mt-2">
                        Filtre tarefas e casos instantaneamente sem precisar abrir o painel completo de filtros.
                    </p>
                </div>

                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.1,
                            },
                        },
                    }}
                >
                    <motion.div 
                        className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-orange-500/5 backdrop-blur-xl border border-orange-500/30 hover:border-orange-500/50 transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20 cursor-help" 
                        aria-live="polite"
                        title={`Total de ${stats.total} tarefas no projeto. Inclui todas as tarefas independente do status.`}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        {/* Glassmorphism overlay */}
                        <div className="absolute inset-0 bg-base-100/60 dark:bg-base-100/40 backdrop-blur-xl" />
                        
                        {/* Animated gradient orb no hover */}
                        <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-orange-500/5 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-700" />
                        
                        {/* Shine effect no hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-base-content/70 mb-2 uppercase tracking-wider">Total de Tarefas</p>
                                    <p className="text-5xl font-bold tracking-tight text-orange-400 dark:text-orange-300 transition-transform duration-500 group-hover:scale-110" aria-label={`${stats.total} tarefas totais`}>
                                        {stats.total}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/15 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                                    <Clipboard className="w-6 h-6 text-orange-400 dark:text-orange-300" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-blue-500/5 backdrop-blur-xl border border-blue-500/30 hover:border-blue-500/50 transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 cursor-help" 
                        aria-live="polite"
                        title={`${stats.inProgress} tarefas em andamento. Tarefas que estão sendo trabalhadas atualmente.`}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        {/* Glassmorphism overlay */}
                        <div className="absolute inset-0 bg-base-100/60 dark:bg-base-100/40 backdrop-blur-xl" />
                        
                        {/* Animated gradient orb no hover */}
                        <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-blue-500/5 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-700" />
                        
                        {/* Shine effect no hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-base-content/70 mb-2 uppercase tracking-wider">Em Andamento</p>
                                    <p className="text-5xl font-bold tracking-tight text-blue-400 dark:text-blue-300 transition-transform duration-500 group-hover:scale-110" aria-label={`${stats.inProgress} tarefas em andamento`}>
                                        {stats.inProgress}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/15 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                                    <Zap className="w-6 h-6 text-blue-400 dark:text-blue-300" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-emerald-500/5 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 cursor-help" 
                        aria-live="polite"
                        title={`${stats.done} tarefas concluídas. Tarefas finalizadas e validadas.`}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        {/* Glassmorphism overlay */}
                        <div className="absolute inset-0 bg-base-100/60 dark:bg-base-100/40 backdrop-blur-xl" />
                        
                        {/* Animated gradient orb no hover */}
                        <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-emerald-500/5 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-700" />
                        
                        {/* Shine effect no hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-base-content/70 mb-2 uppercase tracking-wider">Concluídas</p>
                                    <p className="text-5xl font-bold tracking-tight text-emerald-400 dark:text-emerald-300 transition-transform duration-500 group-hover:scale-110" aria-label={`${stats.done} tarefas concluídas`}>
                                        {stats.done}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/15 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-400 dark:text-emerald-300" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-rose-500/20 via-red-500/10 to-rose-500/5 backdrop-blur-xl border border-rose-500/30 hover:border-rose-500/50 transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-rose-500/20 cursor-help" 
                        aria-live="polite"
                        title={`${stats.bugsOpen} bugs abertos. Problemas identificados que ainda precisam ser resolvidos.`}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        {/* Glassmorphism overlay */}
                        <div className="absolute inset-0 bg-base-100/60 dark:bg-base-100/40 backdrop-blur-xl" />
                        
                        {/* Animated gradient orb no hover */}
                        <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-rose-500/20 via-red-500/10 to-rose-500/5 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-700" />
                        
                        {/* Shine effect no hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-base-content/70 mb-2 uppercase tracking-wider">Bugs Abertos</p>
                                    <p className="text-5xl font-bold tracking-tight text-rose-400 dark:text-rose-300 transition-transform duration-500 group-hover:scale-110" aria-label={`${stats.bugsOpen} bugs abertos`}>
                                        {stats.bugsOpen}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-rose-500/10 group-hover:bg-rose-500/15 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                                    <AlertTriangle className="w-6 h-6 text-rose-400 dark:text-rose-300" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="bg-base-100 rounded-xl p-5 border border-base-300 hover:border-primary/40 hover:shadow-lg col-span-1 md:col-span-2 lg:col-span-4 cursor-help relative overflow-hidden transition-all duration-300"
                        title={`Taxa de execução de testes: ${testExecutionRate}%. ${stats.executedTests} de ${stats.totalTests} casos foram executados. Taxa de automação: ${automationRate}%.`}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-primary/10 rounded-xl">
                                        <ModernIcons.TestExecution className="text-primary" size={22} />
                                    </div>
                                    <p className="text-base font-semibold text-base-content">Execução de Testes</p>
                                </div>
                                <span className="text-2xl font-bold text-primary" aria-label={`${testExecutionRate}% de execução`}>{testExecutionRate}%</span>
                            </div>
                            <div className="w-full bg-base-200/80 rounded-full h-3.5 mb-2 overflow-hidden relative" role="progressbar" aria-valuenow={testExecutionRate} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso de execução: ${testExecutionRate}%`}>
                                <div 
                                    className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                                    style={{ width: `${testExecutionRate}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-base-content/70">
                                <p aria-label={`${stats.executedTests} de ${stats.totalTests} casos executados`} className="font-medium">
                                    {stats.executedTests}/{stats.totalTests} casos executados
                                </p>
                                <p className="font-medium">
                                    Automação <span className="font-bold text-primary" aria-label={`${automationRate}% de automação`}>{automationRate}%</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Barra de filtros rápidos visíveis */}
            <QuickFilters
                filters={filters}
                activeFiltersCount={activeFiltersCount}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
                onRemoveFilter={removeFilter}
            />

            <div className={`grid gap-6 ${showFilters ? 'lg:grid-cols-[360px_1fr]' : ''}`}>
                {showFilters && (
                    <aside className="space-y-4">
                        <div className="rounded-[var(--rounded-box)] border border-base-300 bg-base-100 p-4">
                            <FilterPanel
                                filters={filters}
                                onFilterChange={updateFilter}
                                onClearFilters={clearFilters}
                                availableTestTypes={availableTestTypes}
                                activeFiltersCount={activeFiltersCount}
                            />
                        </div>
                    </aside>
                )}

                <div className="space-y-4 min-w-0">
                    <div className="flex flex-col gap-4">
                        {selectedTasks.size > 0 && (
                            <BulkActions
                                selectedTasks={selectedTasks}
                                project={project}
                                onUpdateProject={onUpdateProject}
                                onClearSelection={() => setSelectedTasks(new Set())}
                                onProjectCreated={(projectId) => {
                                    const { selectProject } = useProjectsStore.getState();
                                    selectProject(projectId);
                                }}
                            />
                        )}
                        {(generatingTestsTaskId || generatingBddTaskId) && (
                            <div className="p-4 bg-primary/10 border border-primary/40 rounded-lg text-sm text-base-content flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
                                {generatingTestsTaskId && <span>Gerando casos de teste para {generatingTestsTaskId}...</span>}
                                {generatingBddTaskId && <span>Gerando cenários BDD para {generatingBddTaskId}...</span>}
                            </div>
                        )}
                    </div>

        <Modal 
            isOpen={isTaskFormOpen} 
            onClose={() => { 
                setIsTaskFormOpen(false); 
                setEditingTask(undefined); 
                setDefaultParentId(undefined);
            }}
            title={editingTask ? 'Editar Tarefa' : 'Adicionar Tarefa'}
            size="xl"
        >
            <TaskForm 
                onSave={handleSaveTask} 
                onCancel={() => { 
                    setIsTaskFormOpen(false); 
                    setEditingTask(undefined); 
                    setDefaultParentId(undefined);
                }} 
                existingTask={editingTask}
                epics={epics}
                parentId={defaultParentId}
            />
        </Modal>

        <Modal 
            isOpen={showJiraProjectSelector} 
            onClose={() => {
                setShowJiraProjectSelector(false);
                setSelectedJiraProjectKey('');
            }}
            title="Selecionar Projeto do Jira"
        >
                <div className="space-y-4">
                    <p className="text-base-content/70 text-sm">
                        Selecione o projeto do Jira para sincronizar apenas as novas tarefas:
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-2">
                            Projeto
                        </label>
                        <select
                            value={selectedJiraProjectKey}
                            onChange={(e) => setSelectedJiraProjectKey(e.target.value)}
                            className="select select-bordered w-full"
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
                            type="button"
                            onClick={() => {
                                setShowJiraProjectSelector(false);
                                setSelectedJiraProjectKey('');
                            }}
                            className="btn btn-ghost"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
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
                        <div>
                            {renderTaskTree(taskTree, 0).map((taskElement, index) => (
                                <motion.div
                                    key={taskElement.key || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ 
                                        delay: index * 0.05,
                                        duration: 0.3 
                                    }}
                                >
                                    {taskElement}
                                </motion.div>
                            ))}
                        </div>
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
                </div>
            </div>
        </Card>

        <Modal 
            isOpen={failModalState.isOpen} 
            onClose={() => setFailModalState({ ...failModalState, isOpen: false })} 
            title="Registrar Falha no Teste"
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="observed-result" className="block text-sm font-medium text-base-content/70 mb-1">Resultado Encontrado (O que aconteceu de errado?)</label>
                    <textarea 
                        id="observed-result" 
                        value={failModalState.observedResult} 
                        onChange={e => setFailModalState({ ...failModalState, observedResult: e.target.value })} 
                        rows={4}
                        className="textarea textarea-bordered w-full"
                    ></textarea>
                </div>
                <div className="flex items-center">
                    <input 
                        id="create-bug-task" 
                        type="checkbox" 
                        checked={failModalState.createBug} 
                        onChange={e => setFailModalState({ ...failModalState, createBug: e.target.checked })}
                        className="checkbox checkbox-primary"
                    />
                    <label htmlFor="create-bug-task" className="ml-2 block text-sm text-base-content">Criar tarefa de Bug automaticamente</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setFailModalState({ ...failModalState, isOpen: false })} className="btn btn-ghost">Cancelar</button>
                    <button type="button" onClick={handleConfirmFail} className="btn btn-error">Confirmar Reprovação</button>
                </div>
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

        {/* Modal de Relatório de Testes Reprovados */}
        <FailedTestsReportModal
            isOpen={showFailedTestsReport}
            onClose={() => setShowFailedTestsReport(false)}
            project={project}
        />

        {/* Modal de Detalhes da Tarefa */}
        {modalTask && (() => {
            // Encontrar a tarefa completa com children
            const findTaskWithChildren = (tasks: JiraTask[], taskId: string): TaskWithChildren | null => {
                for (const t of tasks) {
                    if (t.id === taskId) {
                        const children = tasks.filter(child => child.parentId === taskId);
                        return {
                            ...t,
                            children: children.map(child => findTaskWithChildren(tasks, child.id) || { ...child, children: [] })
                        } as TaskWithChildren;
                    }
                }
                return null;
            };

            const taskWithChildren = findTaskWithChildren(project.tasks, modalTask.id);
            if (!taskWithChildren) return null;

            return (
                <TaskDetailsModal
                    task={taskWithChildren}
                    isOpen={!!modalTask}
                    onClose={() => setModalTask(null)}
                    onTestCaseStatusChange={(testCaseId, status) => handleTestCaseStatusChange(modalTask.id, testCaseId, status)}
                    onToggleTestCaseAutomated={(testCaseId, isAutomated) => handleToggleTestCaseAutomated(modalTask.id, testCaseId, isAutomated)}
                    onExecutedStrategyChange={(testCaseId, strategies) => handleExecutedStrategyChange(modalTask.id, testCaseId, strategies)}
                    onTaskToolsChange={(tools) => handleTaskToolsChange(modalTask.id, tools)}
                    onTestCaseToolsChange={(testCaseId, tools) => handleTestCaseToolsChange(modalTask.id, testCaseId, tools)}
                    onStrategyExecutedChange={(strategyIndex, executed) => handleStrategyExecutedChange(modalTask.id, strategyIndex, executed)}
                    onStrategyToolsChange={(strategyIndex, tools) => handleStrategyToolsChange(modalTask.id, strategyIndex, tools)}
                    onGenerateTests={handleGenerateTests}
                    isGenerating={generatingTestsTaskId === modalTask.id}
                    onGenerateBddScenarios={handleGenerateBddScenarios}
                    isGeneratingBdd={generatingBddTaskId === modalTask.id}
                    onGenerateAll={handleGenerateAll}
                    isGeneratingAll={generatingAllTaskId === modalTask.id}
                    onSaveBddScenario={handleSaveBddScenario}
                    onDeleteBddScenario={handleDeleteBddScenario}
                    onAddComment={(content) => handleAddComment(modalTask.id, content)}
                    onEditComment={(commentId, content) => handleEditComment(modalTask.id, commentId, content)}
                    onDeleteComment={(commentId) => handleDeleteComment(modalTask.id, commentId)}
                    onEditTestCase={handleOpenTestCaseEditor}
                    onDeleteTestCase={handleDeleteTestCase}
                    project={project}
                    onUpdateProject={onUpdateProject}
                    onOpenTask={setModalTask}
                />
            );
        })()}

        </>
    );
};
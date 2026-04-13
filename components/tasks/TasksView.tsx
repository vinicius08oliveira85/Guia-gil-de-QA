import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Project, JiraTask, BddScenario, TestCaseDetailLevel, TestCase, Comment, TaskTestStatus } from '../../types';
import { getAIService } from '../../services/ai/aiServiceFactory';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { TaskForm } from './TaskForm';
import { TestCaseEditorModal } from './TestCaseEditorModal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Zap, AlertTriangle, X, Check, Link as LinkIcon, Clock, ClipboardList, CheckCircle, Star, List, Download } from 'lucide-react';
import { logger } from '../../utils/logger';
import { useProjectsStore } from '../../store/projectsStore';
import { getFriendlyAIErrorMessage } from '../../utils/aiErrorMapper';
import { withTimeout } from '../../utils/withTimeout';
import { JiraTaskItem, TaskWithChildren } from './JiraTaskItem';
import { TaskDetailsModal } from './TaskDetailsModal';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { createBugFromFailedTest } from '../../utils/bugAutoCreation';
import { getTaskDependents, getReadyTasks } from '../../utils/dependencyService';
import { notifyTestFailed, notifyBugCreated, notifyCommentAdded, notifyDependencyResolved } from '../../utils/notificationService';
import { BulkActions } from '../common/BulkActions';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { EmptyState } from '../common/EmptyState';
import { getJiraConfig, syncTaskToJira, fetchJiraTaskFormDataByKey, updateSingleTaskFromJira } from '../../services/jiraService';
import { GeneralIAAnalysisButton } from './GeneralIAAnalysisButton';
import { TasksViewHeader } from './TasksViewHeader';
import { TasksViewSearch } from './TasksViewSearch';
import { TasksViewFiltersModalContent } from './TasksViewFiltersModal';
import { TasksViewList } from './TasksViewList';
import { generateGeneralIAAnalysis } from '../../services/ai/generalAnalysisService';
import { FailedTestsReportModal } from './FailedTestsReportModal';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { GlassIndicatorCards } from '../dashboard/GlassIndicatorCards';
import { getDisplayStatus } from '../../utils/taskHelpers';
import { normalizeExecutedStrategy } from '../../utils/testCaseMigration';
import { FileExportModal } from '../common/FileExportModal';
import {
    buildAttachmentsContextForTask,
    taskMatchesStatusName,
    taskMatchesPriorityName,
    getEffectiveTestStatus,
    TEST_STATUS_FILTER_OPTIONS,
    getTaskComparator,
    PT_STATUS_TO_CATEGORY,
    mapJiraStatusToTaskStatus,
    type TaskSortBy,
    type TaskGroupBy,
} from './tasksViewHelpers';

export const TasksView: React.FC<{ 
    project: Project, 
    onUpdateProject: (project: Project) => void,
    onNavigateToTab?: (tabId: string) => void,
    initialTaskId?: string
}> = ({ project, onUpdateProject, onNavigateToTab, initialTaskId }) => {
    const [generatingTestsTaskId, setGeneratingTestsTaskId] = useState<string | null>(null);
    const [generatingBddTaskId, setGeneratingBddTaskId] = useState<string | null>(null);
    const [generatingAllTaskId, setGeneratingAllTaskId] = useState<string | null>(null);

    /** Garante uma única operação Gemini por vez na tela de tarefas (evita 429 por paralelismo). */
    const geminiOpQueueRef = useRef(Promise.resolve());
    const enqueueGeminiOperation = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
        const scheduled = geminiOpQueueRef.current.then(() => operation());
        geminiOpQueueRef.current = scheduled.then(
            () => undefined,
            () => undefined
        );
        return scheduled;
    }, []);
    const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
    const [updatingFromJiraTaskId, setUpdatingFromJiraTaskId] = useState<string | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const { handleError, handleSuccess } = useErrorHandler();
    
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<JiraTask | undefined>(undefined);
    const [testCaseEditorRef, setTestCaseEditorRef] = useState<{ taskId: string; testCase: TestCase } | null>(null);
    const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
    
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selectedTargetProjects, setSelectedTargetProjects] = useState<Set<string>>(new Set());
    const [showExportTasksModal, setShowExportTasksModal] = useState(false);

    const [confirmDeleteState, setConfirmDeleteState] = useState<{
        type: 'task' | 'testcase' | 'bdd';
        taskId: string;
        targetId?: string;
        label?: string;
    } | null>(null);

    const {
        searchQuery,
        setSearchQuery,
        debouncedSearchQuery,
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        typeFilter,
        setTypeFilter,
        testStatusFilter,
        setTestStatusFilter,
        qualityFilter,
        setQualityFilter,
        sortBy,
        setSortBy,
        groupBy,
        setGroupBy,
        filteredTasks,
        counts,
        activeFiltersCount,
        clearAllFilters,
        statusOptions,
        priorityOptions,
    } = useTaskFilters(project);

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

    // Validação inicial do projeto - retornar EmptyState se inválido
    if (!project || typeof project !== 'object' || !project.tasks || !Array.isArray(project.tasks)) {
        logger.warn('Projeto inválido ou sem tarefas', 'TasksView', { projectId: project?.id, hasTasks: !!project?.tasks });
        return (
            <div className="container mx-auto p-4 md:p-5">
                <EmptyState 
                    title="Projeto inválido"
                    description="Projeto inválido ou sem tarefas. Por favor, selecione outro projeto ou crie um novo."
                    icon={<AlertTriangle className="w-12 h-12 text-warning" />}
                />
            </div>
        );
    }

    const notifyAiError = useCallback((error: unknown, context: string) => {
        const friendlyMessage = getFriendlyAIErrorMessage(error);
        handleError(new Error(friendlyMessage), context);
    }, [handleError]);
    const [isRunningGeneralAnalysis, setIsRunningGeneralAnalysis] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState<{
        current: number;
        total: number;
        message: string;
        estimatedSeconds?: number;
    } | null>(null);
    const [showFailedTestsReport, setShowFailedTestsReport] = useState(false);
    const [modalTask, setModalTask] = useState<JiraTask | null>(null);
    const metrics = useProjectMetrics(project);
    const { projects: allProjects, updateProject: updateGlobalProject } = useProjectsStore();

    // Tarefa com árvore de children estável por referência (evita re-renders em cascata no TestReportModal)
    const taskForModal = useMemo<TaskWithChildren | null>(() => {
        if (!modalTask) return null;
        const tasks = project.tasks;
        const taskById = new Map(tasks.map((t) => [t.id, t]));
        if (!taskById.has(modalTask.id)) return { ...modalTask, children: [] };
        const visited = new Set<string>();
        const queue: string[] = [modalTask.id];
        visited.add(modalTask.id);
        const order: string[] = [];
        while (queue.length > 0) {
            const id = queue.shift()!;
            order.push(id);
            const children = tasks.filter((c) => c.parentId === id);
            for (const c of children) {
                if (!visited.has(c.id)) {
                    visited.add(c.id);
                    queue.push(c.id);
                }
            }
        }
        const built = new Map<string, TaskWithChildren>();
        for (let i = order.length - 1; i >= 0; i--) {
            const id = order[i];
            const t = taskById.get(id)!;
            const children = tasks
                .filter((c) => c.parentId === id)
                .map((c) => built.get(c.id) ?? ({ ...c, children: [] } as TaskWithChildren));
            built.set(id, { ...t, children } as TaskWithChildren);
        }
        return built.get(modalTask.id) ?? { ...modalTask, children: [] };
    }, [project.tasks, modalTask]);

    // Função helper para delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper para propagar atualizações de tarefas para outros projetos vinculados
    const propagateTaskUpdate = useCallback((updatedTask: JiraTask) => {
        const otherProjects = allProjects.filter(p => p.id !== project.id);
        otherProjects.forEach(p => {
            const taskIndex = p.tasks.findIndex(t => t.id === updatedTask.id);
            if (taskIndex !== -1) {
                const newTasks = [...p.tasks];
                // Preservar campos específicos do projeto se necessário, mas o requisito pede sincronização de conteúdo
                newTasks[taskIndex] = { ...updatedTask }; 
                updateGlobalProject({ ...p, tasks: newTasks }, { silent: true });
            }
        });
    }, [allProjects, project.id, updateGlobalProject]);

    const handleTaskStatusChange = useCallback((taskId: string, status: 'To Do' | 'In Progress' | 'Done') => {
        const task = project.tasks.find(t => t.id === taskId);
        const previousStatus = task?.status;
        
        const updatedTask = task ? { 
            ...task, 
            status,
            completedAt: status === 'Done' ? new Date().toISOString() : task.completedAt 
        } : null;

        if (!updatedTask) return;

        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? updatedTask : t)
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

        // Propagar atualização para outros projetos
        propagateTaskUpdate(updatedTask);
    }, [project, onUpdateProject]);
    
    const handleGenerateBddScenarios = useCallback(async (taskId: string) => {
        return enqueueGeminiOperation(async () => {
            setGeneratingBddTaskId(taskId);
            try {
                const task = project.tasks.find(t => t.id === taskId);
                if (!task) throw new Error("Task not found");

                if (task.type !== 'Tarefa' && task.type !== 'Bug') {
                    handleError(new Error('BDD só pode ser gerado para tarefas do tipo "Tarefa" ou "Bug"'), 'Gerar cenários BDD');
                    return;
                }

                const aiService = getAIService();
                const attachmentsContext = buildAttachmentsContextForTask(task);
                const scenarios = await aiService.generateBddScenarios(task.title, task.description, project, attachmentsContext || undefined);
                const updatedTask = { ...task, bddScenarios: [...(task.bddScenarios || []), ...scenarios] };
                const newTasks = project.tasks.map(t => t.id === taskId ? updatedTask : t);
                onUpdateProject({ ...project, tasks: newTasks });
                propagateTaskUpdate(updatedTask);
                handleSuccess('Cenários BDD gerados com sucesso!');
            } catch (error) {
                notifyAiError(error, 'Gerar cenários BDD');
            } finally {
                setGeneratingBddTaskId(null);
            }
        });
    }, [project, onUpdateProject, handleError, handleSuccess, enqueueGeminiOperation]);

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
        propagateTaskUpdate(updatedTask);

    }, [project, onUpdateProject]);

    const handleDeleteBddScenario = useCallback((taskId: string, scenarioId: string) => {
        setConfirmDeleteState({ type: 'bdd', taskId, targetId: scenarioId, label: 'este cenário BDD' });
    }, []);

    const executeDeleteBddScenario = useCallback((taskId: string, scenarioId: string) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;
        const updatedScenarios = (task.bddScenarios || []).filter(sc => sc.id !== scenarioId);
        const updatedTask = { ...task, bddScenarios: updatedScenarios };
        const newTasks = project.tasks.map(t => t.id === taskId ? updatedTask : t);
        onUpdateProject({ ...project, tasks: newTasks });
        propagateTaskUpdate(updatedTask);
    }, [project, onUpdateProject]);

    const handleGenerateTests = useCallback(async (taskId: string, detailLevel: TestCaseDetailLevel) => {
        return enqueueGeminiOperation(async () => {
            setGeneratingTestsTaskId(taskId);
            try {
                const task = project.tasks.find(t => t.id === taskId);
                if (!task) throw new Error("Task not found");

                if (task.type !== 'Tarefa') {
                    handleError(new Error('Casos de teste só podem ser gerados para tarefas do tipo "Tarefa"'), 'Gerar casos de teste');
                    return;
                }

                const aiService = getAIService();
                const attachmentsContext = buildAttachmentsContextForTask(task);
                const { strategy, testCases } = await aiService.generateTestCasesForTask(
                    task.title,
                    task.description,
                    task.bddScenarios,
                    detailLevel,
                    task.type,
                    project,
                    attachmentsContext || undefined
                );
                const updatedTask = { ...task, testStrategy: strategy, testCases };
                const newTasks = project.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
                onUpdateProject({ ...project, tasks: newTasks });
                propagateTaskUpdate(updatedTask);
                handleSuccess('Casos de teste gerados com sucesso!');
            } catch (error) {
                notifyAiError(error, 'Gerar casos de teste');
            } finally {
                setGeneratingTestsTaskId(null);
            }
        });
    }, [project, onUpdateProject, handleError, handleSuccess, enqueueGeminiOperation]);

    const handleGenerateAll = useCallback(async (taskId: string, detailLevel: TestCaseDetailLevel = 'Padrão') => {
        return enqueueGeminiOperation(async () => {
            setGeneratingAllTaskId(taskId);
            try {
                const task = project.tasks.find(t => t.id === taskId);
                if (!task) throw new Error("Task not found");

                if (task.type !== 'Tarefa' && task.type !== 'Bug') {
                    handleError(new Error('BDD e casos de teste só podem ser gerados para tarefas do tipo "Tarefa" ou "Bug"'), 'Gerar BDD, estratégias e testes');
                    return;
                }

                const aiService = getAIService();
                const attachmentsContext = buildAttachmentsContextForTask(task);
                const { strategy, testCases, bddScenarios } = await aiService.generateTestCasesForTask(
                    task.title,
                    task.description,
                    undefined,
                    detailLevel,
                    task.type,
                    project,
                    attachmentsContext || undefined
                );

                const updatedTask = {
                    ...task,
                    bddScenarios,
                    testStrategy: strategy,
                    testCases
                };

                const newTasks = project.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
                onUpdateProject({ ...project, tasks: newTasks });
                propagateTaskUpdate(updatedTask);
                handleSuccess('BDD, estratégias e casos de teste gerados com sucesso!');
            } catch (error) {
                notifyAiError(error, 'Gerar BDD, estratégias e testes');
            } finally {
                setGeneratingAllTaskId(null);
            }
        });
    }, [project, onUpdateProject, handleError, handleSuccess, enqueueGeminiOperation]);

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

    const handleUpdateTaskFromJira = useCallback(async (taskId: string) => {
        setUpdatingFromJiraTaskId(taskId);
        try {
            const config = getJiraConfig();
            if (!config) {
                throw new Error('Jira não configurado. Configure nas configurações primeiro.');
            }
            const updatedProject = await updateSingleTaskFromJira(config, project, taskId);
            await onUpdateProject(updatedProject);
            handleSuccess('Tarefa atualizada do Jira.');
        } catch (error) {
            handleError(error instanceof Error ? error : new Error(String(error)), 'Atualizar do Jira');
        } finally {
            setUpdatingFromJiraTaskId(null);
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
        
        const newTasks = project.tasks.map(t => t.id === taskId ? updatedTask : t);
    
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
        propagateTaskUpdate(updatedTask);
        
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
            propagateTaskUpdate(updatedTask);
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
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        const originalTestCases = task.testCases || [];
        const updatedTestCases = originalTestCases.map(tc => 
            tc.id === testCaseId ? { ...tc, isAutomated } : tc
        );
        const updatedTask = { ...task, testCases: updatedTestCases };

        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? updatedTask : t)
        });
        propagateTaskUpdate(updatedTask);
    }, [project, onUpdateProject]);

    const handleExecutedStrategyChange = useCallback((taskId: string, testCaseId: string, strategies: string[]) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        const originalTestCases = task.testCases || [];
        const updatedTestCases = originalTestCases.map(tc => 
            tc.id === testCaseId ? { ...tc, executedStrategy: strategies } : tc
        );
        const updatedTask = { ...task, testCases: updatedTestCases };

        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? updatedTask : t)
        });
        propagateTaskUpdate(updatedTask);
    }, [project, onUpdateProject]);

    const handleTaskToolsChange = useCallback((taskId: string, tools: string[]) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;
        const updatedTask = { ...task, toolsUsed: tools };
        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? updatedTask : t)
        });
        propagateTaskUpdate(updatedTask);
    }, [project, onUpdateProject]);

    const handleTestCaseToolsChange = useCallback((taskId: string, testCaseId: string, tools: string[]) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedTestCases = (task.testCases || []).map(tc =>
            tc.id === testCaseId ? { ...tc, toolsUsed: tools } : tc
        );
        const updatedTask = { ...task, testCases: updatedTestCases };

        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? updatedTask : t)
        });
        propagateTaskUpdate(updatedTask);
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
            const updatedTask = { ...t, testCases: updatedCases };
            propagateTaskUpdate(updatedTask);
            return updatedTask;
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
        setConfirmDeleteState({ type: 'testcase', taskId, targetId: testCaseId, label: 'este caso de teste' });
    }, [project, handleError]);

    const executeDeleteTestCase = useCallback((taskId: string, testCaseId: string) => {
        const updatedTasks = project.tasks.map(t => {
            if (t.id !== taskId) return t;
            const updatedCases = (t.testCases || []).filter(tc => tc.id !== testCaseId);
            const updatedTask = { ...t, testCases: updatedCases };
            propagateTaskUpdate(updatedTask);
            return updatedTask;
        });
        onUpdateProject({ ...project, tasks: updatedTasks });
        setTestCaseEditorRef(prev => {
            if (prev && prev.taskId === taskId && prev.testCase.id === testCaseId) return null;
            return prev;
        });
        handleSuccess('Caso de teste excluído.');
    }, [project, onUpdateProject, handleSuccess]);

    const handleDuplicateTestCase = useCallback((taskId: string, testCase: TestCase) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) {
            handleError(new Error('Tarefa não encontrada ao duplicar o teste'), 'Duplicar caso de teste');
            return;
        }
        const clone: TestCase = {
            ...testCase,
            id: crypto.randomUUID?.() ?? `tc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            status: 'Not Run',
            isAutomated: false,
            observedResult: undefined,
        };
        const updatedTasks = project.tasks.map(t => {
            if (t.id !== taskId) return t;
            const updatedCases = [...(t.testCases || []), clone];
            const updatedTask = { ...t, testCases: updatedCases };
            propagateTaskUpdate(updatedTask);
            return updatedTask;
        });
        onUpdateProject({ ...project, tasks: updatedTasks });
        handleSuccess('Caso de teste duplicado.');
    }, [project, onUpdateProject, handleSuccess, handleError]);

    const handleStrategyExecutedChange = useCallback((taskId: string, strategyIndex: number, executed: boolean) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        const strategy = task.testStrategy?.[strategyIndex];
        const testType = strategy?.testType;

        const currentExecuted = task.executedStrategies || [];
        let newExecuted: number[];
        let updatedTestCases = task.testCases || [];

        if (executed) {
            newExecuted = currentExecuted.includes(strategyIndex)
                ? currentExecuted
                : [...currentExecuted, strategyIndex];
        } else {
            newExecuted = currentExecuted.filter(idx => idx !== strategyIndex);
        }

        if (testType) {
            updatedTestCases = (task.testCases || []).map(testCase => {
                const hasStrategy = (testCase.strategies || []).includes(testType);
                if (!hasStrategy) return testCase;

                const current = normalizeExecutedStrategy(testCase.executedStrategy);
                if (executed) {
                    if (current.includes(testType)) return testCase;
                    return { ...testCase, executedStrategy: [...current, testType] };
                }
                const newExecutedStrategy = current.filter(s => s !== testType);
                return {
                    ...testCase,
                    executedStrategy: newExecutedStrategy.length > 0 ? newExecutedStrategy : undefined
                };
            });
        }

        let updatedTask: JiraTask;
        if (executed) {
            updatedTask = { ...task, executedStrategies: newExecuted, testCases: updatedTestCases };
        } else {
            const strategyTools = { ...(task.strategyTools || {}) };
            delete strategyTools[strategyIndex];
            updatedTask = {
                ...task,
                executedStrategies: newExecuted,
                testCases: updatedTestCases,
                strategyTools: Object.keys(strategyTools).length > 0 ? strategyTools : undefined
            };
        }

        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? updatedTask : t)
        });
        propagateTaskUpdate(updatedTask);
    }, [project, onUpdateProject]);

    const handleStrategyToolsChange = useCallback((taskId: string, strategyIndex: number, tools: string[]) => {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

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
        
        const updatedTask = { 
            ...task, 
            strategyTools: Object.keys(newStrategyTools).length > 0 ? newStrategyTools : undefined
        };

        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? updatedTask : t)
        });
        propagateTaskUpdate(updatedTask);
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

        propagateTaskUpdate(updatedTask);
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
        propagateTaskUpdate(updatedTask);
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
        propagateTaskUpdate(updatedTask);
    }, [project, onUpdateProject]);

    const handleGeneralIAAnalysis = useCallback(async () => {
        return enqueueGeminiOperation(async () => {
        const taskCount = project.tasks.length;
        const adaptiveTimeout = Math.min(120000 + (taskCount * 5000), 180000); // Base 120s + 5s por tarefa, máximo 180s
        const estimatedSeconds = Math.round(adaptiveTimeout / 1000);

        setIsRunningGeneralAnalysis(true);
        setAnalysisProgress({ current: 0, total: 0, message: 'Iniciando análise...', estimatedSeconds });

        try {
            // Passo 1: Gerar análise geral
            setAnalysisProgress({ current: 1, total: 3, message: 'Gerando análise geral do projeto...', estimatedSeconds });
            const analysis = await withTimeout(generateGeneralIAAnalysis(project), adaptiveTimeout);
            const aiService = getAIService();
            
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
                    message: `Gerando BDDs (0/${limitedBDDTasks.length})...`,
                    estimatedSeconds 
                });

                for (let i = 0; i < limitedBDDTasks.length; i++) {
                    const task = limitedBDDTasks[i];
                    processedCount++;
                    
                    setAnalysisProgress({ 
                        current: 2, 
                        total: 3, 
                        message: `Gerando BDDs para "${task.title.substring(0, 30)}..." (${i + 1}/${limitedBDDTasks.length})`,
                        estimatedSeconds 
                    });

                    try {
                        const attachmentsContext = buildAttachmentsContextForTask(task);
                        const scenarios = await withTimeout(
                            aiService.generateBddScenarios(task.title, task.description || '', project, attachmentsContext || undefined),
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
                    message: `Gerando casos de teste (0/${limitedTestTasks.length})...`,
                    estimatedSeconds 
                });

                for (let i = 0; i < limitedTestTasks.length; i++) {
                    const task = limitedTestTasks[i];
                    processedCount++;
                    
                    setAnalysisProgress({ 
                        current: 3, 
                        total: 3, 
                        message: `Gerando testes para "${task.title.substring(0, 30)}..." (${i + 1}/${limitedTestTasks.length})`,
                        estimatedSeconds 
                    });

                    try {
                        const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
                        // Usar a tarefa atualizada do array para garantir que BDDs recém-gerados sejam incluídos
                        const currentTask = taskIndex !== -1 ? updatedTasks[taskIndex] : task;
                        
                        const attachmentsContext = buildAttachmentsContextForTask(currentTask);
                        const { strategy, testCases } = await withTimeout(
                            aiService.generateTestCasesForTask(
                                currentTask.title, 
                                currentTask.description || '', 
                                currentTask.bddScenarios || [], // Garantir que seja array
                                'Padrão',
                                currentTask.type,
                                project,
                                attachmentsContext || undefined
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
        });
    }, [project, onUpdateProject, handleError, handleSuccess, onNavigateToTab, enqueueGeminiOperation]);
    
    const handleSaveTask = (taskData: Omit<JiraTask, 'testCases' | 'status' | 'testStrategy' | 'bddScenarios' | 'createdAt' | 'completedAt'>) => {
        let newTasks: JiraTask[];
        if (editingTask) {
            // Preservar campos que não vêm do formulário
            const existingTask = project.tasks.find(t => t.id === editingTask.id);
            let updatedTask: JiraTask | undefined;
            newTasks = project.tasks.map(t => {
                if (t.id === editingTask.id) {
                    updatedTask = { 
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
                    return updatedTask;
                }
                return t;
            });
            onUpdateProject({ ...project, tasks: newTasks });
            if (updatedTask) {
                propagateTaskUpdate(updatedTask);
            }
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
        const label = taskToDelete?.title ? `"${taskToDelete.title}"` : 'esta tarefa';
        setConfirmDeleteState({ type: 'task', taskId, label });
    }, [project]);

    const executeDeleteTask = useCallback((taskId: string) => {
        const taskToDelete = project.tasks.find(t => t.id === taskId);
        let tasksToKeep = project.tasks;
        if (taskToDelete?.type === 'Epic') {
            tasksToKeep = tasksToKeep.map(t => t.parentId === taskId ? { ...t, parentId: undefined } : t);
        }
        tasksToKeep = tasksToKeep.filter(t => t.id !== taskId);
        onUpdateProject({ ...project, tasks: tasksToKeep });
        handleSuccess('Tarefa excluída com sucesso!');
    }, [project, onUpdateProject, handleSuccess]);
    
    const handleConfirmDelete = useCallback(() => {
        if (!confirmDeleteState) return;
        const { type, taskId, targetId } = confirmDeleteState;
        if (type === 'task') executeDeleteTask(taskId);
        else if (type === 'testcase' && targetId) executeDeleteTestCase(taskId, targetId);
        else if (type === 'bdd' && targetId) executeDeleteBddScenario(taskId, targetId);
        setConfirmDeleteState(null);
    }, [confirmDeleteState, executeDeleteTask, executeDeleteTestCase, executeDeleteBddScenario]);

    const openTaskFormForEdit = (task: JiraTask) => {
        setEditingTask(task);
        setIsTaskFormOpen(true);
    };
    
    const openTaskFormForNew = (parentId?: string) => {
        setEditingTask(undefined);
        setDefaultParentId(parentId);
        setIsTaskFormOpen(true);
    };

    const handleImportFromJira = useCallback(async (issueKey: string) => {
        const config = getJiraConfig();
        if (!config) {
            handleError(new Error('Configure o Jira nas configurações do projeto primeiro.'), 'Importar do Jira');
            return null;
        }
        try {
            const data = await fetchJiraTaskFormDataByKey(config, issueKey);
            handleSuccess('Tarefa importada do Jira. Revise os dados e salve.');
            return data;
        } catch (e) {
            handleError(e instanceof Error ? e : new Error(String(e)), 'Importar do Jira');
            return null;
        }
    }, [handleError, handleSuccess]);

    const epics = useMemo(() => project.tasks.filter(t => t.type === 'Epic'), [project.tasks]);

    // Corrigir status das tarefas baseado no jiraStatus quando disponível
    // Isso corrige tarefas que foram importadas antes da correção do mapeamento
    // Usar useRef para evitar loops infinitos e correções múltiplas
    const hasCorrectedStatus = useRef<string | null>(null);
    const onUpdateProjectRef = useRef(onUpdateProject);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Atualizar ref quando onUpdateProject mudar
    useEffect(() => {
        onUpdateProjectRef.current = onUpdateProject;
    }, [onUpdateProject]);

    // Atalho de teclado para focar na busca (Ctrl+Shift+F / Cmd+Shift+F)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Scroll até a tarefa quando initialTaskId estiver definido
    useEffect(() => {
        if (!initialTaskId) return;

        // Aguardar um pouco para garantir que o DOM foi renderizado
        const timer = setTimeout(() => {
            const taskElement = document.querySelector(`[data-task-id="${initialTaskId}"]`);
            if (taskElement) {
                // Adicionar highlight temporário
                taskElement.classList.add('ring-2', 'ring-primary/50', 'ring-offset-2');
                
                // Fazer scroll até o elemento
                taskElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });

                // Remover highlight após 3 segundos
                setTimeout(() => {
                    taskElement.classList.remove('ring-2', 'ring-primary/50', 'ring-offset-2');
                }, 3000);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [initialTaskId]);
    
    useEffect(() => {
        if (!project || !project.tasks || !Array.isArray(project.tasks)) return;
        if (!onUpdateProjectRef.current) return;
        
        // Se já corrigimos este projeto, não corrigir novamente
        if (hasCorrectedStatus.current === project.id) return;
        
        try {
            const tasksNeedingCorrection = project.tasks.filter(task => {
                if (!task || !task.jiraStatus) return false;
                try {
                    const correctStatus = mapJiraStatusToTaskStatus(task.jiraStatus);
                    return task.status !== correctStatus;
                } catch (error) {
                    logger.warn('Erro ao mapear status do Jira', 'TasksView', { error, taskId: task.id, jiraStatus: task.jiraStatus });
                    return false;
                }
            });
            
            if (tasksNeedingCorrection.length > 0) {
                const correctedTasks = project.tasks.map(task => {
                    if (!task || !task.jiraStatus) return task;
                    try {
                        const correctStatus = mapJiraStatusToTaskStatus(task.jiraStatus);
                        if (task.status !== correctStatus) {
                            return { ...task, status: correctStatus };
                        }
                    } catch (error) {
                        logger.warn('Erro ao corrigir status da tarefa', 'TasksView', { error, taskId: task.id });
                    }
                    return task;
                });
                
                // Marcar que já corrigimos este projeto ANTES de atualizar
                hasCorrectedStatus.current = project.id;
                
                // Atualizar projeto de forma assíncrona para evitar problemas de render
                Promise.resolve().then(() => {
                    if (onUpdateProjectRef.current && project) {
                        onUpdateProjectRef.current({
                            ...project,
                            tasks: correctedTasks
                        });
                    }
                });
                
                logger.info(`Corrigidos ${tasksNeedingCorrection.length} status de tarefas baseado no jiraStatus`, 'TasksView');
            } else {
                // Marcar como corrigido mesmo se não houver correções necessárias
                hasCorrectedStatus.current = project.id;
            }
        } catch (error) {
            logger.error('Erro ao corrigir status das tarefas', 'TasksView', { error, projectId: project?.id });
            // Marcar como corrigido mesmo em caso de erro para evitar loops
            hasCorrectedStatus.current = project.id;
        }
    }, [project?.id, project?.tasks]);

    const stats = useMemo(() => {
        try {
            // Validação robusta de dados
            if (!project || !project.tasks || !Array.isArray(project.tasks)) {
                return { total: 0, pending: 0, inProgress: 0, done: 0, bugsOpen: 0, totalTests: 0, executedTests: 0, automatedTests: 0 };
            }

            const total = project.tasks.length;
            
            // Corrigir status baseado no jiraStatus quando disponível
            // Isso corrige tarefas que foram importadas antes da correção do mapeamento
            const tasksWithCorrectedStatus = project.tasks.map(task => {
                try {
                    // Validar que task existe e tem propriedades necessárias
                    if (!task || typeof task !== 'object') {
                        return null;
                    }
                    
                    // Se a tarefa tem jiraStatus e o status atual não corresponde ao mapeamento correto, corrigir
                    if (task.jiraStatus) {
                        const correctStatus = mapJiraStatusToTaskStatus(task.jiraStatus);
                        // Só corrigir se o status atual for diferente do correto
                        // Isso preserva mudanças manuais do usuário que não têm jiraStatus
                        if (task.status !== correctStatus) {
                            return { ...task, status: correctStatus };
                        }
                    }
                    return task;
                } catch (taskError) {
                    logger.warn('Erro ao processar tarefa individual', 'TasksView', { taskError, taskId: task?.id });
                    return task; // Retornar tarefa original em caso de erro
                }
            }).filter((task): task is JiraTask => task !== null); // Filtrar nulls
            
            const pending = tasksWithCorrectedStatus.filter(
                task => task && task.status === 'To Do'
            ).length;
            
            const inProgress = tasksWithCorrectedStatus.filter(
                task => task && task.status === 'In Progress'
            ).length;
            
            const done = tasksWithCorrectedStatus.filter(
                task => task && task.status === 'Done'
            ).length;

            const bugsOpen = tasksWithCorrectedStatus.filter(
                task => task && task.type === 'Bug' && task.status !== 'Done'
            ).length;

            const totalTests = tasksWithCorrectedStatus.reduce((acc, t) => {
                if (!t || !t.testCases) return acc;
                return acc + (Array.isArray(t.testCases) ? t.testCases.length : 0);
            }, 0);
            
            const executedTests = tasksWithCorrectedStatus.reduce((acc, t) => {
                if (!t || !t.testCases || !Array.isArray(t.testCases)) return acc;
                return acc + t.testCases.filter(tc => tc && tc.status !== 'Not Run').length;
            }, 0);
            
            const automatedTests = tasksWithCorrectedStatus.reduce((acc, t) => {
                if (!t || !t.testCases || !Array.isArray(t.testCases)) return acc;
                return acc + t.testCases.filter(tc => tc && tc.isAutomated).length;
            }, 0);
            
            return { total, pending, inProgress, done, bugsOpen, totalTests, executedTests, automatedTests };
        } catch (error) {
            logger.error('Erro ao calcular stats', 'TasksView', { error, projectId: project?.id });
            return { total: 0, pending: 0, inProgress: 0, done: 0, bugsOpen: 0, totalTests: 0, executedTests: 0, automatedTests: 0 };
        }
    }, [project?.tasks]);

    const testExecutionRate = stats.totalTests > 0 ? Math.round((stats.executedTests / stats.totalTests) * 100) : 0;
    const automationRate = stats.totalTests > 0 ? Math.round((stats.automatedTests / stats.totalTests) * 100) : 0;

    const toDoLabel = useMemo(() => statusOptions.find(o => PT_STATUS_TO_CATEGORY[o] === 'To Do' || mapJiraStatusToTaskStatus(o) === 'To Do') ?? statusOptions[0], [statusOptions]);
    const inProgressLabel = useMemo(() => statusOptions.find(o => PT_STATUS_TO_CATEGORY[o] === 'In Progress' || mapJiraStatusToTaskStatus(o) === 'In Progress') ?? statusOptions[1], [statusOptions]);
    const doneLabel = useMemo(() => statusOptions.find(o => PT_STATUS_TO_CATEGORY[o] === 'Done' || mapJiraStatusToTaskStatus(o) === 'Done') ?? statusOptions[2], [statusOptions]);
    const nonDoneLabels = useMemo(() => statusOptions.filter(o => (PT_STATUS_TO_CATEGORY[o] ?? mapJiraStatusToTaskStatus(o)) !== 'Done'), [statusOptions]);

    const indicatorItems = useMemo(
        () => [
            {
                label: 'Total de Tarefas',
                value: stats.total,
                modifier: '+0%',
                icon: ClipboardList,
                colorTheme: 'orange' as const,
            },
            {
                label: 'Tarefas Pendentes',
                value: stats.pending,
                modifier: '-',
                icon: Clock,
                colorTheme: 'yellow' as const,
                onClick: () => { setStatusFilter([toDoLabel]); setTypeFilter([]); setTestStatusFilter([]); setQualityFilter([]); setPriorityFilter([]); },
                isActive: statusFilter.length === 1 && statusFilter[0] === toDoLabel && typeFilter.length === 0,
            },
            {
                label: 'Em Andamento',
                value: stats.inProgress,
                modifier: 'active',
                icon: Zap,
                colorTheme: 'blue' as const,
                onClick: () => { setStatusFilter([inProgressLabel]); setTypeFilter([]); setTestStatusFilter([]); setQualityFilter([]); setPriorityFilter([]); },
                isActive: statusFilter.length === 1 && statusFilter[0] === inProgressLabel && typeFilter.length === 0,
            },
            {
                label: 'Concluídas',
                value: stats.done,
                modifier: stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}%` : '0%',
                icon: CheckCircle,
                colorTheme: 'emerald' as const,
                onClick: () => { setStatusFilter([doneLabel]); setTypeFilter([]); setTestStatusFilter([]); setQualityFilter([]); setPriorityFilter([]); },
                isActive: statusFilter.length === 1 && statusFilter[0] === doneLabel && typeFilter.length === 0,
            },
            {
                label: 'Bugs Abertos',
                value: stats.bugsOpen,
                modifier: (metrics.bugsBySeverity?.['Crítico'] ?? 0) > 0 ? 'Critical' : 'Abertos',
                icon: AlertTriangle,
                colorTheme: 'red' as const,
                onClick: () => { setTypeFilter(['Bug']); setStatusFilter(nonDoneLabels); setTestStatusFilter([]); setQualityFilter([]); setPriorityFilter([]); },
                isActive: typeFilter.length === 1 && typeFilter[0] === 'Bug' && statusFilter.length === nonDoneLabels.length && statusFilter.every(s => nonDoneLabels.includes(s)),
            },
        ],
        [
            stats.total,
            stats.pending,
            stats.inProgress,
            stats.done,
            stats.bugsOpen,
            metrics.bugsBySeverity,
            toDoLabel,
            inProgressLabel,
            doneLabel,
            nonDoneLabels,
            statusFilter,
            typeFilter,
        ]
    );

    const executionProps = useMemo(
        () => {
            const executionTrendText =
                stats.totalTests > 0
                    ? `${stats.executedTests} de ${stats.totalTests} executados`
                    : '';
            const automationTrendText =
                stats.totalTests > 0
                    ? `${stats.automatedTests} de ${stats.totalTests} casos`
                    : '';
            return {
                executedTestCases: stats.executedTests,
                totalTestCases: stats.totalTests,
                automationRatio: automationRate,
                projectName: project?.name ?? 'Projeto',
                executionTrend: executionTrendText,
                automationTrend: automationTrendText,
            };
        },
        [
            stats.executedTests,
            stats.totalTests,
            stats.automatedTests,
            automationRate,
            project?.name,
        ]
    );

    const taskComparator = useMemo(() => getTaskComparator(sortBy), [sortBy]);

    const taskTree = useMemo(() => {
        const tasks = [...filteredTasks].sort(taskComparator);
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
            nodes.sort(taskComparator);
            nodes.forEach(node => {
                if (node.children.length > 0) {
                    sortChildrenRecursive(node.children);
                }
            });
        };
        sortChildrenRecursive(tree);
        return tree;
    }, [filteredTasks, taskComparator]);

    const favoriteRoots = useMemo(() => taskTree.filter(t => t.isFavorite), [taskTree]);
    const otherRoots = useMemo(() => taskTree.filter(t => !t.isFavorite), [taskTree]);

    const groupedTasksEntries = useMemo((): [string, TaskWithChildren[]][] => {
        if (groupBy === 'none') return [];
        const map = new Map<string, TaskWithChildren[]>();
        filteredTasks.forEach(task => {
            const key = groupBy === 'status'
                ? getDisplayStatus(task)
                : groupBy === 'priority'
                    ? (task.priority ?? 'Sem prioridade')
                    : task.type;
            const withChildren = { ...task, children: [] as TaskWithChildren[] };
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(withChildren);
        });
        const entries = Array.from(map.entries());
        if (groupBy === 'status') {
            const order = statusOptions;
            entries.sort((a, b) => (order.indexOf(a[0]) === -1 ? 999 : order.indexOf(a[0])) - (order.indexOf(b[0]) === -1 ? 999 : order.indexOf(b[0])));
        } else if (groupBy === 'priority') {
            const order = ['Urgente', 'Alta', 'Média', 'Baixa', 'Sem prioridade'];
            entries.sort((a, b) => (order.indexOf(a[0]) === -1 ? 999 : order.indexOf(a[0])) - (order.indexOf(b[0]) === -1 ? 999 : order.indexOf(b[0])));
        }
        return entries;
    }, [filteredTasks, groupBy, statusOptions]);

    const handleToggleFavorite = useCallback((taskId: string) => {
        const updatedTasks = (project.tasks || []).map(t =>
            t.id === taskId ? { ...t, isFavorite: !t.isFavorite } : t
        );
        onUpdateProject({ ...project, tasks: updatedTasks });
    }, [project, onUpdateProject]);

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

    const handleLinkTasks = async () => {
        const tasksToLink = project.tasks.filter(t => selectedTasks.has(t.id));
        const targetProjects = allProjects.filter(p => selectedTargetProjects.has(p.id));

        for (const targetProject of targetProjects) {
            const newTasks = [...targetProject.tasks];
            let changed = false;
            tasksToLink.forEach(task => {
                if (!newTasks.find(t => t.id === task.id)) {
                    newTasks.push(task);
                    changed = true;
                }
            });
            if (changed) {
                await updateGlobalProject({ ...targetProject, tasks: newTasks });
            }
        }
        setIsLinkModalOpen(false);
        setSelectedTargetProjects(new Set());
        handleSuccess('Tarefas vinculadas com sucesso!');
    };

    const totalTaskCount = filteredTasks.length;
    const renderTaskTree = useCallback((tasks: TaskWithChildren[], level: number, startIndex: number = 0, totalCount?: number): React.ReactElement[] => {
        const total = totalCount ?? totalTaskCount;
        return tasks.map((task, index) => {
            const globalIndex = startIndex + index;
            return (
                <div
                    key={task.id}
                    role="listitem"
                    aria-posinset={globalIndex + 1}
                    aria-setsize={total}
                >
                <JiraTaskItem
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
                    onUpdateFromJira={handleUpdateTaskFromJira}
                    isUpdatingFromJira={updatingFromJiraTaskId === task.id}
                    onSaveBddScenario={handleSaveBddScenario}
                    onDeleteBddScenario={handleDeleteBddScenario}
                    onTaskStatusChange={(status) => handleTaskStatusChange(task.id, status)}
                    level={level}
                    onAddComment={(content) => handleAddComment(task.id, content)}
                    onEditComment={(commentId, content) => handleEditComment(task.id, commentId, content)}
                    onDeleteComment={(commentId) => handleDeleteComment(task.id, commentId)}
                    onEditTestCase={handleOpenTestCaseEditor}
                    onDeleteTestCase={handleDeleteTestCase}
                    onDuplicateTestCase={handleDuplicateTestCase}
                    project={project}
                    onUpdateProject={onUpdateProject}
                    onOpenModal={setModalTask}
                    onToggleFavorite={() => handleToggleFavorite(task.id)}
                >
                    {task.children.length > 0 && renderTaskTree(task.children, level + 1, globalIndex + 1, total)}
                </JiraTaskItem>
                </div>
            );
        });
    }, [totalTaskCount, selectedTasks, generatingTestsTaskId, generatingBddTaskId, generatingAllTaskId, syncingTaskId, updatingFromJiraTaskId, handleUpdateTaskFromJira, handleTestCaseStatusChange, handleToggleTestCaseAutomated, handleExecutedStrategyChange, handleTaskToolsChange, handleTestCaseToolsChange, handleStrategyExecutedChange, handleStrategyToolsChange, handleDeleteTask, handleGenerateTests, openTaskFormForNew, openTaskFormForEdit, handleGenerateBddScenarios, handleGenerateAll, handleSyncTaskToJira, handleSaveBddScenario, handleDeleteBddScenario, handleTaskStatusChange, handleAddComment, handleEditComment, handleDeleteComment, handleOpenTestCaseEditor, handleDeleteTestCase, handleDuplicateTestCase, project, onUpdateProject, toggleTaskSelection, handleToggleFavorite]);

    return (
        <>
        <Card hoverable={false} className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-4 sm:gap-5 mb-6 sm:mb-8">
                <TasksViewHeader
                    onAddTask={() => openTaskFormForNew()}
                    onOpenFilters={() => setIsFiltersModalOpen(true)}
                    onAnalyze={handleGeneralIAAnalysis}
                    isRunningGeneralAnalysis={isRunningGeneralAnalysis}
                    analysisProgress={analysisProgress}
                    activeFiltersCount={activeFiltersCount}
                />

                <TasksViewSearch
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchInputRef={searchInputRef}
                />

                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <GlassIndicatorCards items={indicatorItems} execution={executionProps} />
                </motion.div>
            </div>

            <div className="flex flex-col gap-6">
                <Modal
                    isOpen={isFiltersModalOpen}
                    onClose={() => setIsFiltersModalOpen(false)}
                    title="Filtros"
                >
                    <TasksViewFiltersModalContent
                        statusOptions={statusOptions}
                        priorityOptions={priorityOptions}
                        counts={counts}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        priorityFilter={priorityFilter}
                        setPriorityFilter={setPriorityFilter}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        testStatusFilter={testStatusFilter}
                        setTestStatusFilter={setTestStatusFilter}
                        qualityFilter={qualityFilter}
                        setQualityFilter={setQualityFilter}
                        activeFiltersCount={activeFiltersCount}
                        onClearAll={() => { clearAllFilters(); setIsFiltersModalOpen(false); }}
                        projectId={project.id}
                        sortBy={sortBy}
                        groupBy={groupBy}
                        onLoadPreset={(preset) => {
                            setStatusFilter(preset.filters.statusFilter);
                            setPriorityFilter(preset.filters.priorityFilter);
                            setTypeFilter(preset.filters.typeFilter);
                            setTestStatusFilter(preset.filters.testStatusFilter);
                            setQualityFilter(preset.filters.qualityFilter);
                            setSortBy(preset.filters.sortBy);
                            setGroupBy(preset.filters.groupBy);
                            setIsFiltersModalOpen(false);
                        }}
                    />
                </Modal>

                <TasksViewList
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    priorityFilter={priorityFilter}
                    setPriorityFilter={setPriorityFilter}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    testStatusFilter={testStatusFilter}
                    setTestStatusFilter={setTestStatusFilter}
                    qualityFilter={qualityFilter}
                    setQualityFilter={setQualityFilter}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeFiltersCount={activeFiltersCount}
                    clearAllFilters={clearAllFilters}
                    onClearAndCloseFilters={() => { clearAllFilters(); setIsFiltersModalOpen(false); }}
                    filteredCount={filteredTasks.length}
                    totalCount={project.tasks.length}
                    hasActiveFiltersOrSearch={activeFiltersCount > 0 || !!debouncedSearchQuery}
                >
                <div className="space-y-4 min-w-0">
                    <div className="flex flex-col gap-4">
                        {selectedTasks.size > 0 && (
                            <div className="flex flex-wrap items-center gap-3">
                                <BulkActions
                                    selectedTasks={selectedTasks}
                                    project={project}
                                    onUpdateProject={onUpdateProject}
                                    onClearSelection={() => setSelectedTasks(new Set())}
                                    onProjectCreated={(projectId) => {
                                        const { selectProject } = useProjectsStore.getState();
                                        selectProject(projectId);
                                    }}
                                    onEditTask={(taskId) => {
                                        const task = project.tasks.find(t => t.id === taskId);
                                        if (task) openTaskFormForEdit(task);
                                        setSelectedTasks(new Set());
                                    }}
                                />
                                <button
                                    onClick={() => setIsLinkModalOpen(true)}
                                    className="btn btn-outline btn-sm rounded-full flex items-center gap-1.5 hover:bg-base-200 min-h-[44px] px-4"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                    Vincular a Projeto
                                </button>
                            </div>
                        )}
                        {(generatingTestsTaskId || generatingBddTaskId) && (
                            <div className="p-4 bg-primary/10 border border-primary/40 rounded-lg text-sm text-base-content flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
                                {generatingTestsTaskId && (
                                    <span>
                                        Gerando casos de teste para{' '}
                                        <strong>
                                            {project?.tasks?.find(t => t.id === generatingTestsTaskId)?.title ?? generatingTestsTaskId}
                                        </strong>...
                                    </span>
                                )}
                                {generatingBddTaskId && (
                                    <span>
                                        Gerando cenários BDD para{' '}
                                        <strong>
                                            {project?.tasks?.find(t => t.id === generatingBddTaskId)?.title ?? generatingBddTaskId}
                                        </strong>...
                                    </span>
                                )}
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
                onImportFromJira={handleImportFromJira}
            />
        </Modal>

        <Modal
            isOpen={isLinkModalOpen}
            onClose={() => setIsLinkModalOpen(false)}
            title="Vincular Tarefas a Projetos"
        >
            <div className="space-y-4">
                <p className="text-base-content/70 text-sm">
                    Selecione os projetos para onde deseja vincular as {selectedTasks.size} tarefa(s) selecionada(s).
                    As tarefas serão adicionadas aos projetos selecionados e manterão sincronia de conteúdo.
                </p>
                <div className="max-h-60 overflow-y-auto custom-scrollbar border border-base-300 rounded-lg p-2">
                    {allProjects.filter(p => p.id !== project.id).map(p => (
                        <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-base-200 rounded cursor-pointer">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary"
                                checked={selectedTargetProjects.has(p.id)}
                                onChange={(e) => {
                                    const newSet = new Set(selectedTargetProjects);
                                    if (e.target.checked) newSet.add(p.id);
                                    else newSet.delete(p.id);
                                    setSelectedTargetProjects(newSet);
                                }}
                            />
                            <span className="text-sm font-medium">{p.name}</span>
                        </label>
                    ))}
                    {allProjects.length <= 1 && (
                        <p className="text-sm text-base-content/50 text-center py-4">Nenhum outro projeto disponível.</p>
                    )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1.5 hover:bg-base-200" onClick={() => setIsLinkModalOpen(false)}>
                        Cancelar
                    </Button>
                    <Button variant="brand" size="sm" className="rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95" onClick={handleLinkTasks} disabled={selectedTargetProjects.size === 0}>
                        Vincular
                    </Button>
                </div>
            </div>
        </Modal>

                    {taskTree.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-3 justify-end">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowExportTasksModal(true)}
                                        className="btn btn-ghost btn-sm text-xs gap-1"
                                        aria-label={`Exportar lista visível (${filteredTasks.length} tarefas)`}
                                    >
                                        <Download className="w-3.5 h-3.5" aria-hidden />
                                        Exportar lista visível {filteredTasks.length !== project.tasks.length ? `(${filteredTasks.length})` : ''}
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <label htmlFor="tasks-sort-by" className="text-xs font-medium text-base-content/70">Ordenar por</label>
                                    <select
                                        id="tasks-sort-by"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as TaskSortBy)}
                                        className="select select-bordered select-sm rounded-lg text-sm bg-base-100 border-base-300"
                                        aria-label="Ordenação da lista de tarefas"
                                    >
                                        <option value="id">ID</option>
                                        <option value="status">Status</option>
                                        <option value="priority">Prioridade</option>
                                        <option value="createdAt">Data de criação</option>
                                        <option value="title">Título</option>
                                    </select>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <label htmlFor="tasks-group-by" className="text-xs font-medium text-base-content/70">Agrupar por</label>
                                    <select
                                        id="tasks-group-by"
                                        value={groupBy}
                                        onChange={(e) => setGroupBy(e.target.value as TaskGroupBy)}
                                        className="select select-bordered select-sm rounded-lg text-sm bg-base-100 border-base-300"
                                        aria-label="Agrupar lista de tarefas por"
                                    >
                                        <option value="none">Nenhum</option>
                                        <option value="status">Status</option>
                                        <option value="priority">Prioridade</option>
                                        <option value="type">Tipo</option>
                                    </select>
                                </div>
                            </div>
                            {groupBy !== 'none' && groupedTasksEntries.length > 0 ? (
                                <div className="space-y-6">
                                    {groupedTasksEntries.map(([groupLabel, tasksInGroup]) => (
                                        <section key={groupLabel} aria-label={`Grupo: ${groupLabel}`}>
                                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-base-content/70 mb-3">
                                                <List className="w-4 h-4" aria-hidden />
                                                {groupLabel}
                                            </h3>
                                            <div className="space-y-1" role="list" aria-label="Lista de tarefas">
                                                {renderTaskTree(tasksInGroup, 0).map((taskElement, index) => (
                                                    <motion.div
                                                        key={taskElement.key ?? `grp-${groupLabel}-${index}`}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.03, duration: 0.25 }}
                                                    >
                                                        {taskElement}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            ) : (
                            <>
                            {favoriteRoots.length > 0 && (
                                <section aria-label="Favoritos">
                                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary mb-3">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden />
                                        Favoritos
                                    </h3>
                                    <div className="space-y-1" role="list" aria-label="Lista de tarefas favoritas">
                                        {renderTaskTree(favoriteRoots, 0).map((taskElement, index) => (
                                            <motion.div
                                                key={taskElement.key ?? `fav-${index}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                            >
                                                {taskElement}
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            )}
                            {favoriteRoots.length > 0 && otherRoots.length > 0 && (
                                <div className="border-t border-base-300 my-4" aria-hidden />
                            )}
                            <section aria-label="Outras tarefas">
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-base-content/70 mb-3">
                                    <List className="w-4 h-4" aria-hidden />
                                    Outras Tarefas
                                </h3>
                                <div className="space-y-1" role="list" aria-label="Lista de outras tarefas">
                                    {renderTaskTree(otherRoots, 0).map((taskElement, index) => (
                                        <motion.div
                                            key={taskElement.key ?? `other-${index}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                        >
                                            {taskElement}
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                            </>
                            )}
                        </div>
                    ) : filteredTasks.length === 0 && project.tasks.length > 0 ? (
                        <EmptyState
                            icon="🔍"
                            title="Nenhuma tarefa corresponde aos filtros"
                            description="Ajuste os filtros ou a busca para ver mais tarefas."
                            action={{
                                label: "Limpar filtros",
                                onClick: () => { clearAllFilters(); setIsFiltersModalOpen(false); },
                                variant: 'primary'
                            }}
                        />
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
                        />
                    )}
                </div>
                </TasksViewList>
            </div>
        </Card>

        <FileExportModal
            isOpen={showExportTasksModal}
            onClose={() => setShowExportTasksModal(false)}
            exportType="tasks"
            project={project}
            tasks={filteredTasks}
        />

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
                    <button type="button" onClick={() => setFailModalState({ ...failModalState, isOpen: false })} className="btn btn-outline btn-sm rounded-full flex items-center gap-1.5 hover:bg-base-200">Cancelar</button>
                    <button type="button" onClick={handleConfirmFail} className="btn btn-error btn-sm rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95">Confirmar Reprovação</button>
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


        {/* Modal de Relatório de Testes Reprovados */}
        <FailedTestsReportModal
            isOpen={showFailedTestsReport}
            onClose={() => setShowFailedTestsReport(false)}
            project={project}
        />

        <ConfirmDialog
            isOpen={!!confirmDeleteState}
            onClose={() => setConfirmDeleteState(null)}
            onConfirm={handleConfirmDelete}
            title={
                confirmDeleteState?.type === 'task'
                    ? `Excluir tarefa`
                    : confirmDeleteState?.type === 'testcase'
                    ? 'Excluir caso de teste'
                    : 'Excluir cenário BDD'
            }
            message={`Tem certeza que deseja excluir ${confirmDeleteState?.label ?? 'este item'}? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            variant="danger"
        />

        {/* Modal de Detalhes da Tarefa */}
        {modalTask && taskForModal && (
            <TaskDetailsModal
                task={taskForModal}
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
                onDuplicateTestCase={handleDuplicateTestCase}
                project={project}
                onUpdateProject={onUpdateProject}
                onOpenTask={setModalTask}
                onUpdateFromJira={handleUpdateTaskFromJira}
                isUpdatingFromJira={modalTask ? updatingFromJiraTaskId === modalTask.id : false}
            />
        )}

        </>
    );
};
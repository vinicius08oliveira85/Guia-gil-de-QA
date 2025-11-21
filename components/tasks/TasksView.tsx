import React, { useState, useCallback, useMemo } from 'react';
import { Project, JiraTask, BddScenario, TestCaseDetailLevel, BugSeverity, TeamRole } from '../../types';
import { generateTestCasesForTask, generateBddScenarios } from '../../services/geminiService';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { FilterPanel } from '../common/FilterPanel';
import { TestCaseTemplateSelector } from './TestCaseTemplateSelector';
import { TaskForm } from './TaskForm';
import { JiraTaskItem, TaskWithChildren } from './JiraTaskItem';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useFilters, FilterOptions } from '../../hooks/useFilters';
import { getAllTagsFromProject } from '../../utils/tagService';
import { createBugFromFailedTest } from '../../utils/bugAutoCreation';
import { notifyTestFailed, notifyBugCreated } from '../../utils/notificationService';
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
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<JiraTask | undefined>(undefined);
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

    const handleTaskStatusChange = useCallback((taskId: string, status: 'To Do' | 'In Progress' | 'Done') => {
        onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => t.id === taskId ? { 
                ...t, 
                status,
                completedAt: status === 'Done' ? new Date().toISOString() : t.completedAt 
            } : t)
        });
    }, [project, onUpdateProject]);
    
    const handleGenerateBddScenarios = useCallback(async (taskId: string) => {
        setGeneratingBddTaskId(taskId);
        try {
            const task = project.tasks.find(t => t.id === taskId);
            if (!task) throw new Error("Task not found");
            const scenarios = await generateBddScenarios(task.title, task.description);
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
            const { strategy, testCases } = await generateTestCasesForTask(task.title, task.description, task.bddScenarios, detailLevel);
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
            handleSuccess('Análise geral concluída com sucesso!');
            
            // Navegar para a aba de Análise IA
            if (onNavigateToTab) {
                setTimeout(() => {
                    onNavigateToTab('analysis');
                }, 500);
            }
        } catch (error) {
            handleError(error, 'Executar análise geral com IA');
        } finally {
            setIsRunningGeneralAnalysis(false);
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
        const tasks = [...filteredTasks];
        const taskMap = new Map(tasks.map(t => [t.id, { ...t, children: [] as TaskWithChildren[] }]));
        const tree: TaskWithChildren[] = [];

        for (const task of taskMap.values()) {
            if (task.parentId && taskMap.has(task.parentId)) {
                taskMap.get(task.parentId)!.children.push(task);
            } else {
                tree.push(task);
            }
        }
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
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-text-primary">Tarefas & Casos de Teste</h3>
                        <p className="text-sm text-text-secondary">Acompanhe o progresso das atividades e resultados de QA.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setShowFilters(prev => !prev)} className="btn btn-secondary">
                            {showFilters ? 'Ocultar Filtros' : `Filtros (${activeFiltersCount})`}
                        </button>
                        <button onClick={() => setShowTemplateSelector(true)} className="btn btn-secondary">📋 Templates</button>
                        <button 
                            onClick={handleSyncJira} 
                            className="btn btn-secondary"
                            disabled={isSyncingJira}
                        >
                            {isSyncingJira ? '🔄 Sincronizando...' : '🔄 Atualizar do Jira'}
                        </button>
                        <GeneralIAAnalysisButton 
                            onAnalyze={handleGeneralIAAnalysis}
                            isAnalyzing={isRunningGeneralAnalysis}
                        />
                        <button onClick={() => openTaskFormForNew()} className="btn btn-primary">Adicionar Tarefa</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 bg-surface border border-surface-border rounded-lg">
                        <p className="text-xs text-text-secondary uppercase tracking-wide">Total de Tarefas</p>
                        <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-surface border border-surface-border rounded-lg">
                        <p className="text-xs text-text-secondary uppercase tracking-wide">Em Andamento</p>
                        <p className="text-2xl font-bold text-accent">{stats.inProgress}</p>
                    </div>
                    <div className="p-3 bg-surface border border-surface-border rounded-lg">
                        <p className="text-xs text-text-secondary uppercase tracking-wide">Concluídas</p>
                        <p className="text-2xl font-bold text-green-400">{stats.done}</p>
                    </div>
                    <div className="p-3 bg-surface border border-surface-border rounded-lg">
                        <p className="text-xs text-text-secondary uppercase tracking-wide">Bugs Abertos</p>
                        <p className="text-2xl font-bold text-red-400">{stats.bugsOpen}</p>
                    </div>
                    <div className="p-3 bg-surface border border-surface-border rounded-lg col-span-1 md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-text-secondary uppercase tracking-wide">Execução de Testes</p>
                            <span className="text-sm font-semibold text-text-primary">{testExecutionRate}%</span>
                        </div>
                        <div className="w-full bg-surface-hover rounded-full h-2 mb-2">
                            <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${testExecutionRate}%` }}></div>
                        </div>
                        <p className="text-xs text-text-secondary">
                            {stats.executedTests}/{stats.totalTests} casos executados • Automação {automationRate}%
                        </p>
                    </div>
                </div>
            </div>

            {filterChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {filterChips.map(chip => (
                        <span
                            key={`${chip.key}-${chip.label}`}
                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-hover text-xs text-text-primary border border-surface-border"
                        >
                            {chip.label}
                            <button
                                onClick={() => removeFilter(chip.key)}
                                className="text-text-secondary hover:text-red-400"
                                aria-label={`Remover filtro ${chip.label}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <button onClick={clearFilters} className="text-sm text-accent hover:underline">
                        Limpar todos
                    </button>
                </div>
            )}

            {showFilters && (
                <div className="mb-6 p-4 bg-surface rounded-lg border border-surface-border">
                    <div className="flex justify-between items-center mb-3">
                        <p className="font-semibold text-text-primary">Filtros avançados</p>
                        <button onClick={clearFilters} className="text-sm text-accent hover:underline">Limpar filtros</button>
                    </div>
                    <FilterPanel
                        filters={filters}
                        onFilterChange={updateFilter}
                        onClearFilters={clearFilters}
                        availableTags={availableTags}
                        activeFiltersCount={activeFiltersCount}
                    />
                </div>
            )}

            <div className="flex flex-col gap-4 mb-6">
                {currentSuggestion && showSuggestions && (
                    <div className="border border-surface-border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between bg-surface-hover px-4 py-2">
                            <span className="text-sm font-semibold text-text-primary">Sugestões inteligentes</span>
                            <button
                                onClick={() => setShowSuggestions(false)}
                                className="text-xs text-text-secondary hover:text-text-primary"
                            >
                                Ocultar
                            </button>
                        </div>
                        <div className="p-4">
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
            onClose={() => setShowTemplateSelector(false)}
            title="Selecionar Template de Caso de Teste"
        >
            {selectedTaskForTemplate ? (
                <div>
                    <p className="mb-4 text-text-secondary">
                        Selecione um template para adicionar à tarefa selecionada.
                    </p>
                    <TestCaseTemplateSelector
                        onSelectTemplate={(templateId) => {
                            handleAddTestCaseFromTemplate(selectedTaskForTemplate, templateId);
                            setShowTemplateSelector(false);
                            setSelectedTaskForTemplate(null);
                        }}
                        onClose={() => {
                            setShowTemplateSelector(false);
                            setSelectedTaskForTemplate(null);
                        }}
                    />
                </div>
            ) : (
                <TestCaseTemplateSelector
                    onSelectTemplate={(templateId) => {
                        // Se não houver tarefa selecionada, apenas fechar
                        setShowTemplateSelector(false);
                    }}
                    onClose={() => setShowTemplateSelector(false)}
                />
            )}
        </Modal>

        <TaskCreationWizard
            isOpen={showWizard}
            onClose={() => setShowWizard(false)}
            onStart={handleWizardStart}
        />
        </>
    );
};
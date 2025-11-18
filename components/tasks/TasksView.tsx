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
import { useFilters } from '../../hooks/useFilters';
import { getAllTagsFromProject } from '../../utils/tagService';
import { createBugFromFailedTest } from '../../utils/bugAutoCreation';
import { notifyTestFailed, notifyBugCreated } from '../../utils/notificationService';
import { createTestCaseFromTemplate } from '../../utils/testCaseTemplates';
import { Comment } from '../../types';
import { BulkActions } from '../common/BulkActions';

export const TasksView: React.FC<{ project: Project, onUpdateProject: (project: Project) => void }> = ({ project, onUpdateProject }) => {
    const [generatingTestsTaskId, setGeneratingTestsTaskId] = useState<string | null>(null);
    const [generatingBddTaskId, setGeneratingBddTaskId] = useState<string | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [selectedTaskForTemplate, setSelectedTaskForTemplate] = useState<string | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const { handleError, handleSuccess } = useErrorHandler();
    const { filters, filteredTasks, updateFilter, clearFilters, activeFiltersCount } = useFilters(project);
    const availableTags = getAllTagsFromProject(project);
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<JiraTask | undefined>(undefined);
    const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined);
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
    
    const handleSaveTask = (taskData: Omit<JiraTask, 'testCases' | 'status' | 'testStrategy' | 'bddScenarios' | 'createdAt' | 'completedAt'>) => {
        let newTasks: JiraTask[];
        if (editingTask) {
            newTasks = project.tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t);
        } else {
            const newTask: JiraTask = { ...taskData, status: 'To Do', testCases: [], bddScenarios: [], createdAt: new Date().toISOString() };
            newTasks = [...project.tasks, newTask];
        }
        onUpdateProject({ ...project, tasks: newTasks });
        setIsTaskFormOpen(false);
        setEditingTask(undefined);
    };

    const handleDeleteTask = (taskId: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta tarefa e todas as suas subtarefas?")) return;

        const taskToDelete = project.tasks.find(t => t.id === taskId);
        let tasksToKeep = project.tasks;
        
        if (taskToDelete?.type === 'Epic') {
            tasksToKeep = tasksToKeep.map(t => t.parentId === taskId ? { ...t, parentId: undefined } : t);
        }
        
        tasksToKeep = tasksToKeep.filter(t => t.id !== taskId);

        onUpdateProject({ ...project, tasks: tasksToKeep });
    };
    
    const openTaskFormForEdit = (task: JiraTask) => {
        setEditingTask(task);
        setIsTaskFormOpen(true);
    };
    
    const openTaskFormForNew = (parentId?: string) => {
        setEditingTask(undefined);
        setDefaultParentId(parentId);
        setIsTaskFormOpen(true);
    };

    const epics = useMemo(() => project.tasks.filter(t => t.type === 'Epic'), [project.tasks]);

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

    const renderTaskTree = (tasks: TaskWithChildren[], level: number): React.ReactElement[] => {
        return tasks.map(task => (
            <JiraTaskItem
                key={task.id}
                task={task}
                onTestCaseStatusChange={(testCaseId, status) => handleTestCaseStatusChange(task.id, testCaseId, status)}
                onToggleTestCaseAutomated={(testCaseId, isAutomated) => handleToggleTestCaseAutomated(task.id, testCaseId, isAutomated)}
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
                {task.children.length > 0 && renderTaskTree(task.children, level + 1)}
            </JiraTaskItem>
        ));
    };

    return (
        <>
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-2xl font-bold text-text-primary">Tarefas & Casos de Teste</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setShowTemplateSelector(true)} className="btn btn-secondary w-full sm:w-auto">📋 Templates</button>
                    <button onClick={() => openTaskFormForNew()} className="btn btn-primary w-full sm:w-auto">Adicionar Tarefa</button>
                </div>
            </div>
            
            <FilterPanel
                filters={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
                availableTags={availableTags}
                activeFiltersCount={activeFiltersCount}
            />
            
            {activeFiltersCount > 0 && (
                <div className="mb-4 text-sm text-text-secondary">
                    Mostrando {filteredTasks.length} de {project.tasks.length} tarefas
                </div>
            )}
            {isTaskFormOpen && (
                <div className="mb-6 p-4 bg-black/20 rounded-lg">
                    <TaskForm 
                        onSave={handleSaveTask} 
                        onCancel={() => { setIsTaskFormOpen(false); setEditingTask(undefined); }} 
                        existingTask={editingTask}
                        epics={epics}
                        parentId={defaultParentId}
                    />
                </div>
            )}
            {taskTree.length > 0 ? (
                <div>{renderTaskTree(taskTree, 0)}</div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-text-secondary">Nenhuma tarefa criada ainda.</p>
                </div>
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
        </>
    );
};
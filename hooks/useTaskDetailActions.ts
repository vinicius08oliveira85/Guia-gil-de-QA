import { useCallback, useRef, useState } from 'react';
import type { BddScenario, Comment, JiraTask, Project, TestCase, TestCaseDetailLevel } from '../types';
import { useProjectsStore } from '../store/projectsStore';
import { useErrorHandler } from './useErrorHandler';
import { getAIService } from '../services/ai/aiServiceFactory';
import { generateTestArtifactsForTask } from '../services/ai/testCaseGenerationService';
import { generateDevGuidanceForTask } from '../services/ai/devGuidanceGenerationService';
import { resolveTaskAiContext } from '../services/ai/taskAiContext';
import { toToastableAiError } from '../utils/aiErrorMapper';
import { getJiraConfig, updateSingleTaskFromJira } from '../services/jiraService';
import { createBugFromFailedTest } from '../utils/bugAutoCreation';
import {
  notifyBugCreated,
  notifyCommentAdded,
  notifyTestFailed,
} from '../utils/notificationService';

interface ConfirmDeleteState {
  type: 'testcase' | 'bdd';
  taskId: string;
  targetId?: string;
  label?: string;
}

interface FailModalState {
  isOpen: boolean;
  taskId: string | null;
  testCaseId: string | null;
  observedResult: string;
  createBug: boolean;
}

/** Handlers compartilhados para detalhe de tarefa (modal ou aba workspace). */
export function useTaskDetailActions(
  project: Project,
  onUpdateProject: (project: Project) => void
) {
  const { handleError, handleSuccess } = useErrorHandler();
  const { projects: allProjects, updateProject: updateGlobalProject } = useProjectsStore();

  const [generatingTestsTaskId, setGeneratingTestsTaskId] = useState<string | null>(null);
  const [generatingBddTaskId, setGeneratingBddTaskId] = useState<string | null>(null);
  const [generatingAllTaskId, setGeneratingAllTaskId] = useState<string | null>(null);
  const [generatingDevGuidanceTaskId, setGeneratingDevGuidanceTaskId] = useState<string | null>(null);
  const [updatingFromJiraTaskId, setUpdatingFromJiraTaskId] = useState<string | null>(null);
  const [testCaseEditorRef, setTestCaseEditorRef] = useState<{
    taskId: string;
    testCase: TestCase;
  } | null>(null);
  const [confirmDeleteState, setConfirmDeleteState] = useState<ConfirmDeleteState | null>(null);
  const [failModalState, setFailModalState] = useState<FailModalState>({
    isOpen: false,
    taskId: null,
    testCaseId: null,
    observedResult: '',
    createBug: true,
  });

  const geminiOpQueueRef = useRef(Promise.resolve());
  const enqueueGeminiOperation = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const scheduled = geminiOpQueueRef.current.then(() => operation());
    geminiOpQueueRef.current = scheduled.then(
      () => undefined,
      () => undefined
    );
    return scheduled;
  }, []);

  const notifyAiError = useCallback(
    (error: unknown, context: string) => {
      handleError(toToastableAiError(error), context);
    },
    [handleError]
  );

  const propagateTaskUpdate = useCallback(
    (updatedTask: JiraTask) => {
      allProjects
        .filter(p => p.id !== project.id)
        .forEach(p => {
          const taskIndex = p.tasks.findIndex(t => t.id === updatedTask.id);
          if (taskIndex !== -1) {
            const newTasks = [...p.tasks];
            newTasks[taskIndex] = { ...updatedTask };
            updateGlobalProject({ ...p, tasks: newTasks }, { silent: true });
          }
        });
    },
    [allProjects, project.id, updateGlobalProject]
  );

  const handleSaveBddScenario = useCallback(
    (taskId: string, scenarioData: Omit<BddScenario, 'id'>, scenarioId?: string) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;
      let updatedScenarios: BddScenario[];
      if (scenarioId) {
        updatedScenarios = (task.bddScenarios || []).map(sc =>
          sc.id === scenarioId ? { ...sc, ...scenarioData } : sc
        );
      } else {
        updatedScenarios = [
          ...(task.bddScenarios || []),
          { ...scenarioData, id: `bdd-${Date.now()}` },
        ];
      }
      const updatedTask = { ...task, bddScenarios: updatedScenarios };
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject, propagateTaskUpdate]
  );

  const executeDeleteBddScenario = useCallback(
    (taskId: string, scenarioId: string) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;
      const updatedTask = {
        ...task,
        bddScenarios: (task.bddScenarios || []).filter(sc => sc.id !== scenarioId),
      };
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject, propagateTaskUpdate]
  );

  const handleDeleteBddScenario = useCallback((taskId: string, scenarioId: string) => {
    setConfirmDeleteState({ type: 'bdd', taskId, targetId: scenarioId, label: 'este cenário BDD' });
  }, []);

  const handleGenerateBddScenarios = useCallback(
    async (taskId: string) =>
      enqueueGeminiOperation(async () => {
        setGeneratingBddTaskId(taskId);
        try {
          const task = project.tasks.find(t => t.id === taskId);
          if (!task) throw new Error('Task not found');
          const aiService = getAIService();
          const ctx = await resolveTaskAiContext(task, { project });
          const scenarios = await aiService.generateBddScenarios(ctx, project, task);
          const updatedTask = {
            ...task,
            bddScenarios: [...(task.bddScenarios || []), ...scenarios],
          };
          onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
          });
          propagateTaskUpdate(updatedTask);
          handleSuccess('Cenários BDD gerados com sucesso!');
        } catch (error) {
          notifyAiError(error, 'Gerar cenários BDD');
        } finally {
          setGeneratingBddTaskId(null);
        }
      }),
    [project, onUpdateProject, handleSuccess, enqueueGeminiOperation, notifyAiError, propagateTaskUpdate]
  );

  const handleGenerateTests = useCallback(
    async (taskId: string, detailLevel: TestCaseDetailLevel) =>
      enqueueGeminiOperation(async () => {
        setGeneratingTestsTaskId(taskId);
        try {
          const task = project.tasks.find(t => t.id === taskId);
          if (!task) throw new Error('Task not found');
          const ctx = await resolveTaskAiContext(task, { project });
          const { strategy, testCases, snapshotHash, generatedAt } =
            await generateTestArtifactsForTask(task, {
              detailLevel,
              project,
              taskAiContext: ctx,
            });
          const updatedTask = {
            ...task,
            testStrategy: strategy,
            testCases,
            testCasesSnapshotHash: snapshotHash,
            testCasesGeneratedAt: generatedAt,
          };
          onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)),
          });
          propagateTaskUpdate(updatedTask);
          handleSuccess('Casos de teste gerados com sucesso!');
        } catch (error) {
          notifyAiError(error, 'Gerar casos de teste');
        } finally {
          setGeneratingTestsTaskId(null);
        }
      }),
    [project, onUpdateProject, handleSuccess, enqueueGeminiOperation, notifyAiError, propagateTaskUpdate]
  );

  const handleGenerateAll = useCallback(
    async (taskId: string, detailLevel: TestCaseDetailLevel = 'Estruturado') =>
      enqueueGeminiOperation(async () => {
        setGeneratingAllTaskId(taskId);
        try {
          const task = project.tasks.find(t => t.id === taskId);
          if (!task) throw new Error('Task not found');
          const ctx = await resolveTaskAiContext(task, { project });
          const { strategy, testCases, bddScenarios, snapshotHash, generatedAt } =
            await generateTestArtifactsForTask(task, {
              detailLevel,
              project,
              taskAiContext: ctx,
              regenerateBdd: true,
            });
          const updatedTask = {
            ...task,
            bddScenarios,
            testStrategy: strategy,
            testCases,
            testCasesSnapshotHash: snapshotHash,
            testCasesGeneratedAt: generatedAt,
          };
          onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)),
          });
          propagateTaskUpdate(updatedTask);
          handleSuccess('BDD, estratégias e casos de teste gerados com sucesso!');
        } catch (error) {
          notifyAiError(error, 'Gerar BDD, estratégias e testes');
        } finally {
          setGeneratingAllTaskId(null);
        }
      }),
    [project, onUpdateProject, handleSuccess, enqueueGeminiOperation, notifyAiError, propagateTaskUpdate]
  );

  const handleGenerateDevGuidance = useCallback(
    async (taskId: string) =>
      enqueueGeminiOperation(async () => {
        setGeneratingDevGuidanceTaskId(taskId);
        try {
          const task = project.tasks.find(t => t.id === taskId);
          if (!task) throw new Error('Task not found');
          const ctx = await resolveTaskAiContext(task, { project });
          const result = await generateDevGuidanceForTask(task, {
            project,
            taskAiContext: ctx,
          });
          const { snapshotHash, generatedAt, ...guidance } = result;
          const updatedTask = {
            ...task,
            devGuidance: guidance,
            devGuidanceSnapshotHash: snapshotHash,
            devGuidanceGeneratedAt: generatedAt,
          };
          onUpdateProject({
            ...project,
            tasks: project.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)),
          });
          propagateTaskUpdate(updatedTask);
          handleSuccess('Guia de implementação gerado com sucesso!');
        } catch (error) {
          notifyAiError(error, 'Gerar guia Dev');
        } finally {
          setGeneratingDevGuidanceTaskId(null);
        }
      }),
    [project, onUpdateProject, handleSuccess, enqueueGeminiOperation, notifyAiError, propagateTaskUpdate]
  );

  const handleUpdateTaskFromJira = useCallback(
    async (taskId: string) => {
      setUpdatingFromJiraTaskId(taskId);
      try {
        const config = getJiraConfig();
        if (!config) throw new Error('Jira não configurado.');
        const updatedProject = await updateSingleTaskFromJira(config, project, taskId);
        await onUpdateProject(updatedProject);
        handleSuccess('Tarefa atualizada do Jira.');
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), 'Atualizar do Jira');
      } finally {
        setUpdatingFromJiraTaskId(null);
      }
    },
    [project, onUpdateProject, handleError, handleSuccess]
  );

  const handleConfirmFail = useCallback(() => {
    const { taskId, testCaseId, observedResult, createBug } = failModalState;
    if (!taskId || !testCaseId) return;
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;
    const testCase = task.testCases.find(tc => tc.id === testCaseId);
    if (!testCase) return;
    const updatedTestCases = task.testCases.map(tc =>
      tc.id === testCaseId
        ? { ...tc, status: 'Failed' as const, observedResult: observedResult ?? '' }
        : tc
    );
    const updatedTask = { ...task, testCases: updatedTestCases };
    const newTasks = project.tasks.map(t => (t.id === taskId ? updatedTask : t));
    if (createBug) {
      const newBug = createBugFromFailedTest(testCase, task, observedResult);
      newTasks.push(newBug);
      notifyTestFailed(testCase, task, project);
      notifyBugCreated(newBug, project);
      handleSuccess(`Bug ${newBug.id} criado automaticamente.`);
    } else {
      notifyTestFailed(testCase, task, project);
    }
    onUpdateProject({ ...project, tasks: newTasks });
    propagateTaskUpdate(updatedTask);
    setFailModalState({
      isOpen: false,
      taskId: null,
      testCaseId: null,
      observedResult: '',
      createBug: true,
    });
  }, [failModalState, project, onUpdateProject, handleSuccess, propagateTaskUpdate]);

  const handleTestCaseStatusChange = useCallback(
    (taskId: string, testCaseId: string, status: TestCase['status']) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;
      if (status === 'Failed') {
        setFailModalState({
          isOpen: true,
          taskId,
          testCaseId,
          observedResult: '',
          createBug: true,
        });
        return;
      }
      const updatedTask = {
        ...task,
        testCases: task.testCases.map(tc => (tc.id === testCaseId ? { ...tc, status } : tc)),
      };
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject, propagateTaskUpdate]
  );

  const handleTestCaseObservedResultChange = useCallback(
    (taskId: string, testCaseId: string, value: string) => {
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                testCases: (t.testCases || []).map(tc =>
                  tc.id === testCaseId ? { ...tc, observedResult: value } : tc
                ),
              }
            : t
        ),
      });
    },
    [project, onUpdateProject]
  );

  const handleTestCaseExecutionKindChange = useCallback(
    (taskId: string, testCaseId: string, executionKind: TestCase['executionKind']) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;
      const updatedTask = {
        ...task,
        testCases: (task.testCases || []).map(tc =>
          tc.id === testCaseId ? { ...tc, executionKind } : tc
        ),
      };
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject, propagateTaskUpdate]
  );

  const handleTaskToolsChange = useCallback(
    (taskId: string, tools: string[]) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;
      const updatedTask = { ...task, toolsUsed: tools };
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject, propagateTaskUpdate]
  );

  const handleOpenTestCaseEditor = useCallback((taskId: string, testCase: TestCase) => {
    setTestCaseEditorRef({ taskId, testCase });
  }, []);

  const handleSaveTestCase = useCallback(
    (taskId: string, updatedTestCase: TestCase) => {
      const updatedTasks = project.tasks.map(t => {
        if (t.id !== taskId) return t;
        const updatedTask = {
          ...t,
          testCases: (t.testCases || []).map(tc =>
            tc.id === updatedTestCase.id ? updatedTestCase : tc
          ),
        };
        propagateTaskUpdate(updatedTask);
        return updatedTask;
      });
      onUpdateProject({ ...project, tasks: updatedTasks });
      handleSuccess('Caso de teste atualizado com sucesso!');
      setTestCaseEditorRef(null);
    },
    [project, onUpdateProject, handleSuccess, propagateTaskUpdate]
  );

  const executeDeleteTestCase = useCallback(
    (taskId: string, testCaseId: string) => {
      const updatedTasks = project.tasks.map(t => {
        if (t.id !== taskId) return t;
        const updatedTask = {
          ...t,
          testCases: (t.testCases || []).filter(tc => tc.id !== testCaseId),
        };
        propagateTaskUpdate(updatedTask);
        return updatedTask;
      });
      onUpdateProject({ ...project, tasks: updatedTasks });
      setTestCaseEditorRef(prev =>
        prev?.taskId === taskId && prev.testCase.id === testCaseId ? null : prev
      );
      handleSuccess('Caso de teste excluído.');
    },
    [project, onUpdateProject, handleSuccess, propagateTaskUpdate]
  );

  const handleDeleteTestCase = useCallback((taskId: string, testCaseId: string) => {
    setConfirmDeleteState({
      type: 'testcase',
      taskId,
      targetId: testCaseId,
      label: 'este caso de teste',
    });
  }, []);

  const handleDuplicateTestCase = useCallback(
    (taskId: string, testCase: TestCase) => {
      const clone: TestCase = {
        ...testCase,
        id: crypto.randomUUID?.() ?? `tc-${Date.now()}`,
        status: 'Not Run',
        observedResult: '',
      };
      const updatedTasks = project.tasks.map(t => {
        if (t.id !== taskId) return t;
        const updatedTask = { ...t, testCases: [...(t.testCases || []), clone] };
        propagateTaskUpdate(updatedTask);
        return updatedTask;
      });
      onUpdateProject({ ...project, tasks: updatedTasks });
      handleSuccess('Caso de teste duplicado.');
    },
    [project, onUpdateProject, handleSuccess, propagateTaskUpdate]
  );

  const handleStrategyExecutedChange = useCallback(
    (taskId: string, strategyIndex: number, executed: boolean) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;
      const currentExecuted = task.executedStrategies || [];
      const newExecuted = executed
        ? [...new Set([...currentExecuted, strategyIndex])]
        : currentExecuted.filter(idx => idx !== strategyIndex);
      const strategyTools = { ...(task.strategyTools || {}) };
      if (!executed) delete strategyTools[strategyIndex];
      const updatedTask = {
        ...task,
        executedStrategies: newExecuted,
        strategyTools: Object.keys(strategyTools).length ? strategyTools : undefined,
      };
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject, propagateTaskUpdate]
  );

  const handleStrategyToolsChange = useCallback(
    (taskId: string, strategyIndex: number, tools: string[]) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;
      const strategyTools = { ...(task.strategyTools || {}), [strategyIndex]: tools };
      if (!tools.length) delete strategyTools[strategyIndex];
      const updatedTask = {
        ...task,
        strategyTools: Object.keys(strategyTools).length ? strategyTools : undefined,
      };
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject, propagateTaskUpdate]
  );

  const handleAddComment = useCallback(
    (taskId: string, content: string) => {
      if (!content.trim()) return;
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;
      const updatedTask = {
        ...task,
        comments: [
          ...(task.comments || []),
          {
            id: `comment-${Date.now()}`,
            author: 'Você',
            content,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
      notifyCommentAdded(updatedTask, project, 'Você');
    },
    [project, onUpdateProject, propagateTaskUpdate]
  );

  const handleEditComment = useCallback(
    (taskId: string, commentId: string, content: string) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task?.comments) return;
      const updatedTask = {
        ...task,
        comments: task.comments.map(c =>
          c.id === commentId ? { ...c, content, updatedAt: new Date().toISOString() } : c
        ),
      };
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject, propagateTaskUpdate]
  );

  const handleDeleteComment = useCallback(
    (taskId: string, commentId: string) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task?.comments) return;
      const updatedTask = {
        ...task,
        comments: task.comments.filter(c => c.id !== commentId),
      };
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject, propagateTaskUpdate]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDeleteState) return;
    const { type, taskId, targetId } = confirmDeleteState;
    if (type === 'testcase' && targetId) executeDeleteTestCase(taskId, targetId);
    else if (type === 'bdd' && targetId) executeDeleteBddScenario(taskId, targetId);
    setConfirmDeleteState(null);
  }, [confirmDeleteState, executeDeleteTestCase, executeDeleteBddScenario]);

  return {
    generatingTestsTaskId,
    generatingBddTaskId,
    generatingAllTaskId,
    generatingDevGuidanceTaskId,
    updatingFromJiraTaskId,
    testCaseEditorRef,
    setTestCaseEditorRef,
    confirmDeleteState,
    setConfirmDeleteState,
    failModalState,
    setFailModalState,
    handleConfirmFail,
    handleConfirmDelete,
    handleSaveTestCase,
    handleGenerateBddScenarios,
    handleGenerateTests,
    handleGenerateAll,
    handleGenerateDevGuidance,
    handleUpdateTaskFromJira,
    handleSaveBddScenario,
    handleDeleteBddScenario,
    handleTestCaseStatusChange,
    handleTestCaseObservedResultChange,
    handleTestCaseExecutionKindChange,
    handleTaskToolsChange,
    handleOpenTestCaseEditor,
    handleDeleteTestCase,
    handleDuplicateTestCase,
    handleStrategyExecutedChange,
    handleStrategyToolsChange,
    handleAddComment,
    handleEditComment,
    handleDeleteComment,
  };
}

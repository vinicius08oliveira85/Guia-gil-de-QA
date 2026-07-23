import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Project,
  JiraTask,
  BddScenario,
  TestCaseDetailLevel,
  TestCase,
  Comment,
  TaskTestStatus,
} from '../../types';
import { getAIService } from '../../services/ai/aiServiceFactory';
import { generateTestArtifactsForTask } from '../../services/ai/testCaseGenerationService';
import { resolveTaskAiContext } from '../../services/ai/taskAiContext';
import { Modal } from '../common/Modal';
import { TaskForm } from './TaskForm';
import { TestCaseEditorModal } from './TestCaseEditorModal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Zap,
  AlertTriangle,
  X,
  Check,
  Link as LinkIcon,
  Clock,
  ClipboardList,
  CheckCircle,
  Star,
  List,
  Layers,
  Download,
  Search,
  Sparkles,
} from 'lucide-react';
import { logger } from '../../utils/logger';
import { cn } from '../../utils/cn';
import {
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
  tasksPanelSectionTitleClass,
  tasksPanelToolbarExportBtnClass,
  tasksPanelToolbarFieldClass,
  tasksPanelToolbarLabelClass,
  tasksPanelToolbarSelectClass,
  tasksPanelToolbarShellClass,
  tasksPanelBacklogSprintActiveBadgeClass,
  tasksPanelBacklogSprintCountClass,
  tasksPanelBacklogSprintHeadingClass,
} from './tasksPanelNeuStyles';
import { tasksListPanelClass } from './tasksListNeuUi';
import { useProjectsStore } from '../../store/projectsStore';
import { toToastableAiError } from '../../utils/aiErrorMapper';
import { withTimeout } from '../../utils/withTimeout';
import { JiraTaskItem, TaskWithChildren } from './JiraTaskItem';
import { TaskDetailsModal } from './TaskDetailsModal';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { createBugFromFailedTest } from '../../utils/bugAutoCreation';
import { getTaskDependents, getReadyTasks } from '../../utils/dependencyService';
import {
  notifyTestFailed,
  notifyBugCreated,
  notifyCommentAdded,
  notifyDependencyResolved,
} from '../../utils/notificationService';
import { BulkActions } from '../common/BulkActions';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { EmptyState } from '../common/EmptyState';
import {
  getJiraConfig,
  syncTaskToJira,
  fetchJiraTaskFormDataByKey,
  updateSingleTaskFromJira,
  transitionJiraIssueToStatus,
} from '../../services/jiraService';
import { GeneralIAAnalysisButton } from './GeneralIAAnalysisButton';
import { TasksViewHeader } from './TasksViewHeader';
import { TasksViewSearch } from './TasksViewSearch';
import { TasksViewFiltersModalContent } from './TasksViewFiltersModal';
import { TasksViewList } from './TasksViewList';
import { generateGeneralIAAnalysis } from '../../services/ai/generalAnalysisService';
import { generateAndAppendDevProjectAnalysis } from '../../services/ai/projectDevFullAnalysisService';
import { generateDevGuidanceForTask } from '../../services/ai/devGuidanceGenerationService';
import { generateStrategyHowToExecute } from '../../services/ai/strategyHowToExecuteService';
import { normalizeProjectWorkflow } from '../../utils/projectWorkflow';
import { DEV_TASKS_COPY } from '../../utils/devTasksUi';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { GlassIndicatorCards } from '../dashboard/GlassIndicatorCards';
import type { InsightDrillDownPayload } from '../dashboard/insights/insightDrillDown';
import {
  tasksViewContentClass,
  tasksViewHeroChromeClass,
  tasksViewHeroShellClass,
  tasksViewListPanelClass,
  tasksViewPageShellClass,
  tasksViewPanelClass,
  tasksViewPanelDividerClass,
  tasksViewSectionDescClass,
  tasksViewSectionHeaderClass,
  tasksViewSectionHeaderFollowClass,
  tasksViewSectionLabelClass,
} from './tasksViewNeuUi';
import { getDisplayStatus } from '../../utils/taskHelpers';
import { FileExportModal } from '../common/FileExportModal';
import {
  buildTaskTreeSectionA11y,
  parentLinkCreatesCycle,
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
import { alignTaskStatusesFromJira, buildTaskJiraStatusSnapshot } from '../../utils/jiraTaskSyncMirror';
import { testCaseLooksAutomated } from '../../utils/testCaseMigration';
import { VirtualizedTaskRootList, shouldVirtualizeTaskRoots } from './VirtualizedTaskRootList';
import { leveViewOutlineBtnClass } from '../common/projectCardUi';
import {
  applyBacklogSecondaryFilters,
  BACKLOG_SECONDARY_FILTER_DEFAULTS,
  countActiveBacklogSecondaryFilters,
  filterBacklogTasks,
  filterBacklogTasksByItemFilter,
  getBacklogTaskComparator,
  type BacklogItemFilter,
  type BacklogPriorityFilter,
  type BacklogSortBy,
  type BacklogStoryPointsFilter,
  type BacklogTypeFilter,
  type TasksListMode,
} from '../../utils/backlogTasks';
import { BacklogListSurface } from './BacklogListSurface';
import { TaskListCollapsibleSection } from './TaskListCollapsibleSection';
import {
  BACKLOG_SPRINT_FILTER_ALL,
  buildBacklogSprintFilterOptions,
  filterTasksByBacklogSprint,
  groupBacklogRootsBySprint,
  countTasksInBacklogTree,
} from '../../utils/taskSprintDisplay';
import { TasksViewListModeToggle } from './TasksViewListModeToggle';
import { AppSelect } from '../common/AppSelect';
import { TasksViewSortGroupMobile } from './TasksViewSortGroupMobile';

export const TasksView: React.FC<{
  project: Project;
  onUpdateProject: (project: Project) => void;
  onNavigateToTab?: (tabId: string) => void;
  initialTaskId?: string;
  /** Inline detalhes ou modal de tarefa — atualiza breadcrumb no ProjectView. */
  onTaskDetailsOpenChange?: (taskId: string, isOpen: boolean) => void;
  /** Incrementado pelo ProjectView ao abrir com filtro de resultado de casos (ex.: falhas). */
  tasksExecutionNavKey?: number;
  tasksExecutionNavStatuses?: TestCase['status'][];
  /** Incrementado pelo ProjectView ao drill-down de severidade/módulo no dashboard. */
  tasksInsightNavKey?: number;
  tasksInsightNav?: InsightDrillDownPayload | null;
  /** Subvisão dentro da aba Tarefas & Testes (controlada pelo ProjectView / URL). */
  listMode?: TasksListMode;
  onListModeChange?: (mode: TasksListMode) => void;
  /** Abre tarefa em aba do workspace (ProjectView); se omitido, usa modal local. */
  onOpenTaskTab?: (task: JiraTask) => void;
}> = ({
  project: projectProp,
  onUpdateProject,
  onNavigateToTab,
  initialTaskId,
  onTaskDetailsOpenChange,
  tasksExecutionNavKey = 0,
  tasksExecutionNavStatuses = [],
  tasksInsightNavKey = 0,
  tasksInsightNav = null,
  listMode: listModeProp = 'all',
  onListModeChange,
  onOpenTaskTab,
}) => {
  const project =
    useProjectsStore(
      useCallback(state => state.projects.find(p => p.id === projectProp.id), [projectProp.id])
    ) ?? projectProp;
  const isDevProject = normalizeProjectWorkflow(project.workflow) === 'dev';
  const backlogOnly = listModeProp === 'backlog';
  const backlogTaskCount = useMemo(
    () => filterBacklogTasks(project.tasks).length,
    [project.tasks]
  );
  const [backlogSortBy, setBacklogSortBy] = useLocalStorage<BacklogSortBy>(
    `backlog_sort_${project.id}`,
    'priority'
  );
  const [backlogSprintFilter, setBacklogSprintFilter] = useLocalStorage<string>(
    `backlog_sprint_${project.id}`,
    BACKLOG_SPRINT_FILTER_ALL
  );
  const [backlogItemFilter, setBacklogItemFilter] = useLocalStorage<BacklogItemFilter>(
    `backlog_item_filter_${project.id}`,
    'queue'
  );
  const [backlogTypeFilter, setBacklogTypeFilter] = useLocalStorage<BacklogTypeFilter>(
    `backlog_type_filter_${project.id}`,
    BACKLOG_SECONDARY_FILTER_DEFAULTS.type
  );
  const [backlogPriorityFilter, setBacklogPriorityFilter] =
    useLocalStorage<BacklogPriorityFilter>(
      `backlog_priority_filter_${project.id}`,
      BACKLOG_SECONDARY_FILTER_DEFAULTS.priority
    );
  const [backlogStoryPointsFilter, setBacklogStoryPointsFilter] =
    useLocalStorage<BacklogStoryPointsFilter>(
      `backlog_sp_filter_${project.id}`,
      BACKLOG_SECONDARY_FILTER_DEFAULTS.storyPoints
    );
  const [favoritesSectionOpen, setFavoritesSectionOpen] = useLocalStorage(
    `tasks_favorites_open_${project.id}`,
    true
  );
  const [otherTasksSectionOpen, setOtherTasksSectionOpen] = useLocalStorage(
    `tasks_other_open_${project.id}`,
    true
  );

  const clearBacklogSecondaryFilters = useCallback(() => {
    setBacklogTypeFilter(BACKLOG_SECONDARY_FILTER_DEFAULTS.type);
    setBacklogPriorityFilter(BACKLOG_SECONDARY_FILTER_DEFAULTS.priority);
    setBacklogStoryPointsFilter(BACKLOG_SECONDARY_FILTER_DEFAULTS.storyPoints);
  }, [setBacklogTypeFilter, setBacklogPriorityFilter, setBacklogStoryPointsFilter]);

  const clearAllBacklogFilters = useCallback(() => {
    setBacklogSprintFilter(BACKLOG_SPRINT_FILTER_ALL);
    setBacklogItemFilter('queue');
    clearBacklogSecondaryFilters();
  }, [
    setBacklogSprintFilter,
    setBacklogItemFilter,
    clearBacklogSecondaryFilters,
  ]);

  const backlogBaseTasks = useMemo(
    () => filterBacklogTasksByItemFilter(project.tasks, backlogItemFilter),
    [project.tasks, backlogItemFilter]
  );
  const [generatingTestsTaskId, setGeneratingTestsTaskId] = useState<string | null>(null);
  const [generatingBddTaskId, setGeneratingBddTaskId] = useState<string | null>(null);
  const [generatingAllTaskId, setGeneratingAllTaskId] = useState<string | null>(null);
  const [generatingDevGuidanceTaskId, setGeneratingDevGuidanceTaskId] = useState<string | null>(
    null
  );
  const [generatingStrategyHowToKey, setGeneratingStrategyHowToKey] = useState<string | null>(null);

  /** Evita spam de log ao reconstruir a árvore com o mesmo ciclo parentId. */
  const parentCycleWarnedRef = useRef(new Set<string>());

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
  const [transitioningStatusTaskId, setTransitioningStatusTaskId] = useState<string | null>(null);
  const [updatingFromJiraTaskId, setUpdatingFromJiraTaskId] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const { handleError, handleSuccess } = useErrorHandler();

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<JiraTask | undefined>(undefined);
  const [testCaseEditorRef, setTestCaseEditorRef] = useState<{
    taskId: string;
    testCase: TestCase;
  } | null>(null);
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

  const filterScopeProject = useMemo(
    () =>
      backlogOnly
        ? {
            ...project,
            tasks: applyBacklogSecondaryFilters(backlogBaseTasks, {
              type: backlogTypeFilter,
              priority: backlogPriorityFilter,
              storyPoints: backlogStoryPointsFilter,
            }),
          }
        : project,
    [
      backlogOnly,
      project,
      backlogBaseTasks,
      backlogTypeFilter,
      backlogPriorityFilter,
      backlogStoryPointsFilter,
    ]
  );

  const backlogScopeLabel = useMemo(() => {
    const parts: string[] = [];
    parts.push(
      backlogItemFilter === 'completed'
        ? 'Concluídos'
        : backlogItemFilter === 'all'
          ? 'Fila e Concluídos'
          : 'Fila'
    );
    if (backlogSprintFilter !== BACKLOG_SPRINT_FILTER_ALL) parts.push('Sprint filtrada');
    if (backlogTypeFilter !== 'all') parts.push(`Tipo ${backlogTypeFilter}`);
    if (backlogPriorityFilter !== 'all') parts.push(`Prioridade ${backlogPriorityFilter}`);
    if (backlogStoryPointsFilter === 'withSp') parts.push('Com SP');
    if (backlogStoryPointsFilter === 'withoutSp') parts.push('Sem SP');
    return parts.join(' · ');
  }, [
    backlogItemFilter,
    backlogSprintFilter,
    backlogTypeFilter,
    backlogPriorityFilter,
    backlogStoryPointsFilter,
  ]);

  const hasBacklogToolbarFiltersActive = useMemo(
    () =>
      backlogSprintFilter !== BACKLOG_SPRINT_FILTER_ALL ||
      backlogItemFilter !== 'queue' ||
      countActiveBacklogSecondaryFilters({
        type: backlogTypeFilter,
        priority: backlogPriorityFilter,
        storyPoints: backlogStoryPointsFilter,
      }) > 0,
    [
      backlogSprintFilter,
      backlogItemFilter,
      backlogTypeFilter,
      backlogPriorityFilter,
      backlogStoryPointsFilter,
    ]
  );

  const {
    searchQuery,
    setSearchQuery,
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
    testCaseExecutionStatusFilter,
    setTestCaseExecutionStatusFilter,
    bugSeverityFilter,
    setBugSeverityFilter,
    bugModuleFilter,
    setBugModuleFilter,
  } = useTaskFilters(filterScopeProject, {
    executionStatusNavKey: tasksExecutionNavKey,
    executionStatusNavStatuses: tasksExecutionNavStatuses,
    insightNavKey: tasksInsightNavKey,
    insightNav: tasksInsightNav,
    devMode: isDevProject,
  });

  const backlogSprintFilterOptions = useMemo(
    () => buildBacklogSprintFilterOptions(backlogBaseTasks),
    [backlogBaseTasks]
  );

  useEffect(() => {
    if (backlogSprintFilter === BACKLOG_SPRINT_FILTER_ALL) return;
    if (!backlogSprintFilterOptions.some(o => o.value === backlogSprintFilter)) {
      setBacklogSprintFilter(BACKLOG_SPRINT_FILTER_ALL);
    }
  }, [backlogSprintFilter, backlogSprintFilterOptions, setBacklogSprintFilter]);

  const listTasks = useMemo(() => {
    if (!backlogOnly) return filteredTasks;
    return filterTasksByBacklogSprint(filteredTasks, backlogSprintFilter);
  }, [backlogOnly, filteredTasks, backlogSprintFilter]);

  useEffect(() => {
    parentCycleWarnedRef.current.clear();
  }, [project.id]);

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
    logger.warn('Projeto inválido ou sem tarefas', 'TasksView', {
      projectId: project?.id,
      hasTasks: !!project?.tasks,
    });
    return (
      <div className="w-full min-w-0 max-w-none p-4 md:p-5">
        <EmptyState
          title="Projeto inválido"
          description="Projeto inválido ou sem tarefas. Por favor, selecione outro projeto ou crie um novo."
          icon={<AlertTriangle className="w-12 h-12 text-warning" />}
        />
      </div>
    );
  }

  const notifyAiError = useCallback(
    (error: unknown, context: string) => {
      handleError(toToastableAiError(error), context);
    },
    [handleError]
  );
  const [isRunningGeneralAnalysis, setIsRunningGeneralAnalysis] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{
    current: number;
    total: number;
    message: string;
    estimatedSeconds?: number;
  } | null>(null);
  const [modalTask, setModalTask] = useState<JiraTask | null>(null);

  const handleOpenTaskDetails = useCallback(
    (task: JiraTask) => {
      if (onOpenTaskTab) {
        onOpenTaskTab(task);
      } else {
        setModalTask(task);
      }
    },
    [onOpenTaskTab]
  );

  const metrics = useProjectMetrics(project);
  const { projects: allProjects, updateProject: updateGlobalProject } = useProjectsStore();

  // Tarefa com árvore de children estável por referência (evita re-renders em cascata no TestReportModal)
  const taskForModal = useMemo<TaskWithChildren | null>(() => {
    if (!modalTask) return null;
    const tasks = project.tasks;
    const taskById = new Map(tasks.map(t => [t.id, t]));
    if (!taskById.has(modalTask.id)) return { ...modalTask, children: [] };
    const visited = new Set<string>();
    const queue: string[] = [modalTask.id];
    visited.add(modalTask.id);
    const order: string[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      order.push(id);
      const children = tasks.filter(c => c.parentId === id);
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
        .filter(c => c.parentId === id)
        .map(c => built.get(c.id) ?? ({ ...c, children: [] } as TaskWithChildren));
      built.set(id, { ...t, children } as TaskWithChildren);
    }
    return built.get(modalTask.id) ?? { ...modalTask, children: [] };
  }, [project.tasks, modalTask]);

  useLayoutEffect(() => {
    if (!onTaskDetailsOpenChange || !modalTask) return undefined;
    onTaskDetailsOpenChange(modalTask.id, true);
    return () => onTaskDetailsOpenChange(modalTask.id, false);
  }, [modalTask, onTaskDetailsOpenChange]);

  // Função helper para delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper para propagar atualizações de tarefas para outros projetos vinculados
  const propagateTaskUpdate = useCallback(
    (updatedTask: JiraTask) => {
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
    },
    [allProjects, project.id, updateGlobalProject]
  );

  const handleTaskStatusChange = useCallback(
    (taskId: string, status: 'To Do' | 'In Progress' | 'Done') => {
      const task = project.tasks.find(t => t.id === taskId);
      const previousStatus = task?.status;

      const updatedTask = task
        ? {
            ...task,
            status,
            completedAt: status === 'Done' ? new Date().toISOString() : task.completedAt,
          }
        : null;

      if (!updatedTask) return;

      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });

      // Se a tarefa foi concluída, verificar se alguma tarefa dependente ficou pronta
      if (status === 'Done' && previousStatus !== 'Done' && task) {
        const updatedProject = {
          ...project,
          tasks: project.tasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  status,
                  completedAt: status === 'Done' ? new Date().toISOString() : t.completedAt,
                }
              : t
          ),
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
    },
    [project, onUpdateProject]
  );

  const handleGenerateBddScenarios = useCallback(
    async (taskId: string) => {
      return enqueueGeminiOperation(async () => {
        setGeneratingBddTaskId(taskId);
        try {
          const task = project.tasks.find(t => t.id === taskId);
          if (!task) throw new Error('Task not found');

          if (task.type !== 'Tarefa' && task.type !== 'Bug') {
            handleError(
              new Error('BDD só pode ser gerado para tarefas do tipo "Tarefa" ou "Bug"'),
              'Gerar cenários BDD'
            );
            return;
          }

          const aiService = getAIService();
          const ctx = await resolveTaskAiContext(task, { project });
          const scenarios = await aiService.generateBddScenarios(ctx, project, task);
          const updatedTask = {
            ...task,
            bddScenarios: [...(task.bddScenarios || []), ...scenarios],
          };
          const newTasks = project.tasks.map(t => (t.id === taskId ? updatedTask : t));
          onUpdateProject({ ...project, tasks: newTasks });
          propagateTaskUpdate(updatedTask);
          handleSuccess('Cenários BDD gerados com sucesso!');
        } catch (error) {
          notifyAiError(error, 'Gerar cenários BDD');
        } finally {
          setGeneratingBddTaskId(null);
        }
      });
    },
    [project, onUpdateProject, handleError, handleSuccess, enqueueGeminiOperation]
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
        const newScenario: BddScenario = { ...scenarioData, id: `bdd-${Date.now()}` };
        updatedScenarios = [...(task.bddScenarios || []), newScenario];
      }

      const updatedTask = { ...task, bddScenarios: updatedScenarios };
      const newTasks = project.tasks.map(t => (t.id === taskId ? updatedTask : t));
      onUpdateProject({ ...project, tasks: newTasks });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject]
  );

  const handleDeleteBddScenario = useCallback((taskId: string, scenarioId: string) => {
    setConfirmDeleteState({ type: 'bdd', taskId, targetId: scenarioId, label: 'este cenário BDD' });
  }, []);

  const executeDeleteBddScenario = useCallback(
    (taskId: string, scenarioId: string) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;
      const updatedScenarios = (task.bddScenarios || []).filter(sc => sc.id !== scenarioId);
      const updatedTask = { ...task, bddScenarios: updatedScenarios };
      const newTasks = project.tasks.map(t => (t.id === taskId ? updatedTask : t));
      onUpdateProject({ ...project, tasks: newTasks });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject]
  );

  const handleGenerateTests = useCallback(
    async (taskId: string, detailLevel: TestCaseDetailLevel) => {
      return enqueueGeminiOperation(async () => {
        setGeneratingTestsTaskId(taskId);
        try {
          const task = project.tasks.find(t => t.id === taskId);
          if (!task) throw new Error('Task not found');

          if (task.type !== 'Tarefa') {
            handleError(
              new Error('Casos de teste só podem ser gerados para tarefas do tipo "Tarefa"'),
              'Gerar casos de teste'
            );
            return;
          }

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
          const newTasks = project.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
          onUpdateProject({ ...project, tasks: newTasks });
          propagateTaskUpdate(updatedTask);
          handleSuccess('Casos de teste gerados com sucesso!');
        } catch (error) {
          notifyAiError(error, 'Gerar casos de teste');
        } finally {
          setGeneratingTestsTaskId(null);
        }
      });
    },
    [project, onUpdateProject, handleError, handleSuccess, enqueueGeminiOperation]
  );

  const handleGenerateAll = useCallback(
    async (taskId: string, detailLevel: TestCaseDetailLevel = 'Estruturado') => {
      return enqueueGeminiOperation(async () => {
        setGeneratingAllTaskId(taskId);
        try {
          const task = project.tasks.find(t => t.id === taskId);
          if (!task) throw new Error('Task not found');

          if (task.type !== 'Tarefa' && task.type !== 'Bug') {
            handleError(
              new Error(
                'BDD e casos de teste só podem ser gerados para tarefas do tipo "Tarefa" ou "Bug"'
              ),
              'Gerar BDD, estratégias e testes'
            );
            return;
          }

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

          const newTasks = project.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
          onUpdateProject({ ...project, tasks: newTasks });
          propagateTaskUpdate(updatedTask);
          handleSuccess('BDD, estratégias e casos de teste gerados com sucesso!');
        } catch (error) {
          notifyAiError(error, 'Gerar BDD, estratégias e testes');
        } finally {
          setGeneratingAllTaskId(null);
        }
      });
    },
    [project, onUpdateProject, handleError, handleSuccess, enqueueGeminiOperation]
  );

  const handleGenerateDevGuidance = useCallback(
    async (taskId: string) => {
      return enqueueGeminiOperation(async () => {
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
          const newTasks = project.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
          onUpdateProject({ ...project, tasks: newTasks });
          propagateTaskUpdate(updatedTask);
          handleSuccess('Guia de implementação gerado com sucesso!');
        } catch (error) {
          notifyAiError(error, 'Gerar guia Dev');
        } finally {
          setGeneratingDevGuidanceTaskId(null);
        }
      });
    },
    [
      project,
      onUpdateProject,
      handleSuccess,
      enqueueGeminiOperation,
      notifyAiError,
      propagateTaskUpdate,
    ]
  );

  const handleSyncTaskToJira = useCallback(
    async (taskId: string) => {
      setSyncingTaskId(taskId);
      try {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) throw new Error('Task not found');

        const config = getJiraConfig();
        if (!config) {
          throw new Error('Jira não configurado. Configure nas configurações primeiro.');
        }

        await syncTaskToJira(config, task);
        handleSuccess('Tarefa sincronizada com o Jira com sucesso!');
      } catch (error) {
        handleError(error, 'Sincronizar com Jira');
      } finally {
        setSyncingTaskId(null);
      }
    },
    [project, handleError, handleSuccess]
  );

  const handleUpdateTaskFromJira = useCallback(
    async (taskId: string) => {
      setUpdatingFromJiraTaskId(taskId);
      try {
        const config = getJiraConfig();
        if (!config) {
          throw new Error('Jira não configurado. Configure nas configurações primeiro.');
        }
        const latestProject =
          useProjectsStore.getState().projects.find(p => p.id === project.id) ?? project;
        const updatedProject = await updateSingleTaskFromJira(config, latestProject, taskId);
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

  const handleJiraStatusChange = useCallback(
    async (
      taskId: string,
      jiraStatusName: string,
      rollback: { status: JiraTask['status']; jiraStatus?: string }
    ) => {
      if (!/^[A-Z]+-\d+$/.test(taskId)) return;

      const config = getJiraConfig();
      if (!config) return;

      setTransitioningStatusTaskId(taskId);
      try {
        await transitionJiraIssueToStatus(config, taskId, jiraStatusName);
      } catch (error) {
        onUpdateProject({
          ...project,
          tasks: project.tasks.map(t =>
            t.id === taskId
              ? { ...t, status: rollback.status, jiraStatus: rollback.jiraStatus }
              : t
          ),
        });
        handleError(error, 'Alterar status no Jira');
      } finally {
        setTransitioningStatusTaskId(null);
      }
    },
    [project, onUpdateProject, handleError]
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

      // Notificações
      notifyTestFailed(testCase, task, project);
      notifyBugCreated(newBug, project);

      handleSuccess(`Bug ${newBug.id} criado automaticamente com severidade ${newBug.severity}`);
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
  }, [failModalState, project, onUpdateProject, handleSuccess]);

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

      const updatedTestCases = task.testCases.map(tc =>
        tc.id === testCaseId ? { ...tc, status } : tc
      );
      const updatedTask = { ...task, testCases: updatedTestCases };
      const newTasks = project.tasks.map(t => (t.id === taskId ? updatedTask : t));
      onUpdateProject({ ...project, tasks: newTasks });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject]
  );

  const handleTestCaseObservedResultChange = useCallback(
    (taskId: string, testCaseId: string, value: string) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTestCases = (task.testCases || []).map(tc =>
        tc.id === testCaseId ? { ...tc, observedResult: value } : tc
      );
      const updatedTask = { ...task, testCases: updatedTestCases };

      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
    },
    [project, onUpdateProject]
  );

  const handleTestCaseExecutionKindChange = useCallback(
    (taskId: string, testCaseId: string, executionKind: TestCase['executionKind']) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTestCases = (task.testCases || []).map(tc =>
        tc.id === testCaseId ? { ...tc, executionKind } : tc
      );
      const updatedTask = { ...task, testCases: updatedTestCases };

      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject]
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
    [project, onUpdateProject]
  );

  const handleOpenTestCaseEditor = useCallback((taskId: string, testCase: TestCase) => {
    setTestCaseEditorRef({ taskId, testCase });
  }, []);

  const handleSaveTestCase = useCallback(
    (taskId: string, updatedTestCase: TestCase) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) {
        handleError(new Error('Tarefa não encontrada ao salvar o teste'), 'Salvar caso de teste');
        return;
      }

      const updatedTasks = project.tasks.map(t => {
        if (t.id !== taskId) return t;
        const updatedCases = (t.testCases || []).map(tc =>
          tc.id === updatedTestCase.id ? updatedTestCase : tc
        );
        const updatedTask = { ...t, testCases: updatedCases };
        propagateTaskUpdate(updatedTask);
        return updatedTask;
      });

      onUpdateProject({ ...project, tasks: updatedTasks });
      handleSuccess('Caso de teste atualizado com sucesso!');
      setTestCaseEditorRef(null);
    },
    [project, onUpdateProject, handleSuccess, handleError]
  );

  const handleDeleteTestCase = useCallback(
    (taskId: string, testCaseId: string) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) {
        handleError(new Error('Tarefa não encontrada ao excluir o teste'), 'Excluir caso de teste');
        return;
      }
      setConfirmDeleteState({
        type: 'testcase',
        taskId,
        targetId: testCaseId,
        label: 'este caso de teste',
      });
    },
    [project, handleError]
  );

  const executeDeleteTestCase = useCallback(
    (taskId: string, testCaseId: string) => {
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
    },
    [project, onUpdateProject, handleSuccess]
  );

  const handleDuplicateTestCase = useCallback(
    (taskId: string, testCase: TestCase) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) {
        handleError(
          new Error('Tarefa não encontrada ao duplicar o teste'),
          'Duplicar caso de teste'
        );
        return;
      }
      const clone: TestCase = {
        ...testCase,
        id: crypto.randomUUID?.() ?? `tc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        status: 'Not Run',
        observedResult: '',
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
    },
    [project, onUpdateProject, handleSuccess, handleError]
  );

  const handleStrategyExecutedChange = useCallback(
    (taskId: string, strategyIndex: number, executed: boolean) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;

      const currentExecuted = task.executedStrategies || [];
      const newExecuted = executed
        ? currentExecuted.includes(strategyIndex)
          ? currentExecuted
          : [...currentExecuted, strategyIndex]
        : currentExecuted.filter(idx => idx !== strategyIndex);

      let updatedTask: JiraTask;
      if (executed) {
        updatedTask = { ...task, executedStrategies: newExecuted };
      } else {
        const strategyTools = { ...(task.strategyTools || {}) };
        delete strategyTools[strategyIndex];
        updatedTask = {
          ...task,
          executedStrategies: newExecuted,
          strategyTools: Object.keys(strategyTools).length > 0 ? strategyTools : undefined,
        };
      }

      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject]
  );

  const handleStrategyToolsChange = useCallback(
    (taskId: string, strategyIndex: number, tools: string[]) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return;

      const currentStrategyTools = task.strategyTools || {};
      const newStrategyTools = {
        ...currentStrategyTools,
        [strategyIndex]: tools.length > 0 ? tools : undefined,
      };
      // Remove entradas vazias
      Object.keys(newStrategyTools).forEach(key => {
        const index = Number(key);
        const toolsForIndex = newStrategyTools[index];
        if (!toolsForIndex || toolsForIndex.length === 0) {
          delete newStrategyTools[index];
        }
      });

      const updatedTask = {
        ...task,
        strategyTools: Object.keys(newStrategyTools).length > 0 ? newStrategyTools : undefined,
      };

      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject]
  );

  const handleGenerateStrategyHowToExecute = useCallback(
    async (taskId: string, strategyIndex: number) => {
      return enqueueGeminiOperation(async () => {
        const latestProject =
          useProjectsStore.getState().projects.find(p => p.id === project.id) ?? project;
        const task = latestProject.tasks.find(t => t.id === taskId);
        if (!task) return;

        const strategy = task.testStrategy?.[strategyIndex];
        if (!strategy) {
          handleError(new Error('Estratégia de teste não encontrada.'), 'Gerar passos da estratégia');
          return;
        }

        const toolsFromMap = task.strategyTools?.[strategyIndex];
        const tools = Array.isArray(toolsFromMap)
          ? toolsFromMap.map(t => t.trim()).filter(Boolean)
          : [];
        if (tools.length === 0) {
          handleError(
            new Error('Selecione ao menos uma ferramenta antes de gerar os passos.'),
            'Gerar passos da estratégia'
          );
          return;
        }

        const key = `${taskId}:${strategyIndex}`;
        setGeneratingStrategyHowToKey(key);
        try {
          const generated = await generateStrategyHowToExecute({
            task,
            strategy,
            tools,
          });
          const storeProject =
            useProjectsStore.getState().projects.find(p => p.id === project.id) ?? latestProject;
          const latestTask = storeProject.tasks.find(t => t.id === taskId) ?? task;
          const strategies = [...(latestTask.testStrategy ?? [])];
          if (!strategies[strategyIndex]) return;
          strategies[strategyIndex] = {
            ...strategies[strategyIndex],
            howToExecute: generated.howToExecute,
            cursorAgentTestPrompts: generated.cursorAgentTestPrompts,
          };
          const updatedTask = { ...latestTask, testStrategy: strategies };
          await onUpdateProject({
            ...storeProject,
            tasks: storeProject.tasks.map(t => (t.id === taskId ? updatedTask : t)),
          });
          propagateTaskUpdate(updatedTask);
          handleSuccess('Passos e prompts do Agente gerados e salvos no banco.');
        } catch (error) {
          notifyAiError(error, 'Gerar passos da estratégia');
        } finally {
          setGeneratingStrategyHowToKey(null);
        }
      });
    },
    [enqueueGeminiOperation, project, onUpdateProject, propagateTaskUpdate, handleError, handleSuccess, notifyAiError]
  );

  const handleAddComment = useCallback(
    (taskId: string, content: string) => {
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
        comments: [...(task.comments || []), newComment],
      };

      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });

      propagateTaskUpdate(updatedTask);
      // Notificar sobre o novo comentário
      notifyCommentAdded(updatedTask, project, 'Você');
    },
    [project, onUpdateProject]
  );

  const handleEditComment = useCallback(
    (taskId: string, commentId: string, content: string) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task || !task.comments) return;

      const updatedComments = task.comments.map(comment =>
        comment.id === commentId
          ? { ...comment, content, updatedAt: new Date().toISOString() }
          : comment
      );

      const updatedTask = { ...task, comments: updatedComments };

      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject]
  );

  const handleDeleteComment = useCallback(
    (taskId: string, commentId: string) => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task || !task.comments) return;

      const updatedComments = task.comments.filter(comment => comment.id !== commentId);
      const updatedTask = { ...task, comments: updatedComments };

      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      });
      propagateTaskUpdate(updatedTask);
    },
    [project, onUpdateProject]
  );

  const handleGeneralIAAnalysis = useCallback(async () => {
    return enqueueGeminiOperation(async () => {
      const taskCount = project.tasks.length;
      const adaptiveTimeout = Math.min(120000 + taskCount * 5000, 180000); // Base 120s + 5s por tarefa, máximo 180s
      const estimatedSeconds = Math.round(adaptiveTimeout / 1000);

      setIsRunningGeneralAnalysis(true);
      setAnalysisProgress({
        current: 0,
        total: 0,
        message: 'Iniciando análise...',
        estimatedSeconds,
      });

      try {
        // Passo 1: Gerar análise geral
        setAnalysisProgress({
          current: 1,
          total: 3,
          message: 'Gerando análise geral do projeto...',
          estimatedSeconds,
        });
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
                isOutdated: false,
              },
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
        const bddGenerationResults: Array<{ taskId: string; success: boolean; error?: string }> =
          [];
        if (limitedBDDTasks.length > 0) {
          setAnalysisProgress({
            current: 2,
            total: 3,
            message: `Gerando BDDs (0/${limitedBDDTasks.length})...`,
            estimatedSeconds,
          });

          for (let i = 0; i < limitedBDDTasks.length; i++) {
            const task = limitedBDDTasks[i];
            processedCount++;

            setAnalysisProgress({
              current: 2,
              total: 3,
              message: `Gerando BDDs para "${task.title.substring(0, 30)}..." (${i + 1}/${limitedBDDTasks.length})`,
              estimatedSeconds,
            });

            try {
              const ctx = await resolveTaskAiContext(task, { project });
              const scenarios = await withTimeout(
                aiService.generateBddScenarios(ctx, project, task),
                60000
              );

              const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
              if (taskIndex !== -1) {
                updatedTasks[taskIndex] = {
                  ...updatedTasks[taskIndex],
                  bddScenarios: [...(updatedTasks[taskIndex].bddScenarios || []), ...scenarios],
                };
              }
              bddGenerationResults.push({ taskId: task.id, success: true });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
              logger.error(`Erro ao gerar BDDs para tarefa ${task.id}`, 'TasksView', error);
              bddGenerationResults.push({
                taskId: task.id,
                success: false,
                error: errorMessage.includes('Timeout')
                  ? 'Timeout: operação demorou mais de 60 segundos'
                  : errorMessage,
              });
            }

            // Delay entre processamentos para evitar sobrecarga
            if (i < limitedBDDTasks.length - 1) {
              await delay(300);
            }
          }
        }

        // Passo 3: Gerar casos de teste automaticamente
        const testCaseGenerationResults: Array<{
          taskId: string;
          success: boolean;
          error?: string;
        }> = [];
        if (limitedTestTasks.length > 0) {
          setAnalysisProgress({
            current: 3,
            total: 3,
            message: `Gerando casos de teste (0/${limitedTestTasks.length})...`,
            estimatedSeconds,
          });

          for (let i = 0; i < limitedTestTasks.length; i++) {
            const task = limitedTestTasks[i];
            processedCount++;

            setAnalysisProgress({
              current: 3,
              total: 3,
              message: `Gerando testes para "${task.title.substring(0, 30)}..." (${i + 1}/${limitedTestTasks.length})`,
              estimatedSeconds,
            });

            try {
              const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
              // Usar a tarefa atualizada do array para garantir que BDDs recém-gerados sejam incluídos
              const currentTask = taskIndex !== -1 ? updatedTasks[taskIndex] : task;

              const ctx = await resolveTaskAiContext(currentTask, { project });
              const { strategy, testCases, snapshotHash, generatedAt } = await withTimeout(
                generateTestArtifactsForTask(currentTask, {
                  detailLevel: 'Estruturado',
                  project,
                  taskAiContext: ctx,
                }),
                60000
              );

              if (taskIndex !== -1) {
                const existingTestCases = updatedTasks[taskIndex].testCases || [];
                updatedTasks[taskIndex] = {
                  ...updatedTasks[taskIndex],
                  testStrategy:
                    existingTestCases.length > 0
                      ? [...(updatedTasks[taskIndex].testStrategy || []), ...strategy]
                      : strategy,
                  testCases:
                    existingTestCases.length > 0 ? [...existingTestCases, ...testCases] : testCases,
                  testCasesSnapshotHash: snapshotHash,
                  testCasesGeneratedAt: generatedAt,
                };
              }
              testCaseGenerationResults.push({ taskId: task.id, success: true });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
              logger.error(
                `Erro ao gerar casos de teste para tarefa ${task.id}`,
                'TasksView',
                error
              );
              testCaseGenerationResults.push({
                taskId: task.id,
                success: false,
                error: errorMessage.includes('Timeout')
                  ? 'Timeout: operação demorou mais de 60 segundos'
                  : errorMessage,
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
          generalIAAnalysis: analysis,
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
          warnings.push(
            `${tasksNeedingBDD.length - MAX_TASKS_TO_PROCESS} tarefa(s) com BDD pendente (limite de ${MAX_TASKS_TO_PROCESS} por execução)`
          );
        }
        if (tasksNeedingTestCases.length > MAX_TASKS_TO_PROCESS) {
          warnings.push(
            `${tasksNeedingTestCases.length - MAX_TASKS_TO_PROCESS} tarefa(s) com teste pendente (limite de ${MAX_TASKS_TO_PROCESS} por execução)`
          );
        }

        let successMessage =
          messages.length > 0
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
          const errorMsg =
            `A análise demorou mais de ${timeoutSeconds} segundos e foi interrompida. ` +
            `O projeto possui ${taskCount} tarefa(s), o que pode ser muito para processar de uma vez. ` +
            `Sugestão: Tente novamente com menos tarefas (recomendado: até ${suggestedMaxTasks} tarefas por vez) ` +
            `ou processe em lotes menores. O timeout é adaptativo (${timeoutSeconds}s base + 5s por tarefa, máximo 180s).`;
          handleError(new Error(errorMsg), 'Executar análise geral com IA');
        } else {
          notifyAiError(error, 'Executar análise geral com IA');
        }
      } finally {
        setIsRunningGeneralAnalysis(false);
        setAnalysisProgress(null);
      }
    });
  }, [
    project,
    onUpdateProject,
    handleError,
    handleSuccess,
    notifyAiError,
    onNavigateToTab,
    enqueueGeminiOperation,
  ]);

  const handleDevAssistWithIA = useCallback(async () => {
    return enqueueGeminiOperation(async () => {
      const taskCount = project.tasks.length;
      const adaptiveTimeout = Math.min(120000 + taskCount * 5000, 180000);
      const estimatedSeconds = Math.round(adaptiveTimeout / 1000);

      setIsRunningGeneralAnalysis(true);
      setAnalysisProgress({
        current: 0,
        total: 2,
        message: 'Iniciando assistência Dev…',
        estimatedSeconds,
      });

      try {
        setAnalysisProgress({
          current: 1,
          total: 2,
          message: 'Analisando projeto (stack, backlog técnico, riscos)…',
          estimatedSeconds,
        });

        const { project: withAnalysis } = await withTimeout(
          generateAndAppendDevProjectAnalysis(project),
          adaptiveTimeout
        );

        let updatedTasks = [...withAnalysis.tasks];
        const tasksNeedingGuidance = updatedTasks
          .filter(
            task =>
              (task.type === 'Tarefa' || task.type === 'Bug') &&
              !task.devGuidance &&
              task.title?.trim()
          )
          .slice(0, 10);

        let guidanceSuccess = 0;
        let guidanceFail = 0;

        if (tasksNeedingGuidance.length > 0) {
          setAnalysisProgress({
            current: 2,
            total: 2,
            message: `Gerando guias de implementação (0/${tasksNeedingGuidance.length})…`,
            estimatedSeconds,
          });

          for (let i = 0; i < tasksNeedingGuidance.length; i++) {
            const task = tasksNeedingGuidance[i];
            setAnalysisProgress({
              current: 2,
              total: 2,
              message: `Gerando guia para "${task.title.substring(0, 30)}…" (${i + 1}/${tasksNeedingGuidance.length})`,
              estimatedSeconds,
            });

            try {
              const result = await withTimeout(
                generateDevGuidanceForTask(task, { project: withAnalysis }),
                90000
              );
              const { snapshotHash, generatedAt, ...guidance } = result;
              const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
              if (taskIndex !== -1) {
                updatedTasks[taskIndex] = {
                  ...updatedTasks[taskIndex],
                  devGuidance: guidance,
                  devGuidanceSnapshotHash: snapshotHash,
                  devGuidanceGeneratedAt: generatedAt,
                };
              }
              guidanceSuccess++;
            } catch (error) {
              guidanceFail++;
              logger.error(`Erro ao gerar guia Dev para tarefa ${task.id}`, 'TasksView', error);
            }

            if (i < tasksNeedingGuidance.length - 1) {
              await delay(300);
            }
          }
        }

        onUpdateProject({ ...withAnalysis, tasks: updatedTasks });
        setAnalysisProgress(null);

        const parts: string[] = ['Análise Dev do projeto concluída'];
        if (guidanceSuccess > 0) {
          parts.push(`${guidanceSuccess} guia(s) de implementação gerado(s)`);
        }
        if (guidanceFail > 0) {
          parts.push(`${guidanceFail} falha(s) ao gerar guias`);
        }
        handleSuccess(parts.join('. ') + '.');

        if (onNavigateToTab) {
          setTimeout(() => onNavigateToTab('dashboard'), 500);
        }
      } catch (error) {
        setAnalysisProgress(null);
        notifyAiError(error, 'Assistência Dev com IA');
      } finally {
        setIsRunningGeneralAnalysis(false);
        setAnalysisProgress(null);
      }
    });
  }, [
    project,
    onUpdateProject,
    handleSuccess,
    notifyAiError,
    onNavigateToTab,
    enqueueGeminiOperation,
  ]);

  const handleProjectAiAnalysis = isDevProject ? handleDevAssistWithIA : handleGeneralIAAnalysis;

  const handleSaveTask = (
    taskData: Omit<
      JiraTask,
      'testCases' | 'status' | 'testStrategy' | 'bddScenarios' | 'createdAt' | 'completedAt'
    >
  ) => {
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
            completedAt: t.completedAt,
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
      const newTask: JiraTask = {
        ...taskData,
        status: 'To Do',
        testCases: [],
        bddScenarios: [],
        createdAt: new Date().toISOString(),
      };
      newTasks = [...project.tasks, newTask];
      onUpdateProject({ ...project, tasks: newTasks });
    }
    setIsTaskFormOpen(false);
    setEditingTask(undefined);
    setDefaultParentId(undefined);
  };

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      const taskToDelete = project.tasks.find(t => t.id === taskId);
      const label = taskToDelete?.title ? `"${taskToDelete.title}"` : 'esta tarefa';
      setConfirmDeleteState({ type: 'task', taskId, label });
    },
    [project]
  );

  const executeDeleteTask = useCallback(
    (taskId: string) => {
      const taskToDelete = project.tasks.find(t => t.id === taskId);
      let tasksToKeep = project.tasks;
      if (taskToDelete?.type === 'Epic') {
        tasksToKeep = tasksToKeep.map(t =>
          t.parentId === taskId ? { ...t, parentId: undefined } : t
        );
      }
      tasksToKeep = tasksToKeep.filter(t => t.id !== taskId);
      onUpdateProject({ ...project, tasks: tasksToKeep });
      handleSuccess('Tarefa excluída com sucesso!');
    },
    [project, onUpdateProject, handleSuccess]
  );

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

  const handleImportFromJira = useCallback(
    async (issueKey: string) => {
      const config = getJiraConfig();
      if (!config) {
        handleError(
          new Error('Configure o Jira nas configurações do projeto primeiro.'),
          'Importar do Jira'
        );
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
    },
    [handleError, handleSuccess]
  );

  const epics = useMemo(() => project.tasks.filter(t => t.type === 'Epic'), [project.tasks]);

  // Alinhar status interno ao jiraStatus após sync/importação Jira
  const lastJiraStatusSnapshotRef = useRef('');
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
          inline: 'nearest',
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
    if (!project?.tasks?.length) return;
    if (!onUpdateProjectRef.current) return;

    const snapshot = buildTaskJiraStatusSnapshot(project.tasks);
    if (snapshot === lastJiraStatusSnapshotRef.current) return;

    try {
      const { tasks: correctedTasks, correctedCount } = alignTaskStatusesFromJira(project.tasks);
      lastJiraStatusSnapshotRef.current = snapshot;

      if (correctedCount > 0) {
        Promise.resolve().then(() => {
          onUpdateProjectRef.current?.({
            ...project,
            tasks: correctedTasks,
          });
        });
        logger.info(
          `Alinhados ${correctedCount} status de tarefas com jiraStatus após atualização`,
          'TasksView'
        );
      }
    } catch (error) {
      lastJiraStatusSnapshotRef.current = snapshot;
      logger.error('Erro ao alinhar status das tarefas com jiraStatus', 'TasksView', {
        error,
        projectId: project.id,
      });
    }
  }, [project]);

  useEffect(() => {
    lastJiraStatusSnapshotRef.current = '';
  }, [project.id]);

  const stats = useMemo(() => {
    try {
      if (!project || !project.tasks || !Array.isArray(project.tasks)) {
        return {
          total: 0,
          pending: 0,
          inProgress: 0,
          done: 0,
          bugsOpen: 0,
          totalTests: 0,
          executedTests: 0,
          automatedTests: 0,
        };
      }

      const total = project.tasks.length;

      const tasksWithCorrectedStatus = project.tasks
        .map(task => {
          try {
            if (!task || typeof task !== 'object') {
              return null;
            }
            if (task.jiraStatus) {
              const correctStatus = mapJiraStatusToTaskStatus(task.jiraStatus);
              if (task.status !== correctStatus) {
                return { ...task, status: correctStatus };
              }
            }
            return task;
          } catch (taskError) {
            logger.warn('Erro ao processar tarefa individual', 'TasksView', {
              taskError,
              taskId: task?.id,
            });
            return task;
          }
        })
        .filter((task): task is JiraTask => task !== null);

      const pending = tasksWithCorrectedStatus.filter(
        task => task && task.status === 'To Do'
      ).length;

      const inProgress = tasksWithCorrectedStatus.filter(
        task => task && task.status === 'In Progress'
      ).length;

      const done = tasksWithCorrectedStatus.filter(task => task && task.status === 'Done').length;

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
        return acc + t.testCases.filter(tc => tc && testCaseLooksAutomated(tc)).length;
      }, 0);

      return {
        total,
        pending,
        inProgress,
        done,
        bugsOpen,
        totalTests,
        executedTests,
        automatedTests,
      };
    } catch (error) {
      logger.error('Erro ao calcular stats', 'TasksView', { error, projectId: project?.id });
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        done: 0,
        bugsOpen: 0,
        totalTests: 0,
        executedTests: 0,
        automatedTests: 0,
      };
    }
  }, [project?.tasks]);

  // Rótulos de status agrupados por categoria para que os indicadores filtrem
  // por TODOS os status da categoria (alinhando contagem do card e lista filtrada).
  const toDoLabels = useMemo(
    () =>
      statusOptions.filter(
        o => (PT_STATUS_TO_CATEGORY[o] ?? mapJiraStatusToTaskStatus(o)) === 'To Do'
      ),
    [statusOptions]
  );
  const inProgressLabels = useMemo(
    () =>
      statusOptions.filter(
        o => (PT_STATUS_TO_CATEGORY[o] ?? mapJiraStatusToTaskStatus(o)) === 'In Progress'
      ),
    [statusOptions]
  );
  const doneLabels = useMemo(
    () =>
      statusOptions.filter(
        o => (PT_STATUS_TO_CATEGORY[o] ?? mapJiraStatusToTaskStatus(o)) === 'Done'
      ),
    [statusOptions]
  );
  const nonDoneLabels = useMemo(
    () =>
      statusOptions.filter(
        o => (PT_STATUS_TO_CATEGORY[o] ?? mapJiraStatusToTaskStatus(o)) !== 'Done'
      ),
    [statusOptions]
  );

  const sameStatusSet = useCallback(
    (labels: string[]) =>
      statusFilter.length === labels.length && statusFilter.every(s => labels.includes(s)),
    [statusFilter]
  );

  const withDevGuidanceCount = useMemo(
    () => (project.tasks ?? []).filter(t => t.devGuidance).length,
    [project.tasks]
  );

  const clearDevTaskFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter([]);
    setTypeFilter([]);
    setQualityFilter([]);
    setPriorityFilter([]);
    setTestStatusFilter([]);
    setTestCaseExecutionStatusFilter([]);
    setBugSeverityFilter([]);
    setBugModuleFilter([]);
  }, [
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setQualityFilter,
    setPriorityFilter,
    setTestStatusFilter,
    setTestCaseExecutionStatusFilter,
    setBugSeverityFilter,
    setBugModuleFilter,
  ]);

  const indicatorItems = useMemo(
    () => {
      const baseItems = [
        {
          label: 'Total de Tarefas',
          value: stats.total,
          modifier: 'no escopo',
          icon: ClipboardList,
          colorTheme: 'primary' as const,
        },
        {
          label: 'Tarefas Pendentes',
          value: stats.pending,
          modifier: '-',
          icon: Clock,
          colorTheme: 'warning' as const,
          onClick: () => {
            clearDevTaskFilters();
            setStatusFilter(toDoLabels);
          },
          isActive: typeFilter.length === 0 && sameStatusSet(toDoLabels),
        },
        {
          label: 'Em Andamento',
          value: stats.inProgress,
          modifier: 'active',
          icon: Zap,
          colorTheme: 'info' as const,
          onClick: () => {
            clearDevTaskFilters();
            setStatusFilter(inProgressLabels);
          },
          isActive: typeFilter.length === 0 && sameStatusSet(inProgressLabels),
        },
        {
          label: 'Concluídas',
          value: stats.done,
          modifier: stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}%` : '0%',
          icon: CheckCircle,
          colorTheme: 'success' as const,
          onClick: () => {
            clearDevTaskFilters();
            setStatusFilter(doneLabels);
          },
          isActive: typeFilter.length === 0 && sameStatusSet(doneLabels),
        },
      ];

      if (isDevProject) {
        return [
          ...baseItems,
          {
            label: 'Com guia IA',
            value: withDevGuidanceCount,
            modifier: 'implementação',
            icon: Sparkles,
            colorTheme: 'info' as const,
            onClick: () => {
              clearDevTaskFilters();
              setQualityFilter(['with-guidance']);
            },
            isActive:
              qualityFilter.length === 1 && qualityFilter[0] === 'with-guidance',
          },
        ];
      }

      return [
        ...baseItems,
        {
          label: 'Bugs Abertos',
          value: stats.bugsOpen,
          modifier: (metrics.bugsBySeverity?.['Crítico'] ?? 0) > 0 ? 'Critical' : 'Abertos',
          icon: AlertTriangle,
          colorTheme: 'error' as const,
          onClick: () => {
            clearDevTaskFilters();
            setTypeFilter(['Bug']);
            setStatusFilter(nonDoneLabels);
          },
          isActive:
            typeFilter.length === 1 &&
            typeFilter[0] === 'Bug' &&
            statusFilter.length === nonDoneLabels.length &&
            statusFilter.every(s => nonDoneLabels.includes(s)),
        },
      ];
    },
    [
      isDevProject,
      stats.total,
      stats.pending,
      stats.inProgress,
      stats.done,
      stats.bugsOpen,
      withDevGuidanceCount,
      metrics.bugsBySeverity,
      toDoLabels,
      inProgressLabels,
      doneLabels,
      nonDoneLabels,
      sameStatusSet,
      statusFilter,
      typeFilter,
      qualityFilter,
      clearDevTaskFilters,
      setStatusFilter,
      setTypeFilter,
      setQualityFilter,
    ]
  );

  const taskComparator = useMemo(
    () => (backlogOnly ? getBacklogTaskComparator(backlogSortBy) : getTaskComparator(sortBy)),
    [backlogOnly, backlogSortBy, sortBy]
  );

  const taskTree = useMemo(() => {
    const tasks = [...listTasks].sort(taskComparator);
    const taskMap = new Map(tasks.map(t => [t.id, { ...t, children: [] as TaskWithChildren[] }]));
    const tree: TaskWithChildren[] = [];

    for (const task of taskMap.values()) {
      const pid = task.parentId?.trim();
      if (pid && taskMap.has(pid)) {
        if (parentLinkCreatesCycle(taskMap, task.id, pid)) {
          const warnKey = `${project.id}\0${task.id}\0${pid}`;
          if (!parentCycleWarnedRef.current.has(warnKey)) {
            parentCycleWarnedRef.current.add(warnKey);
            logger.warn(
              'Ciclo ou parentId inconsistente na hierarquia de tarefas; exibindo como raiz.',
              'TasksView',
              { projectId: project.id, taskId: task.id, parentId: pid }
            );
          }
          tree.push(task);
        } else {
          taskMap.get(pid)!.children.push(task);
        }
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
  }, [listTasks, taskComparator, project.id]);

  const favoriteRoots = useMemo(() => taskTree.filter(t => t.isFavorite), [taskTree]);
  const otherRoots = useMemo(() => taskTree.filter(t => !t.isFavorite), [taskTree]);

  const favoriteSectionA11y = useMemo(
    () => buildTaskTreeSectionA11y(favoriteRoots),
    [favoriteRoots]
  );
  const otherSectionA11y = useMemo(() => buildTaskTreeSectionA11y(otherRoots), [otherRoots]);

  const groupedTasksEntries = useMemo((): [string, TaskWithChildren[]][] => {
    if (groupBy === 'none') return [];
    const map = new Map<string, TaskWithChildren[]>();
    filteredTasks.forEach(task => {
      const key =
        groupBy === 'status'
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
      entries.sort(
        (a, b) =>
          (order.indexOf(a[0]) === -1 ? 999 : order.indexOf(a[0])) -
          (order.indexOf(b[0]) === -1 ? 999 : order.indexOf(b[0]))
      );
    } else if (groupBy === 'priority') {
      const order = ['Urgente', 'Alta', 'Média', 'Baixa', 'Sem prioridade'];
      entries.sort(
        (a, b) =>
          (order.indexOf(a[0]) === -1 ? 999 : order.indexOf(a[0])) -
          (order.indexOf(b[0]) === -1 ? 999 : order.indexOf(b[0]))
      );
    }
    return entries;
  }, [filteredTasks, groupBy, statusOptions]);

  const groupedTasksEntriesWithA11y = useMemo(
    () =>
      groupedTasksEntries.map(
        ([label, tasks]) => [label, tasks, buildTaskTreeSectionA11y(tasks)] as const
      ),
    [groupedTasksEntries]
  );

  const backlogSprintGroupsWithA11y = useMemo(() => {
    if (!backlogOnly) return [];
    const groups = groupBacklogRootsBySprint(taskTree, taskComparator);
    return groups.map(group => {
      const tasksWithChildren = group.tasks as TaskWithChildren[];
      return [group, tasksWithChildren, buildTaskTreeSectionA11y(tasksWithChildren)] as const;
    });
  }, [backlogOnly, taskTree, taskComparator]);

  const handleToggleFavorite = useCallback(
    (taskId: string) => {
      const updatedTasks = (project.tasks || []).map(t =>
        t.id === taskId ? { ...t, isFavorite: !t.isFavorite } : t
      );
      onUpdateProject({ ...project, tasks: updatedTasks });
    },
    [project, onUpdateProject]
  );

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

  const totalTaskCount = listTasks.length;
  /** Listas grandes + stagger do Framer atrasam a UI ao filtrar; desliga animação de entrada acima do limite. */
  const reduceListMotion = listTasks.length > 42;
  const renderTaskTree = useCallback(
    (
      tasks: TaskWithChildren[],
      level: number,
      startIndex: number = 0,
      totalCount?: number,
      sectionA11yByTaskId?: Map<string, { posinset: number; setsize: number }>
    ): React.ReactElement[] => {
      const total = totalCount ?? totalTaskCount;
      const renderNode = (
        task: TaskWithChildren,
        taskLevel: number,
        indexInSiblings: number,
        siblingsStartGlobal: number
      ): React.ReactElement => {
        const globalIndex = siblingsStartGlobal + indexInSiblings;
        const a11y = sectionA11yByTaskId?.get(task.id);
        const posinset = a11y?.posinset ?? globalIndex + 1;
        const setsize = a11y?.setsize ?? total;
        return (
          <div key={task.id} role="listitem" aria-posinset={posinset} aria-setsize={setsize}>
            <JiraTaskItem
              task={task}
              isSelected={selectedTasks.has(task.id)}
              onToggleSelect={() => toggleTaskSelection(task.id)}
              onTestCaseStatusChange={(testCaseId, status) =>
                handleTestCaseStatusChange(task.id, testCaseId, status)
              }
              onTestCaseObservedResultChange={(testCaseId, value) =>
                handleTestCaseObservedResultChange(task.id, testCaseId, value)
              }
              onTestCaseExecutionKindChange={(testCaseId, kind) =>
                handleTestCaseExecutionKindChange(task.id, testCaseId, kind)
              }
              onTaskToolsChange={tools => handleTaskToolsChange(task.id, tools)}
              onStrategyExecutedChange={(strategyIndex, executed) =>
                handleStrategyExecutedChange(task.id, strategyIndex, executed)
              }
              onStrategyToolsChange={(strategyIndex, tools) =>
                handleStrategyToolsChange(task.id, strategyIndex, tools)
              }
              onGenerateStrategyHowToExecute={strategyIndex =>
                handleGenerateStrategyHowToExecute(task.id, strategyIndex)
              }
              generatingStrategyHowToExecuteIndex={
                generatingStrategyHowToKey?.startsWith(`${task.id}:`)
                  ? Number(generatingStrategyHowToKey.split(':')[1])
                  : null
              }
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
              onTaskStatusChange={status => handleTaskStatusChange(task.id, status)}
              onJiraStatusChange={(jiraStatusName, rollback) =>
                handleJiraStatusChange(task.id, jiraStatusName, rollback)
              }
              isTransitioningJiraStatus={transitioningStatusTaskId === task.id}
              level={taskLevel}
              onAddComment={content => handleAddComment(task.id, content)}
              onEditComment={(commentId, content) => handleEditComment(task.id, commentId, content)}
              onDeleteComment={commentId => handleDeleteComment(task.id, commentId)}
              onEditTestCase={handleOpenTestCaseEditor}
              onDeleteTestCase={handleDeleteTestCase}
              onDuplicateTestCase={handleDuplicateTestCase}
              project={project}
              onUpdateProject={onUpdateProject}
              onOpenModal={handleOpenTaskDetails}
              onToggleFavorite={() => handleToggleFavorite(task.id)}
              onDetailsOpenChange={onTaskDetailsOpenChange}
              devMode={isDevProject}
            >
              {task.children.length > 0 &&
                task.children.map((child, cidx) =>
                  renderNode(child, taskLevel + 1, cidx, globalIndex + 1)
                )}
            </JiraTaskItem>
          </div>
        );
      };
      return tasks.map((task, index) => renderNode(task, level, index, startIndex));
    },
    [
      totalTaskCount,
      selectedTasks,
      generatingTestsTaskId,
      generatingBddTaskId,
      generatingAllTaskId,
      syncingTaskId,
      transitioningStatusTaskId,
      updatingFromJiraTaskId,
      handleUpdateTaskFromJira,
      handleJiraStatusChange,
      handleTestCaseStatusChange,
      handleTestCaseObservedResultChange,
      handleTestCaseExecutionKindChange,
      handleTaskToolsChange,
      handleStrategyExecutedChange,
      handleStrategyToolsChange,
      handleGenerateStrategyHowToExecute,
      generatingStrategyHowToKey,
      handleDeleteTask,
      handleGenerateTests,
      openTaskFormForNew,
      openTaskFormForEdit,
      handleGenerateBddScenarios,
      handleGenerateAll,
      handleSyncTaskToJira,
      handleSaveBddScenario,
      handleDeleteBddScenario,
      handleTaskStatusChange,
      handleAddComment,
      handleEditComment,
      handleDeleteComment,
      handleOpenTestCaseEditor,
      handleDeleteTestCase,
      handleDuplicateTestCase,
      project,
      onUpdateProject,
      toggleTaskSelection,
      handleToggleFavorite,
      onTaskDetailsOpenChange,
      isDevProject,
    ]
  );

  const renderRootTaskList = useCallback(
    (
      roots: TaskWithChildren[],
      listAriaLabel: string,
      sectionA11yByTaskId: Map<string, { posinset: number; setsize: number }>
    ) => {
      if (shouldVirtualizeTaskRoots(roots.length)) {
        const renderRow = (task: TaskWithChildren) =>
          renderTaskTree([task], 0, 0, undefined, sectionA11yByTaskId)[0];
        return (
          <VirtualizedTaskRootList
            roots={roots}
            listAriaLabel={listAriaLabel}
            renderRootNode={renderRow}
            className={cn(
              tasksListPanelClass,
              'max-h-[min(72vh,880px)] overflow-y-auto overflow-x-hidden custom-scrollbar'
            )}
          />
        );
      }
      return (
        <div className={cn(tasksListPanelClass, 'space-y-1')} role="list" aria-label={listAriaLabel}>
          {renderTaskTree(roots, 0, 0, undefined, sectionA11yByTaskId).map((taskElement, index) =>
            reduceListMotion ? (
              <div key={taskElement.key ?? `row-${index}`}>{taskElement}</div>
            ) : (
              <motion.div
                key={taskElement.key ?? `row-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                {taskElement}
              </motion.div>
            )
          )}
        </div>
      );
    },
    [renderTaskTree, reduceListMotion]
  );

  const jiraProjectKey = project.settings?.jiraProjectKey;

  return (
    <>
      <div
        className={tasksViewPageShellClass}
        role="main"
        aria-label={
          backlogOnly
            ? isDevProject
              ? DEV_TASKS_COPY.backlogAriaLabel
              : 'Tarefas e testes — backlog do projeto'
            : isDevProject
              ? DEV_TASKS_COPY.pageAriaLabel
              : 'Tarefas e casos de teste do projeto'
        }
      >
        <div className={tasksViewContentClass}>
          <div className={tasksViewHeroShellClass}>
            <div className={tasksViewHeroChromeClass}>
              <TasksViewHeader
                jiraProjectKey={jiraProjectKey}
                onAddTask={() => openTaskFormForNew()}
                onOpenFilters={() => setIsFiltersModalOpen(true)}
                onAnalyze={handleProjectAiAnalysis}
                isRunningGeneralAnalysis={isRunningGeneralAnalysis}
                analysisProgress={analysisProgress}
                activeFiltersCount={activeFiltersCount}
                devMode={isDevProject}
              />

              {!backlogOnly ? (
                <section aria-label="Indicadores principais de tarefas">
                  <GlassIndicatorCards items={indicatorItems} columns={5} />
                </section>
              ) : null}
            </div>
          </div>

          <div className={tasksViewSectionHeaderClass}>
            <h2 className={tasksViewSectionLabelClass}>Explorar tarefas</h2>
            <p className={tasksViewSectionDescClass}>
              {isDevProject
                ? DEV_TASKS_COPY.exploreSectionDesc
                : 'Alterne entre todas as tarefas e o backlog, filtre por sprint e busque por ID ou título.'}
            </p>
          </div>

          <section className={tasksViewPanelClass} aria-label="Filtros e busca de tarefas">
            <TasksViewListModeToggle
              mode={listModeProp}
              onModeChange={onListModeChange ?? (() => undefined)}
              backlogCount={backlogTaskCount}
              totalCount={project.tasks.length}
              backlogSortBy={backlogSortBy}
              onBacklogSortChange={setBacklogSortBy}
              backlogSprintFilter={backlogSprintFilter}
              backlogSprintFilterOptions={backlogSprintFilterOptions}
              onBacklogSprintFilterChange={setBacklogSprintFilter}
              backlogItemFilter={backlogItemFilter}
              onBacklogItemFilterChange={setBacklogItemFilter}
              backlogTypeFilter={backlogTypeFilter}
              onBacklogTypeFilterChange={setBacklogTypeFilter}
              backlogPriorityFilter={backlogPriorityFilter}
              onBacklogPriorityFilterChange={setBacklogPriorityFilter}
              backlogStoryPointsFilter={backlogStoryPointsFilter}
              onBacklogStoryPointsFilterChange={setBacklogStoryPointsFilter}
              onClearBacklogSecondaryFilters={clearBacklogSecondaryFilters}
              disabled={isRunningGeneralAnalysis || !onListModeChange}
            />

            <div className={tasksViewPanelDividerClass}>
              <TasksViewSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchInputRef={searchInputRef}
              />
            </div>
          </section>

          <div className={tasksViewSectionHeaderFollowClass}>
            <h2 className={tasksViewSectionLabelClass}>Lista de tarefas</h2>
            <p className={tasksViewSectionDescClass}>
              {listModeProp === 'backlog'
                ? 'Itens do backlog ordenados por prioridade e sprint.'
                : isDevProject
                  ? DEV_TASKS_COPY.listSectionDesc
                  : 'Todas as tarefas do projeto com filtros, agrupamento e ações em lote.'}
            </p>
          </div>

          <section className={tasksViewListPanelClass} aria-label="Lista de tarefas">
            <div className="flex flex-col gap-3 sm:gap-4">
          <Modal
            isOpen={isFiltersModalOpen}
            onClose={() => setIsFiltersModalOpen(false)}
            title="Filtros"
            size="6xl"
            panelClassName={tasksPanelNeuModalPanelClass}
            titleClassName={tasksPanelNeuModalTitleClass}
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
              testCaseExecutionStatusFilter={testCaseExecutionStatusFilter}
              setTestCaseExecutionStatusFilter={setTestCaseExecutionStatusFilter}
              qualityFilter={qualityFilter}
              setQualityFilter={setQualityFilter}
              activeFiltersCount={activeFiltersCount}
              onClearAll={() => {
                clearAllFilters();
                setIsFiltersModalOpen(false);
              }}
              projectId={project.id}
              sortBy={sortBy}
              groupBy={groupBy}
              onLoadPreset={preset => {
                setSearchQuery('');
                setStatusFilter(preset.filters.statusFilter);
                setPriorityFilter(preset.filters.priorityFilter);
                setTypeFilter(preset.filters.typeFilter);
                if (!isDevProject) {
                  setTestStatusFilter(preset.filters.testStatusFilter);
                  setTestCaseExecutionStatusFilter(
                    preset.filters.testCaseExecutionStatusFilter ?? []
                  );
                }
                setBugSeverityFilter([]);
                setBugModuleFilter([]);
                setQualityFilter(preset.filters.qualityFilter);
                setSortBy(preset.filters.sortBy);
                setGroupBy(preset.filters.groupBy);
                setIsFiltersModalOpen(false);
              }}
              devMode={isDevProject}
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
            testCaseExecutionStatusFilter={testCaseExecutionStatusFilter}
            setTestCaseExecutionStatusFilter={setTestCaseExecutionStatusFilter}
            bugSeverityFilter={bugSeverityFilter}
            setBugSeverityFilter={setBugSeverityFilter}
            bugModuleFilter={bugModuleFilter}
            setBugModuleFilter={setBugModuleFilter}
            qualityFilter={qualityFilter}
            setQualityFilter={setQualityFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFiltersCount={activeFiltersCount}
            clearAllFilters={clearAllFilters}
            onClearAndCloseFilters={() => {
              clearAllFilters();
              if (backlogOnly) clearAllBacklogFilters();
              setIsFiltersModalOpen(false);
            }}
            filteredCount={listTasks.length}
            totalCount={filterScopeProject.tasks.length}
            hasActiveFiltersOrSearch={
              activeFiltersCount > 0 || (backlogOnly && hasBacklogToolbarFiltersActive)
            }
            devMode={isDevProject}
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
                      onProjectCreated={projectId => {
                        const { selectProject } = useProjectsStore.getState();
                        selectProject(projectId);
                      }}
                      onEditTask={taskId => {
                        const task = project.tasks.find(t => t.id === taskId);
                        if (task) openTaskFormForEdit(task);
                        setSelectedTasks(new Set());
                      }}
                    />
                    <button
                      onClick={() => setIsLinkModalOpen(true)}
                      className={cn(leveViewOutlineBtnClass, 'btn-sm flex items-center gap-1.5 min-h-[44px] px-4')}
                    >
                      <LinkIcon className="w-4 h-4" />
                      Vincular a Projeto
                    </button>
                  </div>
                )}
                {(generatingTestsTaskId || generatingBddTaskId) && !isDevProject && (
                  <div className="flex items-center gap-2 rounded-field border border-primary/40 bg-primary/10 p-4 text-sm text-base-content">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
                    {generatingTestsTaskId && (
                      <span>
                        Gerando casos de teste para{' '}
                        <strong>
                          {project?.tasks?.find(t => t.id === generatingTestsTaskId)?.title ??
                            generatingTestsTaskId}
                        </strong>
                        ...
                      </span>
                    )}
                    {generatingBddTaskId && (
                      <span>
                        Gerando cenários BDD para{' '}
                        <strong>
                          {project?.tasks?.find(t => t.id === generatingBddTaskId)?.title ??
                            generatingBddTaskId}
                        </strong>
                        ...
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
                panelClassName={tasksPanelNeuModalPanelClass}
                titleClassName={tasksPanelNeuModalTitleClass}
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
                  <p className="task-card-muted text-sm">
                    Selecione os projetos para onde deseja vincular as {selectedTasks.size}{' '}
                    tarefa(s) selecionada(s). As tarefas serão adicionadas aos projetos selecionados
                    e manterão sincronia de conteúdo.
                  </p>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar app-panel p-2">
                    {allProjects
                      .filter(p => p.id !== project.id)
                      .map(p => (
                        <label
                          key={p.id}
                          className="app-menu-item flex cursor-pointer items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-highlight"
                            checked={selectedTargetProjects.has(p.id)}
                            onChange={e => {
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
                      <p className="text-sm task-card-muted text-center py-4">
                        Nenhum outro projeto disponível.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full flex items-center gap-1.5"
                      onClick={() => setIsLinkModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-full px-5 shadow-sm transition-all active:scale-95"
                      onClick={handleLinkTasks}
                      disabled={selectedTargetProjects.size === 0}
                    >
                      Vincular
                    </Button>
                  </div>
                </div>
              </Modal>

              {taskTree.length > 0 ? (
                <BacklogListSurface
                  enabled={backlogOnly}
                  itemCount={listTasks.length}
                  scopeLabel={backlogScopeLabel}
                >
                <div className="space-y-6">
                  <div className={tasksPanelToolbarShellClass}>
                    <button
                      type="button"
                      onClick={() => setShowExportTasksModal(true)}
                      className={tasksPanelToolbarExportBtnClass}
                      aria-label={`Exportar lista visível (${listTasks.length} tarefas)`}
                    >
                      <Download className="h-4 w-4 shrink-0" aria-hidden />
                      Exportar lista
                      {listTasks.length !== project.tasks.length
                        ? ` (${listTasks.length})`
                        : ''}
                    </button>
                    {!backlogOnly && (
                      <div className={cn(tasksPanelToolbarFieldClass, 'max-md:hidden')}>
                        <label htmlFor="tasks-sort-by" className={tasksPanelToolbarLabelClass}>
                          Ordenar
                        </label>
                        <AppSelect
                          id="tasks-sort-by"
                          value={sortBy}
                          onChange={v => setSortBy(v as TaskSortBy)}
                          className={tasksPanelToolbarSelectClass}
                          aria-label="Ordenação da lista de tarefas"
                        >
                          <option value="id">ID</option>
                          <option value="status">Status</option>
                          <option value="priority">Prioridade</option>
                          <option value="createdAt">Data de criação</option>
                          <option value="updatedAt">Data de atualização</option>
                          <option value="title">Título</option>
                        </AppSelect>
                      </div>
                    )}
                    {!backlogOnly && (
                      <div className={cn(tasksPanelToolbarFieldClass, 'max-md:hidden')}>
                        <label htmlFor="tasks-group-by" className={tasksPanelToolbarLabelClass}>
                          Agrupar
                        </label>
                        <AppSelect
                          id="tasks-group-by"
                          value={groupBy}
                          onChange={v => setGroupBy(v as TaskGroupBy)}
                          className={tasksPanelToolbarSelectClass}
                          aria-label="Agrupar lista de tarefas por"
                        >
                          <option value="none">Nenhum</option>
                          <option value="status">Status</option>
                          <option value="priority">Prioridade</option>
                          <option value="type">Tipo</option>
                        </AppSelect>
                      </div>
                    )}
                    {!onOpenTaskTab && !backlogOnly && (
                      <div className="md:hidden">
                        <TasksViewSortGroupMobile
                          sortBy={sortBy}
                          onSortChange={v => setSortBy(v as TaskSortBy)}
                          groupBy={groupBy}
                          onGroupChange={v => setGroupBy(v as TaskGroupBy)}
                        />
                      </div>
                    )}
                  </div>
                  {backlogOnly && backlogSprintGroupsWithA11y.length > 0 ? (
                    <div className="space-y-6">
                      {backlogSprintGroupsWithA11y.map(([group, tasksInGroup, groupA11y]) => (
                        <section key={group.key} aria-label={`Sprint: ${group.label}`}>
                          <h3 className={tasksPanelBacklogSprintHeadingClass(group.isActive)}>
                            <Layers
                              className={cn(
                                'h-4 w-4 shrink-0',
                                group.isActive ? 'text-[#d85414]' : 'text-[#777777]'
                              )}
                              aria-hidden
                            />
                            {group.label}
                            <span className={tasksPanelBacklogSprintCountClass}>
                              ({countTasksInBacklogTree(tasksInGroup)})
                            </span>
                            {group.isActive ? (
                              <span className={tasksPanelBacklogSprintActiveBadgeClass}>Ativa</span>
                            ) : null}
                          </h3>
                          {renderRootTaskList(
                            tasksInGroup,
                            `Backlog — ${group.label}`,
                            groupA11y
                          )}
                        </section>
                      ))}
                    </div>
                  ) : groupBy !== 'none' && groupedTasksEntriesWithA11y.length > 0 ? (
                    <div className="space-y-6">
                      {groupedTasksEntriesWithA11y.map(([groupLabel, tasksInGroup, groupA11y]) => (
                        <section key={groupLabel} aria-label={`Grupo: ${groupLabel}`}>
                          <h3 className="mb-3 flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-wider text-base-content/72">
                            <List className="w-4 h-4" aria-hidden />
                            {groupLabel}
                          </h3>
                          {renderRootTaskList(
                            tasksInGroup,
                            `Lista de tarefas — ${groupLabel}`,
                            groupA11y
                          )}
                        </section>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {favoriteRoots.length > 0 && (
                        <TaskListCollapsibleSection
                          sectionId={`tasks-favorites-${project.id}`}
                          title="Favoritos"
                          icon={
                            <Star
                              className="h-4 w-4 shrink-0 fill-primary text-primary"
                              aria-hidden
                            />
                          }
                          count={countTasksInBacklogTree(favoriteRoots)}
                          isOpen={favoritesSectionOpen}
                          onToggle={() => setFavoritesSectionOpen(prev => !prev)}
                          titleClassName={tasksPanelSectionTitleClass}
                        >
                          {renderRootTaskList(
                            favoriteRoots,
                            'Lista de tarefas favoritas',
                            favoriteSectionA11y
                          )}
                        </TaskListCollapsibleSection>
                      )}
                      {otherRoots.length > 0 && (
                        <TaskListCollapsibleSection
                          sectionId={`tasks-other-${project.id}`}
                          title="Outras Tarefas"
                          icon={
                            <List className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                          }
                          count={countTasksInBacklogTree(otherRoots)}
                          isOpen={otherTasksSectionOpen}
                          onToggle={() => setOtherTasksSectionOpen(prev => !prev)}
                          titleClassName={tasksPanelSectionTitleClass}
                        >
                          {renderRootTaskList(
                            otherRoots,
                            'Lista de outras tarefas',
                            otherSectionA11y
                          )}
                        </TaskListCollapsibleSection>
                      )}
                    </div>
                  )}
                </div>
                </BacklogListSurface>
              ) : listTasks.length === 0 && project.tasks.length > 0 ? (
                <EmptyState
                  icon={<Search className="mx-auto h-12 w-12 text-base-content/72" aria-hidden />}
                  title="Nenhuma tarefa corresponde aos filtros"
                  description="Ajuste os filtros ou a busca para ver mais tarefas."
                  action={{
                    label: 'Limpar filtros',
                    onClick: () => {
                      clearAllFilters();
                      if (backlogOnly) clearAllBacklogFilters();
                      setIsFiltersModalOpen(false);
                    },
                    variant: 'primary',
                  }}
                />
              ) : (
                <EmptyState
                  icon={
                    <ClipboardList className="mx-auto h-12 w-12 text-base-content/72" aria-hidden />
                  }
                  title="Nenhuma tarefa criada ainda"
                  description={
                    isDevProject
                      ? 'Comece criando sua primeira tarefa para organizar o backlog de implementação.'
                      : 'Comece criando sua primeira tarefa para organizar seu trabalho de QA.'
                  }
                  action={{
                    label: 'Adicionar Tarefa',
                    onClick: () => openTaskFormForNew(),
                    variant: 'primary',
                  }}
                />
              )}
            </div>
          </TasksViewList>
          </div>
        </section>
        </div>
      </div>

      <FileExportModal
        isOpen={showExportTasksModal}
        onClose={() => setShowExportTasksModal(false)}
        exportType="tasks"
        project={project}
        tasks={listTasks}
        devMode={isDevProject}
      />

      {!isDevProject ? (
        <Modal
          isOpen={failModalState.isOpen}
          onClose={() => setFailModalState({ ...failModalState, isOpen: false })}
          title="Registrar Falha no Teste"
          size="xl"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="observed-result"
                className="task-card-muted block text-sm font-medium mb-1"
              >
                Resultado Obtido (O que aconteceu de errado?)
              </label>
              <textarea
                id="observed-result"
                value={failModalState.observedResult}
                onChange={e =>
                  setFailModalState({ ...failModalState, observedResult: e.target.value })
                }
                rows={4}
                className="textarea textarea-bordered w-full"
              ></textarea>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="create-bug-task"
                type="checkbox"
                checked={failModalState.createBug}
                onChange={e => setFailModalState({ ...failModalState, createBug: e.target.checked })}
                className="checkbox checkbox-highlight"
              />
              <label htmlFor="create-bug-task" className="block text-sm text-base-content">
                Criar tarefa de Bug automaticamente
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setFailModalState({ ...failModalState, isOpen: false })}
                className={cn(leveViewOutlineBtnClass, 'btn-sm flex items-center gap-1.5')}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmFail}
                className="btn btn-error btn-sm rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                Confirmar Reprovação
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {!isDevProject && testCaseEditorRef ? (
        <TestCaseEditorModal
          testCase={testCaseEditorRef.testCase}
          isOpen={!!testCaseEditorRef}
          onClose={() => setTestCaseEditorRef(null)}
          onSave={updated => handleSaveTestCase(testCaseEditorRef.taskId, updated)}
          onDelete={() =>
            handleDeleteTestCase(testCaseEditorRef.taskId, testCaseEditorRef.testCase.id)
          }
        />
      ) : null}

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
      {modalTask && taskForModal && !onOpenTaskTab && (
        <TaskDetailsModal
          task={taskForModal}
          isOpen={!!modalTask}
          onClose={() => setModalTask(null)}
          onTestCaseStatusChange={(testCaseId, status) =>
            handleTestCaseStatusChange(modalTask.id, testCaseId, status)
          }
          onTestCaseObservedResultChange={(testCaseId, value) =>
            handleTestCaseObservedResultChange(modalTask.id, testCaseId, value)
          }
          onTestCaseExecutionKindChange={(testCaseId, kind) =>
            handleTestCaseExecutionKindChange(modalTask.id, testCaseId, kind)
          }
          onTaskToolsChange={tools => handleTaskToolsChange(modalTask.id, tools)}
          onStrategyExecutedChange={(strategyIndex, executed) =>
            handleStrategyExecutedChange(modalTask.id, strategyIndex, executed)
          }
          onStrategyToolsChange={(strategyIndex, tools) =>
            handleStrategyToolsChange(modalTask.id, strategyIndex, tools)
          }
          onGenerateStrategyHowToExecute={strategyIndex =>
            handleGenerateStrategyHowToExecute(modalTask.id, strategyIndex)
          }
          generatingStrategyHowToExecuteIndex={
            generatingStrategyHowToKey?.startsWith(`${modalTask.id}:`)
              ? Number(generatingStrategyHowToKey.split(':')[1])
              : null
          }
          onGenerateTests={handleGenerateTests}
          isGenerating={generatingTestsTaskId === modalTask.id}
          onGenerateBddScenarios={handleGenerateBddScenarios}
          isGeneratingBdd={generatingBddTaskId === modalTask.id}
          onGenerateAll={handleGenerateAll}
          isGeneratingAll={generatingAllTaskId === modalTask.id}
          onSaveBddScenario={handleSaveBddScenario}
          onDeleteBddScenario={handleDeleteBddScenario}
          onAddComment={content => handleAddComment(modalTask.id, content)}
          onEditComment={(commentId, content) =>
            handleEditComment(modalTask.id, commentId, content)
          }
          onDeleteComment={commentId => handleDeleteComment(modalTask.id, commentId)}
          onEditTestCase={handleOpenTestCaseEditor}
          onDeleteTestCase={handleDeleteTestCase}
          onDuplicateTestCase={handleDuplicateTestCase}
          project={project}
          onUpdateProject={onUpdateProject}
          onNavigateToTab={onNavigateToTab}
          onOpenTask={handleOpenTaskDetails}
          onUpdateFromJira={handleUpdateTaskFromJira}
          isUpdatingFromJira={modalTask ? updatingFromJiraTaskId === modalTask.id : false}
          devMode={isDevProject}
          onGenerateDevGuidance={isDevProject ? handleGenerateDevGuidance : undefined}
          isGeneratingDevGuidance={
            modalTask ? generatingDevGuidanceTaskId === modalTask.id : false
          }
        />
      )}
    </>
  );
};

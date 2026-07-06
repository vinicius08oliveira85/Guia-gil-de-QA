import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Filter, Inbox, List, Loader2, RefreshCw, Search, X } from 'lucide-react';
import {
  getJiraConfig,
  getJiraProjects,
  getJiraIssuesByKeysBulk,
  getJiraStatuses,
  getJiraQueuesForProject,
  transitionJiraIssueToStatus,
  type JiraProject,
  type JiraQueue,
} from '../../services/jiraService';
import { enrichTasksWithJiraSlas } from '../../services/jira/sla';
import { enrichTasksWithJsmSummary } from '../../services/jira/jsmRequest';
import { importFilasRelatedIssues } from '../../services/jira/filasRelatedIssues';
import { syncFilasQueuesFromJira } from '../../services/jira/filasQueueSync';
import { isJiraAutoSyncRunning } from '../../services/jira/jiraAutoSync';
import { jiraIssueToTask } from '../../services/jira/issueToTask';
import { buildJiraSprintSyncContext } from '../../services/jira/sprintSync';
import { mapJiraStatusToTaskStatus } from '../../services/jira/mappers';
import type { JiraTask, Project } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTaskTrackingHeaderStore } from '../../store/taskTrackingHeaderStore';
import { isValidJiraKey } from '../../utils/jiraFieldMapper';
import {
  classifyTaskSla,
  getJiraFilasFilterLabel,
  isJiraFilasFilterActive,
  matchesJiraFilasFilter,
  type JiraFilasFilter,
} from '../../utils/jiraFilasMetrics';
import { normalizeTasksParentIdsAcyclic } from '../../utils/taskParentCycle';
import { logger } from '../../utils/logger';
import { cn } from '../../utils/cn';
import { Spinner } from '../common/Spinner';
import { AppSelect } from '../common/AppSelect';
import { FileExportModal } from '../common/FileExportModal';
import { JiraFilasTaskList } from './JiraFilasTaskList';
import { JiraFilasImportSelector } from './JiraFilasImportSelector';
import { Modal } from '../common/Modal';
import { resolveQueueIdsFromFilasSelection, getJiraQueueStatusLabels } from '../../utils/jiraQueueTree';
import {
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
  tasksPanelToolbarExportBtnClass,
  tasksPanelToolbarFieldClass,
  tasksPanelToolbarLabelClass,
  tasksPanelToolbarSelectClass,
  tasksPanelToolbarShellClass,
} from '../tasks/tasksPanelNeuStyles';
import {
  getTaskComparator,
  type TaskGroupBy,
  type TaskSortBy,
} from '../tasks/tasksViewHelpers';
import {
  JiraFilasFiltersModalContent,
  SLA_FILTER_OPTIONS,
  EMPTY_JIRA_FILAS_FILTERS,
  countActiveJiraFilasFilters,
  getTaskAssigneeLabel,
  getTaskStatusLabel,
  type JiraFilasLocalFilters,
} from './JiraFilasFiltersModalContent';
import {
  readJiraFilasLocalFilters,
  writeJiraFilasLocalFilters,
} from '../../utils/jiraFilasLocalFiltersStorage';
import {
  jiraSolusEyebrowClass,
  jiraSolusHeroChromeClass,
  jiraSolusHeroJiraBadgeClass,
  jiraSolusHeroShellClass,
  jiraSolusHeroSubtitleClass,
  jiraSolusHeroTitleClass,
  jiraSolusSectionDescClass,
  jiraSolusSectionHeaderClass,
  jiraSolusSectionLabelClass,
} from './jiraSolusViewNeuUi';
import {
  jiraSolusFieldClass,
  jiraSolusFieldLabelClass,
  jiraSolusInnerPanelClass,
  jiraSolusInputClass,
  jiraSolusListShellClass,
  jiraSolusPrimaryBtnClass,
  jiraSolusSearchInputClass,
  jiraSolusSearchWrapClass,
  jiraSolusSecondaryBtnClass,
  jiraSolusToolbarClass,
} from './jiraSolusNeuUi';
import {
  jiraIntegrationImportProgressPanelClass,
  jiraIntegrationProgressFillClass,
  jiraIntegrationProgressTrackClass,
} from '../jira/jiraIntegrationUi';

import {
  readFilasImportSelection,
  writeFilasImportSelection,
} from '../../services/taskTrackingStorage';

export interface JiraFilasWorkspaceBridge {
  filasProject: Project;
  onUpdateProject: (project: Project) => void;
  onUpdateFromJira?: (taskId: string) => Promise<void>;
  isUpdatingFromJira: string | null;
}

export interface JiraFilasPanelProps {
  tasks: JiraTask[];
  setTasks: React.Dispatch<React.SetStateAction<JiraTask[]>>;
  selectedProjectKey: string;
  setSelectedProjectKey: (key: string) => void;
  jiraStatuses: Array<{ name: string; color: string }>;
  setJiraStatuses: React.Dispatch<React.SetStateAction<Array<{ name: string; color: string }>>>;
  activeFilter: JiraFilasFilter;
  onClearFilter: () => void;
  slaRiskWindowHours: number;
  onOpenTaskTab?: (task: JiraTask) => void;
  onWorkspaceBridgeChange?: (bridge: JiraFilasWorkspaceBridge | null) => void;
}

/**
 * Painel Filas (Jira) — importação por projeto ou ID e lista com cards de tarefa.
 * O estado de tarefas/projeto/status é controlado pela tela pai (compartilhado com o Dashboard).
 */
export const JiraFilasPanel: React.FC<JiraFilasPanelProps> = ({
  tasks,
  setTasks,
  selectedProjectKey,
  setSelectedProjectKey,
  jiraStatuses,
  setJiraStatuses,
  activeFilter,
  onClearFilter,
  slaRiskWindowHours,
  onOpenTaskTab,
  onWorkspaceBridgeChange,
}) => {
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();

  const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
  const [jiraQueues, setJiraQueues] = useState<JiraQueue[]>([]);
  const storedImportSelection = useMemo(() => readFilasImportSelection(), []);
  const [selectedProjectKeys, setSelectedProjectKeys] = useState<string[]>(() => {
    if (storedImportSelection?.projectKeys?.length) {
      return storedImportSelection.projectKeys;
    }
    return selectedProjectKey ? [selectedProjectKey] : [];
  });
  const [selectedQueueCategories, setSelectedQueueCategories] = useState<string[]>(
    () => storedImportSelection?.queueCategories ?? []
  );
  const [selectedQueueStatuses, setSelectedQueueStatuses] = useState<string[]>(
    () => storedImportSelection?.queueStatuses ?? []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [issueKeyInput, setIssueKeyInput] = useState('');
  const [localFilters, setLocalFilters] = useState<JiraFilasLocalFilters>(() =>
    readJiraFilasLocalFilters()
  );
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [showExportTasksModal, setShowExportTasksModal] = useState(false);
  const [sortBy, setSortBy] = useLocalStorage<TaskSortBy>('jira-filas-sort-by', 'id');
  const [groupBy, setGroupBy] = useLocalStorage<TaskGroupBy>('jira-filas-group-by', 'none');

  useEffect(() => {
    writeJiraFilasLocalFilters(localFilters);
  }, [localFilters]);

  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingQueues, setIsLoadingQueues] = useState(false);
  const [isImportingProject, setIsImportingProject] = useState(false);
  const [isUpdatingQueue, setIsUpdatingQueue] = useState(false);
  const [isImportingIssue, setIsImportingIssue] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total?: number } | null>(
    null
  );
  const [updatingFromJiraId, setUpdatingFromJiraId] = useState<string | null>(null);
  const [transitioningStatusId, setTransitioningStatusId] = useState<string | null>(null);

  const sprintCtxRef = useRef<Awaited<ReturnType<typeof buildJiraSprintSyncContext>> | null>(null);

  useEffect(() => {
    const config = getJiraConfig();
    if (!config) return;

    let cancelled = false;
    setIsLoadingProjects(true);
    getJiraProjects(config)
      .then(projects => {
        if (!cancelled) setJiraProjects(projects);
      })
      .catch(err => handleError(err, 'Carregar projetos Jira'))
      .finally(() => {
        if (!cancelled) setIsLoadingProjects(false);
      });

    return () => {
      cancelled = true;
    };
  }, [handleError]);

  useEffect(() => {
    const config = getJiraConfig();
    if (!config || selectedProjectKeys.length === 0) {
      setJiraStatuses([]);
      return;
    }

    let cancelled = false;
    const primaryKey = selectedProjectKeys[0];
    getJiraStatuses(config, primaryKey)
      .then(statuses => {
        if (!cancelled) setJiraStatuses(statuses);
      })
      .catch(() => {
        if (!cancelled) setJiraStatuses([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProjectKeys, setJiraStatuses]);

  useEffect(() => {
    setSelectedProjectKey(selectedProjectKeys[0] ?? '');
  }, [selectedProjectKeys, setSelectedProjectKey]);

  useEffect(() => {
    const config = getJiraConfig();
    if (!config || selectedProjectKeys.length === 0) {
      setJiraQueues([]);
      return;
    }

    let cancelled = false;
    setIsLoadingQueues(true);

    Promise.all(
      selectedProjectKeys.map(projectKey =>
        getJiraQueuesForProject(config, projectKey).then(queues => ({ projectKey, queues }))
      )
    )
      .then(results => {
        if (cancelled) return;
        const merged = results.flatMap(({ queues }) => queues);
        const uniqueById = new Map<string, JiraQueue>();
        for (const queue of merged) {
          uniqueById.set(queue.id, queue);
        }
        setJiraQueues(Array.from(uniqueById.values()));
      })
      .catch(err => {
        if (!cancelled) {
          setJiraQueues([]);
          handleError(err, 'Carregar filas do Jira');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingQueues(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProjectKeys, handleError]);

  const handleProjectKeysChange = useCallback((keys: string[]) => {
    setSelectedProjectKeys(keys);
    setSelectedQueueCategories([]);
    setSelectedQueueStatuses([]);
  }, []);

  const handleQueueCategoriesChange = useCallback(
    (categories: string[]) => {
      setSelectedQueueCategories(categories);
      setSelectedQueueStatuses(prev => {
        if (categories.length === 0) return [];
        const allowed = new Set(getJiraQueueStatusLabels(jiraQueues, categories));
        return prev.filter(status => allowed.has(status));
      });
    },
    [jiraQueues]
  );

  const resolvedQueueIds = useMemo(
    () => resolveQueueIdsFromFilasSelection(jiraQueues, selectedQueueCategories, selectedQueueStatuses),
    [jiraQueues, selectedQueueCategories, selectedQueueStatuses]
  );

  const selectedQueues = useMemo(() => {
    const idSet = new Set(resolvedQueueIds);
    return jiraQueues.filter(queue => idSet.has(queue.id));
  }, [jiraQueues, resolvedQueueIds]);

  useEffect(() => {
    writeFilasImportSelection({
      projectKeys: selectedProjectKeys,
      queueCategories: selectedQueueCategories,
      queueStatuses: selectedQueueStatuses,
      queueIds: resolvedQueueIds,
    });
  }, [selectedProjectKeys, selectedQueueCategories, selectedQueueStatuses, resolvedQueueIds]);

  const filasProject = useMemo(
    (): Project => ({
      id: 'jira-filas',
      name: 'Filas Jira',
      description: '',
      documents: [],
      businessRules: [],
      tasks,
      phases: [],
      tags: [],
      settings: {
        jiraProjectKey: selectedProjectKey || undefined,
        jiraStatuses,
      },
    }),
    [tasks, selectedProjectKey, jiraStatuses]
  );

  const activeLocalFiltersCount = useMemo(
    () => countActiveJiraFilasFilters(localFilters),
    [localFilters]
  );

  const matchesLocalFilters = useCallback(
    (task: JiraTask): boolean => {
      if (localFilters.statuses.length > 0 && !localFilters.statuses.includes(getTaskStatusLabel(task))) {
        return false;
      }
      if (
        localFilters.slaBuckets.length > 0 &&
        !localFilters.slaBuckets.includes(classifyTaskSla(task, Date.now(), slaRiskWindowHours))
      ) {
        return false;
      }
      if (localFilters.types.length > 0 && !localFilters.types.includes(task.type)) {
        return false;
      }
      if (
        localFilters.assignees.length > 0 &&
        !localFilters.assignees.includes(getTaskAssigneeLabel(task))
      ) {
        return false;
      }
      return true;
    },
    [localFilters, slaRiskWindowHours]
  );

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter(t => {
      if (!matchesJiraFilasFilter(t, activeFilter, Date.now(), slaRiskWindowHours)) return false;
      if (!matchesLocalFilters(t)) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (!!t.description && t.description.toLowerCase().includes(q))
      );
    });
  }, [tasks, searchQuery, activeFilter, slaRiskWindowHours, matchesLocalFilters]);

  const taskComparator = useMemo(() => getTaskComparator(sortBy), [sortBy]);

  const sortedTasks = useMemo(
    () => [...filteredTasks].sort(taskComparator),
    [filteredTasks, taskComparator]
  );

  const groupedTasksEntries = useMemo((): [string, JiraTask[]][] => {
    if (groupBy === 'none') return [];
    const map = new Map<string, JiraTask[]>();
    for (const task of sortedTasks) {
      const key =
        groupBy === 'status'
          ? getTaskStatusLabel(task)
          : groupBy === 'priority'
            ? (task.priority ?? 'Sem prioridade')
            : task.type;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    const entries = Array.from(map.entries());
    if (groupBy === 'status') {
      const order = jiraStatuses.map(status => status.name);
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
    } else {
      entries.sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
    }
    return entries;
  }, [sortedTasks, groupBy, jiraStatuses]);

  const filterOptions = useMemo(() => {
    const statuses = new Set<string>();
    const types = new Set<string>();
    const assignees = new Set<string>();
    for (const task of tasks) {
      statuses.add(getTaskStatusLabel(task));
      types.add(task.type);
      assignees.add(getTaskAssigneeLabel(task));
    }
    const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
    return {
      statuses: Array.from(statuses).sort(sortPt),
      types: Array.from(types).sort(sortPt),
      assignees: Array.from(assignees).sort(sortPt),
    };
  }, [tasks]);

  const filterCounts = useMemo(
    () => ({
      status: (value: string) => tasks.filter(t => getTaskStatusLabel(t) === value).length,
      sla: (value: (typeof SLA_FILTER_OPTIONS)[number]['value']) =>
        tasks.filter(t => classifyTaskSla(t, Date.now(), slaRiskWindowHours) === value).length,
      type: (value: string) => tasks.filter(t => t.type === value).length,
      assignee: (value: string) => tasks.filter(t => getTaskAssigneeLabel(t) === value).length,
    }),
    [tasks, slaRiskWindowHours]
  );

  const mergeImportedTasks = useCallback((imported: JiraTask[]) => {
    setTasks(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      imported.forEach(t => map.set(t.id, t));
      return normalizeTasksParentIdsAcyclic(Array.from(map.values()));
    });
  }, [setTasks]);

  const enrichFilasTasks = useCallback(
    async (
      config: NonNullable<ReturnType<typeof getJiraConfig>>,
      imported: JiraTask[],
      onProgress?: (current: number, total?: number) => void
    ) => {
      const withSlas = await enrichTasksWithJiraSlas(config, imported, {
        onProgress: (done, total) => onProgress?.(done, total),
      });
      return enrichTasksWithJsmSummary(config, withSlas, {
        onProgress: (done, total) => onProgress?.(done, total),
      });
    },
    []
  );

  const handleImportQueue = useCallback(async () => {
    const config = getJiraConfig();
    if (!config) {
      handleWarning('Configure o Jira em Configurações antes de importar.');
      return;
    }
    if (selectedProjectKeys.length === 0) {
      handleWarning('Selecione ao menos um projeto Jira.');
      return;
    }
    if (selectedQueues.length === 0) {
      handleWarning('Selecione fila e status antes de importar.');
      return;
    }
    if (isJiraAutoSyncRunning()) {
      handleWarning('Aguarde a sincronização automática em andamento.');
      return;
    }

    setIsImportingProject(true);
    setImportProgress({ current: 0 });
    try {
      const result = await syncFilasQueuesFromJira((current, total) =>
        setImportProgress({ current, total })
      );
      if (!result) {
        handleWarning('Não foi possível importar com a seleção atual de projeto, fila e status.');
        return;
      }

      const queueLabel =
        result.queueCount === 1
          ? `"${selectedQueues[0].name}"`
          : `${result.queueCount} filas`;
      handleSuccess(
        result.tasks.length === 1
          ? `1 tarefa importada da fila ${queueLabel}.`
          : `${result.tasks.length} tarefas importadas de ${queueLabel}.`
      );
    } catch (err) {
      handleError(err, 'Importar filas do Jira');
    } finally {
      setIsImportingProject(false);
      setImportProgress(null);
    }
  }, [
    selectedProjectKeys,
    selectedQueues,
    handleError,
    handleSuccess,
    handleWarning,
  ]);

  /**
   * Atualiza as tarefas conforme a seleção atual (projeto, fila e status) reimportando
   * do Jira. Se a seleção estiver incompleta, atualiza individualmente as já importadas.
   */
  const handleUpdateQueueFromJira = useCallback(async () => {
    const config = getJiraConfig();
    if (!config) {
      handleWarning('Configure o Jira em Configurações antes de atualizar.');
      return;
    }

    const canSyncFromSelection =
      selectedProjectKeys.length > 0 &&
      selectedQueueCategories.length > 0 &&
      selectedQueueStatuses.length > 0 &&
      selectedQueues.length > 0;

    if (canSyncFromSelection) {
      if (isJiraAutoSyncRunning()) {
        handleWarning('Aguarde a sincronização automática em andamento.');
        return;
      }

      setIsUpdatingQueue(true);
      setImportProgress({ current: 0 });
      try {
        const result = await syncFilasQueuesFromJira((current, total) =>
          setImportProgress({ current, total })
        );
        if (!result) {
          handleWarning('Não foi possível atualizar com a seleção atual de projeto, fila e status.');
          return;
        }

        const queueLabel =
          result.queueCount === 1
            ? `"${selectedQueues[0].name}"`
            : `${result.queueCount} filas`;
        handleSuccess(
          result.tasks.length === 1
            ? `1 tarefa atualizada da fila ${queueLabel}.`
            : `${result.tasks.length} tarefas atualizadas de ${queueLabel}.`
        );
      } catch (err) {
        handleError(err, 'Atualizar filas do Jira');
      } finally {
        setIsUpdatingQueue(false);
        setImportProgress(null);
      }
      return;
    }

    if (tasks.length === 0) {
      handleWarning('Selecione projeto, fila e status antes de atualizar do Jira.');
      return;
    }

    const importedTasks = [...tasks];
    setIsUpdatingQueue(true);
    setImportProgress({ current: 0, total: importedTasks.length });
    try {
      if (!sprintCtxRef.current && selectedProjectKey) {
        sprintCtxRef.current = await buildJiraSprintSyncContext(config, selectedProjectKey);
      }

      let processed = 0;
      const updated: JiraTask[] = [];
      const failures: string[] = [];

      const taskIds = importedTasks.map(t => t.id);
      const issues = await getJiraIssuesByKeysBulk(config, taskIds, (current, total) =>
        setImportProgress({ current, total })
      );
      const issueByKey = new Map(
        issues.filter(issue => issue.key).map(issue => [issue.key!, issue])
      );

      for (const existing of importedTasks) {
        const issue = issueByKey.get(existing.id);
        if (!issue) {
          logger.warn('Tarefa não retornada pelo bulkfetch; mantendo versão local.', 'JiraFilasPanel', {
            taskId: existing.id,
          });
          failures.push(existing.id);
          updated.push(existing);
          processed += 1;
          setImportProgress({ current: processed, total: importedTasks.length });
          continue;
        }

        try {
          const task = await jiraIssueToTask(config, issue, {
            jiraProjectKey: selectedProjectKey || existing.id.split('-')[0],
            existingTask: existing,
            sprintCtx: sprintCtxRef.current ?? undefined,
          });
          updated.push(task);
        } catch (err) {
          logger.warn('Falha ao atualizar tarefa do Jira; mantendo versão local.', 'JiraFilasPanel', {
            taskId: existing.id,
            error: err instanceof Error ? err.message : String(err),
          });
          failures.push(existing.id);
          updated.push(existing);
        } finally {
          processed += 1;
          setImportProgress({ current: processed, total: importedTasks.length });
        }
      }

      const withRelated = await importFilasRelatedIssues(config, updated, {
        jiraProjectKey: selectedProjectKey || undefined,
        sprintCtx: sprintCtxRef.current ?? undefined,
        existingTasks: tasks,
      });

      const enriched = await enrichFilasTasks(config, withRelated, (current, total) =>
        setImportProgress({ current, total })
      );

      mergeImportedTasks(enriched);

      const successCount = importedTasks.length - failures.length;
      if (failures.length > 0) {
        handleWarning(
          `${successCount} de ${importedTasks.length} tarefas atualizadas do Jira. ` +
            `Não foi possível atualizar: ${failures.join(', ')}.`
        );
      } else {
        handleSuccess(
          successCount === 1
            ? '1 tarefa importada atualizada do Jira.'
            : `${successCount} tarefas importadas atualizadas do Jira.`
        );
      }
    } catch (err) {
      handleError(err, 'Atualizar tarefas do Jira');
    } finally {
      setIsUpdatingQueue(false);
      setImportProgress(null);
    }
  }, [
    selectedProjectKeys,
    selectedQueueCategories,
    selectedQueueStatuses,
    selectedQueues,
    selectedProjectKey,
    tasks,
    mergeImportedTasks,
    enrichFilasTasks,
    handleError,
    handleSuccess,
    handleWarning,
  ]);

  const handleImportByIssueKey = useCallback(async () => {
    const config = getJiraConfig();
    if (!config) {
      handleWarning('Configure o Jira em Configurações antes de importar.');
      return;
    }

    const key = issueKeyInput.trim().toUpperCase();
    if (!key) {
      handleWarning('Informe o ID da tarefa no formato PROJ-123.');
      return;
    }
    if (!isValidJiraKey(key)) {
      handleWarning('ID inválido. Use o formato PROJ-123 (ex: PROJ-123).');
      return;
    }

    setIsImportingIssue(true);
    try {
      if (!sprintCtxRef.current && selectedProjectKey) {
        sprintCtxRef.current = await buildJiraSprintSyncContext(config, selectedProjectKey);
      }

      const issues = await getJiraIssuesByKeysBulk(config, [key]);
      const issue = issues.find(i => i.key === key);
      if (!issue) {
        handleWarning(`Tarefa ${key} não encontrada no Jira.`);
        return;
      }
      const existing = tasks.find(t => t.id === key);
      const task = await jiraIssueToTask(config, issue, {
        jiraProjectKey: selectedProjectKey || key.split('-')[0],
        existingTask: existing,
        sprintCtx: sprintCtxRef.current ?? undefined,
      });

      const withRelated = await importFilasRelatedIssues(config, [task], {
        jiraProjectKey: selectedProjectKey || key.split('-')[0],
        sprintCtx: sprintCtxRef.current ?? undefined,
        existingTasks: tasks,
        rootTaskIds: new Set([key]),
      });

      const enriched = await enrichFilasTasks(config, withRelated);
      mergeImportedTasks(enriched);
      setIssueKeyInput('');
      handleSuccess(`Tarefa ${key} importada do Jira.`);
    } catch (err) {
      handleError(err, 'Importar tarefa do Jira');
    } finally {
      setIsImportingIssue(false);
    }
  }, [
    issueKeyInput,
    selectedProjectKey,
    tasks,
    mergeImportedTasks,
    handleError,
    handleSuccess,
    handleWarning,
  ]);

  const handleUpdateFromJira = useCallback(
    async (taskId: string) => {
      const config = getJiraConfig();
      if (!config) {
        handleWarning('Configure o Jira em Configurações.');
        return;
      }

      setUpdatingFromJiraId(taskId);
      try {
        if (!sprintCtxRef.current && selectedProjectKey) {
          sprintCtxRef.current = await buildJiraSprintSyncContext(config, selectedProjectKey);
        }
        const issues = await getJiraIssuesByKeysBulk(config, [taskId]);
        const issue = issues.find(i => i.key === taskId);
        if (!issue) {
          handleWarning(`Tarefa ${taskId} não encontrada no Jira.`);
          return;
        }
        const existing = tasks.find(t => t.id === taskId);
        const updated = await jiraIssueToTask(config, issue, {
          jiraProjectKey: selectedProjectKey || taskId.split('-')[0],
          existingTask: existing,
          sprintCtx: sprintCtxRef.current ?? undefined,
        });
        const withRelated = await importFilasRelatedIssues(config, [updated], {
          jiraProjectKey: selectedProjectKey || taskId.split('-')[0],
          sprintCtx: sprintCtxRef.current ?? undefined,
          existingTasks: tasks,
          rootTaskIds: new Set([taskId]),
        });
        const enriched = await enrichFilasTasks(config, withRelated);
        mergeImportedTasks(enriched);
        handleSuccess('Tarefa atualizada do Jira.');
      } catch (err) {
        handleError(err, 'Atualizar do Jira');
      } finally {
        setUpdatingFromJiraId(null);
      }
    },
    [selectedProjectKey, tasks, mergeImportedTasks, handleError, handleSuccess, handleWarning]
  );

  const handleJiraStatusChange = useCallback(
    async (
      taskId: string,
      jiraStatusName: string,
      rollback: { status: JiraTask['status']; jiraStatus?: string }
    ) => {
      const config = getJiraConfig();
      if (!config) return;

      setTransitioningStatusId(taskId);
      try {
        await transitionJiraIssueToStatus(config, taskId, jiraStatusName);
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  jiraStatus: jiraStatusName,
                  status: mapJiraStatusToTaskStatus(jiraStatusName),
                }
              : t
          )
        );
      } catch (err) {
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId
              ? { ...t, status: rollback.status, jiraStatus: rollback.jiraStatus }
              : t
          )
        );
        handleError(err, 'Alterar status no Jira');
      } finally {
        setTransitioningStatusId(null);
      }
    },
    [handleError]
  );

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const taskListCommonProps = useMemo(
    () => ({
      project: filasProject,
      onUpdateTasks: setTasks,
      onDeleteTask: handleDeleteTask,
      onUpdateFromJira: handleUpdateFromJira,
      isUpdatingFromJira: updatingFromJiraId,
      onJiraStatusChange: handleJiraStatusChange,
      isTransitioningJiraStatus: transitioningStatusId,
      onUnavailableAction: (label: string) =>
        handleWarning(`${label} não está disponível na visualização de filas.`),
      onOpenTaskTab,
    }),
    [
      filasProject,
      handleDeleteTask,
      handleUpdateFromJira,
      updatingFromJiraId,
      handleJiraStatusChange,
      transitioningStatusId,
      handleWarning,
      onOpenTaskTab,
    ]
  );

  useEffect(() => {
    if (!onWorkspaceBridgeChange) return;
    onWorkspaceBridgeChange({
      filasProject,
      onUpdateProject: updated => setTasks(updated.tasks),
      onUpdateFromJira: handleUpdateFromJira,
      isUpdatingFromJira: updatingFromJiraId,
    });
    return () => onWorkspaceBridgeChange(null);
  }, [
    filasProject,
    handleUpdateFromJira,
    updatingFromJiraId,
    onWorkspaceBridgeChange,
    setTasks,
  ]);

  const hasJiraConfig = !!getJiraConfig();
  const isBusy = isImportingProject || isUpdatingQueue || isImportingIssue;
  const hasActiveFilter = isJiraFilasFilterActive(activeFilter);
  const activeFilterLabel = getJiraFilasFilterLabel(activeFilter);
  const canImportQueue =
    hasJiraConfig &&
    selectedProjectKeys.length > 0 &&
    selectedQueueCategories.length > 0 &&
    selectedQueueStatuses.length > 0 &&
    selectedQueues.length > 0 &&
    !isBusy;
  const canUpdateFromSelection =
    hasJiraConfig &&
    selectedProjectKeys.length > 0 &&
    selectedQueueCategories.length > 0 &&
    selectedQueueStatuses.length > 0 &&
    selectedQueues.length > 0 &&
    !isBusy;
  const canUpdateQueue = canUpdateFromSelection || (hasJiraConfig && tasks.length > 0 && !isBusy);

  const setHeaderJiraAction = useTaskTrackingHeaderStore(s => s.setJiraAction);
  useEffect(() => {
    setHeaderJiraAction({
      onSync: () => void handleUpdateQueueFromJira(),
      isSyncing: isUpdatingQueue,
      disabled: !canUpdateQueue,
      title: canUpdateFromSelection
        ? 'Atualiza as tarefas do projeto, fila e status selecionados buscando no Jira'
        : 'Atualiza as tarefas já importadas buscando status, campos e SLAs no Jira',
    });
    return () => setHeaderJiraAction(null);
  }, [
    setHeaderJiraAction,
    handleUpdateQueueFromJira,
    isUpdatingQueue,
    canUpdateQueue,
    canUpdateFromSelection,
  ]);

  return (
    <div className="space-y-3 sm:space-y-4" role="region" aria-label="Filas do Jira">
      <div className={jiraSolusHeroShellClass}>
        <div className={jiraSolusHeroChromeClass}>
          <p className={jiraSolusEyebrowClass}>
            <Inbox className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Acompanhamento · Filas (Jira)
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className={jiraSolusHeroTitleClass}>Filas do Jira</h1>
            {selectedProjectKeys.length > 0 ? (
              <span className={jiraSolusHeroJiraBadgeClass}>
                {selectedProjectKeys.length === 1
                  ? `Jira: ${selectedProjectKeys[0]}`
                  : `Jira: ${selectedProjectKeys.length} projetos`}
              </span>
            ) : null}
            {selectedQueues.length > 0 ? (
              <span className={jiraSolusHeroJiraBadgeClass}>
                {selectedQueueCategories.length} fila(s) · {selectedQueueStatuses.length} status ·{' '}
                {selectedQueues.length} fila(s) JSM
              </span>
            ) : null}
            {hasActiveFilter ? (
              <span className={jiraSolusHeroJiraBadgeClass}>Filtro: {activeFilterLabel}</span>
            ) : null}
          </div>
          <p className={cn(jiraSolusHeroSubtitleClass, 'mt-1')}>
            Selecione projeto(s), fila e status do Jira Service Management para importar apenas as
            tarefas relevantes. O sistema atualiza automaticamente a cada 10 minutos (projetos e
            filas). Use <strong>Atualizar filas</strong> ou o botão <strong>Jira</strong> no topo
            para sincronizar manualmente. Também é possível importar uma issue pelo ID.
          </p>
        </div>
      </div>

      <section className={cn(jiraSolusInnerPanelClass, 'space-y-4')} aria-label="Importação do Jira">
        <header className={jiraSolusSectionHeaderClass}>
          <h2 className={jiraSolusSectionLabelClass}>Importação Jira</h2>
          <p className={jiraSolusSectionDescClass}>
            Selecione projetos, filas e status JSM ou importe uma issue individual pelo ID.
          </p>
        </header>
        <JiraFilasImportSelector
          projects={jiraProjects}
          queues={jiraQueues}
          selectedProjectKeys={selectedProjectKeys}
          onProjectKeysChange={handleProjectKeysChange}
          selectedQueueCategories={selectedQueueCategories}
          onQueueCategoriesChange={handleQueueCategoriesChange}
          selectedQueueStatuses={selectedQueueStatuses}
          onQueueStatusesChange={setSelectedQueueStatuses}
          isLoadingProjects={isLoadingProjects}
          isLoadingQueues={isLoadingQueues}
          disabled={!hasJiraConfig || isBusy}
        />

        <div className={jiraSolusToolbarClass}>
          <div className={jiraSolusFieldClass}>
            <label htmlFor="jira-filas-issue-key" className={jiraSolusFieldLabelClass}>
              ID da tarefa
            </label>
            <input
              id="jira-filas-issue-key"
              type="text"
              value={issueKeyInput}
              onChange={e => setIssueKeyInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') void handleImportByIssueKey();
              }}
              placeholder="PROJ-123"
              disabled={!hasJiraConfig || isBusy}
              className={cn(jiraSolusInputClass, 'uppercase placeholder:normal-case')}
              aria-label="ID da tarefa Jira para importação"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleImportByIssueKey()}
            disabled={!hasJiraConfig || isBusy}
            className={jiraSolusSecondaryBtnClass}
            aria-label="Importar tarefa pelo ID"
          >
            {isImportingIssue ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            )}
            Importar por ID
          </button>

          <button
            type="button"
            onClick={() => void handleImportQueue()}
            disabled={!canImportQueue}
            className={jiraSolusPrimaryBtnClass}
            aria-label="Importar tarefas das filas Jira selecionadas"
          >
            {isImportingProject ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {selectedQueues.length > 0
              ? `Importar (${selectedQueues.length} fila${selectedQueues.length === 1 ? '' : 's'})`
              : 'Importar filas'}
          </button>

          <button
            type="button"
            onClick={() => void handleUpdateQueueFromJira()}
            disabled={!canUpdateFromSelection}
            className={jiraSolusSecondaryBtnClass}
            aria-label="Atualizar tarefas das filas Jira selecionadas"
            title="Re-sincroniza com o projeto, fila e status selecionados"
          >
            {isUpdatingQueue ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {selectedQueues.length > 0
              ? `Atualizar (${selectedQueues.length} fila${selectedQueues.length === 1 ? '' : 's'})`
              : 'Atualizar filas'}
          </button>
        </div>

        {!hasJiraConfig ? (
          <p className="font-sans text-xs text-[var(--brand-text-muted)]">
            Configure a integração Jira na página inicial (Configurações) para importar filas.
          </p>
        ) : null}

        {importProgress ? (
          <div className={jiraIntegrationImportProgressPanelClass} role="status">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span>
                {isUpdatingQueue ? 'Atualizando filas…' : 'Importando tarefas…'}
              </span>
              <span className="tabular-nums">
                {importProgress.current}
                {importProgress.total != null ? ` / ${importProgress.total}` : ''}
              </span>
            </div>
            <div className={jiraIntegrationProgressTrackClass}>
              <div
                className={jiraIntegrationProgressFillClass}
                style={{
                  width:
                    importProgress.total && importProgress.total > 0
                      ? `${Math.min(100, (importProgress.current / importProgress.total) * 100)}%`
                      : '30%',
                }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className={cn(jiraSolusSearchWrapClass, 'min-w-0 flex-1')}>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-text-muted)]"
              aria-hidden
            />
            <input
              type="search"
              inputMode="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por ID, título ou palavra-chave…"
              className={jiraSolusSearchInputClass}
              aria-label="Busca rápida nas tarefas importadas"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-text-muted)] transition-colors hover:text-[var(--project-card-accent)]"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setIsFiltersModalOpen(true)}
            className={cn(jiraSolusSecondaryBtnClass, 'shrink-0 self-stretch sm:self-auto')}
            disabled={tasks.length === 0}
            aria-label="Abrir filtros das tarefas importadas"
            aria-haspopup="dialog"
          >
            <Filter className="h-4 w-4 shrink-0" aria-hidden />
            Filtros{activeLocalFiltersCount > 0 ? ` (${activeLocalFiltersCount})` : ''}
          </button>
        </div>
        {hasActiveFilter ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-xs font-medium text-[var(--brand-text-muted)]">
              Lista filtrada por: {activeFilterLabel}
            </span>
            <button
              type="button"
              onClick={onClearFilter}
              className={jiraSolusSecondaryBtnClass}
              aria-label="Limpar filtro aplicado pelo dashboard"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Limpar filtro
            </button>
          </div>
        ) : null}
      </section>

      <section className={jiraSolusListShellClass} aria-label="Lista de tarefas importadas">
        <header className={cn(jiraSolusSectionHeaderClass, 'mb-3 border-b-0 pb-0')}>
          <h2 className={jiraSolusSectionLabelClass}>Lista de tarefas</h2>
          <p className={jiraSolusSectionDescClass}>
            {filteredTasks.length > 0
              ? `${sortedTasks.length} tarefa${sortedTasks.length === 1 ? '' : 's'} visíve${sortedTasks.length === 1 ? 'l' : 'is'}`
              : 'Nenhuma tarefa importada ainda'}
            {sortedTasks.length !== tasks.length && tasks.length > 0
              ? ` de ${tasks.length} importadas`
              : ''}
          </p>
        </header>
        {isLoadingProjects && jiraProjects.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-4">
            <div className={tasksPanelToolbarShellClass}>
              <button
                type="button"
                onClick={() => setShowExportTasksModal(true)}
                className={tasksPanelToolbarExportBtnClass}
                aria-label={`Exportar lista visível (${sortedTasks.length} tarefas)`}
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden />
                Exportar lista
                {sortedTasks.length !== tasks.length ? ` (${sortedTasks.length})` : ''}
              </button>
              <div className={tasksPanelToolbarFieldClass}>
                <label htmlFor="jira-filas-sort-by" className={tasksPanelToolbarLabelClass}>
                  Ordenar
                </label>
                <AppSelect
                  id="jira-filas-sort-by"
                  value={sortBy}
                  onChange={v => setSortBy(v as TaskSortBy)}
                  className={tasksPanelToolbarSelectClass}
                  aria-label="Ordenação da lista de tarefas da fila Jira"
                >
                  <option value="id">ID</option>
                  <option value="createdAt">Data de criação</option>
                  <option value="updatedAt">Data de atualização</option>
                  <option value="status">Status</option>
                  <option value="priority">Prioridade</option>
                  <option value="title">Título</option>
                </AppSelect>
              </div>
              <div className={tasksPanelToolbarFieldClass}>
                <label htmlFor="jira-filas-group-by" className={tasksPanelToolbarLabelClass}>
                  Agrupar
                </label>
                <AppSelect
                  id="jira-filas-group-by"
                  value={groupBy}
                  onChange={v => setGroupBy(v as TaskGroupBy)}
                  className={tasksPanelToolbarSelectClass}
                  aria-label="Agrupar lista de tarefas da fila Jira por"
                >
                  <option value="none">Nenhum</option>
                  <option value="status">Status</option>
                  <option value="priority">Prioridade</option>
                  <option value="type">Tipo</option>
                </AppSelect>
              </div>
            </div>

            {groupBy !== 'none' && groupedTasksEntries.length > 0 ? (
              <div className="space-y-6">
                {groupedTasksEntries.map(([groupLabel, tasksInGroup]) => (
                  <section key={groupLabel} aria-label={`Grupo: ${groupLabel}`}>
                    <h3 className="mb-3 flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-wider text-[var(--leve-header-text-muted)]">
                      <List className="h-4 w-4" aria-hidden />
                      {groupLabel}
                      <span className="font-medium normal-case tracking-normal text-[var(--brand-text-muted)]">
                        ({tasksInGroup.length})
                      </span>
                    </h3>
                    <JiraFilasTaskList
                      {...taskListCommonProps}
                      tasks={tasksInGroup}
                      listAriaLabel={`Filas do Jira — ${groupLabel}`}
                    />
                  </section>
                ))}
              </div>
            ) : (
              <JiraFilasTaskList
                {...taskListCommonProps}
                tasks={sortedTasks}
                listAriaLabel="Filas do Jira"
              />
            )}
          </div>
        ) : tasks.length > 0 ? (
          <EmptyState
            title="Nenhuma tarefa corresponde aos filtros"
            description={
              activeLocalFiltersCount > 0
                ? 'Ajuste ou limpe os filtros aplicados para ver as tarefas importadas.'
                : hasActiveFilter
                  ? 'Ajuste os filtros ou limpe o filtro aplicado pelo Dashboard.'
                  : 'Ajuste os termos da busca para ver as tarefas importadas.'
            }
            action={{
              label:
                activeLocalFiltersCount > 0
                  ? 'Limpar filtros'
                  : hasActiveFilter
                    ? 'Limpar filtro'
                    : 'Limpar busca',
              onClick:
                activeLocalFiltersCount > 0
                  ? () => setLocalFilters(EMPTY_JIRA_FILAS_FILTERS)
                  : hasActiveFilter
                    ? onClearFilter
                    : () => setSearchQuery(''),
              variant: 'primary',
            }}
          />
        ) : (
          <EmptyState
            title="Nenhuma tarefa importada"
            description={
              hasJiraConfig
                ? 'Selecione o projeto, escolha a fila e clique em Importar fila, ou informe o ID de uma tarefa (ex.: PROJ-123).'
                : 'Configure o Jira e importe tarefas para visualizá-las aqui.'
            }
          />
        )}
      </section>

      <Modal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        title="Filtros"
        size="4xl"
        panelClassName={tasksPanelNeuModalPanelClass}
        titleClassName={tasksPanelNeuModalTitleClass}
      >
        <JiraFilasFiltersModalContent
          filters={localFilters}
          onChange={setLocalFilters}
          statusOptions={filterOptions.statuses}
          typeOptions={filterOptions.types}
          assigneeOptions={filterOptions.assignees}
          counts={filterCounts}
          activeFiltersCount={activeLocalFiltersCount}
          onClearAll={() => setLocalFilters(EMPTY_JIRA_FILAS_FILTERS)}
        />
      </Modal>

      <FileExportModal
        isOpen={showExportTasksModal}
        onClose={() => setShowExportTasksModal(false)}
        exportType="tasks"
        project={filasProject}
        tasks={sortedTasks}
      />
    </div>
  );
};

JiraFilasPanel.displayName = 'JiraFilasPanel';

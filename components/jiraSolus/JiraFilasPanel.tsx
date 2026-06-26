import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Filter, Loader2, RefreshCw, Search, X } from 'lucide-react';
import {
  getJiraConfig,
  getJiraProjects,
  getJiraIssuesByJql,
  getJiraIssueByKey,
  getJiraStatuses,
  getJiraQueuesForProject,
  transitionJiraIssueToStatus,
  type JiraProject,
  type JiraQueue,
} from '../../services/jiraService';
import { enrichTasksWithJiraSlas } from '../../services/jira/sla';
import { enrichTasksWithJsmSummary } from '../../services/jira/jsmRequest';
import { importFilasRelatedIssues } from '../../services/jira/filasRelatedIssues';
import { jiraIssueToTask } from '../../services/jira/issueToTask';
import { buildJiraSprintSyncContext } from '../../services/jira/sprintSync';
import { mapJiraStatusToTaskStatus } from '../../services/jira/mappers';
import type { JiraTask, Project } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
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
import { AppSelect } from '../common/AppSelect';
import { EmptyState } from '../common/EmptyState';
import { Spinner } from '../common/Spinner';
import { JiraFilasTaskList } from './JiraFilasTaskList';
import { JiraFilasQueueTree } from './JiraFilasQueueTree';
import { Modal } from '../common/Modal';
import { getQueueIdsFromSelection } from '../../utils/jiraQueueTree';
import {
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
  tasksViewPageHeaderShellClass,
  tasksViewPageJiraBadgeClass,
  tasksViewPageSubtitleClass,
  tasksViewPageTitleClass,
} from '../tasks/tasksPanelNeuStyles';
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
  jiraSolusFieldClass,
  jiraSolusFieldLabelClass,
  jiraSolusInnerPanelClass,
  jiraSolusInputClass,
  jiraSolusListShellClass,
  jiraSolusPrimaryBtnClass,
  jiraSolusSearchInputClass,
  jiraSolusSearchWrapClass,
  jiraSolusSecondaryBtnClass,
  jiraSolusSelectClass,
  jiraSolusToolbarClass,
} from './jiraSolusNeuUi';
import {
  jiraIntegrationImportProgressPanelClass,
  jiraIntegrationProgressFillClass,
  jiraIntegrationProgressTrackClass,
} from '../jira/jiraIntegrationUi';

import {
  readStoredQueueIdsForProject,
  writeStoredQueueIdsForProject,
} from '../../services/taskTrackingStorage';

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
}) => {
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();

  const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
  const [jiraQueues, setJiraQueues] = useState<JiraQueue[]>([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [issueKeyInput, setIssueKeyInput] = useState('');
  const [localFilters, setLocalFilters] = useState<JiraFilasLocalFilters>(EMPTY_JIRA_FILAS_FILTERS);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

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
    if (!config || !selectedProjectKey) {
      setJiraStatuses([]);
      return;
    }

    let cancelled = false;
    getJiraStatuses(config, selectedProjectKey)
      .then(statuses => {
        if (!cancelled) setJiraStatuses(statuses);
      })
      .catch(() => {
        if (!cancelled) setJiraStatuses([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProjectKey, setJiraStatuses]);

  useEffect(() => {
    const config = getJiraConfig();
    if (!config || !selectedProjectKey) {
      setJiraQueues([]);
      setSelectedQueueIds([]);
      return;
    }

    let cancelled = false;
    setIsLoadingQueues(true);
    getJiraQueuesForProject(config, selectedProjectKey)
      .then(queues => {
        if (cancelled) return;
        setJiraQueues(queues);
        const storedQueueIds = readStoredQueueIdsForProject(selectedProjectKey);
        const availableIds = new Set(queues.map(queue => queue.id));
        const nextQueueIds = storedQueueIds.filter(id => availableIds.has(id));
        setSelectedQueueIds(nextQueueIds);
        writeStoredQueueIdsForProject(selectedProjectKey, nextQueueIds);
      })
      .catch(err => {
        if (!cancelled) {
          setJiraQueues([]);
          setSelectedQueueIds([]);
          handleError(err, 'Carregar filas do Jira');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingQueues(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProjectKey, handleError]);

  useEffect(() => {
    writeStoredQueueIdsForProject(selectedProjectKey, selectedQueueIds);
  }, [selectedProjectKey, selectedQueueIds]);

  const selectedQueues = useMemo(() => {
    const selected = new Set(selectedQueueIds);
    return jiraQueues.filter(queue => selected.has(queue.id));
  }, [jiraQueues, selectedQueueIds]);

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

  const fetchQueueTasksFromJira = useCallback(
    async (onIssueProgress?: (current: number, total?: number) => void) => {
      const config = getJiraConfig();
      if (!config) {
        throw new Error('Configure o Jira em Configurações antes de sincronizar.');
      }
      if (!selectedProjectKey) {
        throw new Error('Selecione um projeto Jira.');
      }
      if (selectedQueues.length === 0) {
        throw new Error('Selecione ao menos uma fila do projeto antes de sincronizar.');
      }

      const sprintCtx = await buildJiraSprintSyncContext(config, selectedProjectKey);
      sprintCtxRef.current = sprintCtx;

      const issueByKey = new Map<string, Awaited<ReturnType<typeof getJiraIssuesByJql>>[number]>();
      let processedQueues = 0;

      for (const queue of selectedQueues) {
        const issues = await getJiraIssuesByJql(config, queue.jql, undefined, (current, total) => {
          const base = processedQueues;
          onIssueProgress?.(base + current, selectedQueues.length * (total ?? (current || 1)));
        });
        for (const issue of issues) {
          if (issue.key) issueByKey.set(issue.key, issue);
        }
        processedQueues += 1;
        onIssueProgress?.(processedQueues, selectedQueues.length);
      }

      const issues = Array.from(issueByKey.values());
      const converted = await Promise.all(
        issues.map(issue =>
          jiraIssueToTask(config, issue, {
            jiraProjectKey: selectedProjectKey,
            existingTask: tasks.find(t => t.id === issue.key),
            sprintCtx,
          })
        )
      );

      const primaryIds = new Set(converted.map(task => task.id));
      const withRelated = await importFilasRelatedIssues(config, converted, {
        jiraProjectKey: selectedProjectKey,
        sprintCtx,
        existingTasks: tasks,
        primaryTaskIds: primaryIds,
        onProgress: (done, total) => onIssueProgress?.(done, total),
      });

      return enrichFilasTasks(config, withRelated, onIssueProgress);
    },
    [selectedProjectKey, selectedQueues, tasks, enrichFilasTasks]
  );

  const handleImportQueue = useCallback(async () => {
    const config = getJiraConfig();
    if (!config) {
      handleWarning('Configure o Jira em Configurações antes de importar.');
      return;
    }
    if (!selectedProjectKey) {
      handleWarning('Selecione um projeto Jira.');
      return;
    }
    if (selectedQueues.length === 0) {
      handleWarning('Selecione ao menos uma fila do projeto antes de importar.');
      return;
    }

    setIsImportingProject(true);
    setImportProgress({ current: 0 });
    try {
      const withSlas = await fetchQueueTasksFromJira((current, total) =>
        setImportProgress({ current, total })
      );

      mergeImportedTasks(withSlas);
      const queueLabel =
        selectedQueues.length === 1
          ? `"${selectedQueues[0].name}"`
          : `${selectedQueues.length} filas`;
      handleSuccess(
        withSlas.length === 1
          ? `1 tarefa importada da fila ${queueLabel}.`
          : `${withSlas.length} tarefas importadas de ${queueLabel}.`
      );
    } catch (err) {
      handleError(err, 'Importar filas do Jira');
    } finally {
      setIsImportingProject(false);
      setImportProgress(null);
    }
  }, [
    selectedProjectKey,
    selectedQueues,
    fetchQueueTasksFromJira,
    mergeImportedTasks,
    handleError,
    handleSuccess,
    handleWarning,
  ]);

  /**
   * Atualiza apenas as tarefas já importadas (re-busca cada uma pelo ID no Jira),
   * preservando dados locais e atualizando status, campos e SLAs.
   */
  const handleUpdateQueueFromJira = useCallback(async () => {
    const config = getJiraConfig();
    if (!config) {
      handleWarning('Configure o Jira em Configurações antes de atualizar.');
      return;
    }
    if (tasks.length === 0) {
      handleWarning('Importe tarefas antes de atualizar do Jira.');
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

      for (const existing of importedTasks) {
        try {
          const issue = await getJiraIssueByKey(config, existing.id);
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
        primaryTaskIds: new Set(importedTasks.map(task => task.id)),
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

      const issue = await getJiraIssueByKey(config, key);
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
        primaryTaskIds: new Set([key]),
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
        const issue = await getJiraIssueByKey(config, taskId);
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
          primaryTaskIds: new Set([taskId]),
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

  const hasJiraConfig = !!getJiraConfig();
  const isBusy = isImportingProject || isUpdatingQueue || isImportingIssue;
  const hasActiveFilter = isJiraFilasFilterActive(activeFilter);
  const activeFilterLabel = getJiraFilasFilterLabel(activeFilter);
  const canImportQueue =
    hasJiraConfig && !!selectedProjectKey && selectedQueues.length > 0 && !isBusy;
  const canUpdateQueue = hasJiraConfig && tasks.length > 0 && !isBusy;

  const setHeaderJiraAction = useTaskTrackingHeaderStore(s => s.setJiraAction);
  useEffect(() => {
    setHeaderJiraAction({
      onSync: () => void handleUpdateQueueFromJira(),
      isSyncing: isUpdatingQueue,
      disabled: !canUpdateQueue,
      title: 'Atualiza as tarefas já importadas buscando status, campos e SLAs no Jira',
    });
    return () => setHeaderJiraAction(null);
  }, [setHeaderJiraAction, handleUpdateQueueFromJira, isUpdatingQueue, canUpdateQueue]);

  return (
    <div className="space-y-5" role="region" aria-label="Filas do Jira">
      <header className={tasksViewPageHeaderShellClass}>
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h1 className={tasksViewPageTitleClass}>Filas do Jira</h1>
            {selectedProjectKey ? (
              <span className={tasksViewPageJiraBadgeClass}>Jira: {selectedProjectKey}</span>
            ) : null}
            {selectedQueues.length > 0 ? (
              <span className={tasksViewPageJiraBadgeClass}>
                {selectedQueues.length === 1
                  ? `Fila: ${selectedQueues[0].name}`
                  : `Filas: ${selectedQueues.length} selecionadas`}
              </span>
            ) : null}
            {hasActiveFilter ? (
              <span className={tasksViewPageJiraBadgeClass}>Filtro: {activeFilterLabel}</span>
            ) : null}
          </div>
          <p className={cn(tasksViewPageSubtitleClass, 'max-w-2xl')}>
            Selecione o projeto e as filas do Jira Service Management para importar apenas as
            tarefas relevantes. Use o botão <strong>Jira</strong> no topo da tela para atualizar
            apenas as tarefas já importadas (status, SLA e campos), como em Tarefas &amp; Testes dos
            Projetos. Também é possível importar uma issue pelo ID.
          </p>
        </div>
      </header>

      <section className={cn(jiraSolusInnerPanelClass, 'space-y-4')} aria-label="Importação do Jira">
        <div className={jiraSolusToolbarClass}>
          <div className={jiraSolusFieldClass}>
            <label htmlFor="jira-filas-project" className={jiraSolusFieldLabelClass}>
              Projeto Jira
            </label>
            <AppSelect
              id="jira-filas-project"
              value={selectedProjectKey}
              onChange={value => {
                setSelectedProjectKey(value);
                setSelectedQueueIds([]);
              }}
              className={jiraSolusSelectClass}
              disabled={!hasJiraConfig || isLoadingProjects || isBusy}
              aria-label="Selecionar projeto Jira"
            >
              <option value="">
                {isLoadingProjects ? 'Carregando…' : 'Selecione o projeto'}
              </option>
              {jiraProjects.map(p => (
                <option key={p.key} value={p.key}>
                  {p.name} ({p.key})
                </option>
              ))}
            </AppSelect>
          </div>

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
              ? `Importar filas (${selectedQueues.length})`
              : 'Importar filas'}
          </button>

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
        </div>

        {selectedProjectKey ? (
          <JiraFilasQueueTree
            queues={jiraQueues}
            selectedQueueIds={getQueueIdsFromSelection(selectedQueueIds, jiraQueues)}
            onChange={setSelectedQueueIds}
            disabled={!hasJiraConfig || isBusy}
            isLoading={isLoadingQueues}
          />
        ) : null}

        {!hasJiraConfig ? (
          <p className="font-sans text-xs text-[var(--brand-text-muted)]">
            Configure a integração Jira na página inicial (Configurações) para importar filas.
          </p>
        ) : null}

        {hasJiraConfig && selectedProjectKey && !isLoadingQueues && jiraQueues.length === 0 ? (
          <p className="font-sans text-xs text-[var(--brand-text-muted)]">
            Nenhuma fila foi encontrada para este projeto. Verifique se ele é um projeto Jira
            Service Management com filas configuradas.
          </p>
        ) : null}

        {importProgress ? (
          <div className={jiraIntegrationImportProgressPanelClass} role="status">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span>Importando tarefas…</span>
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
        {isLoadingProjects && jiraProjects.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredTasks.length > 0 ? (
          <JiraFilasTaskList
            tasks={filteredTasks}
            project={filasProject}
            onUpdateTasks={setTasks}
            onDeleteTask={handleDeleteTask}
            onUpdateFromJira={handleUpdateFromJira}
            isUpdatingFromJira={updatingFromJiraId}
            onJiraStatusChange={handleJiraStatusChange}
            isTransitioningJiraStatus={transitioningStatusId}
            onUnavailableAction={label =>
              handleWarning(`${label} não está disponível na visualização de filas.`)
            }
          />
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
    </div>
  );
};

JiraFilasPanel.displayName = 'JiraFilasPanel';

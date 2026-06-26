import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, RefreshCw, Search, X } from 'lucide-react';
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
import { jiraIssueToTask } from '../../services/jira/issueToTask';
import { buildJiraSprintSyncContext } from '../../services/jira/sprintSync';
import { mapJiraStatusToTaskStatus } from '../../services/jira/mappers';
import type { JiraTask, Project } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useTaskTrackingHeaderStore } from '../../store/taskTrackingHeaderStore';
import { isValidJiraKey } from '../../utils/jiraFieldMapper';
import {
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
  jiraSolusSectionTitleClass,
  jiraSolusSelectClass,
  jiraSolusSubtitleClass,
  jiraSolusBadgeClass,
  jiraSolusToolbarClass,
} from './jiraSolusNeuUi';
import {
  jiraIntegrationImportProgressPanelClass,
  jiraIntegrationProgressFillClass,
  jiraIntegrationProgressTrackClass,
} from '../jira/jiraIntegrationUi';

import {
  readStoredQueueIdForProject,
  writeStoredQueueIdForProject,
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
  const [selectedQueueId, setSelectedQueueId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [issueKeyInput, setIssueKeyInput] = useState('');

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
      setSelectedQueueId('');
      return;
    }

    let cancelled = false;
    setIsLoadingQueues(true);
    getJiraQueuesForProject(config, selectedProjectKey)
      .then(queues => {
        if (cancelled) return;
        setJiraQueues(queues);
        const storedQueueId = readStoredQueueIdForProject(selectedProjectKey);
        const storedQueue = queues.find(queue => queue.id === storedQueueId);
        const nextQueueId = storedQueue?.id ?? '';
        setSelectedQueueId(nextQueueId);
        writeStoredQueueIdForProject(selectedProjectKey, nextQueueId);
      })
      .catch(err => {
        if (!cancelled) {
          setJiraQueues([]);
          setSelectedQueueId('');
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
    writeStoredQueueIdForProject(selectedProjectKey, selectedQueueId);
  }, [selectedProjectKey, selectedQueueId]);

  const selectedQueue = useMemo(
    () => jiraQueues.find(queue => queue.id === selectedQueueId) ?? null,
    [jiraQueues, selectedQueueId]
  );

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

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tasksByFilter = tasks.filter(t =>
      matchesJiraFilasFilter(t, activeFilter, Date.now(), slaRiskWindowHours)
    );
    if (!q) return tasksByFilter;
    return tasksByFilter.filter(
      t =>
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery, activeFilter, slaRiskWindowHours]);

  const mergeImportedTasks = useCallback((imported: JiraTask[]) => {
    setTasks(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      imported.forEach(t => map.set(t.id, t));
      return normalizeTasksParentIdsAcyclic(Array.from(map.values()));
    });
  }, [setTasks]);

  const fetchQueueTasksFromJira = useCallback(
    async (onIssueProgress?: (current: number, total?: number) => void) => {
      const config = getJiraConfig();
      if (!config) {
        throw new Error('Configure o Jira em Configurações antes de sincronizar.');
      }
      if (!selectedProjectKey) {
        throw new Error('Selecione um projeto Jira.');
      }
      if (!selectedQueue?.jql) {
        throw new Error('Selecione a fila do projeto antes de sincronizar.');
      }

      const sprintCtx = await buildJiraSprintSyncContext(config, selectedProjectKey);
      sprintCtxRef.current = sprintCtx;

      const issues = await getJiraIssuesByJql(
        config,
        selectedQueue.jql,
        undefined,
        onIssueProgress
      );

      const converted = await Promise.all(
        issues.map(issue =>
          jiraIssueToTask(config, issue, {
            jiraProjectKey: selectedProjectKey,
            existingTask: tasks.find(t => t.id === issue.key),
            sprintCtx,
          })
        )
      );

      return enrichTasksWithJiraSlas(config, converted, {
        onProgress: (done, total) => onIssueProgress?.(done, total),
      });
    },
    [selectedProjectKey, selectedQueue, tasks]
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
    if (!selectedQueue?.jql) {
      handleWarning('Selecione a fila do projeto antes de importar.');
      return;
    }

    setIsImportingProject(true);
    setImportProgress({ current: 0 });
    try {
      const withSlas = await fetchQueueTasksFromJira((current, total) =>
        setImportProgress({ current, total })
      );

      mergeImportedTasks(withSlas);
      handleSuccess(
        withSlas.length === 1
          ? `1 tarefa importada da fila "${selectedQueue.name}".`
          : `${withSlas.length} tarefas importadas da fila "${selectedQueue.name}".`
      );
    } catch (err) {
      handleError(err, 'Importar fila do Jira');
    } finally {
      setIsImportingProject(false);
      setImportProgress(null);
    }
  }, [
    selectedProjectKey,
    selectedQueue,
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

      const withSlas = await enrichTasksWithJiraSlas(config, updated);

      const updatedById = new Map(withSlas.map(t => [t.id, t]));
      setTasks(prev =>
        normalizeTasksParentIdsAcyclic(prev.map(t => updatedById.get(t.id) ?? t))
      );

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
    setTasks,
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

      const [withSla] = await enrichTasksWithJiraSlas(config, [task]);
      mergeImportedTasks([withSla]);
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
        const [withSla] = await enrichTasksWithJiraSlas(config, [updated]);
        mergeImportedTasks([withSla]);
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
  const canImportQueue = hasJiraConfig && !!selectedProjectKey && !!selectedQueue?.jql && !isBusy;
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
      <header className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <h2 className={jiraSolusSectionTitleClass}>Filas do Jira</h2>
          {selectedProjectKey ? (
            <span className={jiraSolusBadgeClass}>Jira: {selectedProjectKey}</span>
          ) : null}
          {selectedQueue ? (
            <span className={jiraSolusBadgeClass}>Fila: {selectedQueue.name}</span>
          ) : null}
          {hasActiveFilter ? (
            <span className={jiraSolusBadgeClass}>Filtro: {activeFilterLabel}</span>
          ) : null}
        </div>
        <p className={cn(jiraSolusSubtitleClass, 'mt-0')}>
          Selecione o projeto e a fila do Jira Service Management para importar apenas as tarefas
          relevantes. Use o botão <strong>Jira</strong> no topo da tela para atualizar apenas as
          tarefas já importadas (status, SLA e campos), como em Tarefas &amp; Testes dos Projetos.
          Também é possível importar uma issue pelo ID.
        </p>
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
                setSelectedQueueId('');
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

          <div className={jiraSolusFieldClass}>
            <label htmlFor="jira-filas-queue" className={jiraSolusFieldLabelClass}>
              Fila do projeto
            </label>
            <AppSelect
              id="jira-filas-queue"
              value={selectedQueueId}
              onChange={setSelectedQueueId}
              className={jiraSolusSelectClass}
              disabled={
                !hasJiraConfig ||
                !selectedProjectKey ||
                isLoadingQueues ||
                isBusy ||
                jiraQueues.length === 0
              }
              aria-label="Selecionar fila do projeto Jira"
            >
              <option value="">
                {!selectedProjectKey
                  ? 'Selecione o projeto primeiro'
                  : isLoadingQueues
                    ? 'Carregando filas…'
                    : jiraQueues.length === 0
                      ? 'Nenhuma fila encontrada'
                      : 'Selecione a fila'}
              </option>
              {jiraQueues.map(queue => (
                <option key={queue.id} value={queue.id}>
                  {queue.name}
                </option>
              ))}
            </AppSelect>
          </div>

          <button
            type="button"
            onClick={() => void handleImportQueue()}
            disabled={!canImportQueue}
            className={jiraSolusPrimaryBtnClass}
            aria-label="Importar tarefas da fila Jira selecionada"
          >
            {isImportingProject ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4 shrink-0" aria-hidden />
            )}
            Importar fila
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

        {!hasJiraConfig ? (
          <p className="font-sans text-xs text-[var(--brand-text-muted)]">
            Configure a integração Jira na página inicial (Configurações) para importar filas.
          </p>
        ) : null}

        {hasJiraConfig && selectedProjectKey && !isLoadingQueues && jiraQueues.length === 0 ? (
          <p className="font-sans text-xs text-[var(--brand-text-muted)]">
            Nenhuma fila foi encontrada para este projeto. Verifique se ele é um projeto Jira
            Service Management com filas configuradas (ex.: Sustentação → Solus).
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

        <div className={jiraSolusSearchWrapClass}>
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
            title="Nenhuma tarefa corresponde à busca"
            description={
              hasActiveFilter
                ? 'Ajuste os filtros ou limpe o filtro aplicado pelo Dashboard.'
                : 'Ajuste os termos da busca para ver as tarefas importadas.'
            }
            action={{
              label: hasActiveFilter ? 'Limpar filtro' : 'Limpar busca',
              onClick: hasActiveFilter ? onClearFilter : () => setSearchQuery(''),
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
    </div>
  );
};

JiraFilasPanel.displayName = 'JiraFilasPanel';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JiraTask } from '../types';
import {
  FILAS_ACTIVE_PROJECT_FILTER_KEY,
  FILAS_IMPORTED_PROJECT_KEYS_KEY,
  FILAS_JIRA_STATUSES_BY_PROJECT_KEY,
  FILAS_JIRA_STATUSES_STORAGE_KEY,
  FILAS_SLA_RISK_WINDOW_STORAGE_KEY,
  FILAS_TASKS_STORAGE_KEY,
  readFilasImportSelection,
  readTaskTrackingSnapshot,
  TASK_TRACKING_RESTORED_EVENT,
  TASK_TRACKING_UPDATED_EVENT,
  writeActiveProjectFilter,
  type JiraStatusPaletteEntry,
  type TaskTrackingProjectFilter,
} from '../services/taskTrackingStorage';
import {
  filterTasksByProjectFilter,
  resolveImportedProjectKeys,
  resolvePaletteForProjectFilter,
} from '../utils/taskTrackingProject';

export interface FilasTaskTrackingState {
  tasks: JiraTask[];
  filteredTasks: JiraTask[];
  slaRiskWindowHours: number;
  jiraStatuses: JiraStatusPaletteEntry[];
  jiraStatusesByProject: Record<string, JiraStatusPaletteEntry[]>;
  importedProjectKeys: string[];
  activeProjectFilter: TaskTrackingProjectFilter;
  hasFilasSelection: boolean;
  setActiveProjectFilter: (filter: TaskTrackingProjectFilter) => void;
  refresh: () => void;
}

/**
 * Tarefas das Filas Jira persistidas localmente, com atualização após sync/restauração.
 */
export function useFilasTaskTracking(): FilasTaskTrackingState {
  const [tasks, setTasks] = useState<JiraTask[]>(() => readTaskTrackingSnapshot().tasks);
  const [slaRiskWindowHours, setSlaRiskWindowHours] = useState(
    () => readTaskTrackingSnapshot().slaRiskWindowHours
  );
  const [jiraStatuses, setJiraStatuses] = useState<JiraStatusPaletteEntry[]>(
    () => readTaskTrackingSnapshot().jiraStatuses
  );
  const [jiraStatusesByProject, setJiraStatusesByProject] = useState<
    Record<string, JiraStatusPaletteEntry[]>
  >(() => readTaskTrackingSnapshot().jiraStatusesByProject);
  const [importedProjectKeys, setImportedProjectKeys] = useState<string[]>(
    () => readTaskTrackingSnapshot().importedProjectKeys
  );
  const [activeProjectFilter, setActiveProjectFilterState] = useState<TaskTrackingProjectFilter>(
    () => readTaskTrackingSnapshot().activeProjectFilter
  );
  const [hasFilasSelection, setHasFilasSelection] = useState(
    () => readFilasImportSelection() !== null
  );

  const refresh = useCallback(() => {
    const snapshot = readTaskTrackingSnapshot();
    setTasks(snapshot.tasks);
    setSlaRiskWindowHours(snapshot.slaRiskWindowHours);
    setJiraStatuses(snapshot.jiraStatuses);
    setJiraStatusesByProject(snapshot.jiraStatusesByProject);
    setImportedProjectKeys(snapshot.importedProjectKeys);
    setActiveProjectFilterState(snapshot.activeProjectFilter);
    setHasFilasSelection(readFilasImportSelection() !== null);
  }, []);

  const setActiveProjectFilter = useCallback((filter: TaskTrackingProjectFilter) => {
    writeActiveProjectFilter(filter);
    setActiveProjectFilterState(filter);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(TASK_TRACKING_RESTORED_EVENT, refresh);
    window.addEventListener(TASK_TRACKING_UPDATED_EVENT, refresh);
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === FILAS_TASKS_STORAGE_KEY ||
        event.key === FILAS_SLA_RISK_WINDOW_STORAGE_KEY ||
        event.key === FILAS_JIRA_STATUSES_STORAGE_KEY ||
        event.key === FILAS_JIRA_STATUSES_BY_PROJECT_KEY ||
        event.key === FILAS_IMPORTED_PROJECT_KEYS_KEY ||
        event.key === FILAS_ACTIVE_PROJECT_FILTER_KEY
      ) {
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(TASK_TRACKING_RESTORED_EVENT, refresh);
      window.removeEventListener(TASK_TRACKING_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const resolvedImportedKeys = useMemo(
    () =>
      resolveImportedProjectKeys(
        tasks,
        readFilasImportSelection()?.projectKeys ?? importedProjectKeys
      ),
    [tasks, importedProjectKeys]
  );

  const filteredTasks = useMemo(
    () => filterTasksByProjectFilter(tasks, activeProjectFilter),
    [tasks, activeProjectFilter]
  );

  const activePalette = useMemo(
    () => resolvePaletteForProjectFilter(jiraStatusesByProject, activeProjectFilter, jiraStatuses),
    [jiraStatusesByProject, activeProjectFilter, jiraStatuses]
  );

  return {
    tasks,
    filteredTasks,
    slaRiskWindowHours,
    jiraStatuses: activePalette,
    jiraStatusesByProject,
    importedProjectKeys: resolvedImportedKeys,
    activeProjectFilter,
    hasFilasSelection,
    setActiveProjectFilter,
    refresh,
  };
}

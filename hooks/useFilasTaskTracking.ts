import { useCallback, useEffect, useState } from 'react';
import type { JiraTask } from '../types';
import {
  FILAS_SLA_RISK_WINDOW_STORAGE_KEY,
  FILAS_TASKS_STORAGE_KEY,
  readFilasImportSelection,
  readTaskTrackingSnapshot,
  TASK_TRACKING_RESTORED_EVENT,
} from '../services/taskTrackingStorage';

export interface FilasTaskTrackingState {
  tasks: JiraTask[];
  slaRiskWindowHours: number;
  hasFilasSelection: boolean;
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
  const [hasFilasSelection, setHasFilasSelection] = useState(
    () => readFilasImportSelection() !== null
  );

  const refresh = useCallback(() => {
    const snapshot = readTaskTrackingSnapshot();
    setTasks(snapshot.tasks);
    setSlaRiskWindowHours(snapshot.slaRiskWindowHours);
    setHasFilasSelection(readFilasImportSelection() !== null);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(TASK_TRACKING_RESTORED_EVENT, refresh);
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === FILAS_TASKS_STORAGE_KEY ||
        event.key === FILAS_SLA_RISK_WINDOW_STORAGE_KEY
      ) {
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(TASK_TRACKING_RESTORED_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  return { tasks, slaRiskWindowHours, hasFilasSelection, refresh };
}

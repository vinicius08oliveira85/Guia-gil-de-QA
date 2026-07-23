import type { JiraTask } from '../types';
import { DB_NAME, DB_VERSION, TASK_TRACKING_STORE } from '../utils/constants';
import { logger } from '../utils/logger';

/**
 * Service IndexedDB para Acompanhamento de Tarefas (Filas Jira).
 * Substitui localStorage para grandes volumes de tarefas,
 * mantendo localStorage para metadados de configuração.
 */

const TT_TASKS_ID = 'filas-tasks';

let db: IDBDatabase | undefined;
async function openTTDb(): Promise<IDBDatabase> {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      db.onversionchange = () => {
        db?.close();
        db = undefined;
      };
      resolve(db);
    };
    request.onupgradeneeded = event => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(TASK_TRACKING_STORE)) {
        dbInstance.createObjectStore(TASK_TRACKING_STORE, { keyPath: 'id' });
      }
    };
  });
}

export async function writeTasksToIndexedDB(
  tasks: JiraTask[],
  fallbackSave: (tasks: JiraTask[]) => void
): Promise<void> {
  try {
    const db = await openTTDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(TASK_TRACKING_STORE, 'readwrite');
      const store = transaction.objectStore(TASK_TRACKING_STORE);
      store.put({ id: TT_TASKS_ID, tasks, updatedAt: new Date().toISOString() });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Transação IndexedDB abortada'));
    });
    logger.debug(`Tasks salvas no IndexedDB: ${tasks.length}`, 'taskTrackingDbService');
  } catch (error) {
    logger.warn(
      'IndexedDB não disponível para task tracking, usando localStorage como fallback',
      'taskTrackingDbService',
      error
    );
    fallbackSave(tasks);
  }
}

export async function readTasksFromIndexedDB(
  fallbackRead: () => JiraTask[]
): Promise<JiraTask[]> {
  try {
    const db = await openTTDb();
    const record = await new Promise<{ tasks: JiraTask[]; updatedAt?: string } | undefined>(
      (resolve, reject) => {
        const transaction = db.transaction(TASK_TRACKING_STORE, 'readonly');
        transaction.onabort = () => reject(new Error('Transação IndexedDB abortada'));
        const store = transaction.objectStore(TASK_TRACKING_STORE);
        const request = store.get(TT_TASKS_ID);
        request.onerror = () => reject(request.error);
        request.onsuccess = () =>
          resolve(request.result as { tasks: JiraTask[]; updatedAt?: string } | undefined);
      }
    );
    if (record?.tasks) {
      logger.debug(
        `Tasks carregadas do IndexedDB: ${record.tasks.length}`,
        'taskTrackingDbService'
      );
      return record.tasks;
    }
    logger.debug('Nenhuma task no IndexedDB, tentando localStorage', 'taskTrackingDbService');
  } catch (error) {
    logger.warn(
      'IndexedDB não disponível para task tracking, usando localStorage como fallback',
      'taskTrackingDbService',
      error
    );
  }
  return fallbackRead();
}

export async function clearTasksFromIndexedDB(): Promise<void> {
  try {
    const db = await openTTDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(TASK_TRACKING_STORE, 'readwrite');
      const store = transaction.objectStore(TASK_TRACKING_STORE);
      store.delete(TT_TASKS_ID);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Transação IndexedDB abortada'));
    });
    logger.debug('Tasks removidas do IndexedDB', 'taskTrackingDbService');
  } catch {
    /* fallback não necessário para delete */
  }
}

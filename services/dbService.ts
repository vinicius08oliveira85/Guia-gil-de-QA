import { Phase, PhaseName, Project } from '../types';
import type { VersionedProject } from '../utils/dataMigration';
import { normalizeProjectBusinessRules } from '../utils/businessRuleDefaults';
import { normalizeProjectWorkflowFields } from '../utils/projectWorkflow';
import {
  DB_NAME,
  DB_VERSION,
  LOCAL_FOLDER_HANDLES_STORE,
  PHASE_NAMES,
  STORE_NAME,
  TASK_TRACKING_STORE,
  TEST_GENERATION_CACHE_STORE,
} from '../utils/constants';
import { autoBackupBeforeOperation } from './backupService';
import { migrateTestCases } from '../utils/testCaseMigration';
import { migrateProject, CURRENT_PROJECT_SCHEMA_VERSION } from '../utils/dataMigration';
import { logger } from '../utils/logger';
import {
  cleanupTestCasesForProjects,
  cleanupTestCasesForNonTaskTypesSync,
} from '../utils/testCaseCleanup';
import { withAcyclicTaskParents } from '../utils/taskParentCycle';
import {
  collectFullAppStateBackup,
  restoreFullAppStateBackup,
  type FullAppStateBackup,
} from './fullLocalBackupService';
import {
  applyRuntimeAfterAppStateRestore,
  summarizeAppStateBackup,
  type AppStateRestoreSummary,
} from './appStateRestoreService';
import {
  readTaskTrackingSnapshot,
  restoreTaskTrackingFromBackup,
  type TaskTrackingSnapshot,
} from './taskTrackingStorage';

/** Versão do envelope JSON de backup (independente do DB_VERSION do IndexedDB). */
export const BACKUP_EXPORT_FORMAT_VERSION = 3;

let db: IDBDatabase | undefined;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onblocked = () => {
      logger.warn(
        'IndexedDB: upgrade bloqueado — outra aba ou processo mantém o banco aberto. Feche outras instâncias do app para concluir a migração.',
        'dbService'
      );
    };

    request.onerror = () => {
      const error = request.error || new Error('Erro desconhecido ao abrir banco de dados');
      logger.error('Erro ao abrir banco de dados IndexedDB', 'dbService', error);
      reject(error);
    };

    request.onsuccess = () => {
      const opened = request.result;
      opened.onversionchange = () => {
        logger.warn(
          'IndexedDB: nova versão solicitada; fechando conexão atual para permitir o upgrade.',
          'dbService'
        );
        opened.close();
        db = undefined;
      };
      db = opened;
      resolve(db);
    };

    request.onupgradeneeded = event => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(TEST_GENERATION_CACHE_STORE)) {
        dbInstance.createObjectStore(TEST_GENERATION_CACHE_STORE, { keyPath: 'taskId' });
      }
      if (!dbInstance.objectStoreNames.contains(LOCAL_FOLDER_HANDLES_STORE)) {
        dbInstance.createObjectStore(LOCAL_FOLDER_HANDLES_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(TASK_TRACKING_STORE)) {
        dbInstance.createObjectStore(TASK_TRACKING_STORE, { keyPath: 'id' });
      }
    };
  });
};

export type SaveResult = { savedToSupabase: boolean };

const defaultPhasesForImport = (): Phase[] =>
  PHASE_NAMES.map(name => ({
    name: name as PhaseName,
    status: 'Não Iniciado',
  }));

/**
 * Carrega projetos apenas do IndexedDB (carregamento rápido inicial)
 * Usado para mostrar UI imediatamente enquanto Supabase carrega em background
 */
export const loadProjectsFromIndexedDB = async (): Promise<Project[]> => {
  const db = await openDB();
  const indexedDBProjects = await new Promise<Project[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });

  // Aplicar migrações de schema + TestCases dos projetos do IndexedDB (otimizado)
  const migratedIndexedDBProjects = indexedDBProjects.map(raw =>
    normalizeProjectWorkflowFields(
      normalizeProjectBusinessRules(
        migrateProject({
          ...raw,
          businessRules: raw.businessRules ?? [],
          tasks: (raw.tasks || []).map(task => ({
            ...task,
            testCases: migrateTestCases(task.testCases || []),
          })),
        })
      )
    )
  );

  // Limpar casos de teste de tipos não permitidos (Bug, Epic, História)
  return cleanupTestCasesForProjects(migratedIndexedDBProjects).map(p =>
    withAcyclicTaskParents(p, { silent: true })
  );
};

/**
 * Obtém um projeto pelo id no IndexedDB (para verificar existência na importação).
 * Não consulta o Supabase.
 */
export const getProjectById = async (projectId: string): Promise<Project | null> => {
  const db = await openDB();
  const raw = await new Promise<Project | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(projectId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  if (!raw) return null;
  const migrated = normalizeProjectWorkflowFields(
    normalizeProjectBusinessRules(
      migrateProject({
        ...raw,
        businessRules: raw.businessRules ?? [],
        tasks: raw.tasks.map(task => ({
          ...task,
          testCases: migrateTestCases(task.testCases || []),
        })),
      })
    )
  );
  const [cleaned] = cleanupTestCasesForProjects([migrated]);
  if (!cleaned) return null;
  return withAcyclicTaskParents(normalizeProjectBusinessRules(cleaned), { silent: true });
};

/**
 * Carrega todos os projetos do IndexedDB (armazenamento local).
 */
export const getAllProjects = async (): Promise<Project[]> => {
  return loadProjectsFromIndexedDB();
};

export const addProject = async (project: Project): Promise<SaveResult> => {
  const cleanedProject = withAcyclicTaskParents(
    cleanupTestCasesForNonTaskTypesSync(
      normalizeProjectWorkflowFields(normalizeProjectBusinessRules(project))
    )
  );
  (cleanedProject as VersionedProject)._schemaVersion = CURRENT_PROJECT_SCHEMA_VERSION;

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(cleanedProject);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });

  return { savedToSupabase: false };
};

/**
 * Persiste o projeto no IndexedDB (armazenamento local).
 */
export const updateProject = async (
  project: Project,
  _options?: { syncRemote?: boolean }
): Promise<SaveResult> => {
  const cleanedProject = withAcyclicTaskParents(
    cleanupTestCasesForNonTaskTypesSync(
      normalizeProjectWorkflowFields(normalizeProjectBusinessRules(project))
    )
  );

  const totalStrategies = cleanedProject.tasks.reduce(
    (sum, task) => sum + (task.testStrategy?.length || 0),
    0
  );
  const totalExecutedStrategies = cleanedProject.tasks.reduce(
    (sum, task) => sum + (task.executedStrategies?.length || 0),
    0
  );
  if (totalStrategies > 0 || totalExecutedStrategies > 0) {
    logger.debug(
      `Salvando projeto com ${totalStrategies} estratégias de teste e ${totalExecutedStrategies} estratégias executadas`,
      'dbService',
      { projectId: cleanedProject.id, projectName: cleanedProject.name }
    );
  }

  await writeProjectToIndexedDBOnly(cleanedProject);
  return { savedToSupabase: false };
};

function stampSchemaVersion(p: Project): VersionedProject {
  (p as VersionedProject)._schemaVersion = CURRENT_PROJECT_SCHEMA_VERSION;
  return p as VersionedProject;
}

/**
 * Escreve um projeto apenas no IndexedDB (sem chamar Supabase).
 * Usado após Sincronizar (persistir lista final) e opcionalmente após Salvar (alinhar cache).
 * Aplica cleanup e migrateTestCases para manter consistência com o restante do app.
 */
export const writeProjectToIndexedDBOnly = async (project: Project): Promise<void> => {
  const cleaned = cleanupTestCasesForNonTaskTypesSync(normalizeProjectBusinessRules(project));
  const migrated: Project = {
    ...cleaned,
    tasks: cleaned.tasks.map(task => ({
      ...task,
      testCases: migrateTestCases(task.testCases || []),
    })),
  };
  const [toWrite] = cleanupTestCasesForProjects([migrated]);
  if (!toWrite) return;

  const toPersist = stampSchemaVersion(withAcyclicTaskParents(toWrite));

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(toPersist);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Normaliza um item de backup para Project; exige id e name. Demais campos recebem padrões seguros.
 */
function normalizeImportedProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id.trim()) {
    return null;
  }
  if (typeof o.name !== 'string') {
    return null;
  }
  const now = new Date().toISOString();
  const partial = raw as Partial<Project>;
  const base: Project = normalizeProjectWorkflowFields({
    ...partial,
    id: o.id.trim(),
    name: o.name,
    description: typeof o.description === 'string' ? o.description : '',
    documents: Array.isArray(o.documents) ? (o.documents as Project['documents']) : [],
    businessRules: Array.isArray(o.businessRules)
      ? (o.businessRules as Project['businessRules'])
      : [],
    tasks: Array.isArray(o.tasks) ? (o.tasks as Project['tasks']) : [],
    phases:
      Array.isArray(o.phases) && o.phases.length > 0
        ? (o.phases as Project['phases'])
        : defaultPhasesForImport(),
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : now,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : now,
  });
  return withAcyclicTaskParents(normalizeProjectBusinessRules(base));
}

function extractProjectsArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === 'object') {
    const envelope = parsed as { projects?: unknown; taskTracking?: unknown };
    if (Array.isArray(envelope.projects)) {
      return envelope.projects;
    }
    if (envelope.taskTracking !== undefined) {
      return [];
    }
  }
  throw new Error(
    'Formato de backup inválido: esperado um array de projetos ou um objeto com propriedade "projects" (array).'
  );
}

/** Envelope JSON de backup local (IndexedDB + Acompanhamento de Tarefas). */
export type LocalBackupEnvelope = {
  backupFormatVersion: number;
  dbVersion: number;
  exportedAt: string;
  app: string;
  projects: Project[];
  /** Acompanhamento de Tarefas (Filas Jira) — presente a partir do formato v2. */
  taskTracking?: TaskTrackingSnapshot;
  /** Preferências, workspace, credenciais, filtros e cache de IA — formato v3+. */
  appState?: FullAppStateBackup;
};

/**
 * Monta o objeto de backup a partir do IndexedDB (sem gravar arquivo).
 */
export const buildLocalBackupData = async (): Promise<LocalBackupEnvelope> => {
  const projects = await loadProjectsFromIndexedDB();
  const taskTracking = readTaskTrackingSnapshot();
  const appState = await collectFullAppStateBackup();
  return {
    backupFormatVersion: BACKUP_EXPORT_FORMAT_VERSION,
    dbVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'qa-agile-guide',
    projects,
    taskTracking,
    appState,
  };
};

/**
 * Exporta todos os projetos do IndexedDB para um arquivo JSON (backup manual via download do navegador).
 * Quando a File System Access API estiver disponível, prefira o fluxo em `fileSystemBackupService`.
 */
export const exportProjectsToBackup = async (): Promise<void> => {
  try {
    const backupData = await buildLocalBackupData();
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const datePart = new Date().toISOString().split('T')[0];
    link.download = `qa-agile-guide-backup-${datePart}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.info(`Backup local exportado: ${backupData.projects.length} projeto(s)`, 'dbService', {
      backupFormatVersion: BACKUP_EXPORT_FORMAT_VERSION,
      dbVersion: DB_VERSION,
    });
  } catch (error) {
    logger.error('Erro ao exportar backup local', 'dbService', error);
    throw error;
  }
};

/** Resultado da importação de backup JSON (IndexedDB e, opcionalmente, Supabase). */
export type ImportBackupResult = {
  imported: number;
  skipped: number;
  supabaseSynced: number;
  supabaseSyncFailed: number;
  /** Quantidade de tarefas restauradas no Acompanhamento de Tarefas (0 se ausente no arquivo). */
  taskTrackingTasksRestored: number;
  /** Indica se appState (configs, credenciais, preferências) foi restaurado (backup v3+). */
  appStateRestored: boolean;
  /** Resumo do appState restaurado; presente quando appStateRestored é true. */
  appStateSummary?: AppStateRestoreSummary;
};

/**
 * Importa projetos de um arquivo JSON para o IndexedDB (sobrescreve id existente via put).
 */
export const importProjectsFromBackup = async (
  file: File,
  _options?: { syncToSupabase?: boolean }
): Promise<ImportBackupResult> => {

  let text: string;
  try {
    text = await file.text();
  } catch (error) {
    logger.error('Erro ao ler arquivo de backup', 'dbService', error);
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    logger.error('JSON de backup inválido (parse)', 'dbService', error);
    throw new Error('Arquivo não é um JSON válido.');
  }

  const rawProjects = extractProjectsArray(parsed);
  let imported = 0;
  let skipped = 0;
  let taskTrackingTasksRestored = 0;

  const taskTrackingRaw =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as { taskTracking?: unknown }).taskTracking
      : undefined;
  if (taskTrackingRaw !== undefined) {
    const restored = restoreTaskTrackingFromBackup(taskTrackingRaw);
    if (restored) {
      const snapshot = readTaskTrackingSnapshot();
      taskTrackingTasksRestored = snapshot.tasks.length;
    }
  }

  const appStateRaw =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as { appState?: FullAppStateBackup }).appState
      : undefined;

  let appStateRestored = false;
  let appStateSummary: AppStateRestoreSummary | undefined;

  if (appStateRaw) {
    appStateSummary = summarizeAppStateBackup(appStateRaw);
    await restoreFullAppStateBackup(appStateRaw);
    await applyRuntimeAfterAppStateRestore(appStateSummary);
    appStateRestored = true;
  }

  for (let i = 0; i < rawProjects.length; i++) {
    const normalized = normalizeImportedProject(rawProjects[i]);
    if (!normalized) {
      skipped++;
      logger.debug(`Item ${i} ignorado no backup (id/nome inválidos)`, 'dbService');
      continue;
    }
    try {
      await writeProjectToIndexedDBOnly(normalized);
      imported++;
    } catch (error) {
      skipped++;
      logger.warn(`Falha ao importar projeto "${normalized.id}" do backup`, 'dbService', error);
    }
  }

  logger.info(
    `Importação de backup concluída: ${imported} projeto(s) gravados, ${skipped} ignorado(s)` +
      (taskTrackingTasksRestored > 0
        ? `; acompanhamento: ${taskTrackingTasksRestored} tarefa(s)`
        : '') +
      (appStateRestored ? '; appState restaurado' : ''),
    'dbService'
  );
  return {
    imported,
    skipped,
    supabaseSynced: 0,
    supabaseSyncFailed: 0,
    taskTrackingTasksRestored,
    appStateRestored,
    appStateSummary,
  };
};

/** @deprecated Use writeProjectToIndexedDBOnly — mantido para compatibilidade de testes. */
export const saveProjectToSupabaseOnly = async (project: Project): Promise<void> => {
  await writeProjectToIndexedDBOnly(project);
};

export const deleteProject = async (projectId: string): Promise<void> => {
  // Criar backup automático antes de deletar
  // Carregar projeto do IndexedDB para criar backup
  try {
    const db = await openDB();
    const project = await new Promise<Project | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(projectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });

    if (project) {
      const backupId = await autoBackupBeforeOperation(projectId, 'DELETE', () => project);

      if (backupId) {
        logger.debug(
          `Backup criado antes de deletar projeto no dbService: ${backupId}`,
          'dbService'
        );
      }
    }
  } catch (error) {
    logger.warn(
      'Erro ao criar backup antes de deletar (continuando com delete)',
      'dbService',
      error
    );
    // Continuar com delete mesmo se backup falhar
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(projectId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/** Chave fixa do handle da pasta de backup automático no IndexedDB. */
export const LOCAL_FOLDER_HANDLE_ID = 'backup';

type StoredLocalFolderHandle = {
  id: typeof LOCAL_FOLDER_HANDLE_ID;
  handle: FileSystemDirectoryHandle;
};

/**
 * Persiste o handle da pasta de backup automático no IndexedDB.
 */
export const saveLocalFolderDirectoryHandle = async (
  handle: FileSystemDirectoryHandle
): Promise<void> => {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(LOCAL_FOLDER_HANDLES_STORE, 'readwrite');
    const store = transaction.objectStore(LOCAL_FOLDER_HANDLES_STORE);
    const request = store.put({ id: LOCAL_FOLDER_HANDLE_ID, handle } satisfies StoredLocalFolderHandle);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Recupera o handle da pasta de backup automático, se configurado.
 */
export const getLocalFolderDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  const db = await openDB();
  const record = await new Promise<StoredLocalFolderHandle | undefined>((resolve, reject) => {
    const transaction = db.transaction(LOCAL_FOLDER_HANDLES_STORE, 'readonly');
    const store = transaction.objectStore(LOCAL_FOLDER_HANDLES_STORE);
    const request = store.get(LOCAL_FOLDER_HANDLE_ID);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as StoredLocalFolderHandle | undefined);
  });
  return record?.handle ?? null;
};

/**
 * Remove o handle da pasta de backup automático do IndexedDB.
 */
export const clearLocalFolderDirectoryHandle = async (): Promise<void> => {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(LOCAL_FOLDER_HANDLES_STORE, 'readwrite');
    const store = transaction.objectStore(LOCAL_FOLDER_HANDLES_STORE);
    const request = store.delete(LOCAL_FOLDER_HANDLE_ID);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

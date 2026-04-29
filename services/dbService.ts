import { Phase, PhaseName, Project } from '../types';
import { normalizeProjectBusinessRules } from '../utils/businessRuleDefaults';
import { DB_NAME, DB_VERSION, PHASE_NAMES, STORE_NAME } from '../utils/constants';
import {
  isSupabaseAvailable,
  saveProjectToSupabase,
  loadProjectsFromSupabase,
  deleteProjectFromSupabase,
} from './supabaseService';
import { autoBackupBeforeOperation } from './backupService';
import { migrateTestCases } from '../utils/testCaseMigration';
import { logger } from '../utils/logger';
import { cleanupTestCasesForProjects, cleanupTestCasesForNonTaskTypesSync } from '../utils/testCaseCleanup';
import { withAcyclicTaskParents } from '../utils/taskParentCycle';

/** Versão do envelope JSON de backup (independente do DB_VERSION do IndexedDB). */
export const BACKUP_EXPORT_FORMAT_VERSION = 1;

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      const error = request.error || new Error('Erro desconhecido ao abrir banco de dados');
      logger.error('Erro ao abrir banco de dados IndexedDB', 'dbService', error);
      reject(error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export type SaveResult = { savedToSupabase: boolean };

const defaultPhasesForImport = (): Phase[] =>
  PHASE_NAMES.map((name) => ({
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

  // Migrar TestCases dos projetos do IndexedDB (otimizado)
  const migratedIndexedDBProjects = indexedDBProjects.map((project) =>
    normalizeProjectBusinessRules({
      ...project,
      businessRules: project.businessRules ?? [],
      tasks: (project.tasks || []).map((task) => ({
        ...task,
        testCases: migrateTestCases(task.testCases || []),
      })),
    })
  );

  // Limpar casos de teste de tipos não permitidos (Bug, Epic, História)
  return cleanupTestCasesForProjects(migratedIndexedDBProjects).map((p) =>
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
  const migrated = normalizeProjectBusinessRules({
    ...raw,
    businessRules: raw.businessRules ?? [],
    tasks: raw.tasks.map(task => ({
      ...task,
      testCases: migrateTestCases(task.testCases || []),
    })),
  });
  const [cleaned] = cleanupTestCasesForProjects([migrated]);
  if (!cleaned) return null;
  return withAcyclicTaskParents(normalizeProjectBusinessRules(cleaned), { silent: true });
};

/**
 * Carrega todos os projetos (IndexedDB + Supabase).
 * Local-first: qualquer falha crítica no merge com a nuvem retorna somente os dados do IndexedDB.
 */
export const getAllProjects = async (): Promise<Project[]> => {
  let indexedDBProjects: Project[] = [];
  try {
    indexedDBProjects = await loadProjectsFromIndexedDB();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error(
      'Erro crítico ao ler IndexedDB em getAllProjects; não há fallback sem dados locais',
      'dbService',
      { message, stack, error }
    );
    throw error;
  }

  if (!isSupabaseAvailable()) {
    return indexedDBProjects;
  }

  try {
    const { projects: supabaseProjects, loadFailed, errorMessage } = await loadProjectsFromSupabase();

    if (loadFailed) {
      logger.warn(
        'Supabase indisponível (local-first); usando apenas dados do IndexedDB',
        'dbService',
        errorMessage ? { errorMessage } : undefined
      );
      return indexedDBProjects;
    }

    try {
      const migratedSupabaseProjects = supabaseProjects.map((project) =>
        normalizeProjectBusinessRules({
          ...project,
          businessRules: project.businessRules ?? [],
          tasks: (project.tasks || []).map((task) => ({
            ...task,
            testCases: migrateTestCases(task.testCases || []),
          })),
        })
      );

      const projectsMap = new Map<string, Project>();
      indexedDBProjects.forEach((project) => {
        projectsMap.set(project.id, project);
      });
      migratedSupabaseProjects.forEach((project) => {
        projectsMap.set(project.id, project);
      });

      const mergedProjects = Array.from(projectsMap.values());
      const cleanedProjects = cleanupTestCasesForProjects(mergedProjects);

      if (supabaseProjects.length === 0 && indexedDBProjects.length > 0) {
        logger.info(`Usando projetos do cache local: ${indexedDBProjects.length}`, 'dbService');
      } else if (supabaseProjects.length > 0) {
        logger.info(
          `${cleanedProjects.length} projetos carregados (${supabaseProjects.length} do Supabase + ${indexedDBProjects.length} do cache local)`,
          'dbService'
        );
      }

      return cleanedProjects.map((p) => withAcyclicTaskParents(p, { silent: true }));
    } catch (mergeError) {
      const message = mergeError instanceof Error ? mergeError.message : String(mergeError);
      const stack = mergeError instanceof Error ? mergeError.stack : undefined;
      logger.error(
        'Erro crítico no merge/processamento dos dados do Supabase em getAllProjects; retornando apenas IndexedDB',
        'dbService',
        { message, stack, phase: 'merge-cleanup', error: mergeError }
      );
      return indexedDBProjects;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error(
      'Erro crítico ao integrar Supabase em getAllProjects; retornando apenas IndexedDB (fallback total)',
      'dbService',
      { message, stack, phase: 'supabase-load-or-merge', error }
    );
    return indexedDBProjects;
  }
};

export const addProject = async (project: Project): Promise<SaveResult> => {
  const cleanedProject = withAcyclicTaskParents(
    cleanupTestCasesForNonTaskTypesSync(normalizeProjectBusinessRules(project))
  );

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

// Rastrear últimos erros de rede por projeto para evitar tentativas repetidas
const recentNetworkErrors = new Map<string, number>();
const networkErrorCooldownMs = 5000; // 5 segundos de cooldown após erro de rede (reduzido para ser mais responsivo)

/**
 * Persiste o projeto no IndexedDB.
 * @param options.syncRemote - Se true, também envia ao Supabase (salvamento explícito). O padrão é só local.
 */
export const updateProject = async (
  project: Project,
  options?: { syncRemote?: boolean }
): Promise<SaveResult> => {
  const cleanedProject = withAcyclicTaskParents(
    cleanupTestCasesForNonTaskTypesSync(normalizeProjectBusinessRules(project))
  );
  const syncRemote = options?.syncRemote === true;

  const totalStrategies = cleanedProject.tasks.reduce((sum, task) => sum + (task.testStrategy?.length || 0), 0);
  const totalExecutedStrategies = cleanedProject.tasks.reduce((sum, task) => sum + (task.executedStrategies?.length || 0), 0);
  if (totalStrategies > 0 || totalExecutedStrategies > 0) {
    logger.debug(
      `Salvando projeto com ${totalStrategies} estratégias de teste e ${totalExecutedStrategies} estratégias executadas`,
      'dbService',
      { projectId: cleanedProject.id, projectName: cleanedProject.name }
    );
  }

  if (!syncRemote) {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cleanedProject);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
    return { savedToSupabase: false };
  }

  const lastNetworkError = recentNetworkErrors.get(cleanedProject.id);
  const now = Date.now();
  const shouldSkipSupabase = lastNetworkError && (now - lastNetworkError) < networkErrorCooldownMs;

  if (isSupabaseAvailable()) {
    if (shouldSkipSupabase) {
      logger.debug(`Projeto "${cleanedProject.name}" em cooldown, salvando localmente primeiro e tentando Supabase em background`, 'dbService');
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(cleanedProject);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      saveProjectToSupabase(cleanedProject).then(() => {
        recentNetworkErrors.delete(cleanedProject.id);
        logger.debug(`Projeto "${cleanedProject.name}" salvo no Supabase após cooldown`, 'dbService');
      }).catch((error) => {
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        const isNetworkErr = errorMessage.includes('timeout') || errorMessage.includes('connection reset') ||
          errorMessage.includes('err_timed_out') || errorMessage.includes('err_connection_reset') ||
          errorMessage.includes('err_name_not_resolved') || errorMessage.includes('failed to fetch') || errorMessage.includes('network');
        if (isNetworkErr) {
          recentNetworkErrors.set(cleanedProject.id, Date.now());
        }
      });
      return { savedToSupabase: false };
    }

    try {
      await saveProjectToSupabase(cleanedProject);
      recentNetworkErrors.delete(cleanedProject.id);
      logger.debug(`Projeto "${cleanedProject.name}" salvo no Supabase`, 'dbService');
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(cleanedProject);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      return { savedToSupabase: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isNetworkErr = errorMessage.includes('timeout') || errorMessage.includes('connection reset') ||
        errorMessage.includes('err_timed_out') || errorMessage.includes('err_connection_reset') ||
        errorMessage.includes('err_name_not_resolved') || errorMessage.includes('failed to fetch') || errorMessage.includes('network');
      if (isNetworkErr) {
        recentNetworkErrors.set(cleanedProject.id, now);
        logger.debug('Erro de rede ao salvar no Supabase, usando apenas IndexedDB (cooldown ativado)', 'dbService');
      } else {
        const isLocalOnlyOrTooBig = errorMessage.includes('salvo apenas localmente') || errorMessage.includes('muito grande');
        if (isLocalOnlyOrTooBig) {
          logger.debug('Erro ao salvar no Supabase, usando apenas IndexedDB', 'dbService', error);
        } else {
          logger.warn('Erro ao salvar no Supabase, usando apenas IndexedDB', 'dbService', error);
        }
      }
    }
  }

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(cleanedProject);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
  return { savedToSupabase: false };
};

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

  const toPersist = withAcyclicTaskParents(toWrite);

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
  const base: Project = {
    ...partial,
    id: o.id.trim(),
    name: o.name,
    description: typeof o.description === 'string' ? o.description : '',
    documents: Array.isArray(o.documents) ? (o.documents as Project['documents']) : [],
    businessRules: Array.isArray(o.businessRules) ? (o.businessRules as Project['businessRules']) : [],
    tasks: Array.isArray(o.tasks) ? (o.tasks as Project['tasks']) : [],
    phases:
      Array.isArray(o.phases) && o.phases.length > 0
        ? (o.phases as Project['phases'])
        : defaultPhasesForImport(),
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : now,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : now,
  };
  return withAcyclicTaskParents(normalizeProjectBusinessRules(base));
}

function extractProjectsArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { projects?: unknown }).projects)) {
    return (parsed as { projects: unknown[] }).projects;
  }
  throw new Error(
    'Formato de backup inválido: esperado um array de projetos ou um objeto com propriedade "projects" (array).'
  );
}

/** Envelope JSON de backup local (IndexedDB), usado em exportação por download ou File System Access API. */
export type LocalBackupEnvelope = {
  backupFormatVersion: number;
  dbVersion: number;
  exportedAt: string;
  app: string;
  projects: Project[];
};

/**
 * Monta o objeto de backup a partir do IndexedDB (sem gravar arquivo).
 */
export const buildLocalBackupData = async (): Promise<LocalBackupEnvelope> => {
  const projects = await loadProjectsFromIndexedDB();
  return {
    backupFormatVersion: BACKUP_EXPORT_FORMAT_VERSION,
    dbVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'qa-agile-guide',
    projects,
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
};

/**
 * Importa projetos de um arquivo JSON para o IndexedDB (sobrescreve id existente via put).
 * Aplica migrateTestCases e cleanup via writeProjectToIndexedDBOnly.
 * @param options.syncToSupabase — Se true e o Supabase estiver disponível, tenta enviar cada projeto importado após gravar localmente.
 */
export const importProjectsFromBackup = async (
  file: File,
  options?: { syncToSupabase?: boolean }
): Promise<ImportBackupResult> => {
  const trySyncRemote = options?.syncToSupabase === true && isSupabaseAvailable();

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
  let supabaseSynced = 0;
  let supabaseSyncFailed = 0;

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
      if (trySyncRemote) {
        try {
          await saveProjectToSupabase(normalized);
          supabaseSynced++;
        } catch (syncError) {
          supabaseSyncFailed++;
          logger.warn(
            `Projeto "${normalized.id}" importado localmente, mas falhou o envio ao Supabase`,
            'dbService',
            syncError
          );
        }
      }
    } catch (error) {
      skipped++;
      logger.warn(`Falha ao importar projeto "${normalized.id}" do backup`, 'dbService', error);
    }
  }

  logger.info(
    `Importação de backup concluída: ${imported} projeto(s) gravados, ${skipped} ignorado(s)` +
      (trySyncRemote
        ? `; Supabase: ${supabaseSynced} ok, ${supabaseSyncFailed} falha(s)`
        : ''),
    'dbService'
  );
  return { imported, skipped, supabaseSynced, supabaseSyncFailed };
};

/**
 * Salva um projeto apenas no Supabase (sem salvar no IndexedDB)
 * Usado para salvamento manual pelo usuário
 */
export const saveProjectToSupabaseOnly = async (project: Project): Promise<void> => {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase não está disponível. Configure VITE_SUPABASE_PROXY_URL.');
  }
  
  await saveProjectToSupabase(project);
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
            const backupId = await autoBackupBeforeOperation(
                projectId,
                'DELETE',
                () => project
            );
            
            if (backupId) {
                logger.debug(`Backup criado antes de deletar projeto no dbService: ${backupId}`, 'dbService');
            }
        }
    } catch (error) {
        logger.warn('Erro ao criar backup antes de deletar (continuando com delete)', 'dbService', error);
        // Continuar com delete mesmo se backup falhar
    }
    
    // Tentar Supabase primeiro se disponível
    if (isSupabaseAvailable()) {
        try {
            await deleteProjectFromSupabase(projectId);
            // Também deletar do IndexedDB
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(projectId);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        } catch (error) {
            logger.warn('Erro ao deletar do Supabase, usando apenas IndexedDB', 'dbService', error);
            // Continuar para fallback IndexedDB
        }
    }
    
    // Fallback para IndexedDB
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(projectId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

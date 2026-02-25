
import { Project } from '../types';
import { DB_NAME, DB_VERSION, STORE_NAME } from '../utils/constants';
import { 
    isSupabaseAvailable, 
    saveProjectToSupabase, 
    loadProjectsFromSupabase, 
    deleteProjectFromSupabase 
} from './supabaseService';
import { autoBackupBeforeOperation } from './backupService';
import { migrateTestCases } from '../utils/testCaseMigration';
import { logger } from '../utils/logger';

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

import { cleanupTestCasesForProjects, cleanupTestCasesForNonTaskTypesSync } from '../utils/testCaseCleanup';

export type SaveResult = { savedToSupabase: boolean };

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
  const migratedIndexedDBProjects = indexedDBProjects.map(project => ({
    ...project,
    tasks: project.tasks.map(task => ({
      ...task,
      testCases: migrateTestCases(task.testCases || [])
    }))
  }));

  // Limpar casos de teste de tipos não permitidos (Bug, Epic, História)
  return cleanupTestCasesForProjects(migratedIndexedDBProjects);
};

/**
 * Carrega todos os projetos (IndexedDB + Supabase)
 * Mantido para compatibilidade, mas agora getAllProjects() usa carregamento em duas fases
 */
export const getAllProjects = async (): Promise<Project[]> => {
  // Fase 1: Carregar rapidamente do IndexedDB
  const indexedDBProjects = await loadProjectsFromIndexedDB();

  // Se Supabase está disponível, fazer merge com IndexedDB
  if (isSupabaseAvailable()) {
    try {
      const { projects: supabaseProjects } = await loadProjectsFromSupabase();

      // Migrar TestCases dos projetos do Supabase (otimizado)
      const migratedSupabaseProjects = supabaseProjects.map(project => ({
        ...project,
        tasks: project.tasks.map(task => ({
          ...task,
          testCases: migrateTestCases(task.testCases || [])
        }))
      }));
      
      // Fazer merge: criar um Map com ID como chave, priorizando Supabase
      const projectsMap = new Map<string, Project>();
      
      // Primeiro adicionar projetos do IndexedDB (já migrados)
      indexedDBProjects.forEach(project => {
        projectsMap.set(project.id, project);
      });
      
      // Depois sobrescrever/atualizar com projetos do Supabase (prioridade, já migrados)
      migratedSupabaseProjects.forEach(project => {
        projectsMap.set(project.id, project);
      });
      
      const mergedProjects = Array.from(projectsMap.values());
      
      // Limpar casos de teste de tipos não permitidos (Bug, Epic, História)
      const cleanedProjects = cleanupTestCasesForProjects(mergedProjects);
      
      if (supabaseProjects.length === 0 && indexedDBProjects.length > 0) {
        logger.info(`Usando projetos do cache local: ${indexedDBProjects.length}`, 'dbService');
      } else if (supabaseProjects.length > 0) {
        logger.info(`${cleanedProjects.length} projetos carregados (${supabaseProjects.length} do Supabase + ${indexedDBProjects.length} do cache local)`, 'dbService');
      }
      
      return cleanedProjects;
    } catch (error) {
      logger.warn('Erro ao carregar do Supabase, usando apenas IndexedDB', 'dbService', error);
      // Retornar projetos do IndexedDB em caso de erro (já migrados e limpos)
      return indexedDBProjects;
    }
  }
  
  // Se Supabase não está disponível, retornar apenas IndexedDB (já migrados e limpos)
  return indexedDBProjects;
};

export const addProject = async (project: Project): Promise<SaveResult> => {
  const cleanedProject = cleanupTestCasesForNonTaskTypesSync(project);

  if (isSupabaseAvailable()) {
    try {
      await saveProjectToSupabase(cleanedProject);
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(cleanedProject);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      return { savedToSupabase: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const isLocalOnlyOrTooBig = msg.includes('salvo apenas localmente') || msg.includes('muito grande');
      if (isLocalOnlyOrTooBig) {
        logger.debug('Erro ao salvar no Supabase, usando apenas IndexedDB', 'dbService', error);
      } else {
        logger.warn('Erro ao salvar no Supabase, usando apenas IndexedDB', 'dbService', error);
      }
    }
  }

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

export const updateProject = async (project: Project): Promise<SaveResult> => {
  const cleanedProject = cleanupTestCasesForNonTaskTypesSync(project);

  const totalStrategies = cleanedProject.tasks.reduce((sum, task) => sum + (task.testStrategy?.length || 0), 0);
  const totalExecutedStrategies = cleanedProject.tasks.reduce((sum, task) => sum + (task.executedStrategies?.length || 0), 0);
  if (totalStrategies > 0 || totalExecutedStrategies > 0) {
    logger.debug(
      `Salvando projeto com ${totalStrategies} estratégias de teste e ${totalExecutedStrategies} estratégias executadas`,
      'dbService',
      { projectId: cleanedProject.id, projectName: cleanedProject.name }
    );
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

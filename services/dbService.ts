
import { Project } from '../types';
import { DB_NAME, DB_VERSION, STORE_NAME } from '../utils/constants';
import { 
    isSupabaseAvailable, 
    saveProjectToSupabase, 
    loadProjectsFromSupabase, 
    deleteProjectFromSupabase 
} from './supabaseService';
import { migrateTestCases } from '../utils/testCaseMigration';

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Database error:", request.error);
      reject("Database error");
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

import { cleanupTestCasesForProjects, cleanupTestCasesForNonTaskTypes } from '../utils/testCaseCleanup';

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
      const supabaseProjects = await loadProjectsFromSupabase();
      
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
        console.log(`📦 Usando projetos do cache local: ${indexedDBProjects.length}`);
      } else if (supabaseProjects.length > 0) {
        console.log(`✅ ${cleanedProjects.length} projetos carregados (${supabaseProjects.length} do Supabase + ${indexedDBProjects.length} do cache local)`);
      }
      
      return cleanedProjects;
    } catch (error) {
      console.warn('⚠️ Erro ao carregar do Supabase, usando apenas IndexedDB:', error);
      // Retornar projetos do IndexedDB em caso de erro (já migrados e limpos)
      return indexedDBProjects;
    }
  }
  
  // Se Supabase não está disponível, retornar apenas IndexedDB (já migrados e limpos)
  return indexedDBProjects;
};

export const addProject = async (project: Project): Promise<void> => {
  // Limpar BDD e casos de teste de tipos não permitidos antes de salvar
  const cleanedProject = cleanupTestCasesForNonTaskTypes(project);
  
  // Tentar Supabase primeiro se disponível
  if (isSupabaseAvailable()) {
    try {
      await saveProjectToSupabase(cleanedProject);
      // Também salvar no IndexedDB como backup local
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(cleanedProject);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('⚠️ Erro ao salvar no Supabase, usando apenas IndexedDB:', error);
      // Continuar para fallback IndexedDB
    }
  }
  
  // Fallback para IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(cleanedProject);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const updateProject = async (project: Project): Promise<void> => {
  // Limpar BDD e casos de teste de tipos não permitidos antes de salvar
  const cleanedProject = cleanupTestCasesForNonTaskTypes(project);
  
  // Salvar apenas no IndexedDB (salvamento no Supabase é manual)
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(cleanedProject);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
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
            console.warn('⚠️ Erro ao deletar do Supabase, usando apenas IndexedDB:', error);
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

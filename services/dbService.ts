
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

import { cleanupTestCasesForProjects } from '../utils/testCaseCleanup';

export const getAllProjects = async (): Promise<Project[]> => {
  // Sempre carregar do IndexedDB como base
  const db = await openDB();
  const indexedDBProjects = await new Promise<Project[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });

  // Migrar TestCases dos projetos do IndexedDB
  const migratedIndexedDBProjects = indexedDBProjects.map(project => ({
    ...project,
    tasks: project.tasks.map(task => ({
      ...task,
      testCases: migrateTestCases(task.testCases || [])
    }))
  }));

  // Se Supabase está disponível, fazer merge com IndexedDB
  if (isSupabaseAvailable()) {
    try {
      const supabaseProjects = await loadProjectsFromSupabase();
      
      // Migrar TestCases dos projetos do Supabase
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
      migratedIndexedDBProjects.forEach(project => {
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
      // Retornar projetos do IndexedDB em caso de erro (já migrados)
      // Limpar casos de teste de tipos não permitidos (Bug, Epic, História)
      return cleanupTestCasesForProjects(migratedIndexedDBProjects);
    }
  }
  
  // Se Supabase não está disponível, retornar apenas IndexedDB (já migrados)
  // Limpar casos de teste de tipos não permitidos (Bug, Epic, História)
  return cleanupTestCasesForProjects(migratedIndexedDBProjects);
};

export const addProject = async (project: Project): Promise<void> => {
  // Tentar Supabase primeiro se disponível
  if (isSupabaseAvailable()) {
    try {
      await saveProjectToSupabase(project);
      // Também salvar no IndexedDB como backup local
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(project);
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
    const request = store.add(project);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const updateProject = async (project: Project): Promise<void> => {
  // Tentar Supabase primeiro se disponível
  if (isSupabaseAvailable()) {
    try {
      await saveProjectToSupabase(project);
      // Também atualizar no IndexedDB como backup local
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(project);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('⚠️ Erro ao atualizar no Supabase, usando apenas IndexedDB:', error);
      // Continuar para fallback IndexedDB
    }
  }
  
  // Fallback para IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(project);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
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

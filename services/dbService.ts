
import { Project } from '../types';
import { DB_NAME, DB_VERSION, STORE_NAME } from '../utils/constants';
import { 
    isSupabaseAvailable, 
    saveProjectToSupabase, 
    loadProjectsFromSupabase, 
    deleteProjectFromSupabase 
} from './supabaseService';

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

export const getAllProjects = async (): Promise<Project[]> => {
  // Tentar Supabase primeiro se disponível
  if (isSupabaseAvailable()) {
    try {
      return await loadProjectsFromSupabase();
    } catch (error) {
      console.warn('⚠️ Erro ao carregar do Supabase, usando IndexedDB:', error);
      // Continuar para fallback IndexedDB
    }
  }
  
  // Fallback para IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
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

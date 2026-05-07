/**
 * Camada de persistência (IndexedDB) para o cache de `TestGenerationArtifacts`.
 *
 * - Store dedicado `TEST_GENERATION_CACHE_STORE` com `taskId` como chave.
 * - Operações são best-effort: falhas são logadas mas nunca propagadas
 *   (o serviço de geração consegue funcionar apenas com o cache em memória).
 * - Compatível com ambientes sem IndexedDB (SSR, testes em ambientes minimalistas):
 *   todas as funções viram no-op silencioso.
 */

import type { TestGenerationArtifacts } from './testCaseGenerationService';
import { DB_NAME, DB_VERSION, TEST_GENERATION_CACHE_STORE } from '../../utils/constants';
import { logger } from '../../utils/logger';

const LOGGER_CONTEXT = 'testCaseGenerationCache';

export interface PersistedCacheEntry {
  taskId: string;
  hash: string;
  expiresAt: number;
  artifacts: TestGenerationArtifacts;
}

const isIndexedDBAvailable = (): boolean => {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
};

let dbPromise: Promise<IDBDatabase> | null = null;

const openCacheDB = (): Promise<IDBDatabase> => {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB indisponível neste ambiente'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error('Erro ao abrir IndexedDB'));
    };

    request.onsuccess = () => {
      const database = request.result;
      // Se o store não existir (ex.: outra aba abriu o DB com versão antiga),
      // sinalizar erro para fallback gracioso em vez de levantar exceção tardia.
      if (!database.objectStoreNames.contains(TEST_GENERATION_CACHE_STORE)) {
        database.close();
        dbPromise = null;
        reject(new Error(`Store ${TEST_GENERATION_CACHE_STORE} não encontrado`));
        return;
      }
      resolve(database);
    };

    request.onupgradeneeded = event => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(TEST_GENERATION_CACHE_STORE)) {
        database.createObjectStore(TEST_GENERATION_CACHE_STORE, { keyPath: 'taskId' });
      }
    };
  });

  return dbPromise;
};

/**
 * Lê o entry persistido para a task, ou `null` se ausente/expirado/erro.
 */
export async function loadPersistedCacheEntry(
  taskId: string
): Promise<PersistedCacheEntry | null> {
  if (!isIndexedDBAvailable() || !taskId) return null;

  try {
    const database = await openCacheDB();
    return await new Promise<PersistedCacheEntry | null>((resolve, reject) => {
      const transaction = database.transaction(TEST_GENERATION_CACHE_STORE, 'readonly');
      const store = transaction.objectStore(TEST_GENERATION_CACHE_STORE);
      const request = store.get(taskId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result as PersistedCacheEntry | undefined;
        if (!entry) return resolve(null);
        if (typeof entry.expiresAt === 'number' && entry.expiresAt < Date.now()) {
          // Expirado — agendar limpeza assíncrona e retornar null.
          deletePersistedCacheEntry(taskId).catch(() => undefined);
          return resolve(null);
        }
        resolve(entry);
      };
    });
  } catch (error) {
    logger.warn('Falha ao ler cache persistido (ignorando)', LOGGER_CONTEXT, error);
    return null;
  }
}

/**
 * Persiste um entry no cache. Erros são logados mas não propagados.
 */
export async function savePersistedCacheEntry(entry: PersistedCacheEntry): Promise<void> {
  if (!isIndexedDBAvailable() || !entry?.taskId) return;

  try {
    const database = await openCacheDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(TEST_GENERATION_CACHE_STORE, 'readwrite');
      const store = transaction.objectStore(TEST_GENERATION_CACHE_STORE);
      const request = store.put(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    logger.warn('Falha ao persistir cache (ignorando)', LOGGER_CONTEXT, error);
  }
}

/**
 * Remove o entry de uma task. Sem efeito se IndexedDB indisponível ou erro.
 */
export async function deletePersistedCacheEntry(taskId: string): Promise<void> {
  if (!isIndexedDBAvailable() || !taskId) return;

  try {
    const database = await openCacheDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(TEST_GENERATION_CACHE_STORE, 'readwrite');
      const store = transaction.objectStore(TEST_GENERATION_CACHE_STORE);
      const request = store.delete(taskId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    logger.warn(
      `Falha ao remover entry persistido (${taskId}); ignorando`,
      LOGGER_CONTEXT,
      error
    );
  }
}

/**
 * Limpa todo o cache persistido. Sem efeito se IndexedDB indisponível.
 */
export async function clearPersistedCache(): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  try {
    const database = await openCacheDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(TEST_GENERATION_CACHE_STORE, 'readwrite');
      const store = transaction.objectStore(TEST_GENERATION_CACHE_STORE);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    logger.warn('Falha ao limpar cache persistido (ignorando)', LOGGER_CONTEXT, error);
  }
}

/**
 * Remove entradas expiradas do store (TTL ultrapassado).
 * Retorna quantas linhas foram removidas. Erros são engolidos (best-effort).
 */
export async function cleanupExpiredTestGenerationCacheEntries(): Promise<number> {
  if (!isIndexedDBAvailable()) return 0;

  let removed = 0;
  const now = Date.now();

  try {
    const database = await openCacheDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(TEST_GENERATION_CACHE_STORE, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('Erro na transação de limpeza do cache'));
      const store = transaction.objectStore(TEST_GENERATION_CACHE_STORE);
      const request = store.openCursor();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result as IDBCursorWithValue | null;
        if (!cursor) return;
        const entry = cursor.value as PersistedCacheEntry;
        if (typeof entry.expiresAt === 'number' && entry.expiresAt < now) {
          cursor.delete();
          removed++;
        }
        cursor.continue();
      };
    });
  } catch (error) {
    logger.warn('Falha ao limpar entradas expiradas do cache (ignorando)', LOGGER_CONTEXT, error);
  }

  if (removed > 0) {
    logger.info(`Cache testGeneration: ${removed} entrada(s) expirada(s) removida(s)`, LOGGER_CONTEXT);
  }
  return removed;
}

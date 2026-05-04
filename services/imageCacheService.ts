import { logger } from '../utils/logger';

/**
 * Metadata armazenada junto com o blob no cache
 */
export interface CacheMetadata {
  url: string;
  timestamp: number;
  size: number;
  mimeType?: string;
  lastAccessed: number;
}

/**
 * Resultado de uma operação de cache
 */
export interface CacheResult {
  blob: Blob | null;
  metadata: CacheMetadata | null;
  fromCache: boolean;
}

/**
 * Configuração do cache
 */
export interface CacheConfig {
  maxSize?: number; // Tamanho máximo em bytes
  maxAge?: number; // Idade máxima em milissegundos
  maxEntries?: number; // Número máximo de entradas
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
  maxSize: 100 * 1024 * 1024, // 100MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  maxEntries: 1000,
};

const DB_NAME = 'jira-media-cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';

/**
 * Serviço para gerenciar cache persistente de imagens usando IndexedDB
 */
export class ImageCacheService {
  private static instance: ImageCacheService;
  private db: IDBDatabase | null = null;
  private config: Required<CacheConfig>;
  private initPromise: Promise<void> | null = null;

  private constructor(config: CacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: CacheConfig): ImageCacheService {
    if (!ImageCacheService.instance) {
      ImageCacheService.instance = new ImageCacheService(config);
    }
    return ImageCacheService.instance;
  }

  /**
   * Inicializa o banco de dados IndexedDB
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        logger.warn('IndexedDB não está disponível, cache desabilitado', 'ImageCacheService');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Erro ao abrir IndexedDB', 'ImageCacheService', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Obtém uma imagem do cache
   */
  async get(url: string): Promise<CacheResult> {
    await this.init();

    if (!this.db) {
      return { blob: null, metadata: null, fromCache: false };
    }

    return new Promise(resolve => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;

        if (!result) {
          resolve({ blob: null, metadata: null, fromCache: false });
          return;
        }

        // Verificar se expirou
        const age = Date.now() - result.metadata.timestamp;
        if (age > this.config.maxAge) {
          // Remover entrada expirada
          this.delete(url);
          resolve({ blob: null, metadata: null, fromCache: false });
          return;
        }

        // Atualizar lastAccessed
        result.metadata.lastAccessed = Date.now();
        this.set(url, result.blob, result.metadata.mimeType, true);

        resolve({
          blob: result.blob,
          metadata: result.metadata,
          fromCache: true,
        });
      };

      request.onerror = () => {
        logger.error('Erro ao ler do cache', 'ImageCacheService', request.error);
        resolve({ blob: null, metadata: null, fromCache: false });
      };
    });
  }

  /**
   * Armazena uma imagem no cache
   */
  async set(url: string, blob: Blob, mimeType?: string, skipCleanup = false): Promise<boolean> {
    await this.init();

    if (!this.db) {
      return false;
    }

    // Verificar tamanho antes de adicionar
    if (blob.size > this.config.maxSize) {
      logger.warn(`Imagem muito grande para cache: ${blob.size} bytes`, 'ImageCacheService');
      return false;
    }

    return new Promise(resolve => {
      const metadata: CacheMetadata = {
        url,
        timestamp: Date.now(),
        size: blob.size,
        mimeType,
        lastAccessed: Date.now(),
      };

      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ url, blob, metadata });

      request.onsuccess = async () => {
        if (!skipCleanup) {
          await this.cleanup();
        }
        resolve(true);
      };

      request.onerror = () => {
        logger.error('Erro ao salvar no cache', 'ImageCacheService', request.error);
        resolve(false);
      };
    });
  }

  /**
   * Remove uma entrada do cache
   */
  async delete(url: string): Promise<boolean> {
    await this.init();

    if (!this.db) {
      return false;
    }

    return new Promise(resolve => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(url);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        logger.error('Erro ao deletar do cache', 'ImageCacheService', request.error);
        resolve(false);
      };
    });
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<boolean> {
    await this.init();

    if (!this.db) {
      return false;
    }

    return new Promise(resolve => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        logger.error('Erro ao limpar cache', 'ImageCacheService', request.error);
        resolve(false);
      };
    });
  }

  /**
   * Limpa entradas antigas ou que excedem os limites
   */
  private async cleanup(): Promise<void> {
    if (!this.db) return;

    return new Promise(resolve => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('lastAccessed');
      const request = index.openCursor(null, 'next');

      const entries: Array<{ url: string; size: number; lastAccessed: number }> = [];
      let totalSize = 0;

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const entry = cursor.value;
          entries.push({
            url: entry.url,
            size: entry.metadata.size,
            lastAccessed: entry.metadata.lastAccessed,
          });
          totalSize += entry.metadata.size;
          cursor.continue();
        } else {
          // Ordenar por lastAccessed (mais antigo primeiro)
          entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

          // Remover entradas antigas
          const now = Date.now();
          const toDelete: string[] = [];

          for (const entry of entries) {
            const age = now - entry.lastAccessed;
            if (age > this.config.maxAge) {
              toDelete.push(entry.url);
            }
          }

          // Remover entradas excedentes (LRU)
          if (entries.length > this.config.maxEntries) {
            const excess = entries.length - this.config.maxEntries;
            for (let i = 0; i < excess; i++) {
              toDelete.push(entries[i].url);
            }
          }

          // Remover entradas que excedem tamanho máximo
          if (totalSize > this.config.maxSize) {
            let currentSize = totalSize;
            for (const entry of entries) {
              if (currentSize <= this.config.maxSize) break;
              if (!toDelete.includes(entry.url)) {
                toDelete.push(entry.url);
                currentSize -= entry.size;
              }
            }
          }

          // Executar deleções
          if (toDelete.length > 0) {
            let deleted = 0;
            toDelete.forEach(url => {
              store.delete(url).onsuccess = () => {
                deleted++;
                if (deleted === toDelete.length) {
                  resolve();
                }
              };
            });
          } else {
            resolve();
          }
        }
      };

      request.onerror = () => {
        logger.error('Erro ao limpar cache', 'ImageCacheService', request.error);
        resolve();
      };
    });
  }

  /**
   * Obtém estatísticas do cache
   */
  async getStats(): Promise<{
    count: number;
    totalSize: number;
    maxSize: number;
    maxEntries: number;
  }> {
    await this.init();

    if (!this.db) {
      return {
        count: 0,
        totalSize: 0,
        maxSize: this.config.maxSize,
        maxEntries: this.config.maxEntries,
      };
    }

    return new Promise(resolve => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result;
        const totalSize = entries.reduce((sum, entry) => sum + (entry.metadata?.size || 0), 0);

        resolve({
          count: entries.length,
          totalSize,
          maxSize: this.config.maxSize,
          maxEntries: this.config.maxEntries,
        });
      };

      request.onerror = () => {
        resolve({
          count: 0,
          totalSize: 0,
          maxSize: this.config.maxSize,
          maxEntries: this.config.maxEntries,
        });
      };
    });
  }
}

/**
 * Instância singleton do serviço
 */
export const imageCacheService = ImageCacheService.getInstance();

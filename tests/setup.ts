import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Limpar após cada teste
afterEach(() => {
  cleanup();
});

// Mock do IndexedDB
class MockIDBFactory {
  private databasesMap = new Map<string, IDBDatabase>();

  // API moderna do IDBFactory (nem todos os runtimes chamam isso, mas existe na tipagem)
  async databases(): Promise<IDBDatabaseInfo[]> {
    return [];
  }
  
  open(name: string, version?: number): IDBOpenDBRequest {
    type MutableOpenDBRequest = {
      result: IDBDatabase | null;
      error: DOMException | null;
      onsuccess: ((event: Event) => void) | null;
      onerror: ((event: Event) => void) | null;
      onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null;
      readyState: IDBRequestReadyState;
      transaction: IDBTransaction | null;
      source: IDBObjectStore | IDBIndex | IDBCursor | IDBTransaction | null;
    };

    const request: MutableOpenDBRequest = {
      result: null as IDBDatabase | null,
      error: null as DOMException | null,
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
      readyState: 'pending' as IDBRequestReadyState,
      transaction: null as IDBTransaction | null,
      source: null as IDBObjectStore | IDBIndex | IDBCursor | IDBTransaction | null,
    };

    setTimeout(() => {
      const db = ({
        name,
        version: version || 1,
        objectStoreNames: {
          contains: (_name: string) => false,
        },
        createObjectStore: (_name: string) => ({} as IDBObjectStore),
        transaction: () => ({} as IDBTransaction),
      } as unknown) as IDBDatabase;

      request.result = db;
      request.readyState = 'done';
      this.databasesMap.set(name, db);
      if (request.onsuccess) {
        request.onsuccess({} as Event);
      }
    }, 0);

    return request as unknown as IDBOpenDBRequest;
  }

  deleteDatabase(name: string): IDBOpenDBRequest {
    this.databasesMap.delete(name);
    const request = {
      result: null,
      error: null,
      onsuccess: null,
      onerror: null,
      readyState: 'done',
    };
    return request as unknown as IDBOpenDBRequest;
  }

  cmp(_first: unknown, _second: unknown): number {
    return 0;
  }
}

// Mock global do IndexedDB
globalThis.indexedDB = new MockIDBFactory() as unknown as IDBFactory;

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});


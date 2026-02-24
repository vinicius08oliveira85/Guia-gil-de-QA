import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { DB_NAME, DB_VERSION, STORE_NAME } from '../utils/constants';

type IndexedDbStoreSpec = {
  dbName: string;
  dbVersion: number;
  storeName: string;
  ensureStore: (db: IDBDatabase) => void;
};

const clearIndexedDbStore = async (spec: IndexedDbStoreSpec): Promise<void> => {
  await new Promise<void>(resolve => {
    try {
      const request = indexedDB.open(spec.dbName, spec.dbVersion);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        try {
          spec.ensureStore(db);
        } catch {
          // noop
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(spec.storeName, 'readwrite');
          tx.objectStore(spec.storeName).clear();
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            resolve();
          };
        } catch {
          db.close();
          resolve();
        }
      };

      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
};

// Limpar após cada teste
afterEach(async () => {
  cleanup();
  // Limpar mocks globais
  vi.clearAllMocks();

  // Limpar IndexedDB entre testes (evita vazamento de estado)
  await Promise.all([
    clearIndexedDbStore({
      dbName: DB_NAME,
      dbVersion: DB_VERSION,
      storeName: STORE_NAME,
      ensureStore: db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    }),
    clearIndexedDbStore({
      dbName: 'jira-media-cache',
      dbVersion: 1,
      storeName: 'images',
      ensureStore: db => {
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'url' });
        }
      },
    }),
  ]);
});

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

// jsdom nem sempre implementa Blob URLs
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn(() => 'blob:mock') as unknown as typeof URL.createObjectURL;
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
}

// pdfjs (react-pdf) depende de DOMMatrix em runtime
if (typeof (globalThis as { DOMMatrix?: unknown }).DOMMatrix === 'undefined') {
  class MockDOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;

    constructor(_init?: unknown) {}
  }

  (globalThis as { DOMMatrix?: unknown }).DOMMatrix = MockDOMMatrix;
  (globalThis as { DOMMatrixReadOnly?: unknown }).DOMMatrixReadOnly = MockDOMMatrix;
}

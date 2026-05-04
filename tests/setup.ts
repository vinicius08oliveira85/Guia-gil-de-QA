import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Lazy-loaded routes (ProjectsDashboard, ProjectView) costumam levar >1s no Vitest em suíte cheia.
configure({ asyncUtilTimeout: 30_000 });
import 'fake-indexeddb/auto';
import { DB_NAME, DB_VERSION, STORE_NAME } from '../utils/constants';

// Mock framer-motion para evitar ReferenceError/IntersectionObserver em jsdom (SectionHeader, etc.)
vi.mock('framer-motion', () => {
  const createMotion = (tag: string) => {
    const Comp = (props: Record<string, unknown>) => {
      const { children, ...rest } = props;
      return React.createElement(tag, rest, children);
    };
    Comp.displayName = `motion.${tag}`;
    return Comp;
  };
  const motion = new Proxy({} as Record<string, React.ComponentType<Record<string, unknown>>>, {
    get(_, key: string) {
      const tag = key === 'svg' ? 'svg' : key;
      return createMotion(tag);
    },
  });
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => true,
  };
});

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

// Evita vazamento de ?project= / ?view= entre testes (App useRouterSync)
beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', '/');
  }
});

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

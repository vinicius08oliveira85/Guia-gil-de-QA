import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Limpar após cada teste
afterEach(() => {
  cleanup();
});

// Mock do IndexedDB
class IDBFactory {
  databases = new Map<string, IDBDatabase>();
  
  open(name: string, version?: number): IDBOpenDBRequest {
    const request = {
      result: null as IDBDatabase | null,
      error: null as DOMException | null,
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
      readyState: 'pending' as IDBRequestReadyState,
      transaction: null as IDBTransaction | null,
      source: null as IDBObjectStore | IDBIndex | IDBCursor | IDBTransaction | null,
    } as IDBOpenDBRequest;

    setTimeout(() => {
      const db = {
        name,
        version: version || 1,
        objectStoreNames: {
          contains: (name: string) => false,
        },
        createObjectStore: (name: string) => ({} as IDBObjectStore),
        transaction: () => ({} as IDBTransaction),
      } as IDBDatabase;

      request.result = db;
      request.readyState = 'done';
      if (request.onsuccess) {
        request.onsuccess({} as Event);
      }
    }, 0);

    return request;
  }

  deleteDatabase(name: string): IDBOpenDBRequest {
    return {
      result: null,
      error: null,
      onsuccess: null,
      onerror: null,
      readyState: 'done',
    } as IDBOpenDBRequest;
  }

  cmp(first: any, second: any): number {
    return 0;
  }
}

// Mock global do IndexedDB
global.indexedDB = new IDBFactory() as unknown as IDBFactory;

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


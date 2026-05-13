import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInAnonymously: vi.fn(),
    },
  })),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { __supabaseServiceForTests } from '../../services/supabaseService';

class MockCompressionStream {
  private readonly outputChunks: Uint8Array[] = [];

  constructor(_format: string) {}

  readonly writable = {
    getWriter: () => ({
      write: (chunk: Uint8Array) => {
        for (let i = 0; i < chunk.length; i += 10_000) {
          this.outputChunks.push(chunk.slice(i, i + 10_000));
        }
      },
      close: () => undefined,
    }),
  };

  readonly readable = {
    getReader: () => {
      let index = 0;
      return {
        read: async () => {
          if (index >= this.outputChunks.length) {
            return { value: undefined, done: true as const };
          }
          return { value: this.outputChunks[index++], done: false as const };
        },
      };
    },
  };
}

const toBase64 = (value: string): string => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  const chunkSize = 0x4000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

describe('supabaseService.compressData', () => {
  const originalCompressionStream = globalThis.CompressionStream;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'CompressionStream', {
      configurable: true,
      writable: true,
      value: MockCompressionStream,
    });
  });

  afterEach(() => {
    if (originalCompressionStream === undefined) {
      delete (globalThis as typeof globalThis & { CompressionStream?: unknown }).CompressionStream;
      return;
    }

    Object.defineProperty(globalThis, 'CompressionStream', {
      configurable: true,
      writable: true,
      value: originalCompressionStream,
    });
  });

  it('converte payload grande para base64 em chunks sem estourar a pilha', async () => {
    const payload = {
      projectId: 'huge-project',
      description: 'A'.repeat(90_000),
      metadata: 'B'.repeat(10_000),
    };

    const result = await __supabaseServiceForTests.compressData(payload);
    const expected = toBase64(JSON.stringify(payload));

    expect(result).toBe(expected);
  });
});

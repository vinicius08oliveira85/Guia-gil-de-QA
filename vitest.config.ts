import { defineConfig, type UserConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Cast necessário para contornar mismatch de tipos do Vite entre dependências (vitest/vite)
  plugins: [react()] as unknown as UserConfig['plugins'],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    hookTimeout: 30_000,
    /** Fluxos com lazy routes + waitFor longos (ex.: aba Documentos) excedem 5s facilmente. */
    testTimeout: 120_000,
    // Inclui `tests/integration/**`. Para rodar só unitários: `npm run test:unit`.
    include: ['tests/**/*.test.{ts,tsx}', 'tests/**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
        '**/build/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});


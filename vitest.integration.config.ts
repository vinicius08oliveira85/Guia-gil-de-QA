import { defineConfig, type UserConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/** Config para rodar apenas testes de integração (tests/integration). */
export default defineConfig({
  plugins: [react()] as unknown as UserConfig['plugins'],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/integration/**/*.test.{ts,tsx}', 'tests/integration/**/*.spec.{ts,tsx}'],
    exclude: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

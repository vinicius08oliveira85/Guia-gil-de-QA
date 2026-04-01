import { defineConfig, type UserConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Opcional: rodar só integração com `vitest run -c vitest.integration.config.ts`.
 * O suite padrão (`vitest.config.ts`) já inclui `tests/integration/**`.
 * Atalho npm: `npm run test:integration` (usa o config principal com filtro de pasta).
 */
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

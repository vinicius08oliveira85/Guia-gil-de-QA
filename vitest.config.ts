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
    // Integrações/E2E deste repo são experimentais e frágeis; mantemos fora do suite padrão.
    // Rode manualmente quando necessário: `vitest run tests/integration`.
    include: ['tests/**/*.test.{ts,tsx}', 'tests/**/*.spec.{ts,tsx}'],
    exclude: ['tests/integration/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', '**/dist/', '**/build/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

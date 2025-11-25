import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-ignore - rollup-plugin-visualizer não tem tipos
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    // Bundle analyzer (apenas em build de análise)
    process.env.ANALYZE === 'true' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname,
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['react-hot-toast'],
          'ai-vendor': ['@google/genai', 'openai'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});

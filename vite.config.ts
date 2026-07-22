import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import { devApiMiddlewarePlugin } from './vite/devApiMiddlewarePlugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    // 127.0.0.1 evita IPv6/localhost e SW antigo registrado só em "localhost"
    port: 5173,
    host: '127.0.0.1',
    strictPort: true, // falha se 5173 ocupada (atalho não abre porta errada)
    open: false, // start-local.bat abre o browser depois que o HTTP responde
    // Demais /api/* (ex.: supabaseProxy) → vercel dev na :3000, se estiver rodando
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass(req) {
          const url = req.url ?? '';
          // false = nao encaminhar ao :3000; o middleware Vite atende
          if (url.startsWith('/api/manifest') || url.startsWith('/api/jira-proxy')) {
            return false;
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    devApiMiddlewarePlugin(__dirname),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'qa-agile-guide-logo.svg'],
      manifest: {
        name: 'QA Agile Guide',
        short_name: 'QA Guide',
        description:
          'Ferramenta de gestão de projetos de QA seguindo metodologias ágeis e práticas de DevOps',
        theme_color: '#0E6DFD',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Novo Projeto',
            short_name: 'Novo',
            description: 'Criar um novo projeto de QA',
            url: '/projects/new',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Ver dashboard de projetos',
            url: '/dashboard',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
          },
        ],
        categories: ['productivity', 'business', 'developer'],
      },
      workbox: {
        // Não precachear JS/HTML: evita SW servir bundles antigos (lógica Gemini/rate limit desatualizada).
        // Ícones, CSS e imagens continuam em cache; o app carrega chunks sempre da rede (HTTP cache do browser aplica).
        globPatterns: ['**/*.{css,ico,png,svg,woff2}'],
        // Sem index.html no precache, o fallback de navegação geraria WorkboxError "non-precached-url".
        navigateFallback: null,
        // Navegações (document): rede primeiro, cache como fallback (PWA / offline leve) sem precachear HTML.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }: { request: Request; url: URL }) =>
              request.mode === 'navigate' && url.origin === self.location.origin,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'qa-agile-spa-navigation',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutos
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
            },
          },
        ],
      },
      devOptions: {
        // Desligado em dev: SW/Workbox ativo no localhost faz ERR_FAILED
        // quando o Vite ainda não subiu ou a porta muda.
        enabled: false,
      },
    }),
    // Bundle analyzer (apenas em build de análise)
    process.env.ANALYZE === 'true' &&
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      // fileURL/pathname quebra resolução no Windows; alinhar ao tsconfig paths "@/*"
      '@': path.resolve(__dirname),
    },
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

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:4000';
const apiProxy = {
  '/api': {
    target: apiTarget,
    changeOrigin: true,
  },
  '/health': {
    target: apiTarget,
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      cleanupOutdatedCaches: true,
      includeAssets: [
        'app-icon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-512x512.png',
      ],
      injectRegister: 'script-defer',
      manifest: {
        background_color: '#080d1b',
        categories: ['finance', 'productivity', 'utilities'],
        description: 'A personal finance assistant for local spending insights.',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        id: '/',
        name: 'FinHunter',
        scope: '/',
        short_name: 'FinHunter',
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Open the finance dashboard.',
            url: '/',
          },
          {
            name: 'Transactions',
            short_name: 'Transactions',
            description: 'Search and review transactions.',
            url: '/transactions',
          },
          {
            name: 'Upcoming',
            short_name: 'Upcoming',
            description: 'Review upcoming payment reminders.',
            url: '/upcoming',
          },
          {
            name: 'Import assistant',
            short_name: 'Import',
            description: 'Preview bank files before importing.',
            url: '/tools/import-assistant',
          },
        ],
        start_url: '/',
        theme_color: '#080d1b',
      },
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    strictPort: true,
    proxy: apiProxy,
  },
});

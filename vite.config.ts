/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base so the build works on GitHub Pages under /<repo>/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'היומן שלי',
        short_name: 'היומן שלי',
        description: 'משימות, הרגלים, אימונים ותזונה — במקום אחד',
        lang: 'he',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f6f5fb',
        theme_color: '#7c3aed',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});

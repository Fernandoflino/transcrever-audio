import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import path from 'path';
import { defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Transcrever Áudio - WhatsApp Web',
  version: '1.0.0',
  description: 'Transcreva mensagens de áudio no WhatsApp Web para texto',
  permissions: ['storage', 'scripting'],
  host_permissions: ['https://web.whatsapp.com/*', 'https://openrouter.ai/*'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://web.whatsapp.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_start',
    },
  ],
  action: {
    default_title: 'Transcrever Áudio',
    default_popup: 'index.html',
  },
  web_accessible_resources: [
    {
      resources: ['src/mainWorldBridge/injected.ts'],
      matches: ['https://web.whatsapp.com/*'],
    },
  ],
});

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@bg': path.resolve(__dirname, './src/background'),
      '@content': path.resolve(__dirname, './src/content'),
      '@popup': path.resolve(__dirname, './src/popup'),
      '@adapter': path.resolve(__dirname, './src/adapter'),
      '@audio': path.resolve(__dirname, './src/audio'),
      '@api': path.resolve(__dirname, './src/api'),
      '@services': path.resolve(__dirname, './src/services'),
      '@storage': path.resolve(__dirname, './src/storage'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});

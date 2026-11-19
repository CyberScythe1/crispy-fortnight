import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3002,
    proxy: {
      '/api': { target: 'http://fs02-backend:4002', changeOrigin: true },
      '/yjs': { target: 'ws://fs02-backend:4003', ws: true },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
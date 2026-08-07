import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 4181,
    proxy: {
      // In development the artifacts are served by "bulwark serve" or the API.
      '/artifacts': {
        target: process.env['BULWARK_ARTIFACTS_ORIGIN'] ?? 'http://localhost:4180',
        changeOrigin: true,
      },
      '/api': {
        target: process.env['BULWARK_API_ORIGIN'] ?? 'http://localhost:4190',
        changeOrigin: true,
      },
    },
  },
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { projectTestConfig } from '../../vitest.shared.js';

const base = projectTestConfig({
  name: 'dashboard',
  environment: 'jsdom',
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  setupFiles: ['./src/test-setup.ts'],
});

export default defineConfig({
  ...base,
  plugins: [react()],
});

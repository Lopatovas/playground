import { defineConfig } from 'vitest/config';
import { projectTestConfig } from '../../vitest.shared.js';

export default defineConfig(projectTestConfig({ name: 'api' }));

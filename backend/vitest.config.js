import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/helpers/setup.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    sequence: {
      concurrent: false,
    },
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});

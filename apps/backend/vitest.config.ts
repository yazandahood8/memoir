import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: [
        'src/lib/**',
        'src/workers/**',
        'src/services/embeddings.ts',
        'vitest.config.ts',
      ],
      thresholds: { lines: 45, functions: 80, branches: 55 },
    },
  },
});

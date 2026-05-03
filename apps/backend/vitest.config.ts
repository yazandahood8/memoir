import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: [
        'src/lib/**',               // Redis/Supabase config — needs live services
        'src/workers/**',           // Needs live queue; covered via service tests
        'src/services/embeddings.ts', // Needs live OpenAI key
      ],
      thresholds: { lines: 50, functions: 80, branches: 55 },
    },
  },
});
